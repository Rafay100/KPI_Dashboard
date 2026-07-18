import airtableClient from "./airtable.client";
import type { FieldSet } from "airtable";
import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
} from "@/types/models";
import type {
  AirtableKPIFields,
  AirtableEmployeeFields,
  AirtableDepartmentFields,
  AirtableTaskFields,
  AirtableAchievementFields,
} from "@/types/airtable";
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
 * Airtable Service (Redirected to use Adapter Factory)
 * Acts as the primary backend data coordinator, now routing all queries
 * dynamically through the configured adapter (e.g. Google Sheets).
 */
export class AirtableService {
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

    try {
      const base = airtableClient.getBase();
      const resolvedTableName =
        tableName.toLowerCase() === "kpis"
          ? await airtableClient.getTableName("kpis")
          : tableName;

      const record = await base(resolvedTableName).create(normalizedFields as T);
      if (tableName.toLowerCase() === "kpis") {
        const localKPI = createLocalKPIRecord(fields as Record<string, unknown>);
        localKPI.id = record.id;
        localFallbackData.kpis = [localKPI, ...localFallbackData.kpis];
      }
      return record.id;
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
            const localKPI = createLocalKPIRecord(fields as Record<string, unknown>);
            localKPI.id = record.id;
            localFallbackData.kpis = [localKPI, ...localFallbackData.kpis];
            return record.id;
          } catch (retryError) {
            console.error("Retry create after field sanitization failed:", retryError);
          }
        }

        const localKPI = createLocalKPIRecord(fields as Record<string, unknown>);
        localFallbackData.kpis = [localKPI, ...localFallbackData.kpis];
        return localKPI.id;
      }
      throw new Error(`Failed to create record in ${tableName}`);
    }
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
      await base(tableName).update(id, fields as T);
      return true;
    } catch (error) {
      console.error(`Error updating record ${id} in ${tableName}:`, error);
      throw new Error(`Failed to update record in ${tableName}`);
    }
  }

  /**
   * Delete a record (generic)
   */
  async deleteRecord(tableName: string, id: string): Promise<boolean> {
    try {
      const base = airtableClient.getBase();
      await base(tableName).destroy(id);
      return true;
    } catch (error) {
      console.error(`Error deleting record ${id} from ${tableName}:`, error);
      throw new Error(`Failed to delete record from ${tableName}`);
    }
  }
}

export const airtableService = new AirtableService();
