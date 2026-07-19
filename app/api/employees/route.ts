import { NextResponse } from "next/server";
import { dataService } from "@/services/data\.service";
import { EmployeeSchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, Employee } from "@/types/models";

/**
 * GET /api/employees
 * Fetch all employees from Airtable (with server-side caching)
 */
export async function GET() {
  try {
    // Validate environment variables
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          message: `Missing environment variables: ${envCheck.missing.join(", ")}`,
        } as APIResponse<null>,
        { status: 500 }
      );
    }

    // Check cache first (5 minute TTL)
    const cachedEmployees = serverCache.get<Employee[]>(CACHE_KEYS.EMPLOYEES, 5 * 60 * 1000);
    if (cachedEmployees) {
      console.log("✅ Serving Employees from cache");
      return NextResponse.json(
        {
          success: true,
          data: cachedEmployees,
          message: `Successfully fetched ${cachedEmployees.length} employees (cached)`,
        } as APIResponse<Employee[]>,
        { status: 200 }
      );
    }

    // Fetch employees from Airtable
    console.log("🔄 Fetching Employees from Airtable...");
    const employees = await dataService.getEmployees();

    // Validate data and filter out invalid records
    const validatedEmployees = employees
      .map((employee) => {
        const result = EmployeeSchema.safeParse(employee);
        return result.success ? result.data : null;
      })
      .filter((emp): emp is Employee => emp !== null);

    // Cache the result
    serverCache.set(CACHE_KEYS.EMPLOYEES, validatedEmployees);
    console.log(`✅ Cached ${validatedEmployees.length} Employees`);

    return NextResponse.json(
      {
        success: true,
        data: validatedEmployees,
        message: `Successfully fetched ${validatedEmployees.length} employees`,
      } as APIResponse<Employee[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/employees:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch employees",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

