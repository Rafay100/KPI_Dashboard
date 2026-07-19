import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/settings/validation
 * Runs validation checks across all entities and compiles issues
 */
export async function GET() {
  try {
    const base = airtableClient.getBase();

    // Fetch all tables in parallel
    const [kpiTableName, employeeTableName, departmentTableName, taskTableName] =
      await Promise.all([
        airtableClient.getTableName("kpis"),
        airtableClient.getTableName("employees"),
        airtableClient.getTableName("departments"),
        airtableClient.getTableName("tasks"),
      ]);

    const [kpiRecords, employeeRecords, departmentRecords, taskRecords] =
      await Promise.all([
        base(kpiTableName).select().all().catch(() => []),
        base(employeeTableName).select().all().catch(() => []),
        base(departmentTableName).select().all().catch(() => []),
        base(taskTableName).select().all().catch(() => []),
      ]);

    const issues: any[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validate Departments
    const departmentMap = new Map<string, string>(); // ID -> Name
    const deptNamesSeen = new Set<string>();

    departmentRecords.forEach((record) => {
      const id = String(record.fields["ID"] || record.id);
      const name = String(record.fields["Department Name"] || "");

      if (!name) {
        issues.push({
          id: `dept-miss-${record.id}`,
          severity: "High",
          category: "Missing Required Fields",
          entity: "Departments",
          record: id,
          description: "Department Name is blank",
          status: "Unresolved",
        });
      } else {
        departmentMap.set(id, name);
        departmentMap.set(name, id); // map both ways for convenience

        const lowerName = name.toLowerCase().trim();
        if (deptNamesSeen.has(lowerName)) {
          issues.push({
            id: `dept-dup-${record.id}`,
            severity: "Medium",
            category: "Duplicate Records",
            entity: "Departments",
            record: name,
            description: `Department "${name}" is duplicated`,
            status: "Unresolved",
          });
        } else {
          deptNamesSeen.add(lowerName);
        }
      }
    });

    // 2. Validate Employees
    const employeeEmailsSeen = new Set<string>();
    employeeRecords.forEach((record) => {
      const name = String(record.fields["Name"] || "");
      const email = String(record.fields["Email"] || "");
      const dept = String(record.fields["Department"] || "");
      const empId = String(record.fields["ID"] || record.id);

      if (!name) {
        issues.push({
          id: `emp-miss-name-${record.id}`,
          severity: "High",
          category: "Missing Required Fields",
          entity: "Employees",
          record: empId,
          description: "Employee Name is blank",
          status: "Unresolved",
        });
      }

      if (!email) {
        issues.push({
          id: `emp-miss-email-${record.id}`,
          severity: "High",
          category: "Missing Required Fields",
          entity: "Employees",
          record: name || empId,
          description: `Email is missing for employee "${name}"`,
          status: "Unresolved",
        });
      } else {
        if (!emailRegex.test(email)) {
          issues.push({
            id: `emp-inv-email-${record.id}`,
            severity: "High",
            category: "Invalid Email",
            entity: "Employees",
            record: name || empId,
            description: `Invalid email format "${email}" for employee "${name}"`,
            status: "Unresolved",
          });
        }
        const lowerEmail = email.toLowerCase().trim();
        if (employeeEmailsSeen.has(lowerEmail)) {
          issues.push({
            id: `emp-dup-email-${record.id}`,
            severity: "Medium",
            category: "Duplicate Records",
            entity: "Employees",
            record: email,
            description: `Duplicate employee email "${email}"`,
            status: "Unresolved",
          });
        } else {
          employeeEmailsSeen.add(lowerEmail);
        }
      }

      // Check department relationship
      if (dept && !departmentMap.has(dept)) {
        issues.push({
          id: `emp-rel-dept-${record.id}`,
          severity: "Medium",
          category: "Invalid Relationships",
          entity: "Employees",
          record: name || empId,
          description: `Employee "${name}" points to non-existent department "${dept}"`,
          status: "Unresolved",
        });
      }
    });

    // 3. Validate KPIs
    kpiRecords.forEach((record) => {
      const name = String(record.fields["KPI Name"] || "");
      const target = Number(record.fields["target"] || record.fields["Target Value"] || 0);
      const actual = Number(record.fields["actual"] || record.fields["Actual Value"] || 0);
      const dueDateStr = String(record.fields["Due Date"] || "");
      const kpiId = String(record.fields["ID"] || record.id);

      if (!name) {
        issues.push({
          id: `kpi-miss-name-${record.id}`,
          severity: "High",
          category: "Missing Required Fields",
          entity: "KPIs",
          record: kpiId,
          description: "KPI Name is blank",
          status: "Unresolved",
        });
      }

      if (target <= 0) {
        issues.push({
          id: `kpi-inv-target-${record.id}`,
          severity: "Medium",
          category: "Invalid Thresholds",
          entity: "KPIs",
          record: name || kpiId,
          description: `KPI Target is 0 or negative for "${name}"`,
          status: "Unresolved",
        });
      }

      if (dueDateStr) {
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
          issues.push({
            id: `kpi-inv-date-${record.id}`,
            severity: "Medium",
            category: "Invalid Dates",
            entity: "KPIs",
            record: name || kpiId,
            description: `Invalid date format "${dueDateStr}" for KPI "${name}"`,
            status: "Unresolved",
          });
        } else if (dueDate < new Date(Date.now() - 365 * 24 * 3600 * 1000)) {
          // Date more than a year in the past
          issues.push({
            id: `kpi-past-date-${record.id}`,
            severity: "Low",
            category: "Invalid Dates",
            entity: "KPIs",
            record: name || kpiId,
            description: `KPI due date "${dueDateStr}" is in the distant past`,
            status: "Unresolved",
          });
        }
      }
    });

    // 4. Validate Tasks
    taskRecords.forEach((record) => {
      const name = String(record.fields["Task Name"] || "");
      const assigned = String(record.fields["Assigned Employee"] || "");
      const taskId = String(record.fields["ID"] || record.id);

      if (!name) {
        issues.push({
          id: `task-miss-name-${record.id}`,
          severity: "High",
          category: "Missing Required Fields",
          entity: "Tasks",
          record: taskId,
          description: "Task Name is blank",
          status: "Unresolved",
        });
      }

      if (!assigned) {
        issues.push({
          id: `task-miss-assign-${record.id}`,
          severity: "Medium",
          category: "Missing Required Fields",
          entity: "Tasks",
          record: name || taskId,
          description: `Task "${name}" is not assigned to any employee`,
          status: "Unresolved",
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: issues,
        message: `Validation complete. Found ${issues.length} issues.`,
      } as APIResponse<typeof issues>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/settings/validation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to run data validation center scan",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

