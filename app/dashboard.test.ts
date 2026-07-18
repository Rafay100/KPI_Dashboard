import { describe, it, expect } from "vitest";

// Dummy structures representing dashboard models
interface KPI {
  id: string;
  targetValue: number;
  actualValue: number;
  status: "not-started" | "in-progress" | "at-risk" | "completed" | "overdue";
}

interface Employee {
  id: string;
  name: string;
  overallScore: number;
  completedKPIs: number;
}

// 1. KPI Status Calculation helper mock testing
function calculateKPIStatus(kpi: KPI): KPI["status"] {
  const percentage = (kpi.actualValue / kpi.targetValue) * 100;
  if (percentage >= 100) return "completed";
  if (percentage >= 80) return "in-progress";
  if (percentage >= 50) return "at-risk";
  return "not-started";
}

// 2. Employee ranking sorting logic
function rankEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => b.overallScore - a.overallScore);
}

// 3. CSV injection escaping helper
function escapeCSVCell(val: any): string {
  const str = String(val || "");
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    return `'${str}`;
  }
  return str;
}

describe("Dashboard KPI and Calculations Test Suite", () => {
  it("should calculate correct KPI statuses based on targets", () => {
    const kpiCompleted: KPI = { id: "1", targetValue: 100, actualValue: 105, status: "in-progress" };
    const kpiAtRisk: KPI = { id: "2", targetValue: 100, actualValue: 60, status: "in-progress" };
    const kpiNotStarted: KPI = { id: "3", targetValue: 100, actualValue: 20, status: "in-progress" };

    expect(calculateKPIStatus(kpiCompleted)).toBe("completed");
    expect(calculateKPIStatus(kpiAtRisk)).toBe("at-risk");
    expect(calculateKPIStatus(kpiNotStarted)).toBe("not-started");
  });

  it("should rank employees by overall score descending", () => {
    const list: Employee[] = [
      { id: "1", name: "Employee A", overallScore: 82, completedKPIs: 4 },
      { id: "2", name: "Employee B", overallScore: 95, completedKPIs: 6 },
      { id: "3", name: "Employee C", overallScore: 74, completedKPIs: 2 }
    ];

    const sorted = rankEmployees(list);
    expect(sorted[0].name).toBe("Employee B");
    expect(sorted[1].name).toBe("Employee A");
    expect(sorted[2].name).toBe("Employee C");
  });

  it("should protect against CSV formula injection", () => {
    const safeCell = "Regular Text";
    const dangerousFormula = "=SUM(A1:A5)";
    const dangerousOperator = "+49123456";

    expect(escapeCSVCell(safeCell)).toBe("Regular Text");
    expect(escapeCSVCell(dangerousFormula)).toBe("'=SUM(A1:A5)");
    expect(escapeCSVCell(dangerousOperator)).toBe("'+49123456");
  });
});
