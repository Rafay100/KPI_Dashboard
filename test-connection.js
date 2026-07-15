// Quick Airtable Connection Test Script
// Run this with: node test-connection.js

require('dotenv').config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

console.log('🔍 Testing Airtable Connection...\n');

// Check environment variables
console.log('✓ Checking environment variables:');
console.log(`  AIRTABLE_API_KEY: ${AIRTABLE_API_KEY ? (AIRTABLE_API_KEY.substring(0, 10) + '...') : '❌ MISSING'}`);
console.log(`  AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID ? AIRTABLE_BASE_ID : '❌ MISSING'}`);

if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'your_airtable_api_key_here') {
  console.error('\n❌ AIRTABLE_API_KEY is not set or still has placeholder value!');
  console.log('👉 Get your API key from: https://airtable.com/create/tokens\n');
  process.exit(1);
}

if (!AIRTABLE_BASE_ID || AIRTABLE_BASE_ID === 'your_base_id_here') {
  console.error('\n❌ AIRTABLE_BASE_ID is not set or still has placeholder value!');
  console.log('👉 Create a base and get the ID from the URL\n');
  process.exit(1);
}

// Test connection
const Airtable = require('airtable');
Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});

const base = Airtable.base(AIRTABLE_BASE_ID);

console.log('\n🔌 Testing connection to Airtable...');

const tables = ['KPIs', 'Employees', 'Departments', 'Tasks', 'Achievements'];
let successCount = 0;

async function testTable(tableName) {
  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    console.log(`  ✅ ${tableName}: Connected (${records.length} records found)`);
    successCount++;
  } catch (error) {
    console.error(`  ❌ ${tableName}: ${error.message}`);
  }
}

(async () => {
  for (const table of tables) {
    await testTable(table);
  }

  console.log(`\n📊 Results: ${successCount}/${tables.length} tables connected\n`);

  if (successCount === tables.length) {
    console.log('🎉 SUCCESS! All tables are connected and working!\n');
    console.log('You can now run: npm run dev\n');
  } else {
    console.log('⚠️  Some tables failed. Check:');
    console.log('  1. Table names are exactly: KPIs, Employees, Departments, Tasks, Achievements');
    console.log('  2. Tables exist in your Airtable base');
    console.log('  3. Your API token has proper scopes\n');
  }
})();
