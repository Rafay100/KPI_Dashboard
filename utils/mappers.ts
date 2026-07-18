import type {
  AirtableRecord,
  AirtableKPIFields,
  AirtableEmployeeFields,
  AirtableDepartmentFields,
  AirtableTaskFields,
  AirtableAchievementFields,
} from "@/types/airtable";
import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
} from "@/types/models";
import { safeString, safeNumber, formatDateISO } from "./helpers";
import { AIRTABLE_FIELD_MAPPINGS } from "@/config/airtable-field-mappings";

function getFieldValue(fields: Record<string, unknown>, candidates: string[]): unknown {
  if (!fields) return undefined;

  // 1. Direct match first
  for (const candidate of candidates) {
    if (candidate && candidate in fields && fields[candidate] !== undefined && fields[candidate] !== null) {
      return fields[candidate];
    }
  }

  // 2. Normalize fields keys to lowercase and remove spaces, underscores, hyphens
  const normalize = (str: string) => str.toLowerCase().replace(/[\s_-]/g, "");

  const normalizedFields: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    normalizedFields[normalize(key)] = fields[key];
  }

  // 3. Try to match normalized candidates
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normCandidate = normalize(candidate);
    if (normCandidate in normalizedFields && normalizedFields[normCandidate] !== undefined && normalizedFields[normCandidate] !== null) {
      return normalizedFields[normCandidate];
    }
  }

  return undefined;
}

/**
 * Map Airtable KPI record to normalized KPI model - USING ACTUAL AIRTABLE FIELD NAMES
 */
export function mapKPIFromAirtable(
  record: AirtableRecord<AirtableKPIFields>
): KPI {
  const fields = record.fields as Record<string, unknown>;

  // Use ACTUAL Airtable column names with robust matching
  return {
    id: record.id,
    kpiName: safeString(getFieldValue(fields, ["KPI Name", "name", "Name", "title", "Title"])) || `KPI-${record.id.slice(0, 8)}`,
    description: safeString(fields["Description"] || fields["Notes"] || fields["description"] || fields["notes"]),
    // Resolve department and employee references using possible field names
    departmentId: safeString(getFieldValue(fields, ["Department ID", "Department", "Dept", "department", "department_id"])),
    employeeId: safeString(getFieldValue(fields, ["Employee ID", "Assigned Employee", "Employee", "assignedEmployee", "owner_employee_id"])),
    targetValue: safeNumber(getFieldValue(fields, ["Target Value", "target", "Target", "targetValue", "target_value"])),
    actualValue: safeNumber(getFieldValue(fields, ["Actual Value", "actual", "Actual", "actualValue", "actual_value"])),
    status: normalizeKPIStatus(safeString(getFieldValue(fields, ["Status", "status"]))),
    score: safeNumber(getFieldValue(fields, ["Score", "score"])),
    dueDate: formatDateISO(safeString(getFieldValue(fields, ["Due Date", "due_date"]))),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Modified", "updated_at"]))) || new Date().toISOString(),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created", "created_at"]))) || new Date().toISOString(),
    code: safeString(getFieldValue(fields, ["ID", "id", "kpi_code"])),
    category: safeString(getFieldValue(fields, ["Category", "category"])),
    team: safeString(getFieldValue(fields, ["Team", "team", "team_id"])),
    owner: safeString(getFieldValue(fields, ["Owner", "owner", "owner_employee_id"])),
    frequency: safeString(getFieldValue(fields, ["Frequency", "frequency"])),
    unit: safeString(getFieldValue(fields, ["Unit", "unit", "measurement_unit"])),
  };
}

/**
 * Map Airtable Employee record - UPDATED WITH ACTUAL FIELDS
 */
