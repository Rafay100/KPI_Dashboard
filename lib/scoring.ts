import type { KPI, Employee, Department, Task, Achievement } from "@/types/models";
import { calculateKPIScore, type KPIScoreInput, type KPIScoreRule } from "./kpis/calculateKPIScore";
import { calculateKPIStatus, type KPIStatus, type KPIStatusInput } from "./kpis/calculateKPIStatus";
import { isOverdue } from "./kpis/isOverdue";

// Re-export KPI calculation primitives
export { calculateKPIScore, calculateKPIStatus, isOverdue };
export type { KPIScoreInput, KPIScoreRule, KPIStatus, KPIStatusInput };

/**
 * EXACT EXCEL WORKBOOK SCORING MODEL PARAMETERS (03_SETUP & 04_ENGINE)
 */
export const SCORING_MODEL = {
  // Company Weights (03_SETUP!$B$13:$B$15)
  KPI_WEIGHT: 0.7, // 70% KPI Performance
  EXECUTION_WEIGHT: 0.2, // 20% Execution
  CONTRIBUTION_WEIGHT: 0.1, // 10% Contribution

  // Execution Weights (03_SETUP!$C$131:$C$132)
  EXEC_COMPLETION_WEIGHT: 0.6, // 60% Task Completion Rate
  EXEC_ONTIME_WEIGHT: 0.4, // 40% On-Time Delivery Rate

  // Contribution Bonus Parameters (03_SETUP!$C$133:$C$134)
  BONUS_DIV: 10, // Achievement points per bonus point
  BONUS_CAP: 15, // Maximum achievement bonus points

  // Status Thresholds (03_SETUP!$C$135:$C$137)
  STATUS_OVERACHIEVED_THRESHOLD: 100,
  STATUS_ON_TRACK_THRESHOLD: 85,
  STATUS_AT_RISK_THRESHOLD: 70,

  // Trend Thresholds (03_SETUP!$C$138:$C$139)
  TREND_STRONG_THRESHOLD: 5, // > 5% Strong Change
  TREND_MODERATE_THRESHOLD: 1, // > 1% Moderate Change
} as const;

/**
 * Task Execution Metrics
 */
export interface TaskExecutionMetrics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  blocked: number;
  overdue: number;
  onTime: number;
  completionRate: number; // 0 - 100
  onTimeRate: number; // 0 - 100
  executionScore: number; // 60% completion + 40% on-time
}

/**
 * Achievement Points & Badging Metrics
 */
export interface AchievementMetrics {
  totalCount: number;
  totalPoints: number;
  bonusPoints: number;
  badge: {
    label: string;
    color: string;
  };
  impactLevel: "High" | "Medium" | "Low";
}

/**
 * Performance Badge and Trend
 */
export interface PerformanceBadge {
  label: string;
  color: string;
}

export interface PerformanceTrend {
  type: "up" | "down" | "stable";
  label: string;
  color: string;
}

/**
 * Standardized Employee Scorecard
 */
export interface EmployeeScorecard {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  team: string;
  position: string;
  kpiCount: number;
  completedKpiCount: number;
  kpiScore: number;
  weightedKpiScore: number;
  executionScore: number;
  contributionScore: number;
  valueScore: number;
  overallScore: number;
  taskCount: number;
  completedTasks: number;
  taskCompletionRate: number;
  onTimeTasks: number;
  onTimeRate: number;
  achievementPoints: number;
  achievementBadge: { label: string; color: string };
  impactLevel: "High" | "Medium" | "Low";
  performanceBadge: PerformanceBadge;
  trend: PerformanceTrend;
}

/**
 * Standardized Department Scorecard
 */
export interface DepartmentScorecard {
  id: string;
  name: string;
  description: string;
  head: string;
  employeeCount: number;
  activeKPIs: number;
  completedKPIs: number;
  kpiCompletionRate: number;
  kpiScore: number;
  executionScore: number;
  contributionScore: number;
  score: number; // Overall score (70% KPI + 20% Exec + 10% Contrib)
  taskCount: number;
  completedTasks: number;
  taskRate: number;
  achievementPoints: number;
  trend: "up" | "down" | "stable";
}

