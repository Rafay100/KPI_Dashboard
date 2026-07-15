require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

console.log('🚀 COMPREHENSIVE AIRTABLE SETUP');
console.log('=' .repeat(80));
console.log('\n⚠️  IMPORTANT: This script will populate your Airtable base with sample data.');
console.log('   Make sure you have created the tables with proper fields in Airtable first.\n');

async function setupAirtableData() {
  try {
    // Step 1: Clear existing data (optional - comment out if you want to keep existing records)
    console.log('\n📝 Step 1: Checking existing data...\n');

    // Step 2: Create Departments first (as they're referenced by Employees and KPIs)
    console.log('\n🏢 Step 2: Creating Departments...\n');

    const departments = [
      {
        fields: {
          'Name': 'Engineering',
          'department_name': 'Engineering',
          'description': 'Software development and technical operations',
          'department_manager_name': 'John Smith',
          'employee_count': 15,
          'average_kpi_score': 85.5,
          'total_active_kpis': 25,
          'completed_kpis': 18,
          'missed_kpis': 2,
          'at_risk_kpis': 5,
          'overall_department_score': 85.5,
          'performance_trend': 'up',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Sales',
          'department_name': 'Sales',
          'description': 'Revenue generation and client acquisition',
          'department_manager_name': 'Sarah Johnson',
          'employee_count': 12,
          'average_kpi_score': 78.3,
          'total_active_kpis': 20,
          'completed_kpis': 14,
          'missed_kpis': 3,
          'at_risk_kpis': 3,
          'overall_department_score': 78.3,
          'performance_trend': 'stable',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Marketing',
          'department_name': 'Marketing',
          'description': 'Brand management and digital marketing',
          'department_manager_name': 'Michael Chen',
          'employee_count': 8,
          'average_kpi_score': 92.1,
          'total_active_kpis': 15,
          'completed_kpis': 13,
          'missed_kpis': 0,
          'at_risk_kpis': 2,
          'overall_department_score': 92.1,
          'performance_trend': 'up',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'HR',
          'department_name': 'HR',
          'description': 'Human resources and talent management',
          'department_manager_name': 'Emily Davis',
          'employee_count': 5,
          'average_kpi_score': 88.7,
          'total_active_kpis': 10,
          'completed_kpis': 8,
          'missed_kpis': 1,
          'at_risk_kpis': 1,
          'overall_department_score': 88.7,
          'performance_trend': 'stable',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      }
    ];

    const createdDepartments = [];
    for (const dept of departments) {
      try {
        const created = await base('Departments').create([dept]);
        createdDepartments.push(created[0]);
        console.log(`✅ Created department: ${dept.fields.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${dept.fields.Name}:`, error.message);
      }
    }

    // Step 3: Create Employees
    console.log('\n👥 Step 3: Creating Employees...\n');

    const employees = [
      {
        fields: {
          'Name': 'John Doe',
          'name': 'John Doe',
          'email': 'john.doe@company.com',
          'department_name': 'Engineering',
          'role': 'Senior Developer',
          'kpi_score': 88.5,
          'task_completion_rate': 92.0,
          'achievement_points': 450,
          'overall_score': 88.5,
          'kpis_assigned': 8,
          'kpis_completed': 6,
          'active_status': 'Active',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Jane Smith',
          'name': 'Jane Smith',
          'email': 'jane.smith@company.com',
          'department_name': 'Sales',
          'role': 'Account Executive',
          'kpi_score': 95.2,
          'task_completion_rate': 98.0,
          'achievement_points': 680,
          'overall_score': 95.2,
          'kpis_assigned': 6,
          'kpis_completed': 5,
          'active_status': 'Active',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Michael Brown',
          'name': 'Michael Brown',
          'email': 'michael.brown@company.com',
          'department_name': 'Marketing',
          'role': 'Content Manager',
          'kpi_score': 91.8,
          'task_completion_rate': 94.5,
          'achievement_points': 520,
          'overall_score': 91.8,
          'kpis_assigned': 7,
          'kpis_completed': 6,
          'active_status': 'Active',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Sarah Wilson',
          'name': 'Sarah Wilson',
          'email': 'sarah.wilson@company.com',
          'department_name': 'HR',
          'role': 'HR Specialist',
          'kpi_score': 87.3,
          'task_completion_rate': 89.0,
          'achievement_points': 390,
          'overall_score': 87.3,
          'kpis_assigned': 5,
          'kpis_completed': 4,
          'active_status': 'Active',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'David Lee',
          'name': 'David Lee',
          'email': 'david.lee@company.com',
          'department_name': 'Engineering',
          'role': 'DevOps Engineer',
          'kpi_score': 84.6,
          'task_completion_rate': 88.5,
          'achievement_points': 410,
          'overall_score': 84.6,
          'kpis_assigned': 9,
          'kpis_completed': 7,
          'active_status': 'Active',
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      }
    ];

    const createdEmployees = [];
    for (const emp of employees) {
      try {
        const created = await base('Employees').create([emp]);
        createdEmployees.push(created[0]);
        console.log(`✅ Created employee: ${emp.fields.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${emp.fields.Name}:`, error.message);
      }
    }

    // Step 4: Create KPIs
    console.log('\n📊 Step 4: Creating KPIs...\n');

    const kpis = [
      {
        fields: {
          'Name': 'Website Performance Optimization',
          'kpi_name': 'Website Performance Optimization',
          'description': 'Improve page load time to under 2 seconds',
          'department_name': 'Engineering',
          'assigned_employee_name': 'John Doe',
          'target_value': 2.0,
          'actual_value': 1.8,
          'measurement_unit': 'seconds',
          'score': 110.0,
          'status': 'completed',
          'due_date': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Q2 Revenue Target',
          'kpi_name': 'Q2 Revenue Target',
          'description': 'Achieve $500K in revenue for Q2',
          'department_name': 'Sales',
          'assigned_employee_name': 'Jane Smith',
          'target_value': 500000,
          'actual_value': 485000,
          'measurement_unit': 'USD',
          'score': 97.0,
          'status': 'in-progress',
          'due_date': new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Social Media Engagement',
          'kpi_name': 'Social Media Engagement',
          'description': 'Increase social media engagement by 25%',
          'department_name': 'Marketing',
          'assigned_employee_name': 'Michael Brown',
          'target_value': 25.0,
          'actual_value': 28.5,
          'measurement_unit': 'percentage',
          'score': 114.0,
          'status': 'completed',
          'due_date': new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Employee Satisfaction Score',
          'kpi_name': 'Employee Satisfaction Score',
          'description': 'Maintain employee satisfaction above 85%',
          'department_name': 'HR',
          'assigned_employee_name': 'Sarah Wilson',
          'target_value': 85.0,
          'actual_value': 82.0,
          'measurement_unit': 'percentage',
          'score': 96.5,
          'status': 'at-risk',
          'due_date': new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'API Response Time',
          'kpi_name': 'API Response Time',
          'description': 'Keep average API response time under 200ms',
          'department_name': 'Engineering',
          'assigned_employee_name': 'David Lee',
          'target_value': 200,
          'actual_value': 180,
          'measurement_unit': 'milliseconds',
          'score': 111.1,
          'status': 'completed',
          'due_date': new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Customer Acquisition Cost',
          'kpi_name': 'Customer Acquisition Cost',
          'description': 'Reduce CAC to under $150',
          'department_name': 'Sales',
          'assigned_employee_name': 'Jane Smith',
          'target_value': 150,
          'actual_value': 165,
          'measurement_unit': 'USD',
          'score': 90.9,
          'status': 'in-progress',
          'due_date': new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Content Publishing Goal',
          'kpi_name': 'Content Publishing Goal',
          'description': 'Publish 20 blog posts this month',
          'department_name': 'Marketing',
          'assigned_employee_name': 'Michael Brown',
          'target_value': 20,
          'actual_value': 12,
          'measurement_unit': 'posts',
          'score': 60.0,
          'status': 'in-progress',
          'due_date': new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Onboarding Time Reduction',
          'kpi_name': 'Onboarding Time Reduction',
          'description': 'Reduce average onboarding time to 3 days',
          'department_name': 'HR',
          'assigned_employee_name': 'Sarah Wilson',
          'target_value': 3,
          'actual_value': 4,
          'measurement_unit': 'days',
          'score': 75.0,
          'status': 'at-risk',
          'due_date': new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
          'created_at': new Date().toISOString(),
          'last_updated': new Date().toISOString(),
        }
      }
    ];

    const createdKPIs = [];
    for (const kpi of kpis) {
      try {
        const created = await base('KPIs').create([kpi]);
        createdKPIs.push(created[0]);
        console.log(`✅ Created KPI: ${kpi.fields.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${kpi.fields.Name}:`, error.message);
      }
    }

    // Step 5: Create Tasks
    console.log('\n✅ Step 5: Creating Tasks...\n');

    const tasks = [
      {
        fields: {
          'Name': 'Optimize database queries',
          'task_name': 'Optimize database queries',
          'description': 'Review and optimize slow database queries',
          'assigned_employee_name': 'John Doe',
          'department_name': 'Engineering',
          'status': 'in-progress',
          'priority': 'high',
          'due_date': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Follow up with leads',
          'task_name': 'Follow up with leads',
          'description': 'Contact 20 warm leads from last week',
          'assigned_employee_name': 'Jane Smith',
          'department_name': 'Sales',
          'status': 'completed',
          'priority': 'high',
          'due_date': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Create social media calendar',
          'task_name': 'Create social media calendar',
          'description': 'Plan content calendar for next month',
          'assigned_employee_name': 'Michael Brown',
          'department_name': 'Marketing',
          'status': 'todo',
          'priority': 'medium',
          'due_date': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Update employee handbook',
          'task_name': 'Update employee handbook',
          'description': 'Revise policies and procedures',
          'assigned_employee_name': 'Sarah Wilson',
          'department_name': 'HR',
          'status': 'in-progress',
          'priority': 'low',
          'due_date': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          'created_at': new Date().toISOString(),
          'updated_at': new Date().toISOString(),
        }
      }
    ];

    const createdTasks = [];
    for (const task of tasks) {
      try {
        const created = await base('Tasks').create([task]);
        createdTasks.push(created[0]);
        console.log(`✅ Created task: ${task.fields.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${task.fields.Name}:`, error.message);
      }
    }

    // Step 6: Create Achievements
    console.log('\n🏆 Step 6: Creating Achievements...\n');

    const achievements = [
      {
        fields: {
          'Name': 'Top Performer Q2',
          'title': 'Top Performer Q2',
          'description': 'Exceeded all KPI targets for Q2',
          'employee_name': 'Jane Smith',
          'department_name': 'Sales',
          'points': 500,
          'achievement_category': 'excellence',
          'badge_type': 'gold',
          'date_earned': new Date().toISOString(),
          'created_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Fast Finisher',
          'title': 'Fast Finisher',
          'description': 'Completed KPI ahead of schedule',
          'employee_name': 'Michael Brown',
          'department_name': 'Marketing',
          'points': 300,
          'achievement_category': 'kpi-completion',
          'badge_type': 'silver',
          'date_earned': new Date().toISOString(),
          'created_at': new Date().toISOString(),
        }
      },
      {
        fields: {
          'Name': 'Team Player',
          'title': 'Team Player',
          'description': 'Helped colleagues achieve their goals',
          'employee_name': 'John Doe',
          'department_name': 'Engineering',
          'points': 200,
          'achievement_category': 'teamwork',
          'badge_type': 'bronze',
          'date_earned': new Date().toISOString(),
          'created_at': new Date().toISOString(),
        }
      }
    ];

    for (const achievement of achievements) {
      try {
        await base('Achievements').create([achievement]);
        console.log(`✅ Created achievement: ${achievement.fields.Name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${achievement.fields.Name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ SETUP COMPLETE!');
    console.log('\n📊 Summary:');
    console.log(`   - Departments: ${createdDepartments.length} created`);
    console.log(`   - Employees: ${createdEmployees.length} created`);
    console.log(`   - KPIs: ${createdKPIs.length} created`);
    console.log(`   - Tasks: ${createdTasks.length} created`);
    console.log(`   - Achievements: ${achievements.length} attempted`);
    console.log('\n🚀 Your dashboard should now display data!');
    console.log('   Visit: http://localhost:3000\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
  }
}

setupAirtableData();
