import { BaseAdapter } from "./BaseAdapter";
import { AirtableAdapter } from "./AirtableAdapter";
import { ClickUpAdapter } from "./ClickUpAdapter";
import { JiraAdapter } from "./JiraAdapter";
import { AsanaAdapter } from "./AsanaAdapter";
import { MondayAdapter } from "./MondayAdapter";
import { CSVAdapter } from "./CSVAdapter";
import { GoogleSheetsAdapter } from "./GoogleSheetsAdapter";
import type { AdapterConfig, DataSourceType } from "./types";
import { logInfo, logError } from "@/utils/logger";

/**
 * AdapterFactory - Factory pattern for creating data source adapters
 *
 * This class implements the Factory Pattern to create the appropriate
 * adapter instance based on the data source type.
 *
 * Usage:
 *   const adapter = AdapterFactory.create("airtable", config);
 *   await adapter.connect();
 *   const kpis = await adapter.fetchKPIs();
 */
export class AdapterFactory {
  private static readonly SERVICE_NAME = "AdapterFactory";

  /**
   * Create an adapter instance for the specified data source
   *
   * @param sourceType - The type of data source (airtable, clickup, etc.)
   * @param config - Configuration for the adapter
   * @returns An instance of the appropriate adapter
   * @throws Error if the source type is not supported
   */
  static create(
    sourceType: DataSourceType | string,
    config?: Partial<AdapterConfig>
  ): BaseAdapter {
    logInfo(
      this.SERVICE_NAME,
      `Creating adapter for source type: ${sourceType}`
    );

    // Merge config with sourceType
    const adapterConfig: AdapterConfig = {
      sourceType: sourceType as DataSourceType,
      ...config,
    };

    switch (sourceType) {
      case "airtable":
        return new AirtableAdapter(adapterConfig);

      case "clickup":
        return new ClickUpAdapter(adapterConfig);

      case "jira":
        return new JiraAdapter(adapterConfig);

      case "asana":
        return new AsanaAdapter(adapterConfig);

      case "monday":
        return new MondayAdapter(adapterConfig);

      case "csv":
        return new CSVAdapter(adapterConfig);

      case "google-sheets":
        return new GoogleSheetsAdapter(adapterConfig);

      default:
        const error = `Unsupported data source type: ${sourceType}`;
        logError(this.SERVICE_NAME, error);
        throw new Error(error);
    }
  }

  /**
   * Get list of all supported data source types
   */
  static getSupportedSources(): DataSourceType[] {
    return [
      "airtable" as DataSourceType,
      "clickup" as DataSourceType,
      "jira" as DataSourceType,
      "asana" as DataSourceType,
      "monday" as DataSourceType,
      "csv" as DataSourceType,
      "google-sheets" as DataSourceType,
    ];
  }

  /**
   * Check if a data source type is supported
   */
  static isSupported(sourceType: string): boolean {
    return this.getSupportedSources().includes(sourceType as DataSourceType);
  }

  /**
   * Create an adapter from environment variables
   * Reads the default data source from environment
   */
  static createFromEnv(): BaseAdapter {
    const sourceType =
      (process.env.DATA_SOURCE as DataSourceType) ||
      (process.env.DATA_SOURCE_TYPE as DataSourceType) ||
      "airtable";

    logInfo(
      this.SERVICE_NAME,
      `Creating adapter from environment: ${sourceType}`
    );

    const config: Partial<AdapterConfig> = {
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID,
    };

    return this.create(sourceType, config);
  }
}
