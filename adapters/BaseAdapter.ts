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
 * BaseAdapter - Abstract base class for all data source adapters
 *
 * All adapters must implement this interface to ensure consistent behavior
 * across different data sources (Airtable, ClickUp, Jira, etc.)
 *
 * This follows the Adapter Pattern and ensures the Open/Closed Principle.
 */
export abstract class BaseAdapter {
  protected config: AdapterConfig;
  protected isConnected: boolean = false;
  protected lastSyncTime: Date | null = null;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  /**
   * Establish connection to the data source
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the data source
   */
  abstract disconnect(): Promise<void>;

  /**
   * Test if connection is working
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Fetch all KPIs from the data source
   * Must return normalized KPI objects
   */
  abstract fetchKPIs(): Promise<KPI[]>;

  /**
   * Fetch all employees from the data source
   * Must return normalized Employee objects
   */
  abstract fetchEmployees(): Promise<Employee[]>;

  /**
   * Fetch all departments from the data source
   * Must return normalized Department objects
   */
  abstract fetchDepartments(): Promise<Department[]>;

  /**
   * Fetch all tasks from the data source
   * Must return normalized Task objects
   */
  abstract fetchTasks(): Promise<Task[]>;

  /**
   * Fetch all achievements from the data source
   * Must return normalized Achievement objects
   */
  abstract fetchAchievements(): Promise<Achievement[]>;

  /**
   * Synchronize all data from the source
   * Returns sync status with success/failure counts
   */
  abstract sync(): Promise<SyncStatus>;

  /**
   * Get current connection status
   */
  abstract getConnectionStatus(): Promise<ConnectionStatus>;

  /**
   * Get last sync time
   */
  getLastSync(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Health check for the adapter
   */
  abstract health(): Promise<HealthCheckResponse>;

  /**
   * Get adapter capabilities
   */
  abstract getCapabilities(): AdapterCapabilities;

  /**
   * Get adapter name
   */
  abstract getName(): string;

  /**
   * Check if adapter is connected
   */
  isAdapterConnected(): boolean {
    return this.isConnected;
  }
}
