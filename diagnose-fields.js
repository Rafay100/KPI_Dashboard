// Diagnose Airtable Field Names
// This will show you what field names actually exist in your tables

require('dotenv').config({ path: '.env.local' });

const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

const tables = ['KPIs', 'Employees', 'Departments', 'Tasks', 'Achievements'];

console.log('🔍 Diagnosing Airtable Field Names...\n');

async function diagnoseTable(tableName) {
  try {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('─'.repeat(60));

    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();

    if (records.length === 0) {
      console.log('⚠️  No records found in this table');
      return;
    }

    const fields = records[0].fields;
    const fieldNames = Object.keys(fields);

    console.log(`Found ${fieldNames.length} fields:\n`);
    fieldNames.forEach((fieldName, index) => {
      const value = fields[fieldName];
      const valueType = typeof value;
      const preview = valueType === 'string' && value.length > 30
        ? value.substring(0, 30) + '...'
        : value;

      console.log(`  ${index + 1}. "${fieldName}" (${valueType})`);
      console.log(`     Example: ${JSON.stringify(preview)}`);
    });

  } catch (error) {
    console.error(`❌ Error diagnosing ${tableName}:`, error.message);
  }
}

(async () => {
  for (const table of tables) {
    await diagnoseTable(table);
  }

  console.log('\n\n✅ Diagnosis complete!');
  console.log('\nNext steps:');
  console.log('1. Compare these field names with what the mappers expect');
  console.log('2. Either rename fields in Airtable OR update the mapper code');
  console.log('3. Expected field names are in utils/mappers.ts\n');
})();
