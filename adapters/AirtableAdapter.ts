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
import { airtableService } from "@/services/airtable.service";
import airtableClient from "@/services/airtable.client";
import { logInfo, logError, logSuccess } from "@/utils/logger";

/**
 * AirtableAdapter - Full implementation for Airtable data source
 *
 * This adapter wraps the Airtable service created in Day 2 and provides
 * the standardized adapter interface.
 */
export class AirtableAdapter extends BaseAdapter {
  private serviceName = "AirtableAdapter";

  constructor(config: AdapterConfig) {
    super(config);
  }

  /**
   * Connect to Airtable
   */
  async connect(): Promise<void> {
    try {
      logInfo(this.serviceName, "Connecting to Airtable...");

      // Initialize the Airtable client
      airtableClient.initialize();

      // Test the connection
      const isConnected = await this.testConnection();

      if (!isConnected) {
        throw new Error("Failed to connect to Airtable");
      }

      this.isConnected = true;
      logSuccess(this.serviceName, "Successfully connected to Airtable");
    } catch (error) {
      this.isConnected = false;
      logError(this.serviceName, "Connection failed", error);
      throw error;
    }
  }

  /**
   * Disconnect from Airtable
   */
  async disconnect(): Promise<void> {
    logInfo(this.serviceName, "Disconnecting from Airtable");
    this.isConnected = false;
    logSuccess(this.serviceName, "Disconnected from Airtable");
  }

  /**
   * Test Airtable connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await airtableClient.testConnection();
      return result;
    } catch (error) {
      logError(this.serviceName, "Connection test failed", error);
      return false;
    }
  }

  /**
   * Fetch all KPIs from Airtable
   */
  async fetchKPIs(): Promise<KPI[]> {
    try {
      logInfo(this.serviceName, "Fetching KPIs from Airtable");
      const kpis = await airtableService.getKPIs();
      logSuccess(this.serviceName, `Fetched ${kpis.length} KPIs`);
      return kpis;
    } catch (error) {
      logError(this.serviceName, "Failed to fetch KPIs", error);
      throw error;
    }
  }

  /**
   * Fetch all employees from Airtable
   */
  async fetchEmployees(): Promise<Employee[]> {
    try {
      logInfo(this.serviceName, "Fetching Employees from Airtable");
      const employees = await airtableService.getEmployees();
      logSuccess(this.serviceName, `Fetched ${employees.length} Employees`);
      return employees;
    } catch (error) {
      logError(this.serviceName, "Failed to fetch Employees", error);
      throw error;
    }
  }

  /**
   * Fetch all departments from Airtable
   */
  async fetchDepartments(): Promise<Department[]> {
    try {
      logInfo(this.serviceName, "Fetching Departments from Airtable");
      const departments = await airtableService.getDepartments();
      logSuccess(
        this.serviceName,
        `Fetched ${departments.length} Departments`
      );
      return departments;
    } catch (error) {
      logError(this.serviceName, "Failed to fetch Departments", error);
      throw error;
    }
  }

  /**
   * Fetch all tasks from Airtable
   */
  async fetchTasks(): Promise<Task[]> {
    try {
      logInfo(this.serviceName, "Fetching Tasks from Airtable");
      const tasks = await airtableService.getTasks();
      logSuccess(this.serviceName, `Fetched ${tasks.length} Tasks`);
      return tasks;
    } catch (error) {
      logError(this.serviceName, "Failed to fetch Tasks", error);
      throw error;
    }
  }

  /**
   * Fetch all achievements from Airtable
   */
  async fetchAchievements(): Promise<Achievement[]> {
    try {
      logInfo(this.serviceName, "Fetching Achievements from Airtable");
      const achievements = await airtableService.getAchievements();
      logSuccess(
        this.serviceName,
        `Fetched ${achievements.length} Achievements`
      );
      return achievements;
    } catch (error) {
      logError(this.serviceName, "Failed to fetch Achievements", error);
      throw error;
    }
  }

  /**
   * Sync all data from Airtable
   */
  async sync(): Promise<SyncStatus> {
    logInfo(this.serviceName, "Starting full sync from Airtable");

    const syncStatus: SyncStatus = {
      lastSyncTime: new Date(),
      totalRecords: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    try {
      // Fetch all entities
      const [kpis, employees, departments, tasks, achievements] =
        await Promise.allSettled([
          this.fetchKPIs(),
          this.fetchEmployees(),
          this.fetchDepartments(),
          this.fetchTasks(),
          this.fetchAchievements(),
        ]);

      // Process results
      if (kpis.status === "fulfilled") {
        syncStatus.successCount += kpis.value.length;
        syncStatus.totalRecords += kpis.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`KPIs: ${kpis.reason}`);
      }

      if (employees.status === "fulfilled") {
        syncStatus.successCount += employees.value.length;
        syncStatus.totalRecords += employees.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Employees: ${employees.reason}`);
      }

      if (departments.status === "fulfilled") {
        syncStatus.successCount += departments.value.length;
        syncStatus.totalRecords += departments.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Departments: ${departments.reason}`);
      }

      if (tasks.status === "fulfilled") {
        syncStatus.successCount += tasks.value.length;
        syncStatus.totalRecords += tasks.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Tasks: ${tasks.reason}`);
      }

      if (achievements.status === "fulfilled") {
        syncStatus.successCount += achievements.value.length;
        syncStatus.totalRecords += achievements.value.length;
      } else {
        syncStatus.failureCount++;
        syncStatus.errors.push(`Achievements: ${achievements.reason}`);
      }

      this.lastSyncTime = syncStatus.lastSyncTime;

      logSuccess(
        this.serviceName,
        `Sync completed: ${syncStatus.successCount} records synced, ${syncStatus.failureCount} failures`
      );

      return syncStatus;
    } catch (error) {
      logError(this.serviceName, "Sync failed", error);
      syncStatus.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
      return syncStatus;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    const isConnected = await this.testConnection();

    return {
      isConnected,
      lastChecked: new Date(),
      error: isConnected ? undefined : "Connection test failed",
    };
  }

  /**
   * Health check
   */
  async health(): Promise<HealthCheckResponse> {
    try {
      const isConnected = await this.testConnection();

      if (isConnected) {
        return {
          status: "healthy",
          message: "Airtable connection is healthy",
          details: {
            lastSync: this.lastSyncTime,
            sourceType: this.config.sourceType,
          },
          timestamp: new Date(),
        };
      } else {
        return {
          status: "unhealthy",
          message: "Airtable connection failed",
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get adapter capabilities
   */
  getCapabilities(): AdapterCapabilities {
    return {
      supportsRealtime: false,
      supportsWebhooks: true,
      supportsBulkOperations: true,
      supportsSearch: true,
      supportsFiltering: true,
      maxRecordsPerRequest: 100,
    };
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return "Airtable";
  }
}
