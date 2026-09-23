import { NextResponse } from "next/server";
import { dataService } from "@/services/data.service";
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

    // Fetch existing department via dataService
    const existingDepartment = await dataService.getDepartmentById(id);
    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, error: "Department not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    const allDepartments = await dataService.getDepartments();

    // Check duplicate name if the name is changing
    if (
      departmentName &&
      String(departmentName).trim().toLowerCase() !== String(existingDepartment.departmentName || "").toLowerCase().trim()
    ) {
      const isDuplicate = allDepartments.some((rec) => {
        return (
          rec.id !== id &&
          String(rec.departmentName || "").toLowerCase().trim() === String(departmentName).toLowerCase().trim()
        );
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

    await dataService.updateRecord("departments", id, fields);

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
    const existingDepartment = await dataService.getDepartmentById(id);
    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, error: "Department not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    const deptName = String(existingDepartment.departmentName || "");
    const deptCode = String(existingDepartment.id || "");

    // RELATIONSHIP VALIDATION: Check Employees
    const employees = await dataService.getEmployees();
    const hasEmployee = employees.some((emp) => {
      const empDept = String(emp.department || "");
      const empDeptId = String(emp.departmentId || "");
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
    const kpis = await dataService.getKPIs();
    const hasKPI = kpis.some((kpi) => {
      const kpiDeptId = String(kpi.departmentId || "");
      return (
        kpiDeptId.toLowerCase().trim() === deptName.toLowerCase().trim() ||
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

    // Perform Delete via dataService / active adapter
    await dataService.deleteRecord("departments", id);

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
