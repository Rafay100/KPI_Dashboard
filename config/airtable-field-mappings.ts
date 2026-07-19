/**
 * Airtable Field Mappings Configuration - UPDATED WITH ACTUAL FIELD NAMES
 * Based on actual Airtable table structure
 */

export const AIRTABLE_FIELD_MAPPINGS = {
  // KPIs Table - ACTUAL FIELDS FROM YOUR AIRTABLE
  kpis: {
    id: "id",
    kpiName: "KPI Name",
    description: "Description",
    owner: "Owner",
    category: "Category",
    department: "Department",
    departmentName: "Department",
    frequency: "Frequency",
    unit: "Unit",
    assignedEmployee: "Assigned Employee",
    assignedEmployeeName: "Assigned Employee",
    dueDate: "Due Date",
    status: "Status",
    targetValue: "Target Value",
    actualValue: "Actual Value",
    score: "Score",
    weight: "Weight",
    priority: "Priority",
    startDate: "Start Date",
    endDate: "End Date",
    lastUpdated: "Last Updated",
    createdAt: "Created Date",
  },

  // KPI Updates Table
  kpiUpdates: {
    id: "id",
    kpiId: "KPI ID",
    kpiName: "KPI Name",
    previousValue: "Previous Value",
    newValue: "New Value",
    previousScore: "Previous Score",
    newScore: "New Score",
    statusAfterUpdate: "Status After Update",
    updatedBy: "Updated By",
    updateDate: "Update Date",
    notes: "Notes",
  },

  // Employees Table - ACTUAL FIELDS
  employees: {
    id: "ID",
    name: "Name",
    email: "Email",
    department: "Department",
    departmentName: "Department",
    manager: "Manager",
    managerName: "Manager",
    status: "Status",
    kpiScore: "KPI Score",
    achievementPoints: "Achivement Points", // Note: Typo in Airtable
    role: "Role",
    position: "Position",
    hireDate: "Hire Date",
    avatar: "Avatar",
    createdAt: "Created Date",
  },

  // Departments Table - ACTUAL FIELDS
  departments: {
    id: "ID",
    departmentName: "Department Name",
    description: "Description",
    manager: "Manager",
    departmentManagerName: "Manager",
    employees: "Employees",
    employeeCount: "Employee Count",
    activeKpis: "Active KPIs",
    totalActiveKpis: "Active KPIs",
    averageScore: "Avg KPI Sciore", // Note: Typo in Airtable
    averageKpiScore: "Avg KPI Sciore",
    performanceTrend: "Performance Trend",
    createdAt: "Created Date",
  },

  // Teams Table
  teams: {
    id: "id",
    teamName: "Team Name",
    departmentId: "Department",
    teamLead: "Team Lead",
    members: "Members",
    activeKpis: "Active KPIs",
    description: "Description",
    status: "Status",
  },

  // Achievements Table - ACTUAL FIELDS
  achievements: {
    id: "ID",
    title: "Title",
    description: "Description",
    employee: "Employee",
    employeeName: "Employee",
    employeeId: "Employee ID",
    category: "Category",
    achievementCategory: "Category",
    points: "Points",
    impactLevel: "Impact Level",
    dateEarned: "Date Earned",
    relatedKpi: "Related KPI",
    relatedKpiName: "Related KPI",
    relatedTask: "Related Task",
    badgeType: "Badge Type",
    createdAt: "Created Date",
  },

  // Tasks Table (to be created or mapped)
  tasks: {
    id: "id",
    taskName: "Task Name",
    description: "Description",
    assignedTo: "Assigned To",
    assignedToId: "Assigned Employee",
    status: "Status",
    priority: "Priority",
    dueDate: "Due Date",
    relatedKpi: "Related KPI",
    relatedKpiId: "Related KPI ID",
    department: "Department",
    completionScore: "Completion Score",
    createdAt: "Created Date",
    completedAt: "Completed Date",
  },

  // Users Table - ACTUAL FIELDS
  users: {
    id: "ID",
    username: "Username",
    email: "Email",
    role: "Role",
    status: "Status",
    lastLogin: "Last Login",
    createdAt: "Created Date",
    employeeId: "Employee ID",
  },

  // Data Sources Table
  dataSources: {
    id: "id",
    sourceName: "Source Name",
    sourceType: "Source Type",
    status: "Status",
    lastSync: "Last Sync",
    apiKey: "API Key",
    connectionString: "Connection String",
    isActive: "Is Active",
  },

  // Field Mappings Table
  fieldMappings: {
    id: "id",
    sourceTable: "Source Table",
    sourceField: "Source Field",
    targetTable: "Target Table",
    targetField: "Target Field",
    transformation: "Transformation",
    isActive: "Is Active",
  },

  // Import Logs Table
  importLogs: {
    id: "id",
    importDate: "Import Date",
    sourceFile: "Source File",
    recordsImported: "Records Imported",
    recordsFailed: "Records Failed",
    status: "Status",
    errorLog: "Error Log",
    importedBy: "Imported By",
  },

  // Settings Table
  settings: {
    id: "id",
    settingKey: "Setting Key",
    settingValue: "Setting Value",
    category: "Category",
    description: "Description",
    lastUpdated: "Last Updated",
    updatedBy: "Updated By",
  },
};

