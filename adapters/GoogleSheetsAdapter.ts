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

/**
 * GoogleSheetsAdapter - Placeholder implementation for Google Sheets integration
 *
 * This adapter will be fully implemented in a future phase.
 * Currently returns empty data or throws "Not implemented" errors.
 */
export class GoogleSheetsAdapter extends BaseAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    throw new Error("Google Sheets adapter not yet implemented");
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async testConnection(): Promise<boolean> {
    return false;
  }

  async fetchKPIs(): Promise<KPI[]> {
    return [];
  }

  async fetchEmployees(): Promise<Employee[]> {
    return [];
  }

  async fetchDepartments(): Promise<Department[]> {
    return [];
  }

  async fetchTasks(): Promise<Task[]> {
    return [];
  }

  async fetchAchievements(): Promise<Achievement[]> {
    return [];
  }

  async sync(): Promise<SyncStatus> {
    return {
      lastSyncTime: new Date(),
      totalRecords: 0,
      successCount: 0,
      failureCount: 0,
      errors: ["Google Sheets adapter not yet implemented"],
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return {
      isConnected: false,
      lastChecked: new Date(),
      error: "Google Sheets adapter not yet implemented",
    };
  }

  async health(): Promise<HealthCheckResponse> {
    return {
      status: "unhealthy",
      message: "Google Sheets adapter not yet implemented",
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
