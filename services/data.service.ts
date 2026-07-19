import airtableClient from "@/services/airtable.client";
import type { FieldSet } from "airtable";
import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
} from "@/types/models";
import {
  mapKPIFromAirtable,
  mapEmployeeFromAirtable,
  mapDepartmentFromAirtable,
  mapTaskFromAirtable,
  mapAchievementFromAirtable,
} from "@/utils/mappers";

const localFallbackData = {
  kpis: [] as KPI[],
  employees: [] as Employee[],
  departments: [] as Department[],
  tasks: [] as Task[],
  achievements: [] as Achievement[],
};

function createLocalKPIRecord(fields: Record<string, unknown>): KPI {
  const kpiName = String(
    fields["KPI Name"] || fields.Name || fields.kpiName || "Untitled KPI"
  );
  return {
    id: `local-${Date.now()}`,
    kpiName,
    description: String(
      fields.Description || fields.description || ""
    ),
    departmentId: String(
      fields["Department ID"] || fields.DepartmentId || fields.departmentId || ""
    ),
    employeeId: String(
      fields["Employee ID"] || fields.EmployeeId || fields.employeeId || ""
    ),
    targetValue: Number(fields.TargetValue || fields.targetValue || 0),
    actualValue: Number(fields.ActualValue || fields.actualValue || 0),
    status: String(fields.Status || fields.status || "not-started") as KPI["status"],
    score: 0,
    dueDate: fields.DueDate || fields.dueDate
      ? String(fields.DueDate || fields.dueDate)
      : new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

function sanitizeFieldsForAirtable(fields: Record<string, unknown>): Record<string, unknown> {
  const allowedFields = new Set([
    "Name",
    "KPI Name",
    "Description",
    "Department ID",
    "DepartmentId",
    "departmentId",
    "Employee ID",
    "EmployeeId",
    "employeeId",
    "TargetValue",
    "targetValue",
    "ActualValue",
    "actualValue",
    "Status",
    "status",
    "DueDate",
    "dueDate",
    "LastUpdated",
    "lastUpdated",
    "ID",
    "id",
    "Category",
    "category",
    "Team",
    "team",
    "Owner",
    "owner",
    "Frequency",
    "frequency",
    "Unit",
    "unit",
    "Target Value",
    "target",
    "Actual Value",
    "actual"
  ]);

  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => allowedFields.has(key))
  );
}

import { AdapterFactory } from "@/adapters";

/**
 * Data Service
 * Acts as the primary backend data coordinator, routing all queries
 * dynamically through the configured adapter (e.g. Google Sheets).
 */
export class DataService {
  private async getAdapter() {
    const adapter = AdapterFactory.createFromEnv();
    await adapter.connect();
    return adapter;
  }

  /**
   * Fetch all dashboard data in parallel - OPTIMIZED
   */
  async getAllDashboardData() {
    try {
      const adapter = await this.getAdapter();
      const [kpis, employees, departments, tasks, achievements] = await Promise.all([
        adapter.fetchKPIs(),
        adapter.fetchEmployees(),
        adapter.fetchDepartments(),
        adapter.fetchTasks(),
        adapter.fetchAchievements(),
      ]);

      // Update local fallback data
      localFallbackData.kpis = kpis;
      localFallbackData.employees = employees;
      localFallbackData.departments = departments;
      localFallbackData.tasks = tasks;
      localFallbackData.achievements = achievements;

      try {
        await adapter.disconnect();
      } catch (err) {
        // Ignored
      }

      return { kpis, employees, departments, tasks, achievements };
    } catch (error) {
      console.error("Error fetching all dashboard data via adapter:", error);
      return {
        kpis: localFallbackData.kpis,
        employees: localFallbackData.employees,
        departments: localFallbackData.departments,
        tasks: localFallbackData.tasks,
        achievements: localFallbackData.achievements,
      };
    }
  }

  /**
   * Get all KPIs
   */
  async getKPIs(): Promise<KPI[]> {
    try {
      const adapter = await this.getAdapter();
      const kpis = await adapter.fetchKPIs();
      localFallbackData.kpis = kpis;
      try { await adapter.disconnect(); } catch {}
      return kpis;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      return localFallbackData.kpis;
    }
  }