export function mapEmployeeFromAirtable(
  record: AirtableRecord<AirtableEmployeeFields>
): Employee {
  const fields = record.fields as Record<string, unknown>;
  const mapping = AIRTABLE_FIELD_MAPPINGS.employees;

  return {
    id: safeString(getFieldValue(fields, ["ID", mapping.id, "id"])) || record.id,
    name: safeString(getFieldValue(fields, ["Name", mapping.name, "Employee Name", "name"])) || "Unknown Employee",
    email: safeString(getFieldValue(fields, ["Email", mapping.email, "email"])),
    department: safeString(getFieldValue(fields, ["Department", mapping.department, "department_id"])),
    departmentId: safeString(getFieldValue(fields, ["Department", "Department ID", "department_id"])),
    team: safeString(getFieldValue(fields, ["Team", "Team Name", "team_id"])),
    position: safeString(getFieldValue(fields, ["Position", "Role", "Job Title", "role_title"])),
    overallScore: safeNumber(getFieldValue(fields, ["KPI Score", mapping.kpiScore, "Overall Score", "kpi_score", "overall_performance_score"])),
    totalKPIs: safeNumber(getFieldValue(fields, ["Total KPIs", "KPIs Assigned", "active_kpi_count"])),
    completedKPIs: safeNumber(getFieldValue(fields, ["Completed KPIs", "KPIs Completed", "completed_kpi_count"])),
    avatar: safeString(getFieldValue(fields, ["Avatar", "Photo", "avatar"])),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At", "created_at"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At", "updated_at"]))) || new Date().toISOString(),
    manager: safeString(getFieldValue(fields, ["Manager", mapping.manager, "manager_employee_id"])),
  };
}

/**
 * Map Airtable Department record - UPDATED WITH ACTUAL FIELDS
 */
export function mapDepartmentFromAirtable(
  record: AirtableRecord<AirtableDepartmentFields>
): Department {
  const fields = record.fields as Record<string, unknown>;
  const mapping = AIRTABLE_FIELD_MAPPINGS.departments;

  return {
    id: safeString(getFieldValue(fields, ["ID", mapping.id, "id"])) || record.id,
    departmentName: safeString(getFieldValue(fields, ["Department Name", mapping.departmentName, "Name", "name"])) || "Unknown Department",
    description: safeString(getFieldValue(fields, ["Description", mapping.description, "Notes", "description"])),
    averageScore: safeNumber(getFieldValue(fields, ["Avg KPI Sciore", "Avg KPI Score", mapping.averageScore, "Average Score", "average_kpi_score", "overall_score"])),
    employeeCount: safeNumber(getFieldValue(fields, ["Employee Count", mapping.employeeCount, "Total Employees", "employee_count"])),
    totalKPIs: safeNumber(getFieldValue(fields, ["Active KPIs", mapping.activeKpis, "Total KPIs", "active_kpi_count"])),
    completedKPIs: safeNumber(getFieldValue(fields, ["Completed KPIs", "KPIs Completed", "completed_kpi_count"])),
    headOfDepartment: safeString(getFieldValue(fields, ["Manager", mapping.manager, "Department Head", "manager_employee_id"])),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At", "created_at"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At", "updated_at"]))) || new Date().toISOString(),
  };
}

/**
 * Map Airtable Task record
 */
export function mapTaskFromAirtable(
  record: AirtableRecord<AirtableTaskFields>
): Task {
  const fields = record.fields as Record<string, unknown>;
  const mapping = AIRTABLE_FIELD_MAPPINGS.tasks;

  return {
    id: record.id,
    taskName: safeString(getFieldValue(fields, ["Task Name", mapping.taskName, "Name", "Title", "title"])) || "Untitled Task",
    description: safeString(getFieldValue(fields, ["Description", mapping.description, "Notes", "description"])),
    status: normalizeTaskStatus(safeString(getFieldValue(fields, ["Status", mapping.status, "status"]))),
    priority: normalizeTaskPriority(safeString(getFieldValue(fields, ["Priority", mapping.priority, "priority"]))),
    assignedTo: safeString(getFieldValue(fields, ["Assigned To", mapping.assignedTo, "Assigned Employee", "assigned_employee_id"])),
    assignedToId: safeString(getFieldValue(fields, ["Assigned To", "Assigned Employee ID", "assigned_employee_id"])),
    kpiId: safeString(getFieldValue(fields, ["Related KPI", mapping.relatedKpi, "KPI ID", "related_kpi_id"])),
    dueDate: formatDateISO(safeString(getFieldValue(fields, ["Due Date", mapping.dueDate, "due_date"]))),
    completedAt: formatDateISO(safeString(getFieldValue(fields, ["Completed Date", "Completed At", "updated_at"]))),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At", "created_at"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At", "updated_at"]))) || new Date().toISOString(),
  };
}

