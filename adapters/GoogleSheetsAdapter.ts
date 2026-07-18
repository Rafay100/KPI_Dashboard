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
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
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
        range: `${tabName}!A1:Z1000`,
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
      return records.map(record => mapEmployeeFromAirtable(record));
    } catch (error) {
      logError(this.serviceName, "fetchEmployees failed, returning empty list", error);
      return [];
    }
  }

  async fetchDepartments(): Promise<Department[]> {
    try {
      const records = await this.fetchSheetRecords("Departments");
      return records.map(record => mapDepartmentFromAirtable(record));
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

  getCapabilities(): AdapterCapabilities {
    return {
      supportsRealtime: true,
      supportsWebhooks: false,
      supportsBulkOperations: true,
      supportsSearch: false,
      supportsFiltering: true,
      maxRecordsPerRequest: 1000,
    };
  }

  getName(): string {
    return "Google Sheets";
  }
}
