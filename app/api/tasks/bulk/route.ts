import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import airtableClient from "@/services/airtable.client";
import { cleanErrorMessage, validateEnvVars } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse } from "@/types/models";

/**
 * POST /api/tasks/bulk
 * Execute bulk operations on multiple tasks.
 *
 * Body:
 *   action: "delete" | "archive" | "status" | "priority" | "assign"
 *   ids: string[]
 *   value?: string   — new status / priority / assignee name
 */
export async function POST(request: Request) {
  try {
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" } as APIResponse<null>,
        { status: 500 }
      );
    }

    let body: { action: string; ids: string[]; value?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Invalid JSON body" } as APIResponse<null>,
        { status: 400 }
      );
    }

    const { action, ids, value } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "action and ids[] are required" } as APIResponse<null>,
        { status: 400 }
      );
    }

    const tableName = await airtableClient.getTableName("tasks");

    const STATUS_MAP: Record<string, string> = {
      "not-started":  "Not Started",
      "planned":      "Planned",
      "in-progress":  "In Progress",
      "blocked":      "Blocked",
      "under-review": "Under Review",
      "completed":    "Completed",
      "archived":     "Archived",
      "todo":         "Not Started",
    };

    const PRIORITY_MAP: Record<string, string> = {
      critical: "Critical",
      high:     "High",
      medium:   "Medium",
      low:      "Low",
    };

    const results: { id: string; success: boolean; error?: string }[] = [];

    // Process each ID sequentially (Airtable free tier rate-limits parallel requests)
    for (const id of ids) {
      try {
        if (action === "delete") {
          await airtableService.deleteRecord(tableName, id);

        } else if (action === "archive") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await airtableService.updateRecord(tableName, id, {
            "Status": "Archived",
            "Last Updated": new Date().toISOString(),
          } as any);

        } else if (action === "status") {
          if (!value) throw new Error("value is required for status action");
          const airtableStatus = STATUS_MAP[value] ?? value;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await airtableService.updateRecord(tableName, id, {
            "Status": airtableStatus,
            "Last Updated": new Date().toISOString(),
            ...(value === "completed" ? { "Completed Date": new Date().toISOString() } : {}),
          } as any);

        } else if (action === "priority") {
          if (!value) throw new Error("value is required for priority action");
          const airtablePriority = PRIORITY_MAP[value] ?? value;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await airtableService.updateRecord(tableName, id, {
            "Priority": airtablePriority,
            "Last Updated": new Date().toISOString(),
          } as any);

        } else if (action === "assign") {
          if (!value) throw new Error("value is required for assign action");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await airtableService.updateRecord(tableName, id, {
            "Assigned To": value,
            "Last Updated": new Date().toISOString(),
          } as any);

        } else {
          throw new Error(`Unknown action: ${action}`);
        }

        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: cleanErrorMessage(err) });
      }
    }

    // Invalidate cache after bulk operations
    serverCache.invalidate(CACHE_KEYS.TASKS);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Bulk ${action}: ${succeeded} succeeded, ${failed} failed`);

    return NextResponse.json(
      {
        success: failed === 0,
        message: `Bulk ${action}: ${succeeded} succeeded${failed > 0 ? `, ${failed} failed` : ""}`,
        data: results,
      },
      { status: failed === ids.length ? 500 : 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/tasks/bulk:", error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Bulk operation failed",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