/**
 * Map Airtable Achievement record - UPDATED WITH ACTUAL FIELDS
 */
export function mapAchievementFromAirtable(
  record: AirtableRecord<AirtableAchievementFields>
): Achievement {
  const fields = record.fields as Record<string, unknown>;
  const mapping = AIRTABLE_FIELD_MAPPINGS.achievements;

  return {
    id: safeString(getFieldValue(fields, ["ID", mapping.id])) || record.id,
    title: safeString(getFieldValue(fields, ["Title", mapping.title, "Name", "Achievement Name"])) || "Achievement",
    description: safeString(getFieldValue(fields, ["Description", mapping.description])),
    points: safeNumber(getFieldValue(fields, ["Points", mapping.points])),
    employeeId: safeString(getFieldValue(fields, ["Employee", "Employee ID", mapping.employeeId])),
    employeeName: safeString(getFieldValue(fields, ["Employee", mapping.employee])),
    category: normalizeAchievementCategory(safeString(getFieldValue(fields, ["Category", mapping.category]))),
    achievedAt: formatDateISO(safeString(getFieldValue(fields, ["Date Earned", mapping.dateEarned]))),
    badge: safeString(getFieldValue(fields, ["Badge Type", mapping.badgeType])),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At"]))) || new Date().toISOString(),
  };
}

/**
 * Normalize KPI status
 */
function normalizeKPIStatus(
  status: string | undefined
): "not-started" | "in-progress" | "at-risk" | "completed" | "overdue" {
  if (!status) return "not-started";

  const normalized = status.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "not-started":
    case "not started":
    case "pending":
      return "not-started";
    case "in-progress":
    case "in progress":
    case "active":
    case "on-track":
    case "on track":
      return "in-progress";
    case "at-risk":
    case "at risk":
    case "behind":
      return "at-risk";
    case "completed":
    case "complete":
    case "done":
    case "overachieved":
    case "achieved":
      return "completed";
    case "overdue":
    case "late":
      return "overdue";
    default:
      return "not-started";
  }
}

/**
 * Normalize Task status
 */
function normalizeTaskStatus(
  status: string | undefined
): "todo" | "in-progress" | "completed" | "blocked" {
  if (!status) return "todo";

  const normalized = status.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "todo":
    case "to-do":
    case "pending":
      return "todo";
    case "in-progress":
    case "in progress":
    case "active":
      return "in-progress";
    case "completed":
    case "complete":
    case "done":
      return "completed";
    case "blocked":
    case "stuck":
      return "blocked";
    default:
      return "todo";
  }
}

/**
 * Normalize Task priority
 */
function normalizeTaskPriority(
  priority: string | undefined
): "low" | "medium" | "high" | "critical" {
  if (!priority) return "medium";

  const normalized = priority.toLowerCase();

  switch (normalized) {
    case "low":
      return "low";
    case "medium":
    case "normal":
      return "medium";
    case "high":
      return "high";
    case "critical":
    case "urgent":
      return "critical";
    default:
      return "medium";
  }
}

/**
 * Normalize Achievement category
 */
function normalizeAchievementCategory(
  category: string | undefined
): "kpi-completion" | "milestone" | "excellence" | "teamwork" {
  if (!category) return "milestone";

  const normalized = category.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "kpi-completion":
    case "kpi completion":
      return "kpi-completion";
    case "milestone":
      return "milestone";
    case "excellence":
      return "excellence";
    case "teamwork":
    case "team work":
    case "collaboration":
      return "teamwork";
    default:
      return "milestone";
  }
}
