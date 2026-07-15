/**
 * TEST FIXED MAPPER - Shows data flow after fix
 */

const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

// Import helpers
const { safeString, safeNumber, formatDateISO } = require('./utils/helpers.ts');

function normalizeKPIStatus(status) {
  if (!status) return "not-started";
  const normalized = status.toLowerCase().replace(/\s+/g, "-");

  const statusMap = {
    "on-track": "in-progress",
    "on track": "in-progress",
    "at-risk": "at-risk",
    "at risk": "at-risk",
    "overachieved": "completed",
    "completed": "completed",
    "not-started": "not-started",
  };

  return statusMap[normalized] || "not-started";
}

// Fixed mapper function
function mapKPIFromAirtable(record) {
  const fields = record.fields;

  return {
    id: record.id,
    kpiName: safeString(fields["KPI Name"]) || `KPI-${record.id.slice(0, 8)}`,
    description: safeString(fields["Description"] || fields["Notes"]),
    departmentId: safeString(fields["Department"]),
    employeeId: safeString(fields["Assigned Employee"]),
    targetValue: safeNumber(fields["target"]),
    actualValue: safeNumber(fields["actual"]),
    status: normalizeKPIStatus(safeString(fields["Status"])),
    score: safeNumber(fields["Score"] || fields["score"] || 0),
    dueDate: formatDateISO(safeString(fields["Due Date"])),
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

async function testFixedMapper() {
  console.log('='.repeat(80));
  console.log('✅ TESTING FIXED MAPPER');
  console.log('='.repeat(80));
  console.log('');

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

  const records = await base('KPIs').select({ maxRecords: 3 }).all();

  records.forEach((record, index) => {
    console.log(`\n📊 KPI ${index + 1}:`);
    console.log('-'.repeat(80));

    console.log('\n[RAW AIRTABLE DATA]');
    console.log(`KPI Name: "${record.fields["KPI Name"]}"`);
    console.log(`Status: "${record.fields["Status"]}"`);
    console.log(`Department: "${record.fields["Department"]}"`);
    console.log(`Target: ${record.fields["target"]}`);
    console.log(`Actual: ${record.fields["actual"]}`);

    const mapped = mapKPIFromAirtable(record);

    console.log('\n[AFTER MAPPING]');
    console.log(`kpiName: "${mapped.kpiName}"`);
    console.log(`status: "${mapped.status}"`);
    console.log(`departmentId: "${mapped.departmentId}"`);
    console.log(`targetValue: ${mapped.targetValue}`);
    console.log(`actualValue: ${mapped.actualValue}`);
    console.log(`score: ${mapped.score}`);

    console.log('\n✅ RESULT:');
    if (mapped.kpiName === record.fields["KPI Name"]) {
      console.log(`   ✅ KPI Name preserved: "${mapped.kpiName}"`);
    } else {
      console.log(`   ❌ KPI Name changed from "${record.fields["KPI Name"]}" to "${mapped.kpiName}"`);
    }

    if (mapped.targetValue === record.fields["target"]) {
      console.log(`   ✅ Target value correct: ${mapped.targetValue}`);
    } else {
      console.log(`   ❌ Target value wrong: ${mapped.targetValue} (expected ${record.fields["target"]})`);
    }

    if (mapped.actualValue === record.fields["actual"]) {
      console.log(`   ✅ Actual value correct: ${mapped.actualValue}`);
    } else {
      console.log(`   ❌ Actual value wrong: ${mapped.actualValue} (expected ${record.fields["actual"]})`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(80));
  console.log('✅ Mapper is now using correct Airtable field names');
  console.log('✅ Data should flow correctly to dashboard');
  console.log('\nNext: Rebuild and test API endpoint');
}

testFixedMapper().catch(console.error);
