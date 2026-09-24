"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/useData";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { KPIProgressChart } from "@/components/charts/KPIProgressChart";
import { TaskStatusChart } from "@/components/charts/TaskStatusChart";
import { Button } from "@/components/ui/Button";
import { 
  Trophy, 
  Users, 
  Target, 
  CheckSquare, 
  Building2, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Award,
  Zap,
  Flame,
  ArrowUpRight
} from "lucide-react";

import { 
  calculateExecutiveOverviewMetrics, 
  calculateDepartmentScorecard, 
  calculateEmployeeScorecard, 
  calculateHistoricalTrend,
  calculateTaskExecutionMetrics,
  matchesDepartment,
  matchesEmployee
} from "@/lib/scoring";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";

export default function ExecutiveOverview() {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { filters } = useGlobalFilters();

  const rawKpis = useMemo(() => data?.kpis || [], [data]);
  const rawEmployees = useMemo(() => data?.employees || [], [data]);
  const rawDepartments = useMemo(() => data?.departments || [], [data]);
  const rawTasks = useMemo(() => data?.tasks || [], [data]);
  const rawAchievements = useMemo(() => data?.achievements || [], [data]);

  // Apply Global Filters if set
  const filteredData = useMemo(() => {
    let k = [...rawKpis];
    let e = [...rawEmployees];
    let d = [...rawDepartments];
    let t = [...rawTasks];
    let a = [...rawAchievements];

    // Department Filter
    if (filters.department) {
      const targetDept = filters.department.toLowerCase();
      d = d.filter((dept) => dept.departmentName?.toLowerCase() === targetDept || dept.id?.toLowerCase() === targetDept);
      e = e.filter((emp) => emp.department?.toLowerCase() === targetDept || emp.departmentId?.toLowerCase() === targetDept);
      k = k.filter((kpi) => kpi.departmentId?.toLowerCase() === targetDept);
      t = t.filter((task) => e.some((emp) => matchesEmployee(task.assignedToId || task.assignedTo, emp)));
      a = a.filter((ach) => e.some((emp) => matchesEmployee(ach.employeeId || ach.employeeName, emp)));
    }

    // Employee Filter
    if (filters.employee) {
      const targetEmp = filters.employee.toLowerCase();
      e = e.filter((emp) => emp.name.toLowerCase() === targetEmp || emp.id.toLowerCase() === targetEmp);
      k = k.filter((kpi) => e.some((emp) => matchesEmployee(kpi.employeeId, emp)));
      t = t.filter((task) => e.some((emp) => matchesEmployee(task.assignedToId || task.assignedTo, emp)));
      a = a.filter((ach) => e.some((emp) => matchesEmployee(ach.employeeId || ach.employeeName, emp)));
    }

    // KPI Status Filter
    if (filters.kpiStatus) {
      const targetStatus = filters.kpiStatus.toLowerCase();
      k = k.filter((kpi) => kpi.status?.toLowerCase() === targetStatus);
    }

    // Task Status Filter
    if (filters.taskStatus) {
      const targetTaskStatus = filters.taskStatus.toLowerCase();
      t = t.filter((task) => task.status?.toLowerCase() === targetTaskStatus);
    }

    // Date Range Filter
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate).getTime() : -Infinity;
      const end = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;

      k = k.filter((kpi) => {
        const dateStr = kpi.dueDate || kpi.createdAt;
        if (!dateStr) return true;
        const time = new Date(dateStr).getTime();
        return time >= start && time <= end;
      });

      t = t.filter((task) => {
        const dateStr = task.dueDate || task.createdAt;
        if (!dateStr) return true;
        const time = new Date(dateStr).getTime();
        return time >= start && time <= end;
      });
    }

    return { kpis: k, employees: e, departments: d, tasks: t, achievements: a };
  }, [rawKpis, rawEmployees, rawDepartments, rawTasks, rawAchievements, filters]);

  const { kpis, employees, departments, tasks, achievements } = filteredData;

  // Standardized Computed Executive Metrics from lib/scoring
  const metrics = useMemo(() => {
    return calculateExecutiveOverviewMetrics(kpis, employees, departments, tasks, achievements);
  }, [kpis, employees, departments, tasks, achievements]);

  // Department Performance Summary (standardized via calculateDepartmentScorecard)
  const departmentPerformance = useMemo(() => {
    return departments
      .map((dept) => calculateDepartmentScorecard(dept, employees, kpis, tasks, achievements))
      .sort((a, b) => b.score - a.score);
  }, [departments, employees, kpis, tasks, achievements]);

  // Top Performing Staff (standardized via calculateEmployeeScorecard)
  const topEmployees = useMemo(() => {
    return employees
      .map((emp) => calculateEmployeeScorecard(emp, kpis, tasks, achievements))
      .sort((a, b) => b.kpiScore - a.kpiScore)
      .slice(0, 4);
  }, [employees, kpis, tasks, achievements]);

  // Real historical score progression computed from record timestamps
  const historicalTrend = useMemo(() => {
    return calculateHistoricalTrend(kpis);
  }, [kpis]);

  // Task breakdown for pie chart via centralized metrics
  const taskStatusData = useMemo(() => {
    const taskMetrics = calculateTaskExecutionMetrics(tasks);
    
    if (taskMetrics.total === 0) {
      return [
        { name: "Completed", value: 1 },
        { name: "In Progress", value: 1 },
        { name: "Todo", value: 1 },
        { name: "Blocked", value: 0 },
      ];
    }
    return [
      { name: "Completed", value: taskMetrics.completed },
      { name: "In Progress", value: taskMetrics.inProgress },
      { name: "Todo", value: taskMetrics.todo },
      { name: "Blocked", value: taskMetrics.blocked },
    ];
  }, [tasks]);

  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-8 max-w-md border border-slate-800 bg-[#080d1a]/95 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto mb-3" />
              <h3 className="mb-2 text-lg font-bold text-white">Connection Error</h3>
              <p className="mb-6 text-xs text-slate-400">
                Unable to load real-time KPI data from the data source.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-2 px-5 py-2 mx-auto rounded-lg text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Connection</span>
              </Button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="Executive Dashboard"
            description="High-level organizational performance, KPI targets, department velocity, and action items."
          />
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link href="/create-kpi">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20"
              >
                + Create KPI
              </Button>
            </Link>
          </div>
        </div>

        {/* Priority KPI & Execution Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Overall KPI Score"
            value={`${metrics.avgScore}%`}
            icon={Target}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Target vs Actual"
            value={`${metrics.targetVsActualRatio}%`}
            icon={TrendingUp}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="Task Completion Rate"
            value={`${metrics.taskCompletionRate}%`}
            icon={CheckSquare}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title="Active Team Members"
            value={metrics.totalEmployees}
            icon={Users}
            color="orange"
            loading={isLoading}
          />
        </div>

        {/* Action Alerts & Health Distribution Banner */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">On Track / Completed</p>
                <p className="text-xl font-bold text-white">{metrics.completedKPIs + metrics.inProgressKPIs} KPIs</p>
              </div>
            </div>
            <Link href="/kpis" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Attention Required</p>
                <p className="text-xl font-bold text-white">{metrics.atRiskKPIs} Items</p>
              </div>
            </div>
            <Link href="/approvals" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              Review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Achievement Points</p>
                <p className="text-xl font-bold text-white">{metrics.totalAchievementPoints} pts</p>
              </div>
            </div>
            <Link href="/rankings" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              Rankings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Charts Layout */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
          {/* KPI Trend Chart */}
          <div className="glass-card p-5 lg:col-span-2 border border-slate-800/80 bg-[#080d1a]/90">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Performance Trajectory</h3>
                <p className="text-xs text-slate-400">Monthly average KPI scores against benchmarks</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+4.2% Growth</span>
              </div>
            </div>
            <div className="h-[280px]">
              {isLoading ? (
                <div className="h-full w-full bg-slate-800/30 animate-pulse rounded-lg" />
              ) : historicalTrend.hasSufficientData ? (
                <KPIProgressChart data={historicalTrend.data} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Awaiting Historical Baseline</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Monthly trajectory will chart automatically as periodic records and update timestamps accumulate. Current average KPI score: {metrics.avgScore}%.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="glass-card p-5 col-span-1 border border-slate-800/80 bg-[#080d1a]/90">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Work Execution Status</h3>
              <Link href="/tasks" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View Tasks
              </Link>
            </div>
            <div className="h-[280px]">
              {isLoading ? (
                <div className="h-full w-full bg-slate-800/30 animate-pulse rounded-lg" />
              ) : (
                <TaskStatusChart data={taskStatusData} />
              )}
            </div>
          </div>
        </div>

        {/* Department Breakdown & Top Talent Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          {/* Department Performance Overview */}
          <div className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/90">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Department Performance</h3>
              </div>
              <Link href="/departments" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                All Departments <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {departmentPerformance.slice(0, 5).map((dept) => (
                <div key={dept.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">{dept.name}</p>
                    <p className="text-[11px] text-slate-400">{dept.activeKPIs} Active KPIs</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-slate-800 rounded-full h-2 hidden sm:block">
                      <div
                        className={`h-2 rounded-full ${
                          dept.score >= 85 ? "bg-emerald-500" : dept.score >= 70 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, dept.score)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${
                      dept.score >= 85 ? "text-emerald-400" : dept.score >= 70 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {dept.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers Summary */}
          <div className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/90">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Top Performing Talent</h3>
              </div>
              <Link href="/employees" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                All Employees <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {topEmployees.map((emp, index) => (
                <div key={emp.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">{emp.name}</p>
                      <p className="text-[11px] text-slate-400">{emp.department} • {emp.kpiCount} KPIs</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {emp.overallScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Data Source Footnote */}
        <div className="flex items-center justify-between py-2 text-[11px] text-slate-500 border-t border-slate-800/60">
          <span>Connected data source: Google Sheets</span>
          <Link href="/data-sources" className="text-blue-400 hover:underline">
            Manage Integrations
          </Link>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
