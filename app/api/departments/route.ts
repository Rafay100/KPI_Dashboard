import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import airtableClient from "@/services/airtable.client";
import { DepartmentSchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, Department } from "@/types/models";

/**
 * GET /api/departments
 * Fetch all departments from Airtable (with server-side caching)
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
    const cachedDepartments = serverCache.get<Department[]>(CACHE_KEYS.DEPARTMENTS, 5 * 60 * 1000);
    if (cachedDepartments) {
      console.log("✅ Serving Departments from cache");
      return NextResponse.json(
        {
          success: true,
          data: cachedDepartments,
          message: `Successfully fetched ${cachedDepartments.length} departments (cached)`,
        } as APIResponse<Department[]>,
        { status: 200 }
      );
    }

    // Fetch departments from Airtable
    console.log("🔄 Fetching Departments from Airtable...");
    const departments = await airtableService.getDepartments();

    // Validate data and filter out invalid records
    const validatedDepartments = departments
      .map((department) => {
        const result = DepartmentSchema.safeParse(department);
        return result.success ? result.data : null;
      })
      .filter((dept): dept is Department => dept !== null);

    // Cache the result
    serverCache.set(CACHE_KEYS.DEPARTMENTS, validatedDepartments);
    console.log(`✅ Cached ${validatedDepartments.length} Departments`);

    return NextResponse.json(
      {
        success: true,
        data: validatedDepartments,
        message: `Successfully fetched ${validatedDepartments.length} departments`,
      } as APIResponse<Department[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/departments:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch departments",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments
 * Create a new department with duplicate check validation
 */
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { departmentName, description, headOfDepartment } = body;

    if (!departmentName || String(departmentName).trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Department Name is required",
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("departments");

    // Fetch existing to check for duplicate names (case-insensitive)
    const existingRecords = await base(tableName).select().all();
    const isDuplicate = existingRecords.some((record) => {
      const name = String(record.fields["Department Name"] || "").toLowerCase().trim();
      return name === String(departmentName).toLowerCase().trim();
    });

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Department "${departmentName}" already exists`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Create the record in Airtable
    const fields: Record<string, any> = {
      "Department Name": departmentName.trim(),
    };
    if (description) fields["Description"] = description;
    if (headOfDepartment) fields["Manager"] = headOfDepartment; // Field is "Manager" in Airtable schema for Departments

    // Add ID field (e.g. DEPT008)
    const maxId = existingRecords.reduce((max, rec) => {
      const idStr = String(rec.fields["ID"] || "");
      const match = idStr.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0);
    const newId = `DEPT${String(maxId + 1).padStart(3, "0")}`;
    fields["ID"] = newId;

    const newRecord = await base(tableName).create(fields);

    // Invalidate cache
    serverCache.invalidate(CACHE_KEYS.DEPARTMENTS);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newRecord.id,
          departmentName: fields["Department Name"],
          description: fields["Description"] || "",
          headOfDepartment: fields["Manager"] || "",
          createdAt: new Date().toISOString(),
        },
        message: "Department created successfully",
      } as APIResponse<any>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/departments:", error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to create department",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