  /**
   * Get KPI by ID
   */
  async getKPIById(id: string): Promise<KPI | null> {
    try {
      const kpis = await this.getKPIs();
      return kpis.find(k => k.id === id) || null;
    } catch (error) {
      console.error(`Error fetching KPI ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all Employees
   */
  async getEmployees(): Promise<Employee[]> {
    try {
      const adapter = await this.getAdapter();
      const employees = await adapter.fetchEmployees();
      localFallbackData.employees = employees;
      try { await adapter.disconnect(); } catch {}
      return employees;
    } catch (error) {
      console.error("Error fetching Employees:", error);
      return localFallbackData.employees;
    }
  }

  /**
   * Get Employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const employees = await this.getEmployees();
      return employees.find(e => e.id === id) || null;
    } catch (error) {
      console.error(`Error fetching Employee ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all Departments
   */
  async getDepartments(): Promise<Department[]> {
    try {
      const adapter = await this.getAdapter();
      const departments = await adapter.fetchDepartments();
      localFallbackData.departments = departments;
      try { await adapter.disconnect(); } catch {}
      return departments;
    } catch (error) {
      console.error("Error fetching Departments:", error);
      return localFallbackData.departments;
    }
  }

  /**
   * Get Department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const departments = await this.getDepartments();
      return departments.find(d => d.id === id) || null;
    } catch (error) {
      console.error(`Error fetching Department ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all Tasks
   */
  async getTasks(): Promise<Task[]> {
    try {
      const adapter = await this.getAdapter();
      const tasks = await adapter.fetchTasks();
      localFallbackData.tasks = tasks;
      try { await adapter.disconnect(); } catch {}
      return tasks;
    } catch (error) {
      console.error("Error fetching Tasks:", error);
      return localFallbackData.tasks;
    }
  }

  /**
   * Get Task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getTasks();
      return tasks.find(t => t.id === id) || null;
    } catch (error) {
      console.error(`Error fetching Task ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all Achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const adapter = await this.getAdapter();
      const achievements = await adapter.fetchAchievements();
      localFallbackData.achievements = achievements;
      try { await adapter.disconnect(); } catch {}
      return achievements;
    } catch (error) {
      console.error("Error fetching Achievements:", error);
      return localFallbackData.achievements;
    }
  }

  async getAchievementById(id: string): Promise<Achievement | null> {
    try {
      const achievements = await this.getAchievements();
      return achievements.find(a => a.id === id) || null;
    } catch (error) {
      console.error(`Error fetching Achievement ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new record (generic)
   */
  async createRecord<T extends FieldSet>(
    tableName: string,
    fields: Partial<T>
  ): Promise<string> {
    const normalizedFields = sanitizeFieldsForAirtable(fields as Record<string, unknown>);
    let recordId = `local-${Date.now()}`;

    try {
      const base = airtableClient.getBase();
      const resolvedTableName =
        tableName.toLowerCase() === "kpis"
          ? await airtableClient.getTableName("kpis")
          : tableName;

      const record = await base(resolvedTableName).create(normalizedFields as T);
      recordId = record.id;
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);

      if (tableName.toLowerCase() === "kpis") {
        const isUnknownFieldError =
          error instanceof Error &&
          /unknown field name|invalid field|not supported/i.test(error.message);

        if (isUnknownFieldError && Object.keys(normalizedFields).length > 1) {
          const retryFields = Object.fromEntries(
            Object.entries(normalizedFields).filter(([key]) => !["Description", "description"].includes(key))
          );

          try {
            const base = airtableClient.getBase();
            const resolvedTableName = await airtableClient.getTableName("kpis");
            const record = await base(resolvedTableName).create(retryFields as T);
            recordId = record.id;
          } catch (retryError) {
            console.error("Retry create after field sanitization failed:", retryError);
          }
        }
      }
    }

    // Always update local fallback data
    const lowerTable = tableName.toLowerCase();
    if (lowerTable === "kpis") {
      const localKPI = createLocalKPIRecord(fields as Record<string, unknown>);
      localKPI.id = recordId;
      localFallbackData.kpis = [localKPI, ...localFallbackData.kpis];
    } else if (lowerTable === "tasks") {
      const localTask: Task = {
        id: recordId,
        title: String(fields.Title || fields.title || fields.Name || "New Task"),
        description: String(fields.Description || fields.description || ""),
        status: String(fields.Status || fields.status || "Todo") as Task["status"],
        priority: String(fields.Priority || fields.priority || "Medium") as Task["priority"],
        dueDate: String(fields.DueDate || fields.dueDate || new Date().toISOString()),
        assigneeId: String(fields.AssigneeId || fields.assigneeId || fields.Assignee || ""),
        kpiId: String(fields.KpiId || fields.kpiId || fields.KPI || ""),
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      localFallbackData.tasks = [localTask, ...localFallbackData.tasks];
    } else if (lowerTable === "employees") {
      const localEmployee: Employee = {
        id: recordId,
        name: String(fields.Name || fields.name || "New Employee"),
        email: String(fields.Email || fields.email || ""),
        role: String(fields.Role || fields.role || ""),
        departmentId: String(fields.DepartmentId || fields.departmentId || ""),
        avatarUrl: String(fields.AvatarUrl || fields.avatarUrl || ""),
        status: String(fields.Status || fields.status || "active") as Employee["status"],
        joinedDate: String(fields.JoinedDate || fields.joinedDate || new Date().toISOString()),
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      localFallbackData.employees = [localEmployee, ...localFallbackData.employees];
    } else if (lowerTable === "departments") {
      const localDept: Department = {
        id: recordId,
        name: String(fields.Name || fields.name || "New Department"),
        code: String(fields.Code || fields.code || ""),
        managerId: String(fields.ManagerId || fields.managerId || ""),
        description: String(fields.Description || fields.description || ""),
        budget: Number(fields.Budget || fields.budget || 0),
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      localFallbackData.departments = [localDept, ...localFallbackData.departments];
    } else if (lowerTable === "achievements") {
      const localAchievement: Achievement = {
        id: recordId,
        title: String(fields.Title || fields.title || "New Achievement"),
        description: String(fields.Description || fields.description || ""),
        employeeId: String(fields.EmployeeId || fields.employeeId || ""),
        badgeUrl: String(fields.BadgeUrl || fields.badgeUrl || ""),
        dateEarned: String(fields.DateEarned || fields.dateEarned || new Date().toISOString()),
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      localFallbackData.achievements = [localAchievement, ...localFallbackData.achievements];
    }

    return recordId;
  }

  /**
   * Update a record (generic)
   */
  async updateRecord<T extends FieldSet>(
    tableName: string,
    id: string,
    fields: Partial<T>
  ): Promise<boolean> {
    try {
      const base = airtableClient.getBase();
      const resolvedTableName =
        tableName.toLowerCase() === "kpis"
          ? await airtableClient.getTableName("kpis")
          : tableName;
      await base(resolvedTableName).update(id, fields as T);
    } catch (error) {
      console.error(`Error updating record ${id} in ${tableName}:`, error);
    }

    // Always update local fallback data
    const lowerTable = tableName.toLowerCase();
    if (lowerTable === "kpis") {
      localFallbackData.kpis = localFallbackData.kpis.map(k => {
        if (k.id === id) {
          const kpiName = fields.Name !== undefined || fields["KPI Name"] !== undefined
            ? String(fields["KPI Name"] || fields.Name)
            : k.kpiName;
          return {
            ...k,
            kpiName,
            description: fields.Description !== undefined ? String(fields.Description) : k.description,
            departmentId: fields.DepartmentId !== undefined ? String(fields.DepartmentId) : k.departmentId,
            employeeId: fields.EmployeeId !== undefined ? String(fields.EmployeeId) : k.employeeId,
            targetValue: fields.TargetValue !== undefined ? Number(fields.TargetValue) : k.targetValue,
            actualValue: fields.ActualValue !== undefined ? Number(fields.ActualValue) : k.actualValue,
            status: fields.Status !== undefined ? String(fields.Status) as KPI["status"] : k.status,
            dueDate: fields.DueDate !== undefined ? String(fields.DueDate) : k.dueDate,
            lastUpdated: new Date().toISOString(),
          };
        }
        return k;
      });
    }

    return true;
  }

  /**
   * Delete a record (generic)
   */
  async deleteRecord(tableName: string, id: string): Promise<boolean> {
    try {
      const base = airtableClient.getBase();
      const resolvedTableName =
        tableName.toLowerCase() === "kpis"
          ? await airtableClient.getTableName("kpis")
          : tableName;
      await base(resolvedTableName).destroy(id);
    } catch (error) {
      console.error(`Error deleting record ${id} from ${tableName}:`, error);
    }

    // Always delete from local fallback data so the UI updates correctly
    const lowerTable = tableName.toLowerCase();
    if (lowerTable === "kpis") {
      localFallbackData.kpis = localFallbackData.kpis.filter(k => k.id !== id);
    } else if (lowerTable === "tasks") {
      localFallbackData.tasks = localFallbackData.tasks.filter(t => t.id !== id);
    } else if (lowerTable === "employees") {
      localFallbackData.employees = localFallbackData.employees.filter(e => e.id !== id);
    } else if (lowerTable === "departments") {
      localFallbackData.departments = localFallbackData.departments.filter(d => d.id !== id);
    } else if (lowerTable === "achievements") {
      localFallbackData.achievements = localFallbackData.achievements.filter(a => a.id !== id);
    }

    return true;
  }
}

export const dataService = new DataService();
