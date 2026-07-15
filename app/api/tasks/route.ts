import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import { TaskSchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, Task } from "@/types/models";

/**
 * GET /api/tasks
 * Fetch all tasks from Airtable (with server-side caching)
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
    const cachedTasks = serverCache.get<Task[]>(CACHE_KEYS.TASKS, 5 * 60 * 1000);
    if (cachedTasks) {
      console.log("✅ Serving Tasks from cache");
      return NextResponse.json(
        {
          success: true,
          data: cachedTasks,
          message: `Successfully fetched ${cachedTasks.length} tasks (cached)`,
        } as APIResponse<Task[]>,
        { status: 200 }
      );
    }

    // Fetch tasks from Airtable
    console.log("🔄 Fetching Tasks from Airtable...");
    const tasks = await airtableService.getTasks();

    // Validate data and filter out invalid records
    const validatedTasks = tasks
      .map((task) => {
        const result = TaskSchema.safeParse(task);
        return result.success ? result.data : null;
      })
      .filter((task): task is Task => task !== null);

    // Cache the result
    serverCache.set(CACHE_KEYS.TASKS, validatedTasks);
    console.log(`✅ Cached ${validatedTasks.length} Tasks`);

    return NextResponse.json(
      {
        success: true,
        data: validatedTasks,
        message: `Successfully fetched ${validatedTasks.length} tasks`,
      } as APIResponse<Task[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch tasks",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
