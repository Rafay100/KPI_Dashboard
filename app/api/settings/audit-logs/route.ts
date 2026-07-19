import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/settings/audit-logs
 * Fetch audit logs from Airtable
 */
export async function GET() {
  try {
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const auditRecord = records.find((r) => r.fields["Setting Name"] === "Audit_Logs");

    let auditLogs = [];
    if (auditRecord && auditRecord.fields["Setting Value"]) {
      try {
        auditLogs = JSON.parse(String(auditRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    // Default mock logs if empty
    if (auditLogs.length === 0) {
      auditLogs = [
        { id: "log-1", timestamp: new Date(Date.now() - 3600000).toISOString(), user: "Admin User", role: "Administrator", action: "Permission Changes", entity: "Settings", record: "Updated Admin matrix", status: "Success", ip: "192.168.1.50", device: "Chrome / Windows" },
        { id: "log-2", timestamp: new Date(Date.now() - 7200000).toISOString(), user: "Sara Khan", role: "Department Manager", action: "KPI Created", entity: "KPIs", record: "Website Traffic KPI", status: "Success", ip: "192.168.1.62", device: "Safari / macOS" },
        { id: "log-3", timestamp: new Date(Date.now() - 14400000).toISOString(), user: "Ahmed Raza", role: "Manager", action: "Airtable Sync", entity: "System", record: "Manual Trigger Sync", status: "Success", ip: "127.0.0.1", device: "System Agent" },
        { id: "log-4", timestamp: new Date(Date.now() - 28800000).toISOString(), user: "Guest User", role: "Viewer", action: "Failed Operations", entity: "Security", record: "Invalid password attempt", status: "Failed", ip: "198.51.100.12", device: "Firefox / Linux" }
      ];
    }

    return NextResponse.json(
      {
        success: true,
        data: auditLogs,
        message: "Successfully fetched audit logs",
      } as APIResponse<typeof auditLogs>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/settings/audit-logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch audit logs",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/audit-logs
 * Add a new log entry to Audit_Logs in Settings table
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, role, action, entity, record, status, ip, device } = body;

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();
    const auditRecord = records.find((r) => r.fields["Setting Name"] === "Audit_Logs");

    let auditLogs: any[] = [];
    if (auditRecord && auditRecord.fields["Setting Value"]) {
      try {
        auditLogs = JSON.parse(String(auditRecord.fields["Setting Value"]));
      } catch (_) {}
    }

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user || "System User",
      role: role || "Administrator",
      action: action || "Unknown Action",
      entity: entity || "System",
      record: record || "N/A",
      status: status || "Success",
      ip: ip || "127.0.0.1",
      device: device || "Server Agent",
    };

    auditLogs.unshift(newLog); // prepend to show newest first
    // Limit to last 500 logs to prevent payload sizing issues
    if (auditLogs.length > 500) {
      auditLogs = auditLogs.slice(0, 500);
    }

    if (auditRecord) {
      await base(tableName).update(auditRecord.id, {
        "Setting Value": JSON.stringify(auditLogs),
      });
    } else {
      await base(tableName).create({
        "Setting Name": "Audit_Logs",
        "Setting Value": JSON.stringify(auditLogs),
        "Category": "Audit",
        "Description": "Serialized application audit trails log history",
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: newLog,
        message: "Successfully added audit log entry",
      } as APIResponse<typeof newLog>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/settings/audit-logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to create audit log entry",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

