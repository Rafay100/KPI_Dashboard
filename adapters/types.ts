import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
} from "@/types/models";

/**
 * Data source types supported by the adapter system
 */
export enum DataSourceType {
  AIRTABLE = "airtable",
  CLICKUP = "clickup",
  JIRA = "jira",
  ASANA = "asana",
  MONDAY = "monday",
  CSV = "csv",
  GOOGLE_SHEETS = "google-sheets",
}

/**
 * Adapter configuration interface
 */
export interface AdapterConfig {
  sourceType: DataSourceType;
  apiKey?: string;
  baseId?: string;
  workspaceId?: string;
  projectId?: string;
  credentials?: Record<string, unknown>;
}

/**
 * Connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

/**
 * Sync status and metadata
 */
export interface SyncStatus {
  lastSyncTime: Date;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  supportsRealtime: boolean;
  supportsWebhooks: boolean;
  supportsBulkOperations: boolean;
  supportsSearch: boolean;
  supportsFiltering: boolean;
  maxRecordsPerRequest: number;
}

