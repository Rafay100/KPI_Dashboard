import { NextResponse } from "next/server";
import { dataService } from "@/services/data\.service";
import { KPISchema, CreateKPISchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, KPI } from "@/types/models";
import type { FieldSet } from "airtable";

function invalidateKpiCache() {
  serverCache.invalidate(CACHE_KEYS.KPIS);
}

/**
 * GET /api/kpis
 * Fetch all KPIs from Airtable (with server-side caching)
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
    const cachedKPIs = serverCache.get<KPI[]>(CACHE_KEYS.KPIS, 5 * 60 * 1000);
    if (cachedKPIs) {
      console.log("✅ Serving KPIs from cache");
      return NextResponse.json(
        {
          success: true,
          data: cachedKPIs,
          message: `Successfully fetched ${cachedKPIs.length} KPIs (cached)`,
        } as APIResponse<KPI[]>,
        { status: 200 }
      );
    }

    // Fetch KPIs from Airtable
    console.log("🔄 Fetching KPIs from Airtable...");
    const kpis = await dataService.getKPIs();

    // Validate data and filter out invalid records
    const validatedKPIs = kpis
      .map((kpi) => {
        const result = KPISchema.safeParse(kpi);
        return result.success ? result.data : null;
      })
      .filter((kpi): kpi is KPI => kpi !== null);

    // Cache the result
    serverCache.set(CACHE_KEYS.KPIS, validatedKPIs);
    console.log(`✅ Cached ${validatedKPIs.length} KPIs`);

    return NextResponse.json(
      {
        success: true,
        data: validatedKPIs,
        message: `Successfully fetched ${validatedKPIs.length} KPIs`,
      } as APIResponse<KPI[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/kpis:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch KPIs",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/kpis
 * Create a new KPI
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validated = CreateKPISchema.parse(body);

    // Map to Airtable fields
    const airtableFields: Record<string, unknown> = {
      Name: validated.kpiName,
      Description: validated.description || "",
      DepartmentId: validated.departmentId,
      EmployeeId: validated.employeeId,
      TargetValue: validated.targetValue,
      ActualValue: validated.actualValue || 0,
      Status: validated.status || "not-started",
      DueDate: validated.dueDate,
      LastUpdated: new Date().toISOString(),
      Category: validated.category || "",
      Team: validated.team || "",
      Owner: validated.owner || "",
      Frequency: validated.frequency || "",
      Unit: validated.unit || "",
      ID: validated.code || "",
    };

    const recordId = await dataService.createRecord("KPIs", airtableFields as Partial<FieldSet>);
    invalidateKpiCache();

    return NextResponse.json(
      {
        success: true,
        data: { id: recordId, ...validated },
        message: "KPI created successfully",
      } as APIResponse<Partial<KPI>>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/kpis:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to create KPI",
      } as APIResponse<null>,
      { status: 400 }
    );
  }
}

