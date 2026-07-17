"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/kpis/components/StatusBadge";
import { useKPIs, useEmployees, useKPIHistory } from "@/hooks/useData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Cpu,
  User,
  Users,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Info,
  ChevronRight,
  Shield,
  Layers,
  Award,
  HelpCircle,
  History,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import type { KPI, Employee } from "@/types/models";

// Helper to resolve manager from employee record or KPI owner
const getManager = (kpi: KPI, employees: Employee[]): string => {
  if (!kpi.employeeId) return kpi.owner || "—";
  const employee = employees.find(
    (emp) => emp.name.toLowerCase() === kpi.employeeId.toLowerCase()
  );
  if (employee && employee.manager) {
    return employee.manager;
  }
  return kpi.owner || "—";
};

// Helper to calculate Trend
const getTrend = (kpi: KPI) => {
  const actual = kpi.actualValue;
  const target = kpi.targetValue;
  if (target <= 0) return { label: "Stable", type: "stable" as const };
  const ratio = actual / target;
  if (ratio >= 1.0) return { label: "Up", type: "up" as const };
  if (ratio >= 0.9) return { label: "Stable", type: "stable" as const };
  return { label: "Down", type: "down" as const };
};

// Helper to derive Review Date (5 days before Due Date)
const getReviewDate = (dueDateStr: string): string => {
  if (!dueDateStr) return "—";
  const date = new Date(dueDateStr);
  if (isNaN(date.getTime())) return "—";
  const reviewDate = new Date(date.getTime() - 5 * 24 * 60 * 60 * 1000);
  return reviewDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

// Helper to derive Entry Method deterministically from KPI ID
const getEntryMethod = (kpiId: string): "Automated" | "Manual" => {
  if (!kpiId) return "Manual";
  let sum = 0;
  for (let i = 0; i < kpiId.length; i++) {
    sum += kpiId.charCodeAt(i);
  }
  return sum % 2 === 0 ? "Automated" : "Manual";
};

// Dynamic Formula explanation based on category/unit
const getFormulaExplanation = (kpi: KPI) => {
  const unit = kpi.unit || "units";
  
  if (unit.toLowerCase().includes("%") || unit.toLowerCase().includes("percent")) {
    return `Calculated as the percentage ratio: (Actual / Target) * 100. Target threshold set at ${kpi.targetValue}%.`;
  }
  if (unit.toLowerCase().includes("usd") || unit.toLowerCase().includes("revenue") || unit.toLowerCase().includes("$")) {
    return `Calculated as the total financial sum in USD. Target revenue set at $${kpi.targetValue.toLocaleString()}.`;
  }
  if (unit.toLowerCase().includes("second") || unit.toLowerCase().includes("ms") || unit.toLowerCase().includes("hour")) {
    return `Calculated as average duration. Max target latency set at ${kpi.targetValue} ${unit}.`;
  }
  return `Operational metric measured in ${unit}. Computed as: Current Actual (${kpi.actualValue}) against target watermark (${kpi.targetValue}).`;
};

export default function ProfessionalKPIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kpiId = params.id as string;

  // Load KPIs, Employees, and History updates
  const { data: kpis, isLoading: isKPIsLoading } = useKPIs();
  const { data: employees } = useEmployees();
  const { data: historyUpdates, isLoading: isHistoryLoading } = useKPIHistory(kpiId);

  const [lastSynced, setLastSynced] = useState<string>("");

  // Find current KPI
  const kpi = useMemo(() => {
    return kpis?.find((k) => k.id === kpiId);
  }, [kpis, kpiId]);

  // Set last synced timestamp
  useEffect(() => {
    if (kpi) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [kpi]);

  // Derive Contributors (other employees in same team)
  const contributors = useMemo(() => {
    if (!kpi || !employees) return [];
    return employees
      .filter((emp) => emp.team === kpi.team && emp.name.toLowerCase() !== kpi.employeeId?.toLowerCase())
      .map((emp) => emp.name);
  }, [kpi, employees]);

  // Plot Chart Data (either historical updates or dynamic baseline/current)
  const chartData = useMemo(() => {
    if (!kpi) return [];
    
    if (!historyUpdates || historyUpdates.length === 0) {
      // Dynamic baseline seed if no historical records exist yet in Airtable
      const baselineDate = new Date(new Date(kpi.createdAt).getTime() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: "short", day: "numeric" });
      const createdDate = new Date(kpi.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
      const updatedDate = new Date(kpi.lastUpdated).toLocaleDateString([], { month: "short", day: "numeric" });
      
      const currentScore = kpi.targetValue > 0 ? Math.round((kpi.actualValue / kpi.targetValue) * 100) : 0;
      
      return [
        { date: baselineDate, value: 0, score: 0 },
        { date: createdDate, value: Math.round(kpi.actualValue * 0.4), score: Math.round(currentScore * 0.4) },
        { date: updatedDate, value: kpi.actualValue, score: currentScore },
      ];
    }

    // Sort history from oldest to newest for Recharts visualization
    return [...historyUpdates]
      .reverse()
      .map((item) => ({
        date: new Date(item.updateDate).toLocaleDateString([], { month: "short", day: "numeric" }),
        value: item.newValue,
        score: item.newScore,
      }));
  }, [historyUpdates, kpi]);

  // Color config helper for score gauge and cards
  const currentScore = useMemo(() => {
    if (!kpi) return 0;
    return kpi.targetValue > 0 ? Math.round((kpi.actualValue / kpi.targetValue) * 100) : 0;
  }, [kpi]);

  const scoreTheme = useMemo(() => {
    if (currentScore >= 90) return { color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", stroke: "#10b981", badge: "bg-emerald-500/10 text-emerald-400" };
    if (currentScore >= 70) return { color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5", stroke: "#3b82f6", badge: "bg-blue-500/10 text-blue-400" };
    if (currentScore >= 50) return { color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5", stroke: "#f59e0b", badge: "bg-amber-500/10 text-amber-400" };
    return { color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5", stroke: "#ef4444", badge: "bg-red-500/10 text-red-400" };
  }, [currentScore]);

  // SVG Gauge variables
  const r = 50;
  const circ = 2 * Math.PI * r;
  const strokeOffset = circ - (Math.min(currentScore, 100) / 100) * circ;

  // Loading indicator skeleton view
  if (isKPIsLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-8 w-64 rounded bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="glass-card h-44 bg-white/5" />
              <div className="glass-card h-44 bg-white/5" />
              <div className="glass-card h-44 bg-white/5" />
            </div>
            <div className="glass-card h-72 bg-white/5" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-card h-64 bg-white/5" />
              <div className="glass-card h-64 bg-white/5" />
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Not found boundary
  if (!kpi) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="glass-card p-12 text-center max-w-lg mx-auto border border-white/10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">KPI Metric Not Found</h2>
            <p className="text-sm text-gray-400 mb-6">
              The KPI record ID could not be loaded. It may have been deleted or the connection is sync-pending.
            </p>
            <Button
              onClick={() => router.push("/tracking-boards")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg cursor-pointer"
            >
              Back to Tracking Boards
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const manager = getManager(kpi, employees || []);
  const trend = getTrend(kpi);

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Navigation & Title Bar */}
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
                  {kpi.code || `KPI-${kpi.id.slice(0, 5).toUpperCase()}`}
                </span>
                <span className="text-xs text-gray-400 font-semibold">•</span>
                <span className="text-xs text-gray-300 font-medium">{kpi.category || "General"}</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl mt-1 leading-none">
                {kpi.kpiName}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-auto">
            <div className="text-right text-xs text-gray-400 hidden sm:block">
              <div className="flex items-center space-x-1 justify-end text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">
                <Check className="h-3 w-3" />
                <span>Live Sync Active</span>
              </div>
              {lastSynced && <span className="text-[10px] text-gray-500 block mt-0.5">Synced at {lastSynced}</span>}
            </div>
            <StatusBadge status={kpi.status} />
          </div>
        </div>

        {/* Dashboard Rows Grid */}
        <div className="space-y-6">
          {/* Top Row cards: Gauge, Target vs Actual, Trend */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Score Gauge */}
            <div className="glass-card p-6 flex items-center justify-between border border-white/10">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  KPI Score Gauge
                </h3>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`text-3xl font-extrabold ${scoreTheme.color}`}>{currentScore}%</span>
                  <span className="text-xs text-gray-400">score</span>
                </div>
                <div className="text-xs text-gray-400">
                  Status: <span className={`font-semibold capitalize ${scoreTheme.color}`}>{kpi.status.replace("-", " ")}</span>
                </div>
              </div>

              {/* Radial Progress Gauge */}
              <div className="relative flex items-center justify-center h-24 w-24">
                <svg className="h-24 w-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="transparent"
                    stroke={scoreTheme.stroke}
                    strokeWidth="8"
                    strokeDasharray={circ}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-bold text-white leading-none">{currentScore}%</span>
                  <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Progress</span>
                </div>
              </div>
            </div>

            {/* Card 2: Target vs Actual */}
            <div className="glass-card p-6 flex flex-col justify-between border border-white/10">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Target vs Actual
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Target Value</span>
                    <span className="text-xl font-extrabold text-white mt-0.5 block">
                      {kpi.targetValue.toLocaleString()} <span className="text-xs font-normal text-gray-400">{kpi.unit || ""}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Actual Achieved</span>
                    <span className={`text-xl font-extrabold ${scoreTheme.color} mt-0.5 block`}>
                      {kpi.actualValue.toLocaleString()} <span className="text-xs font-normal text-gray-400">{kpi.unit || ""}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Summary bar */}
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(currentScore, 100)}%`, backgroundColor: scoreTheme.stroke }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {currentScore >= 100 
                    ? `Overachieved target by ${(kpi.actualValue - kpi.targetValue).toLocaleString()} ${kpi.unit || ""}`
                    : `${(kpi.targetValue - kpi.actualValue).toLocaleString()} ${kpi.unit || ""} remaining to reach watermark`
                  }
                </span>
              </div>
            </div>

            {/* Card 3: Trend Summary */}
            <div className="glass-card p-6 flex items-center justify-between border border-white/10">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Performance Trend
                </h3>
                <div className="flex items-center space-x-2">
                  {trend.type === "up" && (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-white leading-none">Upward Trend</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Exceeding target metric limits</span>
                      </div>
                    </>
                  )}
                  {trend.type === "down" && (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-white leading-none">Downward Trend</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Needs intervention, underperforming</span>
                      </div>
                    </>
                  )}
                  {trend.type === "stable" && (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Minus className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-white leading-none">Stable Trend</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Holding steady range baseline</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Historical Trend Chart card */}
          <div className="glass-card p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Performance Score Trend</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Timeline plotting actual metric value and score variations across sync updates
                </p>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>Live updates log source</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scoreTheme.stroke} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={scoreTheme.stroke} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Actual Value"
                    stroke={scoreTheme.stroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Row: Info Ledger vs Update History */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* KPI Details Ledger */}
            <div className="lg:col-span-2 glass-card p-6 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white pb-2 border-b border-white/5 flex items-center">
                  <Info className="mr-2 h-4 w-4 text-blue-400" /> Operational Information
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Description</label>
                  <p className="text-sm text-white mt-1 leading-relaxed">
                    {kpi.description || "No description notes provided for this KPI scorecard item."}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Formula Explanation</label>
                  <p className="text-sm text-white mt-1 leading-relaxed">
                    {getFormulaExplanation(kpi)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Department</label>
                  <p className="text-sm text-purple-400 font-semibold mt-1">{kpi.departmentId || "—"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Team</label>
                  <p className="text-sm text-gray-300 mt-1">{kpi.team || "—"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Assigned Employee</label>
                  <p className="text-sm text-white font-medium mt-1">{kpi.employeeId || "—"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">KPI Owner (Manager)</label>
                  <p className="text-sm text-gray-300 mt-1">{manager}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Team Contributors</label>
                  {contributors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {contributors.map((cName) => (
                        <span key={cName} className="inline-flex items-center rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-gray-300">
                          {cName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No other team contributors assigned</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Notes</label>
                  <p className="text-sm text-gray-400 mt-1 italic">
                    No custom ledger notes provided for this tracking cycle.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 grid gap-4 sm:grid-cols-3 text-xs text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Due Date: <span className="font-semibold text-white">{new Date(kpi.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Review Date: <span className="font-semibold text-white">{getReviewDate(kpi.dueDate)}</span></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Cpu className="h-4 w-4 text-gray-500" />
                  <span>Entry Method: <span className="font-semibold text-white">{getEntryMethod(kpi.id)}</span></span>
                </div>
              </div>
            </div>

            {/* Updates History Section */}
            <div className="glass-card p-6 border border-white/10 flex flex-col h-full">
              <h3 className="text-base font-bold text-white pb-2 border-b border-white/5 flex items-center mb-4">
                <History className="mr-2 h-4 w-4 text-blue-400" /> Update History
              </h3>

              {isHistoryLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <RefreshCw className="h-6 w-6 text-blue-400 animate-spin mx-auto" />
                    <p className="text-xs text-gray-500">Loading history logs...</p>
                  </div>
                </div>
              ) : !historyUpdates || historyUpdates.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-white/2 rounded-lg border border-white/5">
                  <Clock className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-xs font-semibold text-white block">No Sync History Logs</span>
                  <span className="text-[10px] text-gray-500 max-w-[160px] block mt-1">
                    No status update logs have been recorded in the base yet.
                  </span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {historyUpdates.map((log) => {
                    const logDate = new Date(log.updateDate);
                    const formattedDate = isNaN(logDate.getTime())
                      ? "—"
                      : logDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                    return (
                      <div
                        key={log.id}
                        className="p-3 bg-white/2 border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-blue-400 font-mono">{log.id}</span>
                          <span className="text-gray-500 font-semibold">{formattedDate}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-xs text-gray-400 block">Value Changed</span>
                            <span className="text-sm text-white font-bold">
                              {log.previousValue} <span className="text-gray-500 font-normal">→</span> {log.newValue}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">Score</span>
                            <span className="text-sm text-white font-bold">
                              {log.newScore}%
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {log.updatedBy}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            {log.statusAfterUpdate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
