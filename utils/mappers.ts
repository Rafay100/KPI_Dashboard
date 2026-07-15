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
  for (const candidate of candidates) {
    if (candidate in fields && fields[candidate] !== undefined && fields[candidate] !== null) {
      return fields[candidate];
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

  // Use ACTUAL Airtable column names
  return {
    id: record.id,
    kpiName: safeString(fields["KPI Name"]) || `KPI-${record.id.slice(0, 8)}`,
    description: safeString(fields["Description"] || fields["Notes"]),
    // Resolve department and employee references using possible field names
    departmentId: safeString(getFieldValue(fields, ["Department ID", "Department", "Dept", "department"])),
    employeeId: safeString(getFieldValue(fields, ["Employee ID", "Assigned Employee", "Employee", "assignedEmployee"])),
    targetValue: safeNumber(getFieldValue(fields, ["Target Value", "target", "Target", "targetValue"])),
    actualValue: safeNumber(getFieldValue(fields, ["Actual Value", "actual", "Actual", "actualValue"])),
    status: normalizeKPIStatus(safeString(fields["Status"])),
    score: safeNumber(fields["Score"] || fields["score"]),
    dueDate: formatDateISO(safeString(fields["Due Date"])),
    lastUpdated: formatDateISO(safeString(fields["Last Updated"] || fields["Modified"])) || new Date().toISOString(),
    createdAt: formatDateISO(safeString(fields["Created Date"] || fields["Created"])) || new Date().toISOString(),
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
    id: safeString(getFieldValue(fields, ["ID", mapping.id])) || record.id,
    name: safeString(getFieldValue(fields, ["Name", mapping.name, "Employee Name"])) || "Unknown Employee",
    email: safeString(getFieldValue(fields, ["Email", mapping.email])),
    department: safeString(getFieldValue(fields, ["Department", mapping.department])),
    departmentId: safeString(getFieldValue(fields, ["Department", "Department ID"])),
    team: safeString(getFieldValue(fields, ["Team", "Team Name"])),
    position: safeString(getFieldValue(fields, ["Position", "Role", "Job Title"])),
    overallScore: safeNumber(getFieldValue(fields, ["KPI Score", mapping.kpiScore, "Overall Score"])),
    totalKPIs: safeNumber(getFieldValue(fields, ["Total KPIs", "KPIs Assigned"])),
    completedKPIs: safeNumber(getFieldValue(fields, ["Completed KPIs", "KPIs Completed"])),
    avatar: safeString(getFieldValue(fields, ["Avatar", "Photo"])),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At"]))) || new Date().toISOString(),
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
    id: safeString(getFieldValue(fields, ["ID", mapping.id])) || record.id,
    departmentName: safeString(getFieldValue(fields, ["Department Name", mapping.departmentName, "Name"])) || "Unknown Department",
    description: safeString(getFieldValue(fields, ["Description", mapping.description, "Notes"])),
    averageScore: safeNumber(getFieldValue(fields, ["Avg KPI Sciore", "Avg KPI Score", mapping.averageScore, "Average Score"])),
    employeeCount: safeNumber(getFieldValue(fields, ["Employee Count", mapping.employeeCount, "Total Employees"])),
    totalKPIs: safeNumber(getFieldValue(fields, ["Active KPIs", mapping.activeKpis, "Total KPIs"])),
    completedKPIs: safeNumber(getFieldValue(fields, ["Completed KPIs", "KPIs Completed"])),
    headOfDepartment: safeString(getFieldValue(fields, ["Manager", mapping.manager, "Department Head"])),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At"]))) || new Date().toISOString(),
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
    taskName: safeString(getFieldValue(fields, ["Task Name", mapping.taskName, "Name", "Title"])) || "Untitled Task",
    description: safeString(getFieldValue(fields, ["Description", mapping.description, "Notes"])),
    status: normalizeTaskStatus(safeString(getFieldValue(fields, ["Status", mapping.status]))),
    priority: normalizeTaskPriority(safeString(getFieldValue(fields, ["Priority", mapping.priority]))),
    assignedTo: safeString(getFieldValue(fields, ["Assigned To", mapping.assignedTo, "Assigned Employee"])),
    assignedToId: safeString(getFieldValue(fields, ["Assigned To", "Assigned Employee ID"])),
    kpiId: safeString(getFieldValue(fields, ["Related KPI", mapping.relatedKpi, "KPI ID"])),
    dueDate: formatDateISO(safeString(getFieldValue(fields, ["Due Date", mapping.dueDate]))),
    completedAt: formatDateISO(safeString(getFieldValue(fields, ["Completed Date", "Completed At"]))),
    createdAt: formatDateISO(safeString(getFieldValue(fields, ["Created Date", "Created At"]))) || new Date().toISOString(),
    lastUpdated: formatDateISO(safeString(getFieldValue(fields, ["Last Updated", "Updated At"]))) || new Date().toISOString(),
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
