import type { FieldSet, Record } from "airtable";

/**
 * Airtable-specific types
 * These represent the raw data structure from Airtable
 */

export type AirtableRecord<T extends FieldSet = FieldSet> = Record<T>;


export interface AirtableKPIFields extends FieldSet {
  "KPI Name": string;
  Description?: string;
  "Department ID": string;
  "Employee ID": string;
  "Target Value": number;
  "Actual Value": number;
  Status: string;
  Score: number;
  "Due Date": string;
  "Last Updated"?: string;
  ID?: string;
  Category?: string;
  Team?: string;
  Owner?: string;
  Frequency?: string;
  Unit?: string;
}

export interface AirtableEmployeeFields extends FieldSet {
  Name: string;
  Email: string;
  Department: string;
  "Department ID": string;
  Team?: string;
  Position?: string;
  "Overall Score": number;
  "Total KPIs": number;
  "Completed KPIs": number;
  Avatar?: string;
  "Last Updated"?: string;
}

export interface AirtableDepartmentFields extends FieldSet {
  "Department Name": string;
  Description?: string;
  "Average Score": number;
  "Employee Count": number;
  "Total KPIs": number;
  "Completed KPIs": number;
  "Head of Department"?: string;
  "Last Updated"?: string;
}

export interface AirtableTaskFields extends FieldSet {
  "Task Name": string;
  Description?: string;
  Status: string;
  Priority: string;
  "Assigned To": string;
  "Assigned To ID": string;
  "KPI ID"?: string;
  "Due Date": string;
  "Completed At"?: string;
  "Last Updated"?: string;
}

export interface AirtableAchievementFields extends FieldSet {
  Title: string;
  Description?: string;
  Points: number;
  "Employee ID": string;
  "Employee Name": string;
  Category: string;
  "Achieved At": string;
  Badge?: string;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tables: {
    kpis: string;
    kpiUpdates: string;
    employees: string;
    departments: string;
    teams: string;
    tasks: string;
    achievements: string;
    users: string;
    dataSources: string;
    fieldMappings: string;
    importLogs: string;
    settings: string;
  };
}
