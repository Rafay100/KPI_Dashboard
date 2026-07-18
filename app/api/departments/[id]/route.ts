import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse } from "@/types/models";

/**
 * PUT /api/departments/[id]
 * Edit a department (name, description, manager)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { departmentName, description, headOfDepartment } = body;

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("departments");

    // Fetch existing department to verify it exists
    const record = await base(tableName).find(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Department not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Check duplicate name if the name is changing
    if (departmentName && String(departmentName).trim().toLowerCase() !== String(record.fields["Department Name"] || "").toLowerCase().trim()) {
      const allRecords = await base(tableName).select().all();
      const isDuplicate = allRecords.some((rec) => {
        return rec.id !== id && String(rec.fields["Department Name"] || "").toLowerCase().trim() === String(departmentName).toLowerCase().trim();
      });

      if (isDuplicate) {
        return NextResponse.json(
          { success: false, error: `Department "${departmentName}" already exists` } as APIResponse<null>,
          { status: 400 }
        );
      }
    }

    const fields: Record<string, any> = {};
    if (departmentName !== undefined) fields["Department Name"] = departmentName.trim();
    if (description !== undefined) fields["Description"] = description;
    if (headOfDepartment !== undefined) fields["Manager"] = headOfDepartment;

    await base(tableName).update(id, fields);

    // Invalidate cache
    serverCache.invalidate(CACHE_KEYS.DEPARTMENTS);

    return NextResponse.json(
      {
        success: true,
        message: "Department updated successfully",
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/departments/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to update department",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/[id]
 * Delete a department with relationship validation (cannot delete if used elsewhere)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const base = airtableClient.getBase();
    
    const deptTableName = await airtableClient.getTableName("departments");
    const record = await base(deptTableName).find(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Department not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    const deptName = String(record.fields["Department Name"] || "");
    const deptCode = String(record.fields["ID"] || "");

    // RELATIONSHIP VALIDATION: Check Employees
    const empTableName = await airtableClient.getTableName("employees");
    const employeeRecords = await base(empTableName).select().all();
    const hasEmployee = employeeRecords.some((emp) => {
      const empDept = String(emp.fields["Department"] || "");
      const empDeptId = String(emp.fields["Department ID"] || "");
      return (
        empDept.toLowerCase().trim() === deptName.toLowerCase().trim() ||
        empDeptId === id ||
        empDeptId === deptCode
      );
    });

    if (hasEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department because it is assigned to one or more employees.`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // RELATIONSHIP VALIDATION: Check KPIs
    const kpisTableName = await airtableClient.getTableName("kpis");
    const kpiRecords = await base(kpisTableName).select().all();
    const hasKPI = kpiRecords.some((kpi) => {
      const kpiDept = String(kpi.fields["Department"] || "");
      const kpiDeptId = String(kpi.fields["Department ID"] || "");
      return (
        kpiDept.toLowerCase().trim() === deptName.toLowerCase().trim() ||
        kpiDeptId === id ||
        kpiDeptId === deptCode
      );
    });

    if (hasKPI) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department because it is assigned to one or more KPIs.`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // RELATIONSHIP VALIDATION: Check Teams
    const teamsTableName = await airtableClient.getTableName("teams");
    const teamRecords = await base(teamsTableName).select().all();
    const hasTeam = teamRecords.some((team) => {
      const teamDept = String(team.fields["Department"] || "");
      return teamDept.toLowerCase().trim() === deptName.toLowerCase().trim();
    });

    if (hasTeam) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department because it is referenced by one or more teams.`,
        } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Perform Delete
    await base(deptTableName).destroy(id);

    // Invalidate cache
    serverCache.invalidate(CACHE_KEYS.DEPARTMENTS);

    return NextResponse.json(
      {
        success: true,
        message: "Department deleted successfully",
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/departments/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to delete department",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
