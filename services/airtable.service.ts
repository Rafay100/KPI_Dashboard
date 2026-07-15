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
  ]);

  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => allowedFields.has(key))
  );
}

/**
 * Airtable Service
 * Provides data access methods for all entities
 */

export class AirtableService {
  /**
   * Fetch all dashboard data in parallel - OPTIMIZED
   * This is called by the /api/dashboard endpoint for maximum performance
   */
  async getAllDashboardData() {
    try {
      const base = airtableClient.getBase();

      // Get all table names in parallel
      const [kpiTableName, employeeTableName, departmentTableName, taskTableName, achievementTableName] =
        await Promise.all([
          airtableClient.getTableName("kpis"),
          airtableClient.getTableName("employees"),
          airtableClient.getTableName("departments"),
          airtableClient.getTableName("tasks"),
          airtableClient.getTableName("achievements"),
        ]);

      // Fetch all data in parallel
      const [kpiRecords, employeeRecords, departmentRecords, taskRecords, achievementRecords] =
        await Promise.all([
          base<AirtableKPIFields>(kpiTableName).select().all().catch(() => []),
          base<AirtableEmployeeFields>(employeeTableName).select().all().catch(() => []),
          base<AirtableDepartmentFields>(departmentTableName).select().all().catch(() => []),
          base<AirtableTaskFields>(taskTableName).select().all().catch(() => []),
          base<AirtableAchievementFields>(achievementTableName).select().all().catch(() => []),
        ]);

      // Map all data in parallel
      const [kpis, employees, departments, tasks, achievements] = await Promise.all([
        Promise.resolve(kpiRecords.map((record) => mapKPIFromAirtable(record))),
        Promise.resolve(employeeRecords.map((record) => mapEmployeeFromAirtable(record))),
        Promise.resolve(departmentRecords.map((record) => mapDepartmentFromAirtable(record))),
        Promise.resolve(taskRecords.map((record) => mapTaskFromAirtable(record))),
        Promise.resolve(achievementRecords.map((record) => mapAchievementFromAirtable(record))),
      ]);

      // Update local fallback data
      localFallbackData.kpis = kpis;
      localFallbackData.employees = employees;
      localFallbackData.departments = departments;
      localFallbackData.tasks = tasks;
      localFallbackData.achievements = achievements;

      return { kpis, employees, departments, tasks, achievements };
    } catch (error) {
      console.error("Error fetching all dashboard data:", error);

      // Return fallback data if available
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
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("kpis");

      const records = await base<AirtableKPIFields>(tableName).select().all();
      const mapped = records.map((record) => mapKPIFromAirtable(record));
      localFallbackData.kpis = mapped;
      return mapped;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      if (localFallbackData.kpis.length > 0) {
        return localFallbackData.kpis;
      }
      return [];
    }
  }

  /**
   * Get KPI by ID
   */
  async getKPIById(id: string): Promise<KPI | null> {
    try {
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("kpis");

      const record = await base<AirtableKPIFields>(tableName).find(id);

      return mapKPIFromAirtable(record);
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
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("employees");

      const records = await base<AirtableEmployeeFields>(tableName).select().all();
      const mapped = records.map((record) => mapEmployeeFromAirtable(record));
      localFallbackData.employees = mapped;
      return mapped;
    } catch (error) {
      console.error("Error fetching Employees:", error);
      if (localFallbackData.employees.length > 0) {
        return localFallbackData.employees;
      }
      return [];
    }
  }

  /**
   * Get Employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("employees");

      const record = await base<AirtableEmployeeFields>(tableName).find(id);

      return mapEmployeeFromAirtable(record);
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
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("departments");

      const records = await base<AirtableDepartmentFields>(tableName).select().all();
      const mapped = records.map((record) => mapDepartmentFromAirtable(record));
      localFallbackData.departments = mapped;
      return mapped;
    } catch (error) {
      console.error("Error fetching Departments:", error);
      if (localFallbackData.departments.length > 0) {
        return localFallbackData.departments;
      }
      return [];
    }
  }

  /**
   * Get Department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("departments");

      const record = await base<AirtableDepartmentFields>(tableName).find(id);

      return mapDepartmentFromAirtable(record);
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
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("tasks");

      const records = await base<AirtableTaskFields>(tableName).select().all();
      const mapped = records.map((record) => mapTaskFromAirtable(record));
      localFallbackData.tasks = mapped;
      return mapped;
    } catch (error) {
      console.error("Error fetching Tasks:", error);
      if (localFallbackData.tasks.length > 0) {
        return localFallbackData.tasks;
      }
      return [];
    }
  }

  /**
   * Get Task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("tasks");

      const record = await base<AirtableTaskFields>(tableName).find(id);

      return mapTaskFromAirtable(record);
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
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("achievements");

      const records = await base<AirtableAchievementFields>(tableName).select().all();
      const mapped = records.map((record) => mapAchievementFromAirtable(record));
      localFallbackData.achievements = mapped;
      return mapped;
    } catch (error) {
      console.error("Error fetching Achievements:", error);
      if (localFallbackData.achievements.length > 0) {
        return localFallbackData.achievements;
      }
      return [];
    }
  }

  /**
   * Get Achievement by ID
   */
  async getAchievementById(id: string): Promise<Achievement | null> {
    try {
      const base = airtableClient.getBase();
      const tableName = await airtableClient.getTableName("achievements");

      const record = await base<AirtableAchievementFields>(tableName).find(id);

      return mapAchievementFromAirtable(record);
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
