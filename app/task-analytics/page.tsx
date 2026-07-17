"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTasks, useEmployees, useKPIs, useDepartments } from "@/hooks/useData";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ZAxis,
} from "recharts";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  Zap,
  Timer,
  TrendingUp,
  Database,
  RefreshCw,
  X,
  ChevronRight,
  User,
  Building2,
  CalendarDays,
  Layers,
  Activity,
  Target,
  Sparkles,
} from "lucide-react";
import type { Task, Employee, KPI, Department } from "@/types/models";

// ─── Shared tooltip style ──────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "#0d1320",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
};
const AXIS_STYLE = { stroke: "#4B5563", fontSize: 11 };
const GRID_STYLE = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" };

// ─── Palette ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "not-started": "#6B7280",
  "todo":        "#6B7280",
  "planned":     "#8B5CF6",
  "in-progress": "#3B82F6",
  "blocked":     "#EF4444",
  "under-review":"#F59E0B",
  "completed":   "#10B981",
  "archived":    "#374151",
};
const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high:     "#F97316",
  medium:   "#F59E0B",
  low:      "#6B7280",
};
const PALETTE = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899","#84CC16","#F97316","#A78BFA"];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DrillDownState {
  title: string;
  tasks: Task[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function normaliseStatus(raw: string = ""): string {
  const m: Record<string, string> = {
    "todo": "not-started", "not-started": "not-started", "planned": "planned",
    "in-progress": "in-progress", "blocked": "blocked",
    "under-review": "under-review", "completed": "completed", "archived": "archived",
  };
  return m[raw.toLowerCase()] ?? "not-started";
}

function isOverdue(task: Task): boolean {
  const done = ["completed", "archived"];
  if (done.includes(normaliseStatus(task.status))) return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function priorityLabel(p: string) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function progressFromTask(task: Task): number {
  const t = task as any;
  if (t.progress !== undefined) return Math.min(100, Math.max(0, Number(t.progress)));
  const s = normaliseStatus(task.status);
  if (s === "completed") return 100;
  if (s === "in-progress") return 50;
  return 0;
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.abs((d2 - d1) / 86_400_000);
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
  loading?: boolean;
}

function StatCard({ title, value, sub, icon, gradient, onClick, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-3" />
        <div className="h-8 w-20 bg-white/10 rounded" />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 transition-all duration-200 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-xl ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 truncate">{title}</p>
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none">{value}</p>
          {sub && <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{sub}</p>}
        </div>
        <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${gradient}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Chart Card ────────────────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

function ChartCard({ title, subtitle, children, className = "", badge }: ChartCardProps) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="flex-shrink-0 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Empty Chart placeholder ────────────────────────────────────────────────────
function EmptyChart({ h = 260 }: { h?: number }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl bg-white/3 border border-white/5`} style={{ height: h }}>
      <BarChart2 className="h-8 w-8 text-gray-700 mb-2" />
      <p className="text-xs text-gray-600 font-medium">No data yet</p>
    </div>
  );
}

// ─── Drill-down Slide-Over ─────────────────────────────────────────────────────
function DrillDownPanel({
  state,
  onClose,
  employees,
  kpis,
}: {
  state: DrillDownState | null;
  onClose: () => void;
  employees: Employee[];
  kpis: KPI[];
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!state) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-[110] h-full w-full max-w-md bg-[#080d19] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-sm font-bold text-white">{state.title}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{state.tasks.length} task{state.tasks.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
          {state.tasks.length === 0 ? (
            <p className="text-center text-xs text-gray-600 py-10">No tasks to display</p>
          ) : (
            state.tasks.map((task) => {
              const emp = employees.find(e => e.name.toLowerCase() === task.assignedTo?.toLowerCase());
              const kpi = kpis.find(k => k.id === task.kpiId);
              const progress = progressFromTask(task);
              const overdue = isOverdue(task);
              const status = normaliseStatus(task.status);
              const statusColor = STATUS_COLORS[status] || "#6B7280";
              const prioColor = PRIORITY_COLORS[task.priority] || "#6B7280";

              return (
                <div key={task.id} className="rounded-xl border border-white/8 bg-white/3 p-3.5 space-y-2.5 hover:bg-white/5 transition-colors">
                  {/* Priority + status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${prioColor}20`, color: prioColor, border: `1px solid ${prioColor}40` }}
                    >
                      {priorityLabel(task.priority)}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      style={{ background: `${statusColor}20`, color: statusColor }}
                    >
                      {status.replace(/-/g, " ")}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{task.taskName}</p>

                  {/* Meta */}
                  <div className="space-y-1">
                    {task.assignedTo && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <User className="h-3 w-3 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{task.assignedTo}</span>
                        {emp?.department && <span className="text-gray-600">· {emp.department}</span>}
                      </div>
                    )}
                    {kpi && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Target className="h-3 w-3 text-violet-400 flex-shrink-0" />
                        <span className="truncate">{kpi.kpiName}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${overdue ? "text-red-400" : "text-gray-400"}`}>
                        <CalendarDays className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {overdue && " · OVERDUE"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-300 font-bold">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? "#10B981" : progress >= 60 ? "#3B82F6" : progress >= 30 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
function TaskAnalyticsContent() {
  const queryClient = useQueryClient();
  const { data: rawTasks = [], isLoading, isError, refetch } = useTasks();
  const { data: employees = [] } = useEmployees();
  const { data: kpis = [] } = useKPIs();
  const { data: departments = [] } = useDepartments();

  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState("");
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync timestamp
  useEffect(() => {
    if (rawTasks.length > 0) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, [rawTasks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await refetch();
    setRefreshing(false);
    setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [refetch, queryClient]);

  // ── Computed metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = rawTasks.length;
    const active = rawTasks.filter(t => ["in-progress", "planned"].includes(normaliseStatus(t.status))).length;
    const completed = rawTasks.filter(t => normaliseStatus(t.status) === "completed").length;
    const blocked = rawTasks.filter(t => normaliseStatus(t.status) === "blocked").length;
    const overdueTasks = rawTasks.filter(t => isOverdue(t));
    const highPriority = rawTasks.filter(t => t.priority === "critical" || t.priority === "high").length;

    const allProgress = rawTasks.map(t => progressFromTask(t));
    const avgCompletion = total > 0 ? Math.round(allProgress.reduce((s, v) => s + v, 0) / total) : 0;

    const doneTasks = rawTasks.filter(t => normaliseStatus(t.status) === "completed" && t.completedAt && t.createdAt);
    const avgDays = doneTasks.length > 0
      ? Math.round(doneTasks.reduce((s, t) => s + daysBetween(t.createdAt, t.completedAt!), 0) / doneTasks.length)
      : 0;

    return { total, active, completed, overdueTasks, blocked, highPriority, avgCompletion, avgDays };
  }, [rawTasks]);

  // ── Chart 1: Status Distribution ─────────────────────────────────────────
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    rawTasks.forEach(t => {
      const s = normaliseStatus(t.status);
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value,
        key: name,
        color: STATUS_COLORS[name] || "#6B7280",
      }));
  }, [rawTasks]);

  // ── Chart 2: Priority Distribution ───────────────────────────────────────
  const priorityChartData = useMemo(() => {
    const order = ["critical", "high", "medium", "low"];
    return order.map(p => ({
      name: priorityLabel(p),
      value: rawTasks.filter(t => t.priority === p).length,
      key: p,
      fill: PRIORITY_COLORS[p],
    })).filter(d => d.value > 0);
  }, [rawTasks]);

  // ── Chart 3: Department Workload ──────────────────────────────────────────
  const deptWorkloadData = useMemo(() => {
    const map: Record<string, { total: number; completed: number; blocked: number; inprogress: number }> = {};
    rawTasks.forEach(t => {
      const emp = employees.find(e => e.name.toLowerCase() === t.assignedTo?.toLowerCase());
      const dept = emp?.department || "Unassigned";
      if (!map[dept]) map[dept] = { total: 0, completed: 0, blocked: 0, inprogress: 0 };
      map[dept].total++;
      const s = normaliseStatus(t.status);
      if (s === "completed") map[dept].completed++;
      else if (s === "blocked") map[dept].blocked++;
      else if (s === "in-progress") map[dept].inprogress++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [rawTasks, employees]);

  // ── Chart 4: Employee Workload ────────────────────────────────────────────
  const empWorkloadData = useMemo(() => {
    const map: Record<string, { total: number; completed: number; inprogress: number }> = {};
    rawTasks.forEach(t => {
      const name = t.assignedTo || "Unassigned";
      if (!map[name]) map[name] = { total: 0, completed: 0, inprogress: 0 };
      map[name].total++;
      const s = normaliseStatus(t.status);
      if (s === "completed") map[name].completed++;
      else if (s === "in-progress") map[name].inprogress++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [rawTasks]);

  // ── Chart 5 & 7: Monthly data ─────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { created: number; completed: number; blocked: number; active: number; totalProgress: number; progressCount: number }> = {};
    rawTasks.forEach(t => {
      const created = new Date(t.createdAt);
      if (isNaN(created.getTime())) return;
      const key = created.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { created: 0, completed: 0, blocked: 0, active: 0, totalProgress: 0, progressCount: 0 };
      map[key].created++;
      const s = normaliseStatus(t.status);
      if (s === "completed") map[key].completed++;
      else if (s === "blocked") map[key].blocked++;
      else if (s === "in-progress") map[key].active++;
      const p = progressFromTask(t);
      map[key].totalProgress += p;
      map[key].progressCount++;
    });
    return Object.entries(map)
      .map(([month, d]) => ({
        month,
        Created: d.created,
        Completed: d.completed,
        Blocked: d.blocked,
        Active: d.active,
        "Avg Progress": d.progressCount > 0 ? Math.round(d.totalProgress / d.progressCount) : 0,
      }))
      .sort((a, b) => {
        const da = new Date(a.month.replace(/(\w+) (\d+)/, "$1 20$2")).getTime();
        const db = new Date(b.month.replace(/(\w+) (\d+)/, "$1 20$2")).getTime();
        return da - db;
      })
      .slice(-12);
  }, [rawTasks]);

  // ── Chart 6: Completion Rate Trend ────────────────────────────────────────
  const completionTrend = useMemo(() => {
    return monthlyData.map(d => ({
      month: d.month,
      "Completion Rate": d.Created > 0 ? Math.round((d.Completed / d.Created) * 100) : 0,
      "Avg Progress": d["Avg Progress"],
    }));
  }, [monthlyData]);

  // ── Chart 8: KPI vs Tasks scatter ────────────────────────────────────────
  const kpiTasksData = useMemo(() => {
    return kpis
      .map(kpi => {
        const linked = rawTasks.filter(t => t.kpiId === kpi.id);
        const done = linked.filter(t => normaliseStatus(t.status) === "completed").length;
        return {
          name: kpi.kpiName,
          id: kpi.id,
          Tasks: linked.length,
          Completed: done,
          Score: Math.round(kpi.score || 0),
        };
      })
      .filter(d => d.Tasks > 0)
      .sort((a, b) => b.Tasks - a.Tasks)
      .slice(0, 12);
  }, [kpis, rawTasks]);

  // ── Chart 9: Heatmap (day-of-week × week) ────────────────────────────────
  const heatmapData = useMemo(() => {
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeks: Record<string, Record<number, { count: number; tasks: Task[] }>> = {};

    rawTasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dow = d.getDay();
      if (!weeks[weekKey]) weeks[weekKey] = {};
      if (!weeks[weekKey][dow]) weeks[weekKey][dow] = { count: 0, tasks: [] };
      weeks[weekKey][dow].count++;
      weeks[weekKey][dow].tasks.push(t);
    });

    const weekKeys = Object.keys(weeks).slice(-8);
    const maxCount = Math.max(1, ...weekKeys.flatMap(wk => DAY_LABELS.map((_, i) => weeks[wk]?.[i]?.count || 0)));

    return { weeks: weekKeys.map(wk => ({ label: wk, days: weeks[wk] })), DAY_LABELS, maxCount };
  }, [rawTasks]);

  // ── Drill-down helpers ────────────────────────────────────────────────────
  const openDrill = useCallback((title: string, tasks: Task[]) => {
    setDrillDown({ title, tasks });
  }, []);

  // ── Loading / Error ───────────────────────────────────────────────────────
  const isDataLoading = isLoading || !isMounted;

  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-gray-300 font-medium">Failed to load task data from Airtable.</p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <PageContainer>

        {/* ── Page Header ── */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Task Analytics</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {rawTasks.length} tasks · Click any chart element to drill down · Live from Airtable
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <Database className="h-3 w-3" />
              <span>Airtable Live</span>
              {lastSynced && <span className="text-emerald-600">· {lastSynced}</span>}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── 8 Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tasks"
            value={metrics.total}
            sub="All statuses"
            icon={<Layers className="h-5 w-5 text-white" />}
            gradient="from-blue-500 to-blue-700"
            loading={isDataLoading}
            onClick={() => openDrill("All Tasks", rawTasks)}
          />
          <StatCard
            title="Active Tasks"
            value={metrics.active}
            sub="In progress + Planned"
            icon={<Zap className="h-5 w-5 text-white" />}
            gradient="from-violet-500 to-violet-700"
            loading={isDataLoading}
            onClick={() => openDrill("Active Tasks", rawTasks.filter(t => ["in-progress", "planned"].includes(normaliseStatus(t.status))))}
          />
          <StatCard
            title="Completed Tasks"
            value={metrics.completed}
            sub={metrics.total > 0 ? `${Math.round((metrics.completed / metrics.total) * 100)}% of total` : "—"}
            icon={<CheckCircle2 className="h-5 w-5 text-white" />}
            gradient="from-emerald-500 to-emerald-700"
            loading={isDataLoading}
            onClick={() => openDrill("Completed Tasks", rawTasks.filter(t => normaliseStatus(t.status) === "completed"))}
          />
          <StatCard
            title="Overdue Tasks"
            value={metrics.overdueTasks.length}
            sub="Past due date, not completed"
            icon={<AlertCircle className="h-5 w-5 text-white" />}
            gradient="from-red-500 to-red-700"
            loading={isDataLoading}
            onClick={() => openDrill("Overdue Tasks", metrics.overdueTasks)}
          />
          <StatCard
            title="Blocked Tasks"
            value={metrics.blocked}
            sub="Awaiting resolution"
            icon={<Ban className="h-5 w-5 text-white" />}
            gradient="from-orange-500 to-orange-700"
            loading={isDataLoading}
            onClick={() => openDrill("Blocked Tasks", rawTasks.filter(t => normaliseStatus(t.status) === "blocked"))}
          />
          <StatCard
            title="High Priority"
            value={metrics.highPriority}
            sub="Critical + High priority"
            icon={<Zap className="h-5 w-5 text-white" />}
            gradient="from-amber-500 to-amber-700"
            loading={isDataLoading}
            onClick={() => openDrill("High Priority Tasks", rawTasks.filter(t => t.priority === "critical" || t.priority === "high"))}
          />
          <StatCard
            title="Avg Completion"
            value={`${metrics.avgCompletion}%`}
            sub="Mean progress across all tasks"
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            gradient="from-teal-500 to-teal-700"
            loading={isDataLoading}
          />
          <StatCard
            title="Avg Completion Time"
            value={metrics.avgDays > 0 ? `${metrics.avgDays}d` : "—"}
            sub="Mean days to complete"
            icon={<Timer className="h-5 w-5 text-white" />}
            gradient="from-purple-500 to-purple-700"
            loading={isDataLoading}
            onClick={metrics.avgDays > 0 ? () => openDrill("Completed Tasks (with dates)", rawTasks.filter(t => normaliseStatus(t.status) === "completed" && t.completedAt)) : undefined}
          />
        </div>

        {/* ── Row 1: Status donut + Priority bar ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Chart 1 — Status Distribution */}
          <ChartCard title="Task Status Distribution" subtitle="Click a slice to see matching tasks" badge="Drill-Down">
            {statusChartData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(d) => openDrill(`Status: ${d.name}`, rawTasks.filter(t => normaliseStatus(t.status) === d.key))}
                    style={{ cursor: "pointer" }}
                  >
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, name: any) => [v, name]} />
                  <Legend
                    formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 2 — Priority Distribution */}
          <ChartCard title="Priority Distribution" subtitle="Click a bar to see tasks with that priority" badge="Drill-Down">
            {priorityChartData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} />
                  <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={70} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    name="Tasks"
                    onClick={(d) => openDrill(`Priority: ${d.name}`, rawTasks.filter(t => t.priority === d.key))}
                    style={{ cursor: "pointer" }}
                  >
                    {priorityChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2: Department Workload + Employee Workload ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Chart 3 — Department Workload */}
          <ChartCard title="Department Workload" subtitle="Click a bar to see that department's tasks" badge="Drill-Down">
            {deptWorkloadData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptWorkloadData} margin={{ left: -10 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" {...AXIS_STYLE} tick={{ fontSize: 10 }} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d) => {
                      const emp_dept = employees.filter(e => e.department === d.name).map(e => e.name.toLowerCase());
                      openDrill(`Dept: ${d.name}`, rawTasks.filter(t => emp_dept.includes(t.assignedTo?.toLowerCase() || "")));
                    }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="blocked" name="Blocked" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 4 — Employee Workload */}
          <ChartCard title="Employee Workload" subtitle="Top 10 employees by task count · Click to drill down" badge="Drill-Down">
            {empWorkloadData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={empWorkloadData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} />
                  <YAxis type="category" dataKey="name" {...AXIS_STYLE} width={90} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#8B5CF6"
                    radius={[0, 6, 6, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d) => openDrill(`Employee: ${d.name}`, rawTasks.filter(t => t.assignedTo === d.name))}
                  />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="inprogress" name="In Progress" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 3: Monthly Completion + Completion Trend ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Chart 5 — Monthly Completion */}
          <ChartCard title="Monthly Task Volume" subtitle="Tasks created vs completed per month · Click bars to drill down" badge="Drill-Down">
            {monthlyData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ left: -10 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="month" {...AXIS_STYLE} tick={{ fontSize: 10 }} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Bar
                    dataKey="Created"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: any) => {
                      const month = d.month as string;
                      openDrill(`Created in ${month}`, rawTasks.filter(t => {
                        const dt = new Date(t.createdAt);
                        return dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) === month;
                      }));
                    }}
                  />
                  <Bar
                    dataKey="Completed"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: any) => {
                      const month = d.month as string;
                      openDrill(`Completed in ${month}`, rawTasks.filter(t => {
                        const dt = new Date(t.createdAt);
                        return normaliseStatus(t.status) === "completed" && dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) === month;
                      }));
                    }}
                  />
                  <Bar dataKey="Blocked" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 6 — Completion Rate Trend */}
          <ChartCard title="Completion Rate Trend" subtitle="% of tasks completed vs average progress per month · Click point to drill down" badge="Drill-Down">
            {completionTrend.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={completionTrend} margin={{ left: -10 }}>
                  <defs>
                    <linearGradient id="grad-cr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-ap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="month" {...AXIS_STYLE} tick={{ fontSize: 10 }} />
                  <YAxis {...AXIS_STYLE} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`]} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Area
                    type="monotone"
                    dataKey="Completion Rate"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#grad-cr)"
                    dot={{ r: 3, fill: "#3B82F6", cursor: "pointer" }}
                    activeDot={{
                      r: 5, cursor: "pointer",
                      onClick: (_: any, payload: any) => {
                        const month = payload?.payload?.month as string;
                        if (!month) return;
                        openDrill(`Active in ${month}`, rawTasks.filter(t => {
                          const dt = new Date(t.createdAt);
                          return dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) === month;
                        }));
                      },
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Avg Progress"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#grad-ap)"
                    dot={{ r: 3, fill: "#10B981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 4: Productivity Trend + KPI vs Tasks ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Chart 7 — Productivity Trend */}
          <ChartCard title="Productivity Trend" subtitle="Tasks created vs completed over time · Click a point to drill down" badge="Drill-Down">
            {monthlyData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData} margin={{ left: -10 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="month" {...AXIS_STYLE} tick={{ fontSize: 10 }} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="Created"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3B82F6", cursor: "pointer" }}
                    activeDot={{
                      r: 6, cursor: "pointer",
                      onClick: (_: any, payload: any) => {
                        const month = payload?.payload?.month as string;
                        if (!month) return;
                        openDrill(`Created in ${month}`, rawTasks.filter(t => {
                          const dt = new Date(t.createdAt);
                          return dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) === month;
                        }));
                      },
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Completed"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#10B981", cursor: "pointer" }}
                    activeDot={{
                      r: 6, cursor: "pointer",
                      onClick: (_: any, payload: any) => {
                        const month = payload?.payload?.month as string;
                        if (!month) return;
                        openDrill(`Completed in ${month}`, rawTasks.filter(t => {
                          const dt = new Date(t.createdAt);
                          return normaliseStatus(t.status) === "completed" && dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) === month;
                        }));
                      },
                    }}
                  />
                  <Line type="monotone" dataKey="Active" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: "#8B5CF6" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Chart 8 — KPI vs Tasks */}
          <ChartCard title="KPI vs Tasks" subtitle="Tasks linked to each KPI · Click a bar to see linked tasks" badge="Drill-Down">
            {kpiTasksData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={kpiTasksData} margin={{ left: -10 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" {...AXIS_STYLE} tick={{ fontSize: 9 }} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
                  <Bar
                    dataKey="Tasks"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d) => openDrill(`KPI: ${d.name}`, rawTasks.filter(t => t.kpiId === d.id))}
                  />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 5: Task Heatmap (full width) ── */}
        <ChartCard
          title="Task Due Date Heatmap"
          subtitle="Tasks due per day of week over recent weeks · Click a cell to see those tasks"
          badge="Drill-Down"
          className="mb-5"
        >
          {heatmapData.weeks.length === 0 ? (
            <EmptyChart h={160} />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Day-of-week header */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
                  <div />
                  {heatmapData.DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[10px] text-gray-500 font-semibold pb-1">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {heatmapData.weeks.map(({ label, days }) => (
                  <div key={label} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
                    <div className="text-[10px] text-gray-600 font-medium flex items-center pr-2 truncate">{label}</div>
                    {heatmapData.DAY_LABELS.map((_, i) => {
                      const cell = days?.[i];
                      const count = cell?.count || 0;
                      const intensity = count === 0 ? 0 : Math.min(1, count / heatmapData.maxCount);
                      const alpha = count === 0 ? 0.04 : 0.15 + intensity * 0.75;
                      return (
                        <button
                          key={i}
                          onClick={() => count > 0 && cell?.tasks && openDrill(`Due: ${label} ${heatmapData.DAY_LABELS[i]}`, cell.tasks)}
                          title={count > 0 ? `${count} task${count !== 1 ? "s" : ""} due` : "No tasks due"}
                          className={`h-8 rounded-md border transition-all duration-150 ${count > 0 ? "cursor-pointer hover:scale-110 hover:shadow-lg" : "cursor-default"}`}
                          style={{
                            background: count === 0
                              ? "rgba(255,255,255,0.04)"
                              : `rgba(59,130,246,${alpha})`,
                            borderColor: count === 0
                              ? "rgba(255,255,255,0.05)"
                              : `rgba(59,130,246,${alpha * 1.5})`,
                          }}
                        >
                          {count > 0 && (
                            <span className="text-[10px] font-bold text-blue-300">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-[10px] text-gray-600">Less</span>
                  {[0.05, 0.25, 0.5, 0.75, 1].map((a, i) => (
                    <div key={i} className="h-3 w-3 rounded-sm" style={{ background: `rgba(59,130,246,${a})` }} />
                  ))}
                  <span className="text-[10px] text-gray-600">More</span>
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* ── Drill-Down Panel ── */}
        <DrillDownPanel
          state={drillDown}
          onClose={() => setDrillDown(null)}
          employees={employees}
          kpis={kpis}
        />

      </PageContainer>
    </DashboardLayout>
  );
}

// ─── Keyframe styles ──────────────────────────────────────────────────────────
const pageStyles = `
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .animate-slide-in-right {
    animation: slide-in-right 0.28s cubic-bezier(0.16,1,0.3,1) both;
  }
`;

export default function TaskAnalyticsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <Suspense
        fallback={
          <DashboardLayout>
            <PageContainer>
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              </div>
            </PageContainer>
          </DashboardLayout>
        }
      >
        <TaskAnalyticsContent />
      </Suspense>
    </>
  );
}
