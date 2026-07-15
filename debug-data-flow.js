/**
 * DEBUG SCRIPT - Shows actual data flow from Airtable to Dashboard
 */

const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function debugDataFlow() {
  console.log('='.repeat(80));
  console.log('🔍 DEBUGGING DATA FLOW: Airtable → Mapper → API → Dashboard');
  console.log('='.repeat(80));
  console.log('');

  try {
    // STEP 1: Fetch raw Airtable records
    console.log('📊 STEP 1: RAW AIRTABLE DATA');
    console.log('-'.repeat(80));

    const records = await base('KPIs').select({ maxRecords: 3 }).all();

    console.log(`Found ${records.length} KPI records\n`);

    records.forEach((record, index) => {
      console.log(`\n[RAW RECORD ${index + 1}] ID: ${record.id}`);
      console.log('Field Names and Values:');
      console.log(JSON.stringify(record.fields, null, 2));
      console.log('');
    });

    // STEP 2: Show what the mapper does
    console.log('\n' + '='.repeat(80));
    console.log('🔄 STEP 2: AFTER MAPPING (using mapKPIFromAirtable)');
    console.log('-'.repeat(80));

    // Import the mapper
    const { mapKPIFromAirtable } = require('./utils/mappers.ts');

    records.forEach((record, index) => {
      const mapped = mapKPIFromAirtable(record);
      console.log(`\n[MAPPED OBJECT ${index + 1}]`);
      console.log(JSON.stringify(mapped, null, 2));
    });

    // STEP 3: Test API endpoint
    console.log('\n' + '='.repeat(80));
    console.log('🌐 STEP 3: TESTING API ENDPOINT /api/kpis');
    console.log('-'.repeat(80));
    console.log('Run this in browser: http://localhost:3006/api/kpis');
    console.log('');

    // STEP 4: Show field mapping configuration
    console.log('\n' + '='.repeat(80));
    console.log('⚙️  STEP 4: CURRENT FIELD MAPPING CONFIGURATION');
    console.log('-'.repeat(80));

    const { AIRTABLE_FIELD_MAPPINGS } = require('./config/airtable-field-mappings.ts');
    console.log('Expected field names:');
    console.log(JSON.stringify(AIRTABLE_FIELD_MAPPINGS.kpis, null, 2));

    // STEP 5: Compare
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSIS');
    console.log('-'.repeat(80));

    if (records.length > 0) {
      const firstRecord = records[0].fields;
      const actualFields = Object.keys(firstRecord);

      console.log('\n✅ Actual Airtable Column Names:');
      actualFields.forEach(field => console.log(`   - "${field}"`));

      console.log('\n❓ Checking if mapper is looking for these fields...');

      // Check if KPI Name exists
      if ('KPI Name' in firstRecord) {
        console.log(`   ✅ "KPI Name" exists with value: "${firstRecord['KPI Name']}"`);
      } else {
        console.log(`   ❌ "KPI Name" not found`);
      }

      if ('Status' in firstRecord) {
        console.log(`   ✅ "Status" exists with value: "${firstRecord['Status']}"`);
      } else {
        console.log(`   ❌ "Status" not found`);
      }

      if ('target' in firstRecord) {
        console.log(`   ✅ "target" exists with value: "${firstRecord['target']}"`);
      } else if ('Target Value' in firstRecord) {
        console.log(`   ✅ "Target Value" exists with value: "${firstRecord['Target Value']}"`);
      } else {
        console.log(`   ❌ Neither "target" nor "Target Value" found`);
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
}

debugDataFlow();
