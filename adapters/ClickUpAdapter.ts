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
 * ClickUpAdapter - Placeholder implementation for ClickUp integration
 *
 * This adapter will be fully implemented in a future phase.
 * Currently returns empty data or throws "Not implemented" errors.
 */
export class ClickUpAdapter extends BaseAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    throw new Error("ClickUp adapter not yet implemented");
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
      errors: ["ClickUp adapter not yet implemented"],
    };
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return {
      isConnected: false,
      lastChecked: new Date(),
      error: "ClickUp adapter not yet implemented",
    };
  }

  async health(): Promise<HealthCheckResponse> {
    return {
      status: "unhealthy",
      message: "ClickUp adapter not yet implemented",
      timestamp: new Date(),
    };
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportsRealtime: true,
      supportsWebhooks: true,
      supportsBulkOperations: true,
      supportsSearch: true,
      supportsFiltering: true,
      maxRecordsPerRequest: 100,
    };
  }

  getName(): string {
    return "ClickUp";
  }
}
