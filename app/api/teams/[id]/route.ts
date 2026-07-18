import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * PUT /api/teams/[id]
 * Edit a team (name, department, manager, description, status)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamName, department, teamLead, description, status } = body;

    const base = airtableClient.getBase();
    const tableName = "Teams";

    // Verify team exists
    const record = await base(tableName).find(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Team not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Check duplicate name if changing name
    if (teamName && String(teamName).trim().toLowerCase() !== String(record.fields["Team Name"] || "").toLowerCase().trim()) {
      const allRecords = await base(tableName).select().all();
      const isDuplicate = allRecords.some((rec) => {
        return rec.id !== id && String(rec.fields["Team Name"] || "").toLowerCase().trim() === String(teamName).toLowerCase().trim();
      });

      if (isDuplicate) {
        return NextResponse.json(
          { success: false, error: `Team "${teamName}" already exists` } as APIResponse<null>,
          { status: 400 }
        );
      }
    }

    const fields: Record<string, any> = {};
    if (teamName !== undefined) fields["Team Name"] = teamName.trim();
    if (department !== undefined) fields["Department"] = department;
    if (teamLead !== undefined) {
      fields["Team Manager"] = teamLead;
      fields["Team Lead"] = teamLead;
    }
    if (description !== undefined) fields["Description"] = description;
    if (status !== undefined) fields["Status"] = status;

    await base(tableName).update(id, fields);

    return NextResponse.json(
      {
        success: true,
        message: "Team updated successfully",
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/teams/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to update team",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete a team with relationship validation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const base = airtableClient.getBase();
    const tableName = "Teams";

    const record = await base(tableName).find(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Team not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    const teamName = String(record.fields["Team Name"] || "");
    const teamCode = String(record.fields["ID"] || "");

    // RELATIONSHIP VALIDATION: Check Employees
    const empTableName = await airtableClient.getTableName("employees");
    const employeeRecords = await base(empTableName).select().all();
    const hasEmployee = employeeRecords.some((emp) => {
      const empTeam = String(emp.fields["Team"] || "");
      return (
        empTeam.toLowerCase().trim() === teamName.toLowerCase().trim()
      );
    });

    if (hasEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete team because it is assigned to one or more employees.`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // RELATIONSHIP VALIDATION: Check KPIs
    const kpisTableName = await airtableClient.getTableName("kpis");
    const kpiRecords = await base(kpisTableName).select().all();
    const hasKPI = kpiRecords.some((kpi) => {
      const kpiTeam = String(kpi.fields["Team"] || "");
      return (
        kpiTeam.toLowerCase().trim() === teamName.toLowerCase().trim()
      );
    });

    if (hasKPI) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete team because it is referenced by one or more KPIs.`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Perform Delete
    await base(tableName).destroy(id);

    return NextResponse.json(
      {
        success: true,
        message: "Team deleted successfully",
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/teams/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to delete team",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
