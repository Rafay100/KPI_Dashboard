/**
 * DEBUG SCRIPT: Trace Airtable data flow
 *
 * This script will:
 * 1. Fetch raw Airtable records
 * 2. Show field names and values
 * 3. Test the mapper function
 * 4. Compare with API response
 */

const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

// Configure Airtable
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

Airtable.configure({ apiKey });
const base = Airtable.base(baseId);

// Helper functions from utils/helpers.ts
function safeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function safeNumber(value) {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function formatDateISO(value) {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  } catch {
    return undefined;
  }
}

// Status normalization function (from utils/mappers.ts)
function normalizeKPIStatus(status) {
  if (!status) return "not-started";

  const normalized = status.toLowerCase().replace(/\s+/g, "-");

  console.log(`   🔄 Normalizing status: "${status}" → "${normalized}"`);

  switch (normalized) {
    case "not-started":
    case "not started":
    case "pending":
      return "not-started";
    case "in-progress":
    case "in progress":
    case "active":
      return "in-progress";
    case "at-risk":
    case "at risk":
    case "behind":
      return "at-risk";
    case "completed":
    case "complete":
    case "done":
      return "completed";
    case "overdue":
    case "late":
      return "overdue";
    default:
      console.log(`   ⚠️  No match found! Defaulting to "not-started"`);
      return "not-started";
  }
}

// Mapper function (from utils/mappers.ts)
function mapKPIFromAirtable(record) {
  const fields = record.fields;

  console.log('\n🔍 MAPPER INPUT (record.fields):');
  console.log(JSON.stringify(fields, null, 2));

  const rawStatus = safeString(fields["Status"]);
  console.log(`\n   Raw Status from Airtable: "${rawStatus}"`);

  const mapped = {
    id: record.id,
    kpiName: safeString(fields["KPI Name"]) || `KPI-${record.id.slice(0, 8)}`,
    description: safeString(fields["Description"] || fields["Notes"]),
    departmentId: safeString(fields["Department"]),
    employeeId: safeString(fields["Assigned Employee"]),
    targetValue: safeNumber(fields["target"]),
    actualValue: safeNumber(fields["actual"]),
    status: normalizeKPIStatus(rawStatus),
    score: safeNumber(fields["Score"] || fields["score"]),
    dueDate: formatDateISO(safeString(fields["Due Date"])),
    lastUpdated: formatDateISO(safeString(fields["Last Updated"] || fields["Modified"])) || new Date().toISOString(),
    createdAt: formatDateISO(safeString(fields["Created Date"] || fields["Created"])) || new Date().toISOString(),
  };

  console.log('\n✅ MAPPER OUTPUT:');
  console.log(JSON.stringify(mapped, null, 2));

  return mapped;
}

async function debugAirtableFlow() {
  console.log('🚀 Starting Airtable Data Flow Debug\n');
  console.log('================================================\n');

  try {
    // Step 1: Fetch raw Airtable records
    console.log('📥 STEP 1: Fetching raw Airtable records...\n');

    const records = await base('KPIs').select({ maxRecords: 3 }).all();

    console.log(`Found ${records.length} records\n`);

    if (records.length === 0) {
      console.log('⚠️  No records found in Airtable KPIs table');
      return;
    }

    // Step 2: Show raw Airtable data
    records.forEach((record, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 RECORD ${index + 1}: ${record.id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      console.log('🔹 RAW AIRTABLE FIELDS:');
      const fieldNames = Object.keys(record.fields);
      console.log(`   Available fields: ${fieldNames.join(', ')}\n`);

      fieldNames.forEach(fieldName => {
        const value = record.fields[fieldName];
        console.log(`   "${fieldName}": ${JSON.stringify(value)}`);
      });

      // Step 3: Test mapper
      console.log('\n🔹 TESTING MAPPER:');
      const mapped = mapKPIFromAirtable(record);

      // Step 4: Highlight potential issues
      console.log('\n🔹 VALIDATION:');
      console.log(`   kpiName = "${mapped.kpiName}"`);
      console.log(`   status = "${mapped.status}"`);
      console.log(`   targetValue = ${mapped.targetValue}`);
      console.log(`   actualValue = ${mapped.actualValue}`);

      // Check if kpiName looks like a status value
      const statusLikeValues = ['on track', 'at risk', 'completed', 'not started', 'overdue'];
      if (statusLikeValues.some(s => mapped.kpiName.toLowerCase().includes(s))) {
        console.log('   ⚠️  WARNING: kpiName looks like a status value!');
      }

      // Check if status looks like a KPI name
      if (mapped.status.length > 20) {
        console.log('   ⚠️  WARNING: status looks too long, might be a KPI name!');
      }
    });

    console.log('\n\n================================================');
    console.log('🏁 Debug complete!');
    console.log('================================================\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
}

debugAirtableFlow();
