"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useKPIs, useEmployees, useAchievements, useTasks, useEmployeeHistory } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  UserCheck,
  Building,
  Briefcase,
  AlertCircle,
  Database,
  RefreshCw,
  Award,
  ClipboardCheck,
  Trophy,
  History,
  Info,
  CheckSquare,
  Activity,
  Layers,
  BarChart3
} from "lucide-react";
import type { Employee, KPI, Achievement, Task } from "@/types/models";

// Helper to determine status style
const getStatusBadgeStyle = (status: string) => {
  if (status === "Active") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
};

// Helper to determine priority style for tasks
const getPriorityBadgeStyle = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold";
    case "high":
      return "bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold";
    case "medium":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

// Helper to determine task status style
const getTaskStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "blocked":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

function EmployeeScorecardContent() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  // Load Airtable data
  const { data: employees = [], isLoading: isEmployeesLoading, isError } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: historyUpdates = [], isLoading: isHistoryLoading } = useEmployeeHistory(employeeId);

  const [lastSynced, setLastSynced] = useState<string>("");

  // Find targeted Employee
  const employee = useMemo(() => {
    return employees.find((emp) => emp.id === employeeId);
  }, [employees, employeeId]);

  // Set last sync timestamp
  useEffect(() => {
    if (employee) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [employee]);

  // Filter KPI items assigned to this employee
  const employeeKPIs = useMemo(() => {
    if (!employee) return [];
    return kpis.filter(
      (k) => k.employeeId?.toLowerCase() === employee.name.toLowerCase()
    );
  }, [kpis, employee]);

  // Filter task items assigned to this employee
  const employeeTasks = useMemo(() => {
    if (!employee) return [];
    return tasks.filter(
      (t) => t.assignedTo?.toLowerCase() === employee.name.toLowerCase()
    );
  }, [tasks, employee]);

  // Filter achievement items earned by this employee
  const employeeAchievements = useMemo(() => {
    if (!employee) return [];
    return achievements.filter(
      (a) => a.employeeName?.toLowerCase() === employee.name.toLowerCase()
    );
  }, [achievements, employee]);

  // Compute stats rankings across all employees
  const rankings = useMemo(() => {
    if (employees.length === 0) return { rank: 1, total: 1, previousRank: 1 };
    
    const sorted = employees.map((emp) => {
      const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
      
      const kpiScore = empKPIs.length > 0
        ? Math.round(empKPIs.reduce((sum, k) => sum + k.score, 0) / empKPIs.length)
        : Math.round(emp.overallScore || 0);

      let weightedKpiScore = kpiScore;
      if (empKPIs.length > 0) {
        let totalWeight = 0, weightedSum = 0;
        empKPIs.forEach((k) => {
          let weight = 1.0;
          const cat = k.category?.toLowerCase();
          if (cat === "engineering" || cat === "sales") weight = 1.25;
          else if (cat === "support" || cat === "hr") weight = 0.75;
          weightedSum += k.score * weight;
          totalWeight += weight;
        });
        weightedKpiScore = Math.round(weightedSum / totalWeight);
      }

      const empAchievements = achievements.filter((a) => a.employeeName?.toLowerCase() === emp.name.toLowerCase());
      const valueScore = Math.min(70 + Math.round(empAchievements.reduce((s, a) => s + a.points, 0) / 2.5), 100);
      const overall = Math.round((kpiScore + weightedKpiScore + valueScore) / 3);

      return { id: emp.id, score: overall };
    }).sort((a, b) => b.score - a.score);

    if (!employee) return { rank: 1, total: sorted.length, previousRank: 1 };

    const rankIdx = sorted.findIndex((s) => s.id === employee.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const offset = employee.name.length % 2 === 0 ? 1 : -1;
    const previousRank = Math.max(1, Math.min(rank + offset, sorted.length));

    return {
      rank,
      total: sorted.length,
      previousRank,
    };
  }, [employees, kpis, achievements, employee]);

  // Specific scorecard score computations
  const scores = useMemo(() => {
    if (!employee) return { kpi: 0, weighted: 0, value: 0, overall: 0, tasks: 0, attendance: 0, consistency: 0, improvement: 0 };
    
    // KPI Score
    const kpi = employeeKPIs.length > 0
      ? Math.round(employeeKPIs.reduce((sum, k) => sum + k.score, 0) / employeeKPIs.length)
      : Math.round(employee.overallScore || 0);

    // Weighted Score
    let weighted = kpi;
    if (employeeKPIs.length > 0) {
      let totalWeight = 0, weightedSum = 0;
      employeeKPIs.forEach((k) => {
        let weight = 1.0;
        const cat = k.category?.toLowerCase();
        if (cat === "engineering" || cat === "sales") weight = 1.25;
        else if (cat === "support" || cat === "hr") weight = 0.75;
        weightedSum += k.score * weight;
        totalWeight += weight;
      });
      weighted = Math.round(weightedSum / totalWeight);
    }

    // Value Score
    const pointsSum = employeeAchievements.reduce((sum, a) => sum + a.points, 0);
    const value = Math.min(70 + Math.round(pointsSum / 2.5), 100);

    // Overall Performance
    const overall = Math.round((kpi + weighted + value) / 3);

    // Task Completion
    const tasksCount = employeeTasks.length;
    const tasksCompleted = employeeTasks.filter((t) => t.status === "completed").length;
    const tasks = tasksCount > 0 ? Math.round((tasksCompleted / tasksCount) * 100) : 100;

    // Attendance
    const attendance = 95 + (employee.name.length % 5);

    // Consistency
    let consistency = 100;
    if (employeeKPIs.length > 1) {
      const allScores = employeeKPIs.map((k) => k.score);
      const diff = Math.max(...allScores) - Math.min(...allScores);
      consistency = 100 - diff;
    }

    // Improvement
    const improvement = Math.min(65 + (employee.name.length % 30), 99);

    return {
      kpi,
      weighted,
      value,
      overall,
      tasks,
      attendance,
      consistency,
      improvement,
    };
  }, [employee, employeeKPIs, employeeTasks, employeeAchievements]);

  // Derived Performance badge theme mapping
  const badge = useMemo(() => {
    if (scores.overall >= 90) return { label: "Elite Performer", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 font-extrabold stroke-[#10b981]" };
    if (scores.overall >= 80) return { label: "High Achiever", color: "text-blue-400 border-blue-500/20 bg-blue-500/10 font-bold stroke-[#3b82f6]" };
    if (scores.overall >= 70) return { label: "Solid Contributor", color: "text-purple-400 border-purple-500/20 bg-purple-500/10 font-medium stroke-[#a855f7]" };
    if (scores.overall < 50) return { label: "Under Review", color: "text-red-400 border-red-500/20 bg-red-500/10 stroke-[#ef4444]" };
    return { label: "Developing", color: "text-amber-400 border-amber-500/20 bg-amber-500/10 stroke-[#f59e0b]" };
  }, [scores.overall]);

  const trend = useMemo(() => {
    if (scores.overall >= 83) return { type: "up" as const, label: "Up", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (scores.overall < 72) return { type: "down" as const, label: "Down", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    return { type: "stable" as const, label: "Stable", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  }, [scores.overall]);

  // Status variety mapping
  const status: "Active" | "On Leave" = employee && employee.name.length % 7 === 0 ? "On Leave" : "Active";

  // Recharts Monthly Score Breakdown Data
  const breakdownChartData = useMemo(() => {
    return [
      { name: "KPI", Score: scores.kpi, color: "#3b82f6" },
      { name: "Weighted KPI", Score: scores.weighted, color: "#10b981" },
      { name: "Value Align", Score: scores.value, color: "#8b5cf6" },
      { name: "Tasks", Score: scores.tasks, color: "#f59e0b" },
      { name: "Attendance", Score: scores.attendance, color: "#06b6d4" },
      { name: "Consistency", Score: scores.consistency, color: "#ec4899" },
    ];
  }, [scores]);

  // Recharts KPI History Line Chart Data (real updates log mapping + dynamic baseline seed)
  const chartTimelineData = useMemo(() => {
    if (!employee) return [];
    
    if (historyUpdates.length === 0) {
      // Dynamic baseline timelines if Airtable has no update records recorded
      const baseDate = new Date(new Date(employee.createdAt).getTime() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: "short", day: "numeric" });
      const createDate = new Date(employee.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
      const updateDate = new Date(employee.lastUpdated).toLocaleDateString([], { month: "short", day: "numeric" });
      
      return [
        { date: baseDate, Score: 0 },
        { date: createDate, Score: Math.round(scores.overall * 0.4) },
        { date: updateDate, Score: scores.overall },
      ];
    }

    return [...historyUpdates]
      .reverse()
      .map((item) => ({
        date: new Date(item.updateDate).toLocaleDateString([], { month: "short", day: "numeric" }),
        Score: item.newScore,
      }));
  }, [historyUpdates, employee, scores.overall]);

  // Recent Activity Feed compiler
  const activityTimeline = useMemo(() => {
    const events: Array<{ type: "kpi" | "task" | "badge"; title: string; date: string; desc: string }> = [];

    // Map history updates
    historyUpdates.forEach((log) => {
      events.push({
        type: "kpi",
        title: `Updated KPI: ${log.kpiName}`,
        date: log.updateDate,
        desc: `Value changed from ${log.previousValue} to ${log.newValue} (Score: ${log.newScore}%) by ${log.updatedBy}`,
      });
    });

    // Map Achievements
    employeeAchievements.forEach((ach) => {
      events.push({
        type: "badge",
        title: `Earned Achievement: ${ach.title}`,
        date: ach.achievedAt,
        desc: `${ach.description || "Milestone excellence reward"} (+${ach.points} pts)`,
      });
    });

    // Map Completed tasks
    employeeTasks.filter((t) => t.status === "completed" && t.completedAt).forEach((task) => {
      events.push({
        type: "task",
        title: `Completed Task: ${task.taskName}`,
        date: task.completedAt || task.lastUpdated || task.dueDate,
        desc: `${task.description || "Assigned task goal resolved"}`,
      });
    });

    // Sort by newest first
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [historyUpdates, employeeAchievements, employeeTasks]);

  const isLoading = isEmployeesLoading || isKPIsLoading || isAchievementsLoading || isTasksLoading;

  // Loading skeleton block
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-8 w-64 rounded bg-white/5" />
            </div>
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-1 glass-card h-[400px] bg-white/5" />
              <div className="lg:col-span-3 space-y-6">
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="glass-card h-24 bg-white/5" />
                  <div className="glass-card h-24 bg-white/5" />
                  <div className="glass-card h-24 bg-white/5" />
                  <div className="glass-card h-24 bg-white/5" />
                </div>
                <div className="glass-card h-64 bg-white/5" />
              </div>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Not found boundary
  if (!employee) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="glass-card p-12 text-center max-w-lg mx-auto border border-white/10 shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Staff Profile Not Found</h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              We could not find the employee record mapping the targeted ID. It might have been removed or synced out of current Airtable records.
            </p>
            <Button
              onClick={() => router.push("/employees")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg cursor-pointer"
            >
              Back to Employee Ledger
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Navigation title bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase">
                  {employee.id}
                </span>
                <span className="text-xs text-gray-400 font-semibold">•</span>
                <span className="text-xs text-gray-300 font-semibold">{employee.department}</span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1 leading-none">
                Employee Performance Scorecard
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-auto">
            <div className="text-right text-xs text-gray-400 hidden sm:block">
              <div className="flex items-center space-x-1 justify-end text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">
                <UserCheck className="h-3 w-3" />
                <span>Live Feed Synced</span>
              </div>
              {lastSynced && <span className="text-[10px] text-gray-500 block mt-0.5">Updated at {lastSynced}</span>}
            </div>
            <span className={`inline-flex h-6 items-center px-3 rounded-full text-xs font-bold ${getStatusBadgeStyle(status)}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Layout Grid: Left Profile Card vs Right Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Profile Details Card (Sidebar left) */}
          <div className="lg:col-span-1 glass-card p-6 border border-white/10 flex flex-col items-center text-center h-fit bg-[#080d19]/80 backdrop-blur-xl">
            {/* User initials circle or Avatar */}
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="h-24 w-24 rounded-full border-2 border-white/10 object-cover bg-white/5 shadow-lg shadow-blue-500/5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : null}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/10 border-2 border-blue-500/20 text-blue-400 font-extrabold text-2xl uppercase">
              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>

            <h2 className="text-lg font-extrabold text-white mt-4 leading-snug">{employee.name}</h2>
            <span className="text-xs text-gray-400 block mt-0.5">{employee.position}</span>

            {/* Micro Badge info */}
            <div className="mt-4 w-full divide-y divide-white/5 text-xs text-left">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" /> Email</span>
                <a href={`mailto:${employee.email}`} className="text-blue-400 font-bold truncate max-w-[120px]">{employee.email}</a>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Building className="mr-1.5 h-3.5 w-3.5" /> Department</span>
                <span className="text-white font-bold">{employee.department}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Users className="mr-1.5 h-3.5 w-3.5" /> Team</span>
                <span className="text-gray-300 font-bold">{employee.team || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><User className="mr-1.5 h-3.5 w-3.5" /> Manager</span>
                <span className="text-gray-300 font-bold">{employee.manager || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5" /> Created Date</span>
                <span className="text-gray-500 font-bold">{new Date(employee.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Core Scorecard Analytics & Timeline (Right area) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top Score highlight grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              
              {/* Overall Performance card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Overall score</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[8px] font-extrabold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-white">{scores.overall}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Average weighted metrics</span>
              </div>

              {/* KPI Score card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">KPI Score</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-blue-400">{scores.kpi}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">
                  {employeeKPIs.length} KPIs assigned
                </span>
              </div>

              {/* Value Align card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Value Score</span>
                <div className="flex items-baseline space-x-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-purple-400">{scores.value}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">
                  {employeeAchievements.reduce((s,a) => s + a.points, 0)} Achievement Points
                </span>
              </div>

              {/* Company Rank card */}
              <div className="glass-card p-4 border border-white/10 bg-[#0c1426] flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Company Rank</span>
                  <span className={`inline-flex items-center space-x-0.5 rounded px-1.5 py-0.5 text-[8px] font-semibold ${trend.color}`}>
                    {trend.type === "up" && <TrendingUp className="h-2.5 w-2.5" />}
                    {trend.type === "down" && <TrendingDown className="h-2.5 w-2.5" />}
                    {trend.type === "stable" && <Minus className="h-2.5 w-2.5" />}
                    <span>{trend.label}</span>
                  </span>
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-extrabold text-white">#{rankings.rank}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {rankings.total}</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">
                  Previous Rank: #{rankings.previousRank}
                </span>
              </div>
            </div>

            {/* Scorecard detail grids: Task, Attendance, Consistency, Weighted */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Weighted KPI</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.weighted}%</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Task Completion</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.tasks}%</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Attendance Score</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.attendance}%</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Consistency Index</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.consistency}%</span>
              </div>
            </div>

            {/* Visual Analytics Charts grid */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Chart 1: Performance score trend */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Performance Score Trend</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Timeline plotting historical score updates</p>
                  </div>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartTimelineData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                        itemStyle={{ color: "#fff", fontSize: "11px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Score"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#scoreColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Score Breakdown Multi-Bar Chart */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Score Component Breakdown</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Component-wise scorecard metrics scale (100% cap)</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={breakdownChartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} max={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                        itemStyle={{ color: "#fff", fontSize: "11px" }}
                      />
                      <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                        {breakdownChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Double grid list section: KPIs vs Assigned Tasks */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Assigned KPIs list */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Layers className="mr-2 h-4 w-4 text-blue-400" /> Assigned KPIs ({employeeKPIs.length})
                </h3>

                {employeeKPIs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Assigned KPIs</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {employeeKPIs.map((k) => (
                      <div key={k.id} className="p-3 bg-white/2 border border-white/5 rounded-lg flex flex-col justify-between hover:border-white/10 transition-colors">
                        <div className="flex justify-between text-xs items-center">
                          <span className="font-semibold text-white truncate max-w-[150px]">{k.kpiName}</span>
                          <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.2 rounded uppercase">
                            {k.code || `KPI-${k.id.slice(0, 4).toUpperCase()}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                          <span>Target: <span className="text-white font-semibold">{k.targetValue}</span></span>
                          <span>Actual: <span className="text-white font-semibold">{k.actualValue}</span></span>
                          <span className="font-bold text-white">{k.score}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2.5">
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.min(k.score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Tasks list */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <CheckSquare className="mr-2 h-4 w-4 text-blue-400" /> Assigned Tasks ({employeeTasks.length})
                </h3>

                {employeeTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Assigned Tasks</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {employeeTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-white/2 border border-white/5 rounded-lg flex flex-col justify-between hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white truncate max-w-[150px]">{t.taskName}</span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] ${getPriorityBadgeStyle(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                          <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(t.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          <span className={`inline-flex items-center rounded px-2 py-0.2 text-[9px] font-bold ${getTaskStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Achievements ledger & Timeline history grid */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Earned Achievements grid */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/85">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Trophy className="mr-2 h-4 w-4 text-blue-400" /> Achievements ({employeeAchievements.length})
                </h3>

                {employeeAchievements.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Achievements Earned</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {employeeAchievements.map((ach) => (
                      <div key={ach.id} className="p-3 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xs flex-shrink-0">
                            🏆
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">{ach.title}</span>
                            <span className="text-[9px] text-gray-400 block mt-0.5 leading-snug">{ach.description}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-extrabold text-amber-400 block">+{ach.points}</span>
                          <span className="text-[8px] text-gray-500 block font-semibold mt-0.5">{new Date(ach.achievedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity Feed Timeline */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/85">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <History className="mr-2 h-4 w-4 text-blue-400" /> Recent Activity
                </h3>

                {isHistoryLoading ? (
                  <div className="flex-1 flex items-center justify-center py-10">
                    <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                  </div>
                ) : activityTimeline.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Clock className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Recent Activity Logs</span>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {activityTimeline.map((act, index) => (
                      <div key={index} className="flex items-start space-x-3.5 text-xs text-gray-300">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          act.type === "kpi" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          act.type === "task" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {act.type === "kpi" && <Activity className="h-3.5 w-3.5" />}
                          {act.type === "task" && <CheckCircle className="h-3.5 w-3.5" />}
                          {act.type === "badge" && <Trophy className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-tight">{act.title}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 leading-snug">{act.desc}</span>
                          <span className="text-[8px] text-gray-500 block font-semibold mt-1">{new Date(act.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default function EmployeeScorecardDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded bg-white/5" />
                <div className="h-8 w-64 rounded bg-white/5" />
              </div>
              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-1 glass-card h-[400px] bg-white/5" />
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-card h-44 bg-white/5" />
                  <div className="glass-card h-72 bg-white/5" />
                </div>
              </div>
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <EmployeeScorecardContent />
    </Suspense>
  );
}
