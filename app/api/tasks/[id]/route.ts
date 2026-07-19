import { NextResponse } from "next/server";
import { dataService } from "@/services/data.service";
import airtableClient from "@/services/airtable.client";
import { cleanErrorMessage, validateEnvVars } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, Task } from "@/types/models";

/**
 * PATCH /api/tasks/[id]
 * Update a task's fields in Airtable (e.g., status change from Kanban board).
 * Body: { status?, progress?, completedAt?, lastUpdated? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate env
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Task ID is required" } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Invalid JSON body" } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Build the Airtable field update payload using actual Airtable field names
    const airtableFields: Record<string, unknown> = {};

    if (body.status !== undefined) {
      // Convert internal status slug to human-readable Airtable value
      const statusMap: Record<string, string> = {
        "not-started": "Not Started",
        "planned": "Planned",
        "in-progress": "In Progress",
        "blocked": "Blocked",
        "under-review": "Under Review",
        "completed": "Completed",
        "archived": "Archived",
        // pass-through fallback
        "todo": "Not Started",
      };
      airtableFields["Status"] = statusMap[body.status as string] ?? String(body.status);
    }

    if (body.progress !== undefined) {
      airtableFields["Progress"] = Number(body.progress);
    }

    if (body.completedAt !== undefined) {
      airtableFields["Completed Date"] = body.completedAt;
    }

    // Always stamp last updated
    airtableFields["Last Updated"] = new Date().toISOString();

    if (Object.keys(airtableFields).length === 0) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "No updatable fields provided" } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Resolve actual Airtable table name
    const tableName = await airtableClient.getTableName("tasks");

    console.log(`🔄 Updating Task ${id} in Airtable table "${tableName}"…`, airtableFields);

    // Update the record in Airtable (cast to satisfy FieldSet generic constraint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await dataService.updateRecord(tableName, id, airtableFields as any);

    // Invalidate tasks server cache so next GET returns fresh data
    serverCache.invalidate(CACHE_KEYS.TASKS);

    console.log(`✅ Task ${id} updated successfully`);

    return NextResponse.json(
      {
        success: true,
        message: `Task ${id} updated successfully`,
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in PATCH /api/tasks/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: `Failed to update task ${id}`,
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/[id]
 * Fetch a single task by its Airtable record ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" } as APIResponse<null>,
        { status: 500 }
      );
    }

    const task = await dataService.getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: `Task ${id} not found` } as APIResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: task } as APIResponse<Task>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in GET /api/tasks/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: `Failed to fetch task ${id}`,
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Permanently delete a task record from Airtable.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" } as APIResponse<null>,
        { status: 500 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Task ID is required" } as APIResponse<null>,
        { status: 400 }
      );
    }

    const tableName = await airtableClient.getTableName("tasks");
    console.log(`🗑️  Deleting Task ${id} from Airtable table "${tableName}"…`);

    await dataService.deleteRecord(tableName, id);

    // Invalidate tasks server cache
    serverCache.invalidate(CACHE_KEYS.TASKS);

    console.log(`✅ Task ${id} deleted successfully`);

    return NextResponse.json(
      { success: true, message: `Task ${id} deleted successfully` } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in DELETE /api/tasks/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: `Failed to delete task ${id}`,
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