/**
 * Standardized Executive Overview Metrics
 */
export interface ExecutiveOverviewMetrics {
  totalKPIs: number;
  completedKPIs: number;
  inProgressKPIs: number;
  atRiskKPIs: number;
  avgScore: number; // Overall Score (70% KPI + 20% Exec + 10% Contrib)
  kpiPerformanceIndex: number;
  executionIndex: number;
  contributionIndex: number;
  overallScore: number;
  totalTarget: number;
  totalActual: number;
  targetVsActualRatio: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalAchievementPoints: number;
  totalEmployees: number;
  totalDepartments: number;
}

/**
 * 1. KPI Achievement Percentage (Target vs Actual)
 */
export function calculateKPIAchievementPercentage(actualValue: number, targetValue: number): number {
  if (!Number.isFinite(actualValue) || !Number.isFinite(targetValue)) {
    return 0;
  }
  const actual = actualValue;
  const target = targetValue;

  if (target <= 0) {
    return actual > 0 ? 100 : 0;
  }
  if (actual <= 0) {
    return 0;
  }

  return Math.round((actual / target) * 100);
}

/**
 * 2. Overall Score Calculation (Exact Excel Engine Formula)
 * Overall = 70% KPI + 20% Execution + 10% Contribution
 */
export function calculateOverallScore(
  kpiScore: number,
  executionScore: number,
  contributionScore: number
): number {
  const kpi = Number.isFinite(kpiScore) ? kpiScore : 0;
  const exec = Number.isFinite(executionScore) ? executionScore : 0;
  const contrib = Number.isFinite(contributionScore) ? contributionScore : 0;

  const raw =
    SCORING_MODEL.KPI_WEIGHT * kpi +
    SCORING_MODEL.EXECUTION_WEIGHT * exec +
    SCORING_MODEL.CONTRIBUTION_WEIGHT * contrib;

  return Math.round(raw * 10) / 10;
}

/**
 * 3. Task Execution Metrics & Score (Exact Excel Engine Formula: 60% Completion + 40% On-Time)
 */
export function calculateTaskExecutionMetrics(tasks: Task[] = []): TaskExecutionMetrics {
  const total = tasks.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      blocked: 0,
      overdue: 0,
      onTime: 0,
      completionRate: 100,
      onTimeRate: 100,
      executionScore: 100,
    };
  }

  const now = new Date();
  let completed = 0;
  let inProgress = 0;
  let todo = 0;
  let blocked = 0;
  let overdue = 0;
  let onTime = 0;

  for (const task of tasks) {
    const status = task.status?.toLowerCase();
    const isCompleted = status === "completed";

    if (isCompleted) {
      completed++;
      // Check if task was completed on or before due date
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const completedDate = task.completedAt
          ? new Date(task.completedAt)
          : task.lastUpdated
          ? new Date(task.lastUpdated)
          : null;

        if (!completedDate || isNaN(completedDate.getTime()) || completedDate <= dueDate) {
          onTime++;
        }
      } else {
        onTime++;
      }
    } else if (status === "in-progress") {
      inProgress++;
    } else if (status === "blocked") {
      blocked++;
    } else {
      todo++;
    }

    if (!isCompleted && task.dueDate) {
      const due = new Date(task.dueDate);
      if (due < now) {
        overdue++;
      }
    }
  }

  const completionRate = (completed / total) * 100;
  const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 0;
  const executionScore =
    SCORING_MODEL.EXEC_COMPLETION_WEIGHT * completionRate +
    SCORING_MODEL.EXEC_ONTIME_WEIGHT * onTimeRate;

  return {
    total,
    completed,
    inProgress,
    todo,
    blocked,
    overdue,
    onTime,
    completionRate: Math.round(completionRate),
    onTimeRate: Math.round(onTimeRate),
    executionScore: Math.round(executionScore * 10) / 10,
  };
}

/**
 * 4. Contribution Score (Exact Excel Engine Formula: Priority Tasks + Achievement Bonus)
 */
