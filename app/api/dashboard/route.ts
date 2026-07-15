import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import { KPISchema, EmployeeSchema, DepartmentSchema, TaskSchema, AchievementSchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, KPI, Employee, Department, Task, Achievement } from "@/types/models";

/**
 * GET /api/dashboard
 * Fetch ALL dashboard data in a single optimized request
 * This eliminates 5 separate API calls and fetches data in parallel
 */
export async function GET() {
  try {
    // Validate environment variables once
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

    // Check if we have ALL data cached
    const cachedKPIs = serverCache.get<KPI[]>(CACHE_KEYS.KPIS, 5 * 60 * 1000);
    const cachedEmployees = serverCache.get<Employee[]>(CACHE_KEYS.EMPLOYEES, 5 * 60 * 1000);
    const cachedDepartments = serverCache.get<Department[]>(CACHE_KEYS.DEPARTMENTS, 5 * 60 * 1000);
    const cachedTasks = serverCache.get<Task[]>(CACHE_KEYS.TASKS, 5 * 60 * 1000);
    const cachedAchievements = serverCache.get<Achievement[]>(CACHE_KEYS.ACHIEVEMENTS, 5 * 60 * 1000);

    // If ALL data is cached, return immediately
    if (cachedKPIs && cachedEmployees && cachedDepartments && cachedTasks && cachedAchievements) {
      console.log("✅ Serving ALL dashboard data from cache");
      return NextResponse.json(
        {
          success: true,
          data: {
            kpis: cachedKPIs,
            employees: cachedEmployees,
            departments: cachedDepartments,
            tasks: cachedTasks,
            achievements: cachedAchievements,
          },
          message: "Successfully fetched dashboard data (cached)",
        },
        { status: 200 }
      );
    }

    console.log("🔄 Fetching dashboard data from Airtable in parallel...");
    const startTime = Date.now();

    // Fetch ALL data in parallel using the optimized service method
    const { kpis, employees, departments, tasks, achievements } = await airtableService.getAllDashboardData();

    const fetchTime = Date.now() - startTime;
    console.log(`✅ Fetched all data in ${fetchTime}ms`);

    // Validate and filter data in parallel
    const validationStart = Date.now();
    const [validatedKPIs, validatedEmployees, validatedDepartments, validatedTasks, validatedAchievements] = await Promise.all([
      Promise.resolve(kpis.map(k => KPISchema.safeParse(k)).filter(r => r.success).map(r => r.data as KPI)),
      Promise.resolve(employees.map(e => EmployeeSchema.safeParse(e)).filter(r => r.success).map(r => r.data as Employee)),
      Promise.resolve(departments.map(d => DepartmentSchema.safeParse(d)).filter(r => r.success).map(r => r.data as Department)),
      Promise.resolve(tasks.map(t => TaskSchema.safeParse(t)).filter(r => r.success).map(r => r.data as Task)),
      Promise.resolve(achievements.map(a => AchievementSchema.safeParse(a)).filter(r => r.success).map(r => r.data as Achievement)),
    ]);

    const validationTime = Date.now() - validationStart;
    console.log(`✅ Validated all data in ${validationTime}ms`);

    // Cache all results
    serverCache.set(CACHE_KEYS.KPIS, validatedKPIs);
    serverCache.set(CACHE_KEYS.EMPLOYEES, validatedEmployees);
    serverCache.set(CACHE_KEYS.DEPARTMENTS, validatedDepartments);
    serverCache.set(CACHE_KEYS.TASKS, validatedTasks);
    serverCache.set(CACHE_KEYS.ACHIEVEMENTS, validatedAchievements);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Total dashboard API time: ${totalTime}ms`);

    return NextResponse.json(
      {
        success: true,
        data: {
          kpis: validatedKPIs,
          employees: validatedEmployees,
          departments: validatedDepartments,
          tasks: validatedTasks,
          achievements: validatedAchievements,
        },
        message: `Successfully fetched dashboard data in ${totalTime}ms`,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    );
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch dashboard data",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
