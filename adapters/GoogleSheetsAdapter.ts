import { BaseAdapter } from "./BaseAdapter";
import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
} from "@/types/models";
import type {
  AdapterConfig,
  ConnectionStatus,
  SyncStatus,
  HealthCheckResponse,
  AdapterCapabilities,
} from "./types";
import { google } from "googleapis";
import {
  mapKPIFromAirtable,
  mapEmployeeFromAirtable,
  mapDepartmentFromAirtable,
  mapTaskFromAirtable,
  mapAchievementFromAirtable,
} from "@/utils/mappers";
import { logInfo, logError, logSuccess } from "@/utils/logger";

/**
 * GoogleSheetsAdapter - Full implementation for Google Sheets data source
 *
 * Authenticates with Google Sheets API using a service account JWT and
 * fetches normalized dashboard records.
 */
export class GoogleSheetsAdapter extends BaseAdapter {
  private serviceName = "GoogleSheetsAdapter";
  private authClient: any = null;

  constructor(config: AdapterConfig) {
    super(config);
  }

  /**
   * Parse the private key from env, handling escaped newlines
   */
  private getPrivateKey(): string {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
    return rawKey.replace(/\\n/g, "\n");
  }

  /**
   * Connect and authenticate with Google Sheets API
   */
  async connect(): Promise<void> {
    try {
      logInfo(this.serviceName, "Connecting to Google Sheets API...");

      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = this.getPrivateKey();
      const sheetId = process.env.GOOGLE_SHEET_ID;

      if (!email || !privateKey || !sheetId) {
        throw new Error(
          "Missing Google Sheets configuration in environment variables"
        );
      }

      this.authClient = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });

