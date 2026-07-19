import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/settings/alerts
 * Load all generated system alerts
 */
export async function GET() {
  try {
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const alertRecord = records.find((r) => r.fields["Setting Name"] === "System_Alerts");

    let alerts = [];
    if (alertRecord && alertRecord.fields["Setting Value"]) {
      try {
        alerts = JSON.parse(String(alertRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    // Default seed alerts if empty
    if (alerts.length === 0) {
      alerts = [
        { id: "alt-1", timestamp: new Date(Date.now() - 1800000).toISOString(), title: "KPI Critical Fall", description: "Website Load Time KPI is below success rate 50%", severity: "Critical", status: "Open", category: "KPI Below Critical Threshold" },
        { id: "alt-2", timestamp: new Date(Date.now() - 3600000).toISOString(), title: "Manual KPI Review Pending", description: "Monthly Sales Scorecard requires executive review", severity: "Warning", status: "Open", category: "Manual KPI Awaiting Approval" },
        { id: "alt-3", timestamp: new Date(Date.now() - 7200000).toISOString(), title: "Airtable Connection Health Warning", description: "Metadata check timeout occurred on table 'Tasks'", severity: "High", status: "Acknowledged", category: "Airtable Sync Failure" },
        { id: "alt-4", timestamp: new Date(Date.now() - 86400000).toISOString(), title: "Task Overdue Reminder", description: "Task 'Database Index Upgrades' has missed due date", severity: "Warning", status: "Open", category: "Overdue Tasks" }
      ];
    }

    return NextResponse.json(
      {
        success: true,
        data: alerts,
        message: "Successfully loaded system alerts",
      } as APIResponse<typeof alerts>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/settings/alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to load system alerts",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/alerts
 * Bulk updates alerts list or creates a new alert entry
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, alertId, alertIds, updatedStatus, newAlert } = body;

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const alertRecord = records.find((r) => r.fields["Setting Name"] === "System_Alerts");

    let alerts: any[] = [];
    if (alertRecord && alertRecord.fields["Setting Value"]) {
      try {
        alerts = JSON.parse(String(alertRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    if (action === "create" && newAlert) {
      const addedAlert = {
        id: `alt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: "Open",
        ...newAlert
      };
      alerts.unshift(addedAlert);
    } else if (action === "update" && alertId && updatedStatus) {
      alerts = alerts.map((a) => a.id === alertId ? { ...a, status: updatedStatus } : a);
    } else if (action === "bulk-update" && alertIds && updatedStatus) {
      alerts = alerts.map((a) => alertIds.includes(a.id) ? { ...a, status: updatedStatus } : a);
    } else if (action === "delete" && alertId) {
      alerts = alerts.filter((a) => a.id !== alertId);
    } else if (action === "bulk-delete" && alertIds) {
      alerts = alerts.filter((a) => !alertIds.includes(a.id));
    }

    // Keep payload size reasonable
    if (alerts.length > 500) {
      alerts = alerts.slice(0, 500);
    }

    if (alertRecord) {
      await base(tableName).update(alertRecord.id, {
        "Setting Value": JSON.stringify(alerts),
      });
    } else {
      await base(tableName).create({
        "Setting Name": "System_Alerts",
        "Setting Value": JSON.stringify(alerts),
        "Category": "Alerts",
        "Description": "Persisted logs for the Global Alert Center",
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: alerts,
        message: "Successfully modified system alerts configuration",
      } as APIResponse<typeof alerts>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/settings/alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to persist alert state changes",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

