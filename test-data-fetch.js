// Test Data Fetching with Updated Mappers
// This will test if data can be fetched and mapped correctly

require('dotenv').config({ path: '.env.local' });

const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

console.log('🧪 Testing Data Fetch with Updated Mappers...\n');

// Field mappings
const FIELD_MAPPINGS = {
  kpis: {
    id: "KPIs Name",
    kpiName: "Status",
    description: "Description",
    departmentId: "Pasted field 1",
    employeeId: "Pasted field 5",
    targetValue: "Pasted field 9",
    actualValue: "Pasted field 10",
    status: "Pasted field 24",
    score: "Pasted field 16",
    dueDate: "Pasted field 21",
    lastUpdated: "Pasted field 42",
  },
  employees: {
    id: "Name",
    name: "Job Title",
    email: "Pasted field 1",
    departmentName: "Pasted field 3",
    overallScore: "Pasted field 12",
  },
  departments: {
    id: "Name",
    departmentName: "Name",
    employeeCount: "Number of Employees",
  }
};

async function testKPIs() {
  try {
    console.log('📊 Testing KPIs...');
    const records = await base('KPIs').select({ maxRecords: 3 }).firstPage();

    console.log(`  Found ${records.length} KPI records\n`);

    records.forEach((record, index) => {
      const fields = record.fields;
      const mapping = FIELD_MAPPINGS.kpis;

      console.log(`  KPI ${index + 1}:`);
      console.log(`    ID: ${record.id}`);
      console.log(`    Name: ${fields[mapping.kpiName] || 'N/A'}`);
      console.log(`    Description: ${fields[mapping.description] || 'N/A'}`);
      console.log(`    Department ID: ${fields[mapping.departmentId] || 'N/A'}`);
      console.log(`    Employee ID: ${fields[mapping.employeeId] || 'N/A'}`);
      console.log(`    Target Value: ${fields[mapping.targetValue] || 'N/A'}`);
      console.log(`    Actual Value: ${fields[mapping.actualValue] || 'N/A'}`);
      console.log(`    Status: ${fields[mapping.status] || 'N/A'}`);
      console.log(`    Score: ${fields[mapping.score] || 'N/A'}`);
      console.log();
    });

    return records.length;
  } catch (error) {
    console.error('  ❌ Error fetching KPIs:', error.message);
    return 0;
  }
}

async function testEmployees() {
  try {
    console.log('👥 Testing Employees...');
    const records = await base('Employees').select({ maxRecords: 3 }).firstPage();

    console.log(`  Found ${records.length} Employee records\n`);

    records.forEach((record, index) => {
      const fields = record.fields;
      const mapping = FIELD_MAPPINGS.employees;

      console.log(`  Employee ${index + 1}:`);
      console.log(`    ID: ${record.id}`);
      console.log(`    Name: ${fields[mapping.name] || 'N/A'}`);
      console.log(`    Email: ${fields[mapping.email] || 'N/A'}`);
      console.log(`    Department: ${fields[mapping.departmentName] || 'N/A'}`);
      console.log(`    Overall Score: ${fields[mapping.overallScore] || 'N/A'}`);
      console.log();
    });

    return records.length;
  } catch (error) {
    console.error('  ❌ Error fetching Employees:', error.message);
    return 0;
  }
}

async function testDepartments() {
  try {
    console.log('🏢 Testing Departments...');
    const records = await base('Departments').select({ maxRecords: 3 }).firstPage();

    console.log(`  Found ${records.length} Department records\n`);

    records.forEach((record, index) => {
      const fields = record.fields;
      const mapping = FIELD_MAPPINGS.departments;

      console.log(`  Department ${index + 1}:`);
      console.log(`    ID: ${record.id}`);
      console.log(`    Name: ${fields[mapping.departmentName] || 'N/A'}`);
      console.log(`    Employee Count: ${fields[mapping.employeeCount] || 'N/A'}`);
      console.log();
    });

    return records.length;
  } catch (error) {
    console.error('  ❌ Error fetching Departments:', error.message);
    return 0;
  }
}

(async () => {
  const kpiCount = await testKPIs();
  const empCount = await testEmployees();
  const deptCount = await testDepartments();

  console.log('─'.repeat(60));
  console.log('📈 Summary:');
  console.log(`  KPIs: ${kpiCount} records`);
  console.log(`  Employees: ${empCount} records`);
  console.log(`  Departments: ${deptCount} records`);
  console.log();

  if (kpiCount > 0 && empCount > 0 && deptCount > 0) {
    console.log('✅ SUCCESS! Data is being fetched correctly!');
    console.log('\n🚀 You can now run: npm run dev');
    console.log('   Your data should appear on localhost:3000\n');
  } else {
    console.log('⚠️  Some tables have no data. Please add more records to your Airtable base.\n');
  }
})();