export function calculateContributionScore(
  tasks: Task[] = [],
  achievements: Achievement[] = []
): number {
  const totalTasks = tasks.length;
  const priorityTasks = tasks.filter((t) => {
    const p = t.priority?.toLowerCase();
    return p === "urgent" || p === "critical" || p === "high";
  });

  let priorityCompletionRate = 100;
  if (priorityTasks.length > 0) {
    const completedPriority = priorityTasks.filter((t) => t.status?.toLowerCase() === "completed").length;
    priorityCompletionRate = (completedPriority / priorityTasks.length) * 100;
  } else if (totalTasks > 0) {
    const completedAll = tasks.filter((t) => t.status?.toLowerCase() === "completed").length;
    priorityCompletionRate = (completedAll / totalTasks) * 100;
  }

  const totalPoints = achievements.reduce(
    (sum, a) => sum + (Number.isFinite(a.points) ? a.points : 0),
    0
  );
  const bonus = Math.min(SCORING_MODEL.BONUS_CAP, totalPoints / SCORING_MODEL.BONUS_DIV);

  return Math.round(Math.min(100, priorityCompletionRate + bonus) * 10) / 10;
}

/**
 * 5. Achievement Metrics (Total Points, Honors Badge, Impact Level)
 */
export function calculateAchievementMetrics(achievements: Achievement[] = []): AchievementMetrics {
  const totalCount = achievements.length;
  const totalPoints = achievements.reduce((sum, a) => sum + (Number.isFinite(a.points) ? a.points : 0), 0);
  const bonusPoints = Math.min(SCORING_MODEL.BONUS_CAP, totalPoints / SCORING_MODEL.BONUS_DIV);

  let badgeLabel = "None";
  let badgeColor = "text-gray-500 border-white/5 bg-white/5";

  if (totalPoints >= 150) {
    badgeLabel = "Gold";
    badgeColor = "text-yellow-400 border-yellow-500/20 bg-yellow-500/10 font-bold";
  } else if (totalPoints >= 100) {
    badgeLabel = "Silver";
    badgeColor = "text-gray-300 border-gray-400/20 bg-gray-400/10 font-bold";
  } else if (totalPoints >= 50) {
    badgeLabel = "Bronze";
    badgeColor = "text-amber-600 border-amber-700/20 bg-amber-700/10 font-bold";
  } else if (totalPoints > 0) {
    badgeLabel = "Rookie";
    badgeColor = "text-blue-400 border-blue-500/20 bg-blue-500/10";
  }

  let impactLevel: "High" | "Medium" | "Low" = "Low";
  if (totalPoints >= 100) {
    impactLevel = "High";
  } else if (totalPoints >= 50) {
    impactLevel = "Medium";
  }

  return {
    totalCount,
    totalPoints,
    bonusPoints: Math.round(bonusPoints * 10) / 10,
    badge: { label: badgeLabel, color: badgeColor },
    impactLevel,
  };
}

/**
 * 6. Performance Badge by Score
 */
export function calculatePerformanceBadge(score: number): PerformanceBadge {
  if (score >= SCORING_MODEL.STATUS_OVERACHIEVED_THRESHOLD) {
    return {
      label: "Overachiever",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 font-extrabold",
    };
  }
  if (score >= SCORING_MODEL.STATUS_ON_TRACK_THRESHOLD) {
    return {
      label: "On Track",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10 font-bold",
    };
  }
  if (score >= SCORING_MODEL.STATUS_AT_RISK_THRESHOLD) {
    return {
      label: "At Risk",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/10 font-medium",
    };
  }
  return {
    label: "Critical",
    color: "text-red-400 border-red-500/20 bg-red-500/10",
  };
}

/**
 * 7. Performance Trend
 */
