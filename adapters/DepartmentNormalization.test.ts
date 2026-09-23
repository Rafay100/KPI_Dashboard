import { describe, it, expect } from "vitest";
import { GoogleSheetsAdapter } from "@/adapters/GoogleSheetsAdapter";
import { 
  calculateDepartmentScorecard, 
  matchesDepartment,
  calculateOverallScore,
  calculateKPIAchievementPercentage,
  calculateTaskExecutionMetrics,
  calculateContributionScore
} from "@/lib/scoring";
import type { Department, Employee, KPI, Task, Achievement } from "@/types/models";

describe("Department Canonical Ingestion & Scoring Normalization", () => {
  const sampleDepartments: Department[] = [
    { id: "dept_01", departmentName: "Sales", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_02", departmentName: "Marketing", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_03", departmentName: "Operations", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_04", departmentName: "HR", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_05", departmentName: "Finance", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_06", departmentName: "Product", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_07", departmentName: "Engineering", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
    { id: "dept_08", departmentName: "Customer Support", description: "", averageScore: 0, employeeCount: 0, totalKPIs: 0, completedKPIs: 0, headOfDepartment: "", createdAt: "", lastUpdated: "" },
  ];

  it("proves matchesDepartment isolates each canonical department strictly", () => {
    const salesDept = sampleDepartments[0];
    const opsDept = sampleDepartments[2];
    const finDept = sampleDepartments[4];
    const prodDept = sampleDepartments[5];
    const csDept = sampleDepartments[7];

    // Sales
    expect(matchesDepartment("dept_01", salesDept)).toBe(true);
    expect(matchesDepartment("SAL", salesDept)).toBe(true);
    expect(matchesDepartment("Sales", salesDept)).toBe(true);
    expect(matchesDepartment("dept_02", salesDept)).toBe(false);
    expect(matchesDepartment("Finance", salesDept)).toBe(false);

    // Finance vs Operations (proves dept_13 cross-pollution is fixed)
    expect(matchesDepartment("dept_05", finDept)).toBe(true);
    expect(matchesDepartment("Finance", finDept)).toBe(true);
    expect(matchesDepartment("dept_03", finDept)).toBe(false);
    expect(matchesDepartment("Operations", finDept)).toBe(false);
    expect(matchesDepartment("dept_05", opsDept)).toBe(false);
    expect(matchesDepartment("Finance", opsDept)).toBe(false);

    // Product vs Customer Support (proves dept_16 cross-pollution is fixed)
    expect(matchesDepartment("dept_06", prodDept)).toBe(true);
    expect(matchesDepartment("Product", prodDept)).toBe(true);
    expect(matchesDepartment("dept_08", prodDept)).toBe(false);
    expect(matchesDepartment("Customer Support", prodDept)).toBe(false);
    expect(matchesDepartment("dept_06", csDept)).toBe(false);
    expect(matchesDepartment("Product", csDept)).toBe(false);
  });

  it("verifies no cross-department matching across KPIs, Employees, Tasks, and Achievements", () => {
    const salesDept = sampleDepartments[0];
    const finDept = sampleDepartments[4];

    const employees: Employee[] = [
      { id: "emp_1", name: "Alice Sales", email: "a@sales.com", department: "Sales", departmentId: "dept_01", team: "T1", position: "Rep", overallScore: 90, totalKPIs: 1, completedKPIs: 1, createdAt: "", lastUpdated: "" },
      { id: "emp_2", name: "Bob Finance", email: "b@fin.com", department: "Finance", departmentId: "dept_05", team: "T2", position: "Analyst", overallScore: 85, totalKPIs: 1, completedKPIs: 1, createdAt: "", lastUpdated: "" },
    ];

    const kpis: KPI[] = [
      { id: "kpi_1", kpiName: "Sales Revenue", description: "", departmentId: "dept_01", employeeId: "emp_1", targetValue: 100, actualValue: 110, status: "completed", score: 100, dueDate: "", lastUpdated: "", createdAt: "" },
      { id: "kpi_2", kpiName: "Finance Audit", description: "", departmentId: "dept_05", employeeId: "emp_2", targetValue: 100, actualValue: 90, status: "in-progress", score: 90, dueDate: "", lastUpdated: "", createdAt: "" },
    ];

    const tasks: Task[] = [
      { id: "task_1", taskName: "Close Deal", description: "", status: "completed", priority: "high", assignedTo: "emp_1", assignedToId: "emp_1", dueDate: "", lastUpdated: "", createdAt: "" },
      { id: "task_2", taskName: "Monthly Close", description: "", status: "completed", priority: "high", assignedTo: "emp_2", assignedToId: "emp_2", dueDate: "", lastUpdated: "", createdAt: "" },
    ];

    const achievements: Achievement[] = [
      { id: "ach_1", title: "Top Seller", description: "", points: 50, employeeId: "emp_1", employeeName: "Alice Sales", category: "milestone", achievedAt: "", createdAt: "" },
      { id: "ach_2", title: "Audit Star", description: "", points: 30, employeeId: "emp_2", employeeName: "Bob Finance", category: "excellence", achievedAt: "", createdAt: "" },
    ];

    const salesCard = calculateDepartmentScorecard(salesDept, employees, kpis, tasks, achievements);
    expect(salesCard.employeeCount).toBe(1);
    expect(salesCard.activeKPIs).toBe(1);
    expect(salesCard.taskCount).toBe(1);
    expect(salesCard.achievementPoints).toBe(50);
    expect(salesCard.kpiScore).toBe(100);

    const finCard = calculateDepartmentScorecard(finDept, employees, kpis, tasks, achievements);
    expect(finCard.employeeCount).toBe(1);
    expect(finCard.activeKPIs).toBe(1);
    expect(finCard.taskCount).toBe(1);
    expect(finCard.achievementPoints).toBe(30);
    expect(finCard.kpiScore).toBe(90);
  });

  it("verifies verified scoring engine mathematical integrity (70/20/10)", () => {
    // 70% KPI (100) + 20% Exec (100) + 10% Contrib (100) = 100
    expect(calculateOverallScore(100, 100, 100)).toBe(100);

    // 70% * 90 + 20% * 80 + 10% * 70 = 63 + 16 + 7 = 86
    expect(calculateOverallScore(90, 80, 70)).toBe(86);

    // KPI Achievement percentage
    expect(calculateKPIAchievementPercentage(120, 100)).toBe(120);
    expect(calculateKPIAchievementPercentage(85, 100)).toBe(85);
  });
});
