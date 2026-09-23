import { describe, it, expect } from "vitest";
import {
  calculateKPIAchievementPercentage,
  calculateTaskExecutionMetrics,
  calculateContributionScore,
  calculateOverallScore,
  calculateAchievementMetrics,
  calculatePerformanceBadge,
  calculatePerformanceTrend,
  matchesEmployee,
  matchesDepartment,
  calculateEmployeeScorecard,
  calculateDepartmentScorecard,
  calculateExecutiveOverviewMetrics,
  calculateHistoricalTrend,
  calculateKPIScore,
  calculateKPIStatus,
  isOverdue,
  SCORING_MODEL,
} from "./scoring";
import type { KPI, Employee, Department, Task, Achievement } from "@/types/models";

describe("Scoring Engine - lib/scoring.ts (Verified Excel Engine)", () => {
  describe("Exact Excel Scoring Engine Known Samples", () => {
    it("should calculate Alex Thompson expected overall score (98.6)", () => {
      const overall = calculateOverallScore(102.0588, 85.8824, 100);
      expect(overall).toBe(98.6);
    });

    it("should calculate Priya Kapoor expected overall score (94.5)", () => {
      const overall = calculateOverallScore(104.1176, 68.961, 77.7778);
      expect(overall).toBe(94.5);
    });

    it("should calculate Sales Department expected overall score (85.7)", () => {
      const overall = calculateOverallScore(90.2667, 68.1136, 88.4838);
      expect(overall).toBe(85.7);
    });

    it("should calculate Company / Executive expected overall score (85.4)", () => {
      const overall = calculateOverallScore(90.7176, 66.9427, 85.2613);
      expect(overall).toBe(85.4);
    });
  });

  describe("KPI primitives re-export", () => {
    it("should calculate KPI score with default more-is-better rule", () => {
      expect(calculateKPIScore({ actualValue: 80, targetValue: 100 })).toBe(80);
      expect(calculateKPIScore({ actualValue: 120, targetValue: 100 })).toBe(100);
      expect(calculateKPIScore({ actualValue: 0, targetValue: 100 })).toBe(0);
      expect(calculateKPIScore({ actualValue: 50, targetValue: 0 })).toBe(0);
    });

    it("should calculate KPI status according to exact Excel thresholds (>=100 Completed, >=85 On Track, >=70 At Risk, <70 Behind/Missed)", () => {
      expect(
        calculateKPIStatus({
          actualValue: 100,
          targetValue: 100,
          score: 100,
          dueDate: "2099-01-01",
        })
      ).toBe("Completed");

      expect(
        calculateKPIStatus({
          actualValue: 88,
          targetValue: 100,
          score: 88,
          dueDate: "2099-01-01",
        })
      ).toBe("On Track");

      expect(
        calculateKPIStatus({
          actualValue: 75,
          targetValue: 100,
          score: 75,
          dueDate: "2099-01-01",
        })
      ).toBe("At Risk");

      expect(
        calculateKPIStatus({
          actualValue: 55,
          targetValue: 100,
          score: 55,
          dueDate: "2099-01-01",
        })
      ).toBe("Behind");

      expect(
        calculateKPIStatus({
          actualValue: 40,
          targetValue: 100,
          score: 40,
          dueDate: "2020-01-01", // in past -> missed
        })
      ).toBe("Missed");
    });

    it("should detect overdue correctly", () => {
      expect(isOverdue("2020-01-01", false)).toBe(true);
      expect(isOverdue("2020-01-01", true)).toBe(false);
      expect(isOverdue("2099-01-01", false)).toBe(false);
    });
  });

  describe("calculateKPIAchievementPercentage", () => {
    it("should calculate standard actual/target ratio", () => {
      expect(calculateKPIAchievementPercentage(85, 100)).toBe(85);
      expect(calculateKPIAchievementPercentage(150, 100)).toBe(150);
      expect(calculateKPIAchievementPercentage(33.33, 100)).toBe(33);
    });

    it("should handle edge cases with zero or negative targets/actuals", () => {
      expect(calculateKPIAchievementPercentage(10, 0)).toBe(100);
      expect(calculateKPIAchievementPercentage(0, 0)).toBe(0);
      expect(calculateKPIAchievementPercentage(0, 100)).toBe(0);
      expect(calculateKPIAchievementPercentage(-10, 100)).toBe(0);
      expect(calculateKPIAchievementPercentage(NaN, 100)).toBe(0);
      expect(calculateKPIAchievementPercentage(50, Infinity)).toBe(0);
    });
  });

  describe("calculateTaskExecutionMetrics (60% completion + 40% on-time)", () => {
    it("should return 100 for empty task list", () => {
      const result = calculateTaskExecutionMetrics([]);
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.completionRate).toBe(100);
      expect(result.executionScore).toBe(100);
    });

    it("should compute execution score correctly from completion rate and on-time rate", () => {
      const sampleTasks: Task[] = [
        {
          id: "t1",
          taskName: "Task 1",
          description: "",
          status: "completed",
          priority: "high",
          assignedTo: "Alice",
          assignedToId: "emp-1",
          dueDate: "2025-01-01",
          completedAt: "2024-12-01", // on-time
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-02",
        },
        {
          id: "t2",
          taskName: "Task 2",
          description: "",
          status: "completed",
          priority: "medium",
          assignedTo: "Alice",
          assignedToId: "emp-1",
          dueDate: "2024-01-01",
          completedAt: "2024-02-01", // late
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-02",
        },
        {
          id: "t3",
          taskName: "Task 3",
          description: "",
          status: "in-progress",
          priority: "low",
          assignedTo: "Alice",
          assignedToId: "emp-1",
          dueDate: "2029-01-01",
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-02",
        },
        {
          id: "t4",
          taskName: "Task 4",
          description: "",
          status: "todo",
          priority: "critical",
          assignedTo: "Alice",
          assignedToId: "emp-1",
          dueDate: "2029-01-01",
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-02",
        },
      ];

      const result = calculateTaskExecutionMetrics(sampleTasks);
      expect(result.total).toBe(4);
      expect(result.completed).toBe(2);
      expect(result.onTime).toBe(1);
      // completion rate = 2/4 = 50%
      expect(result.completionRate).toBe(50);
      // on-time rate = 1/2 = 50%
      expect(result.onTimeRate).toBe(50);
      // executionScore = 0.6 * 50 + 0.4 * 50 = 30 + 20 = 50
      expect(result.executionScore).toBe(50);
    });
  });

  describe("calculateContributionScore (Priority Tasks + Bonus)", () => {
    it("should calculate priority rate and add achievement bonus capped at 15", () => {
      const tasks: Task[] = [
        {
          id: "t1",
          taskName: "Urgent Task",
          description: "",
          status: "completed",
          priority: "high",
          assignedTo: "Alice",
          assignedToId: "emp-1",
          dueDate: "2025-01-01",
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-01",
        },
      ];
      const achievements: Achievement[] = [
        {
          id: "a1",
          title: "Top Performer",
          description: "",
          points: 100, // 100 / 10 = 10 bonus points
          employeeId: "emp-1",
          employeeName: "Alice",
          category: "excellence",
          achievedAt: "2024-01-01",
          createdAt: "2024-01-01",
        },
      ];

      // Priority rate = 100%, Bonus = 10 -> Capped at 100
      expect(calculateContributionScore(tasks, achievements)).toBe(100);
    });
  });

  describe("matchesEmployee and matchesDepartment", () => {
    const sampleEmp: Employee = {
      id: "rec123",
      name: "John Doe",
      email: "john@example.com",
      department: "Engineering",
      departmentId: "dept-eng",
      team: "Backend",
      position: "Senior Engineer",
      overallScore: 88,
      totalKPIs: 3,
      completedKPIs: 2,
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-01",
    };

    const sampleDept: Department = {
      id: "dept-eng",
      departmentName: "Engineering",
      description: "Dev team",
      averageScore: 85,
      employeeCount: 10,
      totalKPIs: 20,
      completedKPIs: 15,
      headOfDepartment: "Jane Lead",
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-01",
    };

    it("should match employee by ID or Name case-insensitively", () => {
      expect(matchesEmployee("rec123", sampleEmp)).toBe(true);
      expect(matchesEmployee("REC123", sampleEmp)).toBe(true);
      expect(matchesEmployee("John Doe", sampleEmp)).toBe(true);
      expect(matchesEmployee("john doe", sampleEmp)).toBe(true);
      expect(matchesEmployee("Jane Doe", sampleEmp)).toBe(false);
      expect(matchesEmployee(undefined, sampleEmp)).toBe(false);
    });

    it("should match department by ID or Name case-insensitively", () => {
      expect(matchesDepartment("dept-eng", sampleDept)).toBe(true);
      expect(matchesDepartment("DEPT-ENG", sampleDept)).toBe(true);
      expect(matchesDepartment("Engineering", sampleDept)).toBe(true);
      expect(matchesDepartment("engineering", sampleDept)).toBe(true);
      expect(matchesDepartment("Marketing", sampleDept)).toBe(false);
      expect(matchesDepartment("", sampleDept)).toBe(false);
    });
  });

  describe("calculateEmployeeScorecard", () => {
    const employee: Employee = {
      id: "emp-1",
      name: "Alex Smith",
      email: "alex@example.com",
      department: "Engineering",
      departmentId: "dept-eng",
      team: "Core",
      position: "Lead Architect",
      overallScore: 80,
      totalKPIs: 0,
      completedKPIs: 0,
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-01",
    };

    it("should compute overall score using 70% KPI + 20% Execution + 10% Contribution", () => {
      const kpis: KPI[] = [
        {
          id: "k1",
          kpiName: "Code Quality",
          description: "",
          departmentId: "dept-eng",
          employeeId: "emp-1",
          targetValue: 100,
          actualValue: 90,
          status: "completed",
          score: 90,
          dueDate: "2025-01-01",
          lastUpdated: "2024-01-01",
          createdAt: "2024-01-01",
        },
      ];

      const tasks: Task[] = [
        {
          id: "t1",
          taskName: "Build feature",
          description: "",
          status: "completed",
          priority: "high",
          assignedTo: "Alex Smith",
          assignedToId: "emp-1",
          dueDate: "2025-01-01",
          completedAt: "2024-12-01",
          createdAt: "2024-01-01",
          lastUpdated: "2024-01-01",
        },
      ];

      const scorecard = calculateEmployeeScorecard(employee, kpis, tasks, []);
      expect(scorecard.kpiScore).toBe(90);
      expect(scorecard.executionScore).toBe(100);
      expect(scorecard.contributionScore).toBe(100);
      // Overall = 0.7*90 + 0.2*100 + 0.1*100 = 63 + 20 + 10 = 93
      expect(scorecard.overallScore).toBe(93);
      expect(scorecard.performanceBadge.label).toBe("On Track");
    });
  });

  describe("calculateDepartmentScorecard", () => {
    const department: Department = {
      id: "dept-1",
      departmentName: "Sales",
      description: "Revenue Team",
      averageScore: 75,
      employeeCount: 1,
      totalKPIs: 1,
      completedKPIs: 1,
      headOfDepartment: "Bob Lead",
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-01",
    };

    const employees: Employee[] = [
      {
        id: "emp-s1",
        name: "Sam Sales",
        email: "sam@sales.com",
        department: "Sales",
        departmentId: "dept-1",
        team: "Direct",
        position: "Rep",
        overallScore: 90,
        totalKPIs: 1,
        completedKPIs: 1,
        createdAt: "2024-01-01",
        lastUpdated: "2024-01-01",
      },
    ];

    const kpis: KPI[] = [
      {
        id: "k-s1",
        kpiName: "Sales Target",
        description: "",
        departmentId: "dept-1",
        employeeId: "emp-s1",
        targetValue: 100,
        actualValue: 90,
        status: "completed",
        score: 90,
        dueDate: "2025-01-01",
        lastUpdated: "2024-01-01",
        createdAt: "2024-01-01",
      },
    ];

    it("should calculate department scorecard using 70/20/10 model", () => {
      const deptScorecard = calculateDepartmentScorecard(department, employees, kpis, [], []);
      expect(deptScorecard.employeeCount).toBe(1);
      expect(deptScorecard.activeKPIs).toBe(1);
      expect(deptScorecard.completedKPIs).toBe(1);
      expect(deptScorecard.kpiCompletionRate).toBe(100);
      expect(deptScorecard.kpiScore).toBe(90);
      expect(deptScorecard.score).toBe(93); // 0.7*90 + 0.2*100 + 0.1*100 = 93
      expect(deptScorecard.trend).toBe("up");
    });
  });

  describe("calculateExecutiveOverviewMetrics", () => {
    it("should aggregate all organizational metrics correctly with 70/20/10 model", () => {
      const kpis: KPI[] = [
        {
          id: "k1",
          kpiName: "KPI 1",
          description: "",
          departmentId: "d1",
          employeeId: "e1",
          targetValue: 100,
          actualValue: 80,
          status: "in-progress",
          score: 80,
          dueDate: "2025-01-01",
          lastUpdated: "2024-01-01",
          createdAt: "2024-01-01",
        },
        {
          id: "k2",
          kpiName: "KPI 2",
          description: "",
          departmentId: "d1",
          employeeId: "e2",
          targetValue: 200,
          actualValue: 200,
          status: "completed",
          score: 100,
          dueDate: "2025-01-01",
          lastUpdated: "2024-01-01",
          createdAt: "2024-01-01",
        },
      ];

      const result = calculateExecutiveOverviewMetrics(kpis, [], [], [], []);
      expect(result.totalKPIs).toBe(2);
      expect(result.completedKPIs).toBe(1);
      expect(result.inProgressKPIs).toBe(1);
      expect(result.kpiPerformanceIndex).toBe(90); // (80 + 100) / 2
      expect(result.overallScore).toBe(93); // 0.7*90 + 0.2*100 + 0.1*100 = 93
      expect(result.totalTarget).toBe(300);
      expect(result.totalActual).toBe(280);
      expect(result.targetVsActualRatio).toBe(93); // Math.round(280/300 * 100)
    });
  });

  describe("calculateHistoricalTrend", () => {
    it("should return hasSufficientData: false when fewer than 2 months are present", () => {
      const singleMonthKPIs: KPI[] = [
        {
          id: "k1",
          kpiName: "KPI 1",
          description: "",
          departmentId: "d1",
          employeeId: "e1",
          targetValue: 100,
          actualValue: 80,
          status: "in-progress",
          score: 80,
          dueDate: "2025-01-01",
          lastUpdated: "2024-05-15T00:00:00Z",
          createdAt: "2024-05-15T00:00:00Z",
        },
      ];
      const trend = calculateHistoricalTrend(singleMonthKPIs);
      expect(trend.hasSufficientData).toBe(false);
    });

    it("should return genuine chronological progression when multiple months exist", () => {
      const multiMonthKPIs: KPI[] = [
        {
          id: "k1",
          kpiName: "KPI 1",
          description: "",
          departmentId: "d1",
          employeeId: "e1",
          targetValue: 100,
          actualValue: 80,
          status: "in-progress",
          score: 80,
          dueDate: "2025-01-01",
          lastUpdated: "2024-03-10T00:00:00Z",
          createdAt: "2024-03-10T00:00:00Z",
        },
        {
          id: "k2",
          kpiName: "KPI 2",
          description: "",
          departmentId: "d1",
          employeeId: "e1",
          targetValue: 100,
          actualValue: 90,
          status: "completed",
          score: 90,
          dueDate: "2025-01-01",
          lastUpdated: "2024-04-12T00:00:00Z",
          createdAt: "2024-04-12T00:00:00Z",
        },
      ];
      const trend = calculateHistoricalTrend(multiMonthKPIs);
      expect(trend.hasSufficientData).toBe(true);
      expect(trend.data).toEqual([
        { month: "Mar", progress: 80 },
        { month: "Apr", progress: 90 },
      ]);
    });
  });
});