export function calculatePerformanceTrend(score: number, prevScore?: number): PerformanceTrend {
  if (prevScore !== undefined && Number.isFinite(prevScore) && prevScore > 0) {
    const changePct = ((score - prevScore) / prevScore) * 100;
    if (changePct > SCORING_MODEL.TREND_STRONG_THRESHOLD) {
      return { type: "up", label: "Strong Improvement", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
    if (changePct > SCORING_MODEL.TREND_MODERATE_THRESHOLD) {
      return { type: "up", label: "Improving", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
    if (changePct < -SCORING_MODEL.TREND_STRONG_THRESHOLD) {
      return { type: "down", label: "Strong Decline", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    }
    if (changePct < -SCORING_MODEL.TREND_MODERATE_THRESHOLD) {
      return { type: "down", label: "Declining", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    }
    return { type: "stable", label: "Stable", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  }

  if (score >= SCORING_MODEL.STATUS_ON_TRACK_THRESHOLD) {
    return { type: "up", label: "On Track", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (score < SCORING_MODEL.STATUS_AT_RISK_THRESHOLD) {
    return { type: "down", label: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  }
  return { type: "stable", label: "Stable", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
}

/**
 * Helper to check if a record matches an employee identifier (ID or Name)
 */
export function matchesEmployee(
  referenceIdOrName: string | undefined | null,
  employee: Employee
): boolean {
  if (!referenceIdOrName || !employee) return false;
  const ref = referenceIdOrName.trim().toLowerCase();
  const empId = employee.id?.trim().toLowerCase();
  const empName = employee.name?.trim().toLowerCase();
  if (ref === empId || ref === empName) return true;

  // Match numeric suffix (e.g. "12" or "0012" vs "emp_0012" or "emp_12")
  const refNum = ref.replace(/^emp[_-]?0*/i, "");
  const empIdNum = empId?.replace(/^emp[_-]?0*/i, "");
  if (refNum && empIdNum && refNum === empIdNum) return true;

  return false;
}

/**
 * Helper to check if a record matches a department identifier (ID or Name)
 */
export function matchesDepartment(
  referenceIdOrName: string | undefined | null,
  department: Department
): boolean {
  if (!referenceIdOrName || !department) return false;
  const ref = referenceIdOrName.trim().toLowerCase();
  const deptId = department.id?.trim().toLowerCase();
  const deptName = department.departmentName?.trim().toLowerCase();
  if (ref === deptId || ref === deptName) return true;

  // Match numeric suffix (e.g. "1" or "01" vs "dept_01" or "dept_1")
  const refNum = ref.replace(/^dept[_-]?0*/i, "");
  const deptIdNum = deptId?.replace(/^dept[_-]?0*/i, "");
  if (refNum && deptIdNum && refNum === deptIdNum) return true;

  // Match clean 1-to-1 canonical department aliases
  const deptAliases: Record<string, string[]> = {
    sales: ["dept_01", "dept_1", "1", "sal", "sales"],
    marketing: ["dept_02", "dept_2", "2", "mar", "marketing"],
    operations: ["dept_03", "dept_3", "3", "ope", "operations"],
    hr: ["dept_04", "dept_4", "4", "hr", "human resources"],
    finance: ["dept_05", "dept_5", "5", "fin", "finance"],
    product: ["dept_06", "dept_6", "6", "pro", "product"],
    engineering: ["dept_07", "dept_7", "7", "eng", "engineering"],
    "customer support": ["dept_08", "dept_8", "8", "cus", "customer support", "support"],
  };

  for (const [key, aliases] of Object.entries(deptAliases)) {
    const matchesTarget = deptName === key || aliases.includes(deptId || "") || aliases.includes(deptName || "");
    if (matchesTarget) {
      if (aliases.includes(ref) || ref === key) return true;
    }
  }

  return false;
}

/**
 * 8. Standardized Employee Scorecard Calculation (Exact Excel Engine)
 */
export function calculateEmployeeScorecard(
  employee: Employee,
  kpis: KPI[] = [],
  tasks: Task[] = [],
  achievements: Achievement[] = []
): EmployeeScorecard {
  const empKPIs = kpis.filter(
    (k) => matchesEmployee(k.employeeId, employee)
  );
  const empTasks = tasks.filter((t) => matchesEmployee(t.assignedToId || t.assignedTo, employee));
  const empAchievements = achievements.filter((a) =>
    matchesEmployee(a.employeeId || a.employeeName, employee)
  );

  const kpiCount = empKPIs.length;
  const completedKpiCount = empKPIs.filter((k) => k.status === "completed").length;

  // KPI Score: average of assigned KPI scores, fallback to employee.overallScore
  const kpiScore =
    kpiCount > 0
      ? Math.round(
          (empKPIs.reduce((sum, k) => sum + (Number.isFinite(k.score) ? k.score : 0), 0) / kpiCount) * 10
        ) / 10
      : Math.round((employee.overallScore || 0) * 10) / 10;

  // Task execution metrics (60% completion + 40% on-time)
  const taskMetrics = calculateTaskExecutionMetrics(empTasks);
  const executionScore = taskMetrics.executionScore;

  // Contribution score (priority completion + achievement bonus)
  const contributionScore = calculateContributionScore(empTasks, empAchievements);

  // Overall Score = 70% KPI + 20% Execution + 10% Contribution
  const overallScore = calculateOverallScore(kpiScore, executionScore, contributionScore);

  const achievementMetrics = calculateAchievementMetrics(empAchievements);
  const performanceBadge = calculatePerformanceBadge(overallScore);
  const trend = calculatePerformanceTrend(overallScore);

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department || "General",
    departmentId: employee.departmentId || "",
    team: employee.team || "",
    position: employee.position || "Team Member",
    kpiCount,
    completedKpiCount,
    kpiScore,
    weightedKpiScore: kpiScore,
    executionScore,
    contributionScore,
    valueScore: contributionScore,
    overallScore,
    taskCount: taskMetrics.total,
    completedTasks: taskMetrics.completed,
    taskCompletionRate: taskMetrics.completionRate,
    onTimeTasks: taskMetrics.onTime,
    onTimeRate: taskMetrics.onTimeRate,
    achievementPoints: achievementMetrics.totalPoints,
    achievementBadge: achievementMetrics.badge,
    impactLevel: achievementMetrics.impactLevel,
    performanceBadge,
    trend,
  };
}

/**
 * 9. Standardized Department Scorecard Calculation (Exact Excel Engine)
 */
export function calculateDepartmentScorecard(
  department: Department,
  employees: Employee[] = [],
  kpis: KPI[] = [],
  tasks: Task[] = [],
  achievements: Achievement[] = []
): DepartmentScorecard {
  const deptEmployees = employees.filter(
    (e) =>
      matchesDepartment(e.departmentId, department) ||
      matchesDepartment(e.department, department)
  );

  const deptKPIs = kpis.filter((k) => matchesDepartment(k.departmentId, department));

  const deptTasks = tasks.filter((t) =>
    deptEmployees.some((e) => matchesEmployee(t.assignedToId || t.assignedTo, e))
  );

  const deptAchievements = achievements.filter((a) =>
    deptEmployees.some((e) => matchesEmployee(a.employeeId || a.employeeName, e))
  );

  const activeKPIs = deptKPIs.length;
  const completedKPIs = deptKPIs.filter((k) => k.status === "completed").length;
  const kpiCompletionRate = activeKPIs > 0 ? Math.round((completedKPIs / activeKPIs) * 100) : 100;

  const kpiScore =
    activeKPIs > 0
      ? Math.round(
          (deptKPIs.reduce((sum, k) => sum + (Number.isFinite(k.score) ? k.score : 0), 0) / activeKPIs) * 10
        ) / 10
      : Math.round((department.averageScore || 0) * 10) / 10;

  const taskMetrics = calculateTaskExecutionMetrics(deptTasks);
  const executionScore = taskMetrics.executionScore;
  const contributionScore = calculateContributionScore(deptTasks, deptAchievements);

  // Overall Department Score = 70% KPI + 20% Execution + 10% Contribution
  const score = calculateOverallScore(kpiScore, executionScore, contributionScore);

  const achievementMetrics = calculateAchievementMetrics(deptAchievements);
  const trend: "up" | "down" | "stable" =
    score >= SCORING_MODEL.STATUS_ON_TRACK_THRESHOLD
      ? "up"
      : score >= SCORING_MODEL.STATUS_AT_RISK_THRESHOLD
      ? "stable"
      : "down";

  return {
    id: department.id,
    name: department.departmentName,
    description: department.description || "Operational Business Unit",
    head: department.headOfDepartment || "Executive Lead",
    employeeCount: deptEmployees.length,
    activeKPIs,
    completedKPIs,
    kpiCompletionRate,
    kpiScore,
    executionScore,
    contributionScore,
    score,
    taskCount: taskMetrics.total,
    completedTasks: taskMetrics.completed,
    taskRate: taskMetrics.completionRate,
    achievementPoints: achievementMetrics.totalPoints,
    trend,
  };
}

/**
 * 10. Standardized Executive Overview Metrics (Exact Excel Engine)
 */
export function calculateExecutiveOverviewMetrics(
  kpis: KPI[] = [],
  employees: Employee[] = [],
  departments: Department[] = [],
  tasks: Task[] = [],
  achievements: Achievement[] = []
): ExecutiveOverviewMetrics {
  const totalKPIs = kpis.length;
  const completedKPIs = kpis.filter((k) => k.status === "completed").length;
  const inProgressKPIs = kpis.filter((k) => k.status === "in-progress").length;
  const atRiskKPIs = kpis.filter((k) => k.status === "at-risk" || k.status === "overdue").length;

  const kpiPerformanceIndex =
    totalKPIs > 0
      ? Math.round(
          (kpis.reduce((sum, k) => sum + (Number.isFinite(k.score) ? k.score : 0), 0) / totalKPIs) * 10
        ) / 10
      : 0;

  const taskMetrics = calculateTaskExecutionMetrics(tasks);
  const executionIndex = taskMetrics.executionScore;

  // Contribution Index: average contribution score across employees
  const employeeCards = employees.map((emp) =>
    calculateEmployeeScorecard(emp, kpis, tasks, achievements)
  );
  const contributionIndex =
    employeeCards.length > 0
      ? Math.round(
          (employeeCards.reduce((sum, card) => sum + card.contributionScore, 0) / employeeCards.length) * 10
        ) / 10
      : calculateContributionScore(tasks, achievements);

  // Overall Score = 70% KPI + 20% Execution + 10% Contribution
  const overallScore = calculateOverallScore(kpiPerformanceIndex, executionIndex, contributionIndex);

  const totalTarget = kpis.reduce((sum, k) => sum + (Number.isFinite(k.targetValue) ? k.targetValue : 0), 0);
  const totalActual = kpis.reduce((sum, k) => sum + (Number.isFinite(k.actualValue) ? k.actualValue : 0), 0);
  const targetVsActualRatio = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : kpiPerformanceIndex;

  const achievementMetrics = calculateAchievementMetrics(achievements);

  return {
    totalKPIs,
    completedKPIs,
    inProgressKPIs,
    atRiskKPIs,
    avgScore: overallScore,
    kpiPerformanceIndex,
    executionIndex,
    contributionIndex,
    overallScore,
    totalTarget,
    totalActual,
    targetVsActualRatio,
    totalTasks: taskMetrics.total,
    completedTasks: taskMetrics.completed,
    taskCompletionRate: taskMetrics.completionRate,
    totalAchievementPoints: achievementMetrics.totalPoints,
    totalEmployees: employees.length,
    totalDepartments: departments.length,
  };
}

/**
 * 11. Real Historical Trend Calculator
 */
export function calculateHistoricalTrend(
  kpis: KPI[] = []
): { data: Array<{ month: string; progress: number }>; hasSufficientData: boolean } {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyBuckets: { [key: string]: { totalScore: number; count: number; order: number } } = {};

  for (const kpi of kpis) {
    const rawDate = kpi.lastUpdated || kpi.createdAt;
    if (!rawDate) continue;

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) continue;

    const monthKey = monthNames[date.getMonth()];
    const order = date.getFullYear() * 12 + date.getMonth();

    if (!monthlyBuckets[monthKey]) {
      monthlyBuckets[monthKey] = { totalScore: 0, count: 0, order };
    }

    monthlyBuckets[monthKey].totalScore += Number.isFinite(kpi.score) ? kpi.score : 0;
    monthlyBuckets[monthKey].count += 1;
  }

  const entries = Object.entries(monthlyBuckets)
    .map(([month, val]) => ({
      month,
      progress: Math.round(val.totalScore / val.count),
      order: val.order,
    }))
    .sort((a, b) => a.order - b.order);

  const hasSufficientData = entries.length >= 2;

  return {
    data: entries.map(({ month, progress }) => ({ month, progress })),
    hasSufficientData,
  };
}
