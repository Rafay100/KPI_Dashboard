/**
 * Adapter Layer - Source-agnostic data access
 *
 * This module exports all data source adapters and the factory
 * for creating adapter instances.
 *
 * Example usage:
 *   import { AdapterFactory } from '@/adapters';
 *
 *   const adapter = AdapterFactory.create('airtable');
 *   await adapter.connect();
 *   const kpis = await adapter.fetchKPIs();
 */

// Base adapter and types
export { BaseAdapter } from "./BaseAdapter";
export * from "./types";

// Adapter implementations
export { AirtableAdapter } from "./AirtableAdapter";
export { ClickUpAdapter } from "./ClickUpAdapter";
export { JiraAdapter } from "./JiraAdapter";
export { AsanaAdapter } from "./AsanaAdapter";
export { MondayAdapter } from "./MondayAdapter";
export { CSVAdapter } from "./CSVAdapter";
export { GoogleSheetsAdapter } from "./GoogleSheetsAdapter";

// Factory
export { AdapterFactory } from "./AdapterFactory";

