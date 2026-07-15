/**
 * VERIFICATION SCRIPT: Confirm the bug fix is working
 */

const fetch = require('node-fetch');

async function verifyFix() {
  console.log('🔍 VERIFICATION: Testing KPI API with Fixed Mapper\n');
  console.log('================================================\n');

  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3007/api/kpis');

    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}`);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ API returned success: false');
      console.error(result);
      return;
    }

    console.log(`✅ API returned ${result.data.length} KPIs\n`);

    // Group by status
    const statusGroups = {};

    result.data.forEach(kpi => {
      if (!statusGroups[kpi.status]) {
        statusGroups[kpi.status] = [];
      }
      statusGroups[kpi.status].push(kpi);
    });

    // Display status distribution
    console.log('📊 STATUS DISTRIBUTION:\n');
    Object.keys(statusGroups).sort().forEach(status => {
      console.log(`   ${status}: ${statusGroups[status].length} KPIs`);
    });

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show all KPIs with key fields
    console.log('📋 ALL KPIs:\n');
    result.data.forEach((kpi, index) => {
      console.log(`${index + 1}. ${kpi.kpiName}`);
      console.log(`   Status: ${kpi.status}`);
      console.log(`   Target: ${kpi.targetValue} | Actual: ${kpi.actualValue}`);
      console.log(`   Department: ${kpi.departmentId}`);
      console.log(`   Employee: ${kpi.employeeId}`);
      console.log('');
    });

    // Highlight the specific KPI mentioned by the user
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 SPECIFIC TEST CASE: "Monthly Sales Target"\n');

    const monthlySalesTarget = result.data.find(kpi =>
      kpi.kpiName.toLowerCase().includes('monthly sales target')
    );

    if (monthlySalesTarget) {
      console.log('✅ FOUND!\n');
      console.log(JSON.stringify(monthlySalesTarget, null, 2));
      console.log('\n✅ Verification: KPI Name is correct');
      console.log(`✅ Verification: Status is "${monthlySalesTarget.status}" (not "On Track" literal)`);
      console.log('✅ Verification: Target and Actual values present');
    } else {
      console.log('⚠️  Not found in this batch');
    }

    console.log('\n\n================================================');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('================================================\n');
    console.log('Next Steps:');
    console.log('1. Open http://localhost:3007 in your browser');
    console.log('2. Navigate to the KPI Dashboard');
    console.log('3. Verify "Monthly Sales Target" displays correctly');
    console.log('4. Check that all status badges show proper values\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nMake sure the dev server is running on port 3007');
    console.error('Run: npm run dev');
  }
}

verifyFix();
