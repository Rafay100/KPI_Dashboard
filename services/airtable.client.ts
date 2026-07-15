import Airtable from "airtable";
import type { AirtableConfig } from "@/types/airtable";

/**
 * Airtable Client Singleton
 * Manages the connection to Airtable and provides a reusable base instance
 */

class AirtableClient {
  private static instance: AirtableClient;
  private base: Airtable.Base | null = null;
  private config: AirtableConfig | null = null;
  private tableNameCache: Record<string, string> = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AirtableClient {
    if (!AirtableClient.instance) {
      AirtableClient.instance = new AirtableClient();
    }
    return AirtableClient.instance;
  }

  /**
   * Initialize Airtable connection
   */
  public initialize(): void {
    if (this.base) {
      return; // Already initialized
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey) {
      throw new Error("AIRTABLE_API_KEY is not defined in environment variables");
    }

    if (!baseId) {
      throw new Error("AIRTABLE_BASE_ID is not defined in environment variables");
    }

    this.config = {
      apiKey,
      baseId,
      tables: {
        kpis: process.env.AIRTABLE_KPI_TABLE || "KPIs",
        kpiUpdates: "KPI Updates",
        employees: process.env.AIRTABLE_EMPLOYEE_TABLE || "Employees",
        departments: process.env.AIRTABLE_DEPARTMENT_TABLE || "Departments",
        teams: "Teams",
        tasks: process.env.AIRTABLE_TASK_TABLE || "Tasks",
        achievements: process.env.AIRTABLE_ACHIEVEMENT_TABLE || "Achievements",
        users: "Users",
        dataSources: "Data Sources",
        fieldMappings: "Field Mappings",
        importLogs: "Import Logs",
        settings: "Settings",
      },
    };

    Airtable.configure({
      apiKey: this.config.apiKey,
    });

    this.base = Airtable.base(this.config.baseId);
  }

  /**
   * Get Airtable base instance
   */
  public getBase(): Airtable.Base {
    if (!this.base) {
      this.initialize();
    }
    if (!this.base) {
      throw new Error("Failed to initialize Airtable base");
    }
    return this.base;
  }

  /**
   * Get table configuration
   */
  public getConfig(): AirtableConfig {
    if (!this.config) {
      this.initialize();
    }
    if (!this.config) {
      throw new Error("Failed to initialize Airtable configuration");
    }
    return this.config;
  }

  /**
   * Get table name by type
   */
  public async getTableName(
    tableType: "kpis" | "kpiUpdates" | "employees" | "departments" | "teams" | "tasks" | "achievements" | "users" | "dataSources" | "fieldMappings" | "importLogs" | "settings"
  ): Promise<string> {
    if (this.tableNameCache[tableType]) {
      return this.tableNameCache[tableType];
    }

    const config = this.getConfig();
    const configuredName = config.tables[tableType];
    const candidates = this.buildTableNameCandidates(tableType, configuredName);

    for (const candidateName of candidates) {
      try {
        const base = this.getBase();
        await base(candidateName).select({ maxRecords: 1 }).firstPage();
        this.tableNameCache[tableType] = candidateName;
        return candidateName;
      } catch {
        // Try the next likely table name
      }
    }

    this.tableNameCache[tableType] = configuredName;
    return configuredName;
  }

  private buildTableNameCandidates(
    tableType: "kpis" | "kpiUpdates" | "employees" | "departments" | "teams" | "tasks" | "achievements" | "users" | "dataSources" | "fieldMappings" | "importLogs" | "settings",
    configuredName: string
  ): string[] {
    const baseName = configuredName?.trim() || this.getDefaultTableName(tableType);
    const cleanedBaseName = baseName.replace(/^\d+[_-]/, "").trim();
    const normalizedBaseName = cleanedBaseName.replace(/\s+/g, "_");
    const normalizedBaseNameLower = normalizedBaseName.toLowerCase();
    const normalizedBaseNameUpper = normalizedBaseName.toUpperCase();

    const candidates: string[] = [];
    const seen = new Set<string>();

    const addCandidate = (value: string | undefined) => {
      if (!value) return;
      const trimmed = value.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      candidates.push(trimmed);
    };

    for (const prefix of ["01_", "02_", "03_", "04_", "05_", "06_", "07_", "08_", "09_", "10_", "11_", "12_"]) {
      addCandidate(prefix + normalizedBaseName);
      addCandidate(prefix + cleanedBaseName);
      addCandidate(prefix + normalizedBaseNameLower);
      addCandidate(prefix + normalizedBaseNameUpper);
    }

    addCandidate(configuredName);
    addCandidate(baseName);
    addCandidate(cleanedBaseName);
    addCandidate(normalizedBaseName);
    addCandidate(normalizedBaseNameLower);
    addCandidate(normalizedBaseNameUpper);

    return candidates;
  }

  private getDefaultTableName(
    tableType: "kpis" | "kpiUpdates" | "employees" | "departments" | "teams" | "tasks" | "achievements" | "users" | "dataSources" | "fieldMappings" | "importLogs" | "settings"
  ): string {
    switch (tableType) {
      case "kpis":
        return "KPIs";
      case "kpiUpdates":
        return "KPI Updates";
      case "employees":
        return "Employees";
      case "departments":
        return "Departments";
      case "teams":
        return "Teams";
      case "tasks":
        return "Tasks";
      case "achievements":
        return "Achievements";
      case "users":
        return "Users";
      case "dataSources":
        return "Data Sources";
      case "fieldMappings":
        return "Field Mappings";
      case "importLogs":
        return "Import Logs";
      case "settings":
        return "Settings";
    }
  }

  /**
   * Test connection to Airtable
   */
  public async testConnection(): Promise<boolean> {
    try {
      const base = this.getBase();
      const config = this.getConfig();

      // Try to fetch one record from the KPIs table
      await base(config.tables.kpis)
        .select({ maxRecords: 1 })
        .firstPage();

      return true;
    } catch (error) {
      console.error("Airtable connection test failed:", error);
      return false;
    }
  }
}

export default AirtableClient.getInstance();
