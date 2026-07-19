/**
 * Example: Using the Adapter Pattern
 *
 * This file demonstrates how to use the adapter layer to fetch data
 * from different sources with the same code.
 */

import { AdapterFactory, DataSourceType } from "@/adapters";

/**
 * Example 1: Basic Usage - Fetch KPIs from Airtable
 */
export async function example1_BasicUsage() {
  // Create adapter instance
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    // Connect to data source
    await adapter.connect();

    // Fetch data
    const kpis = await adapter.fetchKPIs();
    console.log(`Fetched ${kpis.length} KPIs from ${adapter.getName()}`);

    // Use the data
    kpis.forEach((kpi) => {
      console.log(`- ${kpi.kpiName}: ${kpi.actualValue}/${kpi.targetValue}`);
    });

    // Disconnect
    await adapter.disconnect();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

/**
 * Example 2: Full Sync - Sync all entities
 */
export async function example2_FullSync() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    await adapter.connect();

    // Perform full sync
    const syncStatus = await adapter.sync();

    console.log("Sync Results:");
    console.log(`- Total Records: ${syncStatus.totalRecords}`);
    console.log(`- Success: ${syncStatus.successCount}`);
    console.log(`- Failures: ${syncStatus.failureCount}`);

    if (syncStatus.errors.length > 0) {
      console.log("Errors:", syncStatus.errors);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

/**
 * Example 3: Health Check
 */
export async function example3_HealthCheck() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    await adapter.connect();

    // Check health
    const health = await adapter.health();

    console.log(`Status: ${health.status}`);
    console.log(`Message: ${health.message}`);
    console.log(`Timestamp: ${health.timestamp}`);

    if (health.details) {
      console.log("Details:", health.details);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error("Health check failed:", error);
  }
}

/**
 * Example 4: Fetch All Entities
 */
export async function example4_FetchAllEntities() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    await adapter.connect();

    // Fetch all entity types
    const [kpis, employees, departments, tasks, achievements] =
      await Promise.all([
        adapter.fetchKPIs(),
        adapter.fetchEmployees(),
        adapter.fetchDepartments(),
        adapter.fetchTasks(),
        adapter.fetchAchievements(),
      ]);

    console.log("Fetched all data:");
    console.log(`- ${kpis.length} KPIs`);
    console.log(`- ${employees.length} Employees`);
    console.log(`- ${departments.length} Departments`);
    console.log(`- ${tasks.length} Tasks`);
    console.log(`- ${achievements.length} Achievements`);

    await adapter.disconnect();

    return { kpis, employees, departments, tasks, achievements };
  } catch (error) {
    console.error("Error fetching entities:", error);
    throw error;
  }
}

/**
 * Example 5: Switch Data Sources
 */
export async function example5_SwitchSources() {
  // Same code works with different sources
  const sources: DataSourceType[] = [
    DataSourceType.AIRTABLE,
    DataSourceType.CLICKUP,
    DataSourceType.JIRA,
  ];

  for (const sourceType of sources) {
    const adapter = AdapterFactory.create(sourceType);

    console.log(`\nTrying ${adapter.getName()}...`);

    try {
      await adapter.connect();
      const kpis = await adapter.fetchKPIs();
      console.log(`✓ Fetched ${kpis.length} KPIs`);
      await adapter.disconnect();
    } catch (error) {
      console.log(
        `✗ ${adapter.getName()} not yet implemented or connection failed`
      );
    }
  }
}

/**
 * Example 6: Check Adapter Capabilities
 */
export async function example6_CheckCapabilities() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  const capabilities = adapter.getCapabilities();

  console.log(`${adapter.getName()} Capabilities:`);
  console.log(`- Realtime: ${capabilities.supportsRealtime ? "✓" : "✗"}`);
  console.log(`- Webhooks: ${capabilities.supportsWebhooks ? "✓" : "✗"}`);
  console.log(`- Bulk Ops: ${capabilities.supportsBulkOperations ? "✓" : "✗"}`);
  console.log(`- Search: ${capabilities.supportsSearch ? "✓" : "✗"}`);
  console.log(`- Filtering: ${capabilities.supportsFiltering ? "✓" : "✗"}`);
  console.log(`- Max Records: ${capabilities.maxRecordsPerRequest}`);
}

/**
 * Example 7: Create from Environment
 */
export async function example7_CreateFromEnv() {
  // Reads DATA_SOURCE_TYPE from environment
  const adapter = AdapterFactory.createFromEnv();

  console.log(`Using adapter: ${adapter.getName()}`);

  try {
    await adapter.connect();
    const health = await adapter.health();
    console.log(`Health: ${health.status}`);
    await adapter.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Example 8: Connection Status
 */
export async function example8_ConnectionStatus() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    await adapter.connect();

    // Check connection status
    const status = await adapter.getConnectionStatus();

    console.log("Connection Status:");
    console.log(`- Connected: ${status.isConnected}`);
    console.log(`- Last Checked: ${status.lastChecked}`);

    if (status.error) {
      console.log(`- Error: ${status.error}`);
    }

    await adapter.disconnect();
  } catch (error) {
    console.error("Error checking status:", error);
  }
}

/**
 * Example 9: Error Handling
 */
export async function example9_ErrorHandling() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    // Attempt connection
    await adapter.connect();

    // Test connection
    const isConnected = await adapter.testConnection();

    if (!isConnected) {
      throw new Error("Connection test failed");
    }

    // Fetch data with error handling
    try {
      const kpis = await adapter.fetchKPIs();
      console.log(`Success: Fetched ${kpis.length} KPIs`);
    } catch (fetchError) {
      console.error("Failed to fetch KPIs:", fetchError);
      // Handle specific error
    }
  } catch (connectionError) {
    console.error("Connection failed:", connectionError);
    // Handle connection error
  } finally {
    // Always disconnect
    await adapter.disconnect();
  }
}

/**
 * Example 10: Check Last Sync
 */
export async function example10_LastSync() {
  const adapter = AdapterFactory.create(DataSourceType.AIRTABLE);

  try {
    await adapter.connect();

    // Check if previously synced
    const lastSync = adapter.getLastSync();

    if (lastSync) {
      console.log(`Last synced: ${lastSync.toISOString()}`);
      console.log(`Time since sync: ${Date.now() - lastSync.getTime()}ms`);
    } else {
      console.log("Never synced before");
    }

    // Perform sync
    await adapter.sync();

    // Check again
    const newLastSync = adapter.getLastSync();
    console.log(`New sync time: ${newLastSync?.toISOString()}`);

    await adapter.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

