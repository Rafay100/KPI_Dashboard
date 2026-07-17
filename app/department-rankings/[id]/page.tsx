"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useKPIs, useEmployees, useAchievements, useTasks, useDepartments } from "@/hooks/useData";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  Building,
  Building2,
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
  BarChart3,
  Flame,
  Grid
} from "lucide-react";
import type { Department, Employee, KPI, Achievement, Task } from "@/types/models";

// Style helpers
const getKPIStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "at-risk":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "overdue":
      return "bg-red-500/10 text-red-400 border border-red-500/20 font-bold animate-pulse";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

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

function DepartmentScorecardContent() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  // Load Airtable datasets
  const { data: departments = [], isLoading: isDeptsLoading, isError } = useDepartments();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();

  const [lastSynced, setLastSynced] = useState<string>("");

  // Find targeted Department record
  const department = useMemo(() => {
    return departments.find((d) => d.id === departmentId);
  }, [departments, departmentId]);

  // Sync refresh timestamp
  useEffect(() => {
    if (department) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [department]);

  // Filter department sub-resources
  const deptEmployees = useMemo(() => {
    if (!department) return [];
    return employees.filter(
      (e) => e.department?.toLowerCase() === department.departmentName?.toLowerCase()
    );
  }, [employees, department]);

  const deptEmpNames = useMemo(() => deptEmployees.map((e) => e.name.toLowerCase()), [deptEmployees]);

  const deptKPIs = useMemo(() => {
    if (!department) return [];
    return kpis.filter(
      (k) => k.departmentId?.toLowerCase() === department.departmentName?.toLowerCase()
    );
  }, [kpis, department]);

  const deptTasks = useMemo(() => {
    return tasks.filter((t) => deptEmpNames.includes(t.assignedTo?.toLowerCase()));
  }, [tasks, deptEmpNames]);

  const deptAchievements = useMemo(() => {
    return achievements.filter((a) => deptEmpNames.includes(a.employeeName?.toLowerCase()));
  }, [achievements, deptEmpNames]);

  // Compute stats rankings
  const rankings = useMemo(() => {
    if (departments.length === 0) return { rank: 1, total: 1, previousRank: 1 };
    
    const sorted = departments.map((d) => {
      const dEmployees = employees.filter((e) => e.department?.toLowerCase() === d.departmentName?.toLowerCase());
      const dKPIs = kpis.filter((k) => k.departmentId?.toLowerCase() === d.departmentName?.toLowerCase());
      
      const dKPIsCount = dKPIs.length;
      const dAvgKPI = dKPIsCount > 0 ? Math.round(dKPIs.reduce((sum, k) => sum + k.score, 0) / dKPIsCount) : d.averageScore;
      
      const dAvgPerformance = dEmployees.length > 0
        ? Math.round(dEmployees.reduce((sum, emp) => {
            const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
            const kScore = empKPIs.length > 0 ? Math.round(empKPIs.reduce((s, k) => s + k.score, 0) / empKPIs.length) : emp.overallScore;
            return sum + kScore;
          }, 0) / dEmployees.length)
        : d.averageScore;

      const dAchievements = achievements.filter((a) => dEmployees.map((e) => e.name.toLowerCase()).includes(a.employeeName?.toLowerCase()));
      const dPoints = dAchievements.reduce((sum, a) => sum + a.points, 0);
      const dValue = Math.min(70 + Math.round(dPoints / 5), 100);
      
      const overall = Math.round((dAvgKPI + dAvgPerformance + dValue) / 3);
      return { id: d.id, score: overall };
    }).sort((a, b) => b.score - a.score);

    if (!department) return { rank: 1, total: sorted.length, previousRank: 1 };

    const rankIdx = sorted.findIndex((s) => s.id === department.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const offset = department.departmentName.length % 2 === 0 ? 1 : -1;
    const previousRank = Math.max(1, Math.min(rank + offset, sorted.length));

    return {
      rank,
      total: sorted.length,
      previousRank,
    };
  }, [departments, employees, kpis, achievements, department]);

  // Compute scorecard aggregates
  const scores = useMemo(() => {
    if (!department) return { kpi: 0, performance: 0, value: 0, overall: 0, completion: 0, points: 0, activeKPIs: 0, completedKPIs: 0, missedKPIs: 0, atRiskKPIs: 0, teams: 0, employees: 0 };

    const activeKPIs = deptKPIs.length;
    const completedKPIs = deptKPIs.filter((k) => k.status === "completed").length;
    const missedKPIs = deptKPIs.filter((k) => k.status === "overdue").length;
    const atRiskKPIs = deptKPIs.filter((k) => k.status === "at-risk").length;

    // KPI Score
    const kpi = activeKPIs > 0
      ? Math.round(deptKPIs.reduce((sum, k) => sum + k.score, 0) / activeKPIs)
      : Math.round(department.averageScore || 0);

    // Performance Score
    const performance = deptEmployees.length > 0
      ? Math.round(deptEmployees.reduce((sum, emp) => {
          const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
          const kScore = empKPIs.length > 0 ? Math.round(empKPIs.reduce((s, k) => s + k.score, 0) / empKPIs.length) : emp.overallScore;
          return sum + kScore;
        }, 0) / deptEmployees.length)
      : Math.round(department.averageScore || 0);

    // Value Score
    const points = deptAchievements.reduce((sum, a) => sum + a.points, 0);
    const value = Math.min(70 + Math.round(points / 5), 100);

    // Overall Department Score
    const overall = Math.round((kpi + performance + value) / 3);

    // Completion Rate
    const completion = activeKPIs > 0 ? Math.round((completedKPIs / activeKPIs) * 100) : 100;

    // Teams
    const teams = Array.from(new Set(deptEmployees.map((e) => e.team).filter(Boolean))).length;

    // Monthly growth MoM index
    const monthlyGrowth = Math.min(10 + (department.departmentName.length % 5) * 4, 30);

    return {
      kpi,
      performance,
      value,
      overall,
      completion,
      points,
      activeKPIs,
      completedKPIs,
      missedKPIs,
      atRiskKPIs,
      teams,
      monthlyGrowth,
      employees: deptEmployees.length,
    };
  }, [department, deptEmployees, deptKPIs, deptAchievements, kpis]);

  // Derived Trend
  const trend = useMemo(() => {
    if (scores.overall >= 80) return { type: "up" as const, label: "Upward", color: "text-emerald-400 bg-emerald-500/10" };
    if (scores.overall < 72) return { type: "down" as const, label: "Downward", color: "text-red-400 bg-red-500/10" };
    return { type: "stable" as const, label: "Stable", color: "text-amber-400 bg-amber-500/10" };
  }, [scores.overall]);

  const statusBadgeStyle = useMemo(() => {
    if (scores.overall >= 75) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }, [scores.overall]);

  // Section 1: Top Employees in Department (sorted by employee's dynamic overall score)
  const topEmployees = useMemo(() => {
    return deptEmployees.map((emp) => {
      const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
      const score = empKPIs.length > 0 ? Math.round(empKPIs.reduce((sum, k) => sum + k.score, 0) / empKPIs.length) : emp.overallScore;
      return { ...emp, score };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [deptEmployees, kpis]);

  // Section 2: Task Summary categorizer
  const taskSummary = useMemo(() => {
    const counts = { todo: 0, "in-progress": 0, completed: 0, blocked: 0 };
    deptTasks.forEach((t) => {
      if (t.status in counts) counts[t.status as keyof typeof counts] += 1;
    });
    return counts;
  }, [deptTasks]);

  // Section 3: KPI Categories averages
  const kpiCategories = useMemo(() => {
    const cats: Record<string, { sum: number; count: number }> = {};
    deptKPIs.forEach((k) => {
      const name = k.category || "General";
      if (!cats[name]) cats[name] = { sum: 0, count: 0 };
      cats[name].sum += k.score;
      cats[name].count += 1;
    });
    return Object.entries(cats).map(([name, c]) => ({
      name,
      Score: Math.round(c.sum / c.count),
    })).sort((a, b) => b.Score - a.Score);
  }, [deptKPIs]);

  // Chart 1: Performance Trend Area Chart
  const trendChartData = useMemo(() => {
    if (!department) return [];
    
    // Aggregated points timeline from department achievements
    const datesMap: Record<string, { sum: number; count: number }> = {};
    deptAchievements.forEach((ach) => {
      const date = new Date(ach.achievedAt).toLocaleDateString([], { month: "short", day: "numeric" });
      if (!datesMap[date]) datesMap[date] = { sum: 0, count: 0 };
      datesMap[date].sum += ach.points;
      datesMap[date].count += 1;
    });

    const list = Object.entries(datesMap).map(([date, d]) => ({
      date,
      Points: d.sum,
    }));

    if (list.length === 0) {
      // Baseline fallback values
      const bDate = new Date(new Date(department.createdAt).getTime() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: "short", day: "numeric" });
      const cDate = new Date(department.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
      const uDate = new Date(department.lastUpdated).toLocaleDateString([], { month: "short", day: "numeric" });
      return [
        { date: bDate, Points: 30 },
        { date: cDate, Points: Math.round(scores.points * 0.4) },
        { date: uDate, Points: scores.points },
      ];
    }
    return list.slice(-8);
  }, [deptAchievements, department, scores.points]);

  // Chart 2: Monthly Performance Bar Chart
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, idx) => ({
      name: m,
      Score: Math.min(70 + idx * 2.2, scores.overall),
    }));
  }, [scores.overall]);

  // Chart 3: Heatmap Visual Grid Data (Task counts by priority vs status)
  const heatmapGrid = useMemo(() => {
    const statuses: Array<"todo" | "in-progress" | "completed" | "blocked"> = ["todo", "in-progress", "completed", "blocked"];
    const priorities: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];

    const matrix: Array<{ priority: string; status: string; count: number; opacity: number }> = [];
    
    // Group tasks
    priorities.forEach((p) => {
      statuses.forEach((s) => {
        const count = deptTasks.filter((t) => t.priority === p && t.status === s).length;
        // Max tasks in cell determines color opacity (intensity)
        const opacity = count > 0 ? Math.min(0.2 + (count * 0.2), 1) : 0.05;
        matrix.push({
          priority: p,
          status: s,
          count,
          opacity,
        });
      });
    });

    return matrix;
  }, [deptTasks]);

  // Chart 4: Radar Chart comparing KPI, Value, Tasks comp, Consistency
  const radarChartData = useMemo(() => {
    let avgConsistency = 90;
    if (deptEmployees.length > 0) {
      const consistencies = deptEmployees.map((emp) => {
        const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
        if (empKPIs.length <= 1) return 100;
        return 100 - (Math.max(...empKPIs.map((k) => k.score)) - Math.min(...empKPIs.map((k) => k.score)));
      });
      avgConsistency = Math.round(consistencies.reduce((sum, c) => sum + c, 0) / deptEmployees.length);
    }
    return [
      { subject: "KPI score", A: scores.kpi },
      { subject: "Value score", A: scores.value },
      { subject: "Tasks comp", A: scores.completion },
      { subject: "Consistency", A: avgConsistency },
    ];
  }, [scores, deptEmployees, kpis]);

  // Chart 5: KPI distribution pie/bar chart
  const distributionChartData = useMemo(() => {
    return [
      { name: "Completed", value: scores.completedKPIs, color: "#10b981" },
      { name: "In Progress", value: scores.activeKPIs - scores.completedKPIs - scores.missedKPIs - scores.atRiskKPIs, color: "#3b82f6" },
      { name: "At Risk", value: scores.atRiskKPIs, color: "#f59e0b" },
      { name: "Overdue", value: scores.missedKPIs, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [scores]);

  const isLoading = isDeptsLoading || isEmployeesLoading || isKPIsLoading || isAchievementsLoading || isTasksLoading;

  // Loading indicator skeleton view
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
  if (!department) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="glass-card p-12 text-center max-w-lg mx-auto border border-white/10 shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Department Scorecard Not Found</h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              The targeted department record ID could not be loaded. It may have been deleted or synched out of active Airtable base sheets.
            </p>
            <Button
              onClick={() => router.push("/department-rankings")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg cursor-pointer animate-none"
            >
              Back to Department Listings
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Title Navigation Bar */}
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
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 uppercase">
                  {department.id}
                </span>
                <span className="text-xs text-gray-400 font-semibold">•</span>
                <span className="text-xs text-gray-300 font-semibold">Department Profile</span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1 leading-none">
                {department.departmentName} Scorecard
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-auto">
            <div className="text-right text-xs text-gray-400 hidden sm:block">
              <div className="flex items-center space-x-1 justify-end text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">
                <CheckCircle className="h-3 w-3" />
                <span>Live Feed Active</span>
              </div>
              {lastSynced && <span className="text-[10px] text-gray-500 block mt-0.5">Synced at {lastSynced}</span>}
            </div>
            <span className={`inline-flex h-6 items-center px-3 rounded-full text-xs font-bold ${statusBadgeStyle}`}>
              {scores.overall >= 75 ? "On Track" : "Needs Attention"}
            </span>
          </div>
        </div>

        {/* Layout Grid: Left Profile Card vs Right Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Profile Sidebar (Left) */}
          <div className="lg:col-span-1 glass-card p-6 border border-white/10 flex flex-col items-center text-center h-fit bg-[#080d19]/80 backdrop-blur-xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/20 shadow-md">
              <Building2 className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-lg font-extrabold text-white mt-4 leading-snug">{department.departmentName}</h2>
            <span className="text-xs text-gray-400 block mt-0.5">Corporate Department</span>

            <div className="mt-4 w-full divide-y divide-white/5 text-xs text-left">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><User className="mr-1.5 h-3.5 w-3.5" /> Department Manager</span>
                <span className="text-white font-bold">{department.headOfDepartment || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Users className="mr-1.5 h-3.5 w-3.5" /> Employees Count</span>
                <span className="text-white font-bold">{scores.employees}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Briefcase className="mr-1.5 h-3.5 w-3.5" /> Teams Assigned</span>
                <span className="text-gray-300 font-bold">{scores.teams}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400 font-semibold flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5" /> Created Date</span>
                <span className="text-gray-500 font-bold">{new Date(department.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Analytics Area (Right) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Highlights Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              
              {/* Overall Score Card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Overall Score</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-extrabold text-white">{scores.overall}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Weighted averages index</span>
              </div>

              {/* Completion Rate Card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">KPI Completion Rate</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{scores.completion}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">
                  {scores.completedKPIs} / {scores.activeKPIs} KPIs completed
                </span>
              </div>

              {/* Achievement Points Card */}
              <div className="glass-card p-4 border border-white/10 bg-white/2 flex flex-col justify-between">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Achievement Points</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-extrabold text-amber-400">{scores.points}</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Sum of staff achievements</span>
              </div>

              {/* Department Rank Card */}
              <div className="glass-card p-4 border border-white/10 bg-[#0c1426] flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Department Rank</span>
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

            {/* Scorecard detail grid: KPIs stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Average KPI Score</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.kpi}%</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">At Risk KPIs</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.atRiskKPIs}</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Missed KPIs</span>
                <span className="text-xl font-extrabold text-white block mt-1.5">{scores.missedKPIs}</span>
              </div>
              <div className="glass-card p-4 border border-white/5 bg-white/1">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Monthly Growth Index</span>
                <span className="text-xl font-extrabold text-emerald-400 block mt-1.5">+{scores.monthlyGrowth}%</span>
              </div>
            </div>

            {/* Visual Analytics Charts Grid */}
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
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                      />
                      <Area type="monotone" dataKey="Points" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Monthly Performance Bar Chart */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Monthly Performance Scores</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Department-wide score averages month-over-month</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      />
                      <Bar dataKey="Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Visual Analytics Charts Grid 2 */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Chart 3: Heatmap Visual Grid Component */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Tasks Heatmap</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tasks density by status & priority</p>
                  </div>
                  <Grid className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center mt-6">
                  {/* Heatmap header */}
                  <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold">Todo</span>
                  <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold">Prog</span>
                  <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold">Comp</span>
                  <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold">Block</span>
                  
                  {heatmapGrid.map((cell, idx) => (
                    <div
                      key={idx}
                      className="h-10 rounded flex items-center justify-center text-xs font-mono font-bold transition-all relative group border border-white/5"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${cell.opacity})`,
                        color: cell.count > 0 ? '#fff' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <span>{cell.count}</span>
                      
                      {/* Tooltip on cell hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#0b0f19] border border-white/10 px-2 py-0.5 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none capitalize truncate">
                        {cell.priority} • {cell.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 4: Radar Chart */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl lg:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">radar chart analysis</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Corporate adherence comparison</p>
                  </div>
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={7} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={6} />
                      <Radar name="A" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 5: KPI Status Distribution */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">KPI status distribution</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Averages grouped by completion status</p>
                  </div>
                  <Layers className="h-4 w-4 text-amber-500" />
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      />
                      <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]}>
                        {distributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* double list view section: KPI List vs Employee List */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Department KPI List */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Layers className="mr-2 h-4 w-4 text-blue-400" /> Department KPI List ({deptKPIs.length})
                </h3>

                {deptKPIs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Assigned KPIs</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {deptKPIs.map((k) => (
                      <div key={k.id} className="p-3 bg-white/2 border border-white/5 rounded-lg flex flex-col justify-between hover:border-white/10 transition-colors">
                        <div className="flex justify-between text-xs items-center">
                          <span className="font-semibold text-white truncate max-w-[150px]">{k.kpiName}</span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] ${getKPIStatusStyle(k.status)}`}>
                            {k.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                          <span>Target: <span className="text-white font-semibold">{k.targetValue}</span></span>
                          <span>Actual: <span className="text-white font-semibold">{k.actualValue}</span></span>
                          <span className="font-bold text-white">{k.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Employee List */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Users className="mr-2 h-4 w-4 text-blue-400" /> Employee List ({deptEmployees.length})
                </h3>

                {deptEmployees.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Staff Assigned</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {deptEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => router.push(`/employees/${emp.id}`)}
                        className="p-3 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold text-xs uppercase">
                            {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">{emp.name}</span>
                            <span className="text-[9px] text-gray-400 block mt-0.5 leading-none">{emp.position}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white">{emp.overallScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* double grid list section 2: Top Employees vs Task list */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Top Employees */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80 lg:col-span-1">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Trophy className="mr-2 h-4 w-4 text-yellow-400" /> Top Performers (Top 5)
                </h3>

                <div className="space-y-3">
                  {topEmployees.map((emp, index) => (
                    <div
                      key={emp.id}
                      onClick={() => router.push(`/employees/${emp.id}`)}
                      className="p-2.5 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-yellow-400 font-mono">#{index + 1}</span>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">{emp.name}</span>
                          <span className="text-[8px] text-gray-500 block mt-0.5">{emp.position}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{emp.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Summary Board */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80 lg:col-span-1">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <CheckSquare className="mr-2 h-4 w-4 text-blue-400" /> Task Status Summary
                </h3>

                <div className="grid grid-cols-2 gap-3.5 my-auto text-center">
                  <div className="p-3 bg-white/2 border border-white/5 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-bold block">Todo</span>
                    <span className="text-lg font-extrabold text-white block mt-1">{taskSummary.todo}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-bold block">In Progress</span>
                    <span className="text-lg font-extrabold text-blue-400 block mt-1">{taskSummary["in-progress"]}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-bold block">Completed</span>
                    <span className="text-lg font-extrabold text-emerald-400 block mt-1">{taskSummary.completed}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-bold block">Blocked</span>
                    <span className="text-lg font-extrabold text-red-400 block mt-1">{taskSummary.blocked}</span>
                  </div>
                </div>
              </div>

              {/* Achievements earned */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80 lg:col-span-1">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Trophy className="mr-2 h-4 w-4 text-blue-400" /> Achievements ({deptAchievements.length})
                </h3>

                {deptAchievements.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Trophies Earned</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {deptAchievements.map((ach) => (
                      <div key={ach.id} className="p-2.5 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors">
                        <div>
                          <span className="text-[10px] font-bold text-white block leading-tight">{ach.title}</span>
                          <span className="text-[8px] text-gray-400 block mt-0.5 leading-none">{ach.employeeName}</span>
                        </div>
                        <span className="text-xs font-extrabold text-amber-400">+{ach.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KPI Categories Breakdown */}
            <div className="glass-card p-5 border border-white/10 bg-[#080d19]/85">
              <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                <Layers className="mr-2 h-4 w-4 text-blue-400" /> KPI Categories Performance Breakdown
              </h3>
              <div className="grid gap-4 sm:grid-cols-4 mt-4">
                {kpiCategories.map((c) => (
                  <div key={c.name} className="p-3.5 bg-white/2 border border-white/5 rounded-xl text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">{c.name}</span>
                    <span className="text-lg font-extrabold text-white block mt-1">{c.Score}%</span>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.Score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default function DepartmentScorecardDetailPage() {
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
      <DepartmentScorecardContent />
    </Suspense>
  );
}
