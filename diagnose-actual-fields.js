require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

async function inspectActualFields() {
  console.log('🔍 INSPECTING ACTUAL AIRTABLE FIELD NAMES\n');
  console.log('='.repeat(80));

  // Inspect KPIs table
  console.log('\n📊 KPIs TABLE - Actual Fields:');
  console.log('-'.repeat(80));
  try {
    const kpiRecords = await base('KPIs').select({ maxRecords: 1 }).firstPage();
    if (kpiRecords.length > 0) {
      const fields = Object.keys(kpiRecords[0].fields);
      console.log('Field names found:', fields);
      console.log('\nSample record data:');
      console.log(JSON.stringify(kpiRecords[0].fields, null, 2));
    } else {
      console.log('⚠️  No KPI records found');
    }
  } catch (error) {
    console.error('❌ Error fetching KPIs:', error.message);
  }

  // Inspect Employees table
  console.log('\n\n👥 EMPLOYEES TABLE - Actual Fields:');
  console.log('-'.repeat(80));
  try {
    const empRecords = await base('Employees').select({ maxRecords: 1 }).firstPage();
    if (empRecords.length > 0) {
      const fields = Object.keys(empRecords[0].fields);
      console.log('Field names found:', fields);
      console.log('\nSample record data:');
      console.log(JSON.stringify(empRecords[0].fields, null, 2));
    } else {
      console.log('⚠️  No Employee records found');
    }
  } catch (error) {
    console.error('❌ Error fetching Employees:', error.message);
  }

  // Inspect Departments table
  console.log('\n\n🏢 DEPARTMENTS TABLE - Actual Fields:');
  console.log('-'.repeat(80));
  try {
    const deptRecords = await base('Departments').select({ maxRecords: 1 }).firstPage();
    if (deptRecords.length > 0) {
      const fields = Object.keys(deptRecords[0].fields);
      console.log('Field names found:', fields);
      console.log('\nSample record data:');
      console.log(JSON.stringify(deptRecords[0].fields, null, 2));
    } else {
      console.log('⚠️  No Department records found');
    }
  } catch (error) {
    console.error('❌ Error fetching Departments:', error.message);
  }

  // Inspect Tasks table
  console.log('\n\n✅ TASKS TABLE - Actual Fields:');
  console.log('-'.repeat(80));
  try {
    const taskRecords = await base('Tasks').select({ maxRecords: 1 }).firstPage();
    if (taskRecords.length > 0) {
      const fields = Object.keys(taskRecords[0].fields);
      console.log('Field names found:', fields);
      console.log('\nSample record data:');
      console.log(JSON.stringify(taskRecords[0].fields, null, 2));
    } else {
      console.log('⚠️  No Task records found');
    }
  } catch (error) {
    console.error('❌ Error fetching Tasks:', error.message);
  }

  // Inspect Achievements table
  console.log('\n\n🏆 ACHIEVEMENTS TABLE - Actual Fields:');
  console.log('-'.repeat(80));
  try {
    const achRecords = await base('Achievements').select({ maxRecords: 1 }).firstPage();
    if (achRecords.length > 0) {
      const fields = Object.keys(achRecords[0].fields);
      console.log('Field names found:', fields);
      console.log('\nSample record data:');
      console.log(JSON.stringify(achRecords[0].fields, null, 2));
    } else {
      console.log('⚠️  No Achievement records found');
    }
  } catch (error) {
    console.error('❌ Error fetching Achievements:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Inspection complete!\n');
}

inspectActualFields().catch(console.error);