      // Verify connection by testing access
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error("Failed to connect or access the specified spreadsheet");
      }

      this.isConnected = true;
      logSuccess(this.serviceName, "Successfully connected to Google Sheets");
    } catch (error) {
      this.isConnected = false;
      logError(this.serviceName, "Connection failed", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    logInfo(this.serviceName, "Disconnecting from Google Sheets");
    this.authClient = null;
    this.isConnected = false;
    logSuccess(this.serviceName, "Disconnected from Google Sheets");
  }

  /**
   * Test the connection to the Google Sheet by reading metadata
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.authClient) {
        return false;
      }

      const sheets = google.sheets({ version: "v4", auth: this.authClient });
      const sheetId = process.env.GOOGLE_SHEET_ID;

      // Try fetching metadata of spreadsheet
      await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      return true;
    } catch (error) {
      logError(this.serviceName, "Spreadsheet access test failed", error);
      return false;
    }
  }

  /**
   * Helper to fetch data rows from a sheet and convert to a list of { id, fields } records
   */
  private async fetchSheetRecords(tabName: string): Promise<any[]> {
    try {
      if (!this.authClient) {
        throw new Error("Google Sheets adapter is not connected");
      }

      const sheets = google.sheets({ version: "v4", auth: this.authClient });
      const sheetId = process.env.GOOGLE_SHEET_ID;

      logInfo(this.serviceName, `Fetching tab "${tabName}" from spreadsheet`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tabName}!A1:ZZ5000`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        logInfo(this.serviceName, `Tab "${tabName}" is empty or does not exist`);
        return [];
      }

      const headers = rows[0].map(h => String(h).trim());
      const dataRows = rows.slice(1);

      return dataRows.map((row, rowIndex) => {
        const fields: Record<string, any> = {};
        headers.forEach((header, colIndex) => {
          const val = row[colIndex];
          fields[header] = val !== undefined && val !== "" ? val : null;
        });

        // Resolve record id
        const id = fields.id || fields.ID || fields.Id || `row_${rowIndex + 1}`;
        return {
          id: String(id),
          fields,
        };
      });
    } catch (error) {
      logError(this.serviceName, `Failed to fetch/parse tab "${tabName}"`, error);
      throw error;
    }
  }

  async fetchKPIs(): Promise<KPI[]> {
    try {
      const records = await this.fetchSheetRecords("KPIs");
      return records.map(record => mapKPIFromAirtable(record));
    } catch (error) {
      logError(this.serviceName, "fetchKPIs failed, returning empty list", error);
      return [];
    }
  }

  async fetchEmployees(): Promise<Employee[]> {
    try {
      const records = await this.fetchSheetRecords("Employees");
      return records
        .map(record => mapEmployeeFromAirtable(record))
        .filter(emp => emp.name && emp.name !== "Unknown Employee" && emp.id !== "null");
    } catch (error) {
      logError(this.serviceName, "fetchEmployees failed, returning empty list", error);
      return [];
    }
  }

  async fetchDepartments(): Promise<Department[]> {
    try {
      const records = await this.fetchSheetRecords("Departments");
      const canonicalIds = new Set([
        "dept_01", "dept_02", "dept_03", "dept_04",
        "dept_05", "dept_06", "dept_07", "dept_08",
        "dept_1", "dept_2", "dept_3", "dept_4",
        "dept_5", "dept_6", "dept_7", "dept_8",
        "1", "2", "3", "4", "5", "6", "7", "8"
      ]);

      const mapped = records
        .map(record => mapDepartmentFromAirtable(record))
        .filter(dept => {
          if (!dept.id || dept.id === "null" || dept.id === "undefined") return false;
          if (!dept.departmentName || dept.departmentName === "Unknown Department" || dept.departmentName === "null" || dept.departmentName === "undefined") return false;
          // Retain only canonical departments (filtering unreferenced shadow dept_09..dept_16)
          const lowerId = dept.id.trim().toLowerCase();
          return canonicalIds.has(lowerId);
        });

      // Deduplicate by canonical department ID if any duplicate rows exist
      const seenIds = new Set<string>();
      const canonicalDepartments: Department[] = [];
      for (const dept of mapped) {
        const normId = dept.id.trim().toLowerCase();
        if (!seenIds.has(normId)) {
          seenIds.add(normId);
          canonicalDepartments.push(dept);
        }
      }

      // Sort by canonical department order (dept_01 through dept_08)
      canonicalDepartments.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      return canonicalDepartments;
    } catch (error) {
      logError(this.serviceName, "fetchDepartments failed, returning empty list", error);
      return [];
    }
  }

  async fetchTasks(): Promise<Task[]> {
    try {
      const records = await this.fetchSheetRecords("Tasks");
      return records.map(record => mapTaskFromAirtable(record));
    } catch (error) {
      logError(this.serviceName, "fetchTasks failed, returning empty list", error);
      return [];
    }
  }

  async fetchAchievements(): Promise<Achievement[]> {
    try {
      const records = await this.fetchSheetRecords("Achievements");
      return records.map(record => mapAchievementFromAirtable(record));
    } catch (error) {
      logError(this.serviceName, "fetchAchievements failed, returning empty list", error);
      return [];
    }
  }

  async sync(): Promise<SyncStatus> {
    logInfo(this.serviceName, "Starting full sync from Google Sheets");

    const syncStatus: SyncStatus = {
      lastSyncTime: new Date(),
      totalRecords: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Fetch all entities in parallel settled
      const [kpis, employees, departments, tasks, achievements] =
        await Promise.allSettled([
          this.fetchKPIs(),
          this.fetchEmployees(),
          this.fetchDepartments(),
          this.fetchTasks(),
          this.fetchAchievements(),
        ]);

      // Process KPIs
      if (kpis.status === "fulfilled") {
        syncStatus.successCount += kpis.value.length;
        syncStatus.totalRecords += kpis.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`KPIs: ${kpis.reason}`);
      }

      // Process Employees
      if (employees.status === "fulfilled") {
        syncStatus.successCount += employees.value.length;
        syncStatus.totalRecords += employees.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Employees: ${employees.reason}`);
      }

      // Process Departments
      if (departments.status === "fulfilled") {
        syncStatus.successCount += departments.value.length;
        syncStatus.totalRecords += departments.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Departments: ${departments.reason}`);
      }

      // Process Tasks
      if (tasks.status === "fulfilled") {
        syncStatus.successCount += tasks.value.length;
        syncStatus.totalRecords += tasks.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Tasks: ${tasks.reason}`);
      }

      // Process Achievements
      if (achievements.status === "fulfilled") {
        syncStatus.successCount += achievements.value.length;
        syncStatus.totalRecords += achievements.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Achievements: ${achievements.reason}`);
      }

      this.lastSyncTime = syncStatus.lastSyncTime;
      logSuccess(this.serviceName, "Google Sheets sync completed successfully");
      return syncStatus;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logError(this.serviceName, "Sync process failed", error);
      syncStatus.errors.push(msg);
      return syncStatus;
    }
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    const isConnected = await this.testConnection();
    return {
      isConnected,
      lastChecked: new Date(),
      error: isConnected ? undefined : "Connection test failed",
    };
  }

  async health(): Promise<HealthCheckResponse> {
    const isConnected = await this.testConnection();
    return {
      status: isConnected ? "healthy" : "unhealthy",
      message: isConnected
        ? "Google Sheets adapter is healthy"
        : "Failed to connect to Google Sheets spreadsheet",
      timestamp: new Date(),
    };
  }

  async createRecord(
    tableName: string,
    fields: Record<string, unknown>
  ): Promise<string> {
    try {
      if (!this.isConnected || !this.authClient) {
        await this.connect();
      }

      const sheets = google.sheets({ version: "v4", auth: this.authClient });
      const sheetId = process.env.GOOGLE_SHEET_ID;

      // Determine the canonical sheet tab name
      const lowerTable = tableName.toLowerCase();
      let tabName = "KPIs";
      if (lowerTable.includes("kpi")) tabName = "KPIs";
      else if (lowerTable.includes("emp")) tabName = "Employees";
      else if (lowerTable.includes("dep")) tabName = "Departments";
      else if (lowerTable.includes("task")) tabName = "Tasks";
      else if (lowerTable.includes("achieve")) tabName = "Achievements";
      else if (lowerTable.includes("team")) tabName = "Teams";
      else if (lowerTable.includes("user")) tabName = "Users";

      // Fetch headers and existing records to determine structure & unique ID
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tabName}!A1:ZZ5000`,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        throw new Error(`Tab "${tabName}" has no header row.`);
      }

      const headers = rows[0].map((h) => String(h).trim());
      const idColIdx = headers.findIndex((h) => h.toLowerCase() === "id");

      let nextId = "";
      if (fields.id || fields.ID || fields.Id) {
        nextId = String(fields.id || fields.ID || fields.Id);
      } else if (tabName === "KPIs") {
        let maxNum = 0;
        for (let i = 1; i < rows.length; i++) {
          const rowId = idColIdx >= 0 ? String(rows[i][idColIdx] || "") : "";
          const match = rowId.match(/kpi_(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
        if (maxNum === 0) maxNum = rows.length;
        nextId = `kpi_${String(maxNum + 1).padStart(4, "0")}`;
      } else {
        nextId = `row_${Date.now()}`;
      }

      const findVal = (candidates: string[]) => {
        for (const c of candidates) {
          if (c in fields && fields[c] !== undefined && fields[c] !== null && fields[c] !== "") {
            return fields[c];
          }
        }
        for (const key of Object.keys(fields)) {
          const normKey = key.toLowerCase().replace(/[\s_-]/g, "");
          for (const c of candidates) {
            if (normKey === c.toLowerCase().replace(/[\s_-]/g, "")) {
              if (fields[key] !== undefined && fields[key] !== null && fields[key] !== "") {
                return fields[key];
              }
            }
          }
        }
        return undefined;
      };

      const rowValues = headers.map((header) => {
        const norm = header.toLowerCase().replace(/[\s_-]/g, "");
        if (norm === "id") return nextId;
        if (norm === "kpicode") return findVal(["code", "ID", "kpi_code", "kpiCode", "idCode"]) || "";
        if (norm === "name") return findVal(["kpiName", "Name", "name", "title", "Title"]) || "";
        if (norm === "description") return findVal(["Description", "description", "notes"]) || "";
        if (norm === "category") return findVal(["Category", "category"]) || "";
        if (norm === "kpilevel") return findVal(["kpi_level", "kpiLevel"]) || "Employee KPI";
        if (norm === "departmentid") return findVal(["DepartmentId", "departmentId", "department_id", "Department", "department"]) || "";
        if (norm === "teamid") return findVal(["Team", "team", "team_id", "teamId"]) || "";
        if (norm === "employeeid") return findVal(["EmployeeId", "employeeId", "employee_id", "assignedEmployee"]) || "";
        if (norm === "owneremployeeid") return findVal(["Owner", "owner", "owner_employee_id", "ownerEmployeeId", "EmployeeId", "employee_id"]) || "";
        if (norm === "targetvalue") {
          const v = findVal(["TargetValue", "targetValue", "target_value", "Target"]);
          return v !== undefined ? String(v) : "0";
        }
        if (norm === "actualvalue") {
          const v = findVal(["ActualValue", "actualValue", "actual_value", "Actual"]);
          return v !== undefined ? String(v) : "0";
        }
        if (norm === "minimumvalue") return findVal(["minimum_value", "minValue"]) || "0";
        if (norm === "maximumvalue") return findVal(["maximum_value", "maxValue"]) || "0";
        if (norm === "measurementunit") return findVal(["Unit", "unit", "measurement_unit", "measurementUnit"]) || "Percentage";
        if (norm === "measurementtype") return findVal(["measurement_type", "measurementType"]) || "Numeric";
        if (norm === "calculationdirection") return findVal(["calculation_direction"]) || "Higher is Better";
        if (norm === "score") {
          const target = Number(findVal(["TargetValue", "targetValue", "target_value"]) || 0);
          const actual = Number(findVal(["ActualValue", "actualValue", "actual_value"]) || 0);
          if (target > 0) {
            return String(Math.min(Math.round((actual / target) * 100), 100));
          }
          return "0";
        }
        if (norm === "scorecap") return findVal(["score_cap"]) || "100";
        if (norm === "frequency") return findVal(["Frequency", "frequency"]) || "Monthly";
        if (norm === "startdate") return findVal(["start_date", "startDate"]) || new Date().toISOString().split("T")[0];
        if (norm === "duedate") return findVal(["DueDate", "dueDate", "due_date"]) || "";
        if (norm === "reviewdate") return findVal(["review_date"]) || "";
        if (norm === "entrymethod") return findVal(["entry_method"]) || "Manual";
        if (norm === "requiresmanagerapproval") return "FALSE";
        if (norm === "weight") return findVal(["weight", "Weight"]) || "10";
        if (norm === "criticalthreshold") return "50";
        if (norm === "warningthreshold") return "75";
        if (norm === "successthreshold") return "90";
        if (norm === "stretchscore") return "110";
        if (norm === "status") return findVal(["Status", "status"]) || "not-started";
        if (norm === "approvalstatus") return findVal(["approval_status", "approvalStatus"]) || "Approved";
        if (norm === "trend") return findVal(["trend"]) || "stable";
        if (norm === "sourcesystem") return findVal(["source_system"]) || "dashboard";
        if (norm === "externalid") return findVal(["external_id"]) || "";
        if (norm === "notes") return findVal(["Notes", "notes"]) || "";
        if (norm === "createdat") return new Date().toISOString();
        if (norm === "updatedat") return new Date().toISOString();

        const genericVal = findVal([header, norm]);
        return genericVal !== undefined ? String(genericVal) : "";
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowValues],
        },
      });

      logSuccess(this.serviceName, `Successfully created record ${nextId} in "${tabName}"`);
      return nextId;
    } catch (error) {
      logError(this.serviceName, `Failed to create record in ${tableName}`, error);
      throw error;
    }
  }

  async updateRecord(
    tableName: string,
    id: string,
    _fields: Record<string, unknown>
  ): Promise<boolean> {
    const errorMsg = `Write operations are not supported by the Google Sheets adapter (table: ${tableName}, id: ${id}).`;
    logError(this.serviceName, errorMsg);
    throw new Error(errorMsg);
  }

  async deleteRecord(tableName: string, id: string): Promise<boolean> {
    const errorMsg = `Write operations are not supported by the Google Sheets adapter (table: ${tableName}, id: ${id}).`;
    logError(this.serviceName, errorMsg);
    throw new Error(errorMsg);
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportsRealtime: true,
      supportsWebhooks: false,
      supportsBulkOperations: true,
      supportsSearch: false,
      supportsFiltering: true,
      supportsWrites: true,
      maxRecordsPerRequest: 1000,
    };
  }

  getName(): string {
    return "Google Sheets";
  }
}

