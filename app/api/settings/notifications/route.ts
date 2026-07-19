import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/settings/notifications
 * Retrieve all in-app notifications
 */
export async function GET() {
  try {
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const notificationRecord = records.find((r) => r.fields["Setting Name"] === "InApp_Notifications");

    let notifications = [];
    if (notificationRecord && notificationRecord.fields["Setting Value"]) {
      try {
        notifications = JSON.parse(String(notificationRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    // Seed default in-app notifications if empty
    if (notifications.length === 0) {
      notifications = [
        { id: "ntf-1", timestamp: new Date(Date.now() - 600000).toISOString(), title: "KPI Approved", message: "Your KPI 'Customer Satisfaction Rate' has been approved by Admin.", read: false, type: "Approval Decisions" },
        { id: "ntf-2", timestamp: new Date(Date.now() - 3600000).toISOString(), title: "New Task Assigned", message: "Task 'Weekly Status Deck' has been assigned to you.", read: false, type: "Task Updates" },
        { id: "ntf-3", timestamp: new Date(Date.now() - 7200000).toISOString(), title: "Achievement Earned", message: "Congratulations! You earned the 'Consistency Badge' for achievements.", read: true, type: "Achievement Updates" },
        { id: "ntf-4", timestamp: new Date(Date.now() - 14400000).toISOString(), title: "Database Synced", message: "Airtable database sync completed successfully with 342 records.", read: true, type: "Airtable Sync" }
      ];
    }

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        message: "Successfully retrieved in-app notifications",
      } as APIResponse<typeof notifications>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/settings/notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch in-app notifications",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/notifications
 * Operations to mark read, delete, or add notifications
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, ids, newNotification } = body;

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const notificationRecord = records.find((r) => r.fields["Setting Name"] === "InApp_Notifications");

    let notifications: any[] = [];
    if (notificationRecord && notificationRecord.fields["Setting Value"]) {
      try {
        notifications = JSON.parse(String(notificationRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    if (action === "create" && newNotification) {
      const added = {
        id: `ntf-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...newNotification
      };
      notifications.unshift(added);
    } else if (action === "mark-read" && id) {
      notifications = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    } else if (action === "mark-all-read") {
      notifications = notifications.map((n) => ({ ...n, read: true }));
    } else if (action === "delete" && id) {
      notifications = notifications.filter((n) => n.id !== id);
    } else if (action === "clear-all") {
      notifications = [];
    }

    if (notifications.length > 500) {
      notifications = notifications.slice(0, 500);
    }

    if (notificationRecord) {
      await base(tableName).update(notificationRecord.id, {
        "Setting Value": JSON.stringify(notifications),
      });
    } else {
      await base(tableName).create({
        "Setting Name": "InApp_Notifications",
        "Setting Value": JSON.stringify(notifications),
        "Category": "Notifications",
        "Description": "Persisted log list of in-app notification alerts",
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        message: "Successfully synchronized notifications status",
      } as APIResponse<typeof notifications>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/settings/notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to persist notifications change",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

