"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useDepartments, useEmployees, useKPIs, useAchievements, useTasks } from "@/hooks/useData";
import {
  Building2,
  Users,
  Target,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  RefreshCw,
  Layers,
  Award,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Flame,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

import { calculateDepartmentScorecard } from "@/lib/scoring";

export default function DepartmentsHubPage() {
  const { data: departments = [], isLoading: isDeptLoading, refetch } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const { data: kpis = [] } = useKPIs();
  const { data: achievements = [] } = useAchievements();
  const { data: tasks = [] } = useTasks();

  const [activeTab, setActiveTab] = useState<"cards" | "table" | "analytics">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Compute enriched standardized metrics for each department via centralized scoring
  const computedDepartments = useMemo(() => {
    return departments
      .map((dept) => calculateDepartmentScorecard(dept, employees, kpis, tasks, achievements))
      .sort((a, b) => b.score - a.score);
  }, [departments, employees, kpis, tasks, achievements]);

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return computedDepartments.filter((d) => {
      const q = searchQuery.toLowerCase();
      return !q || d.name.toLowerCase().includes(q) || d.head.toLowerCase().includes(q);
    });
  }, [computedDepartments, searchQuery]);

  // Overall Department Aggregate Stats
  const stats = useMemo(() => {
    const total = computedDepartments.length;
    const avgScore = total > 0
      ? Math.round(computedDepartments.reduce((sum, d) => sum + d.score, 0) / total)
      : 0;
    const totalMembers = computedDepartments.reduce((sum, d) => sum + d.employeeCount, 0);
    const totalActiveKPIs = computedDepartments.reduce((sum, d) => sum + d.activeKPIs, 0);

    return { total, avgScore, totalMembers, totalActiveKPIs };
  }, [computedDepartments]);

  // Chart dataset for comparison
  const barChartData = useMemo(() => {
    return computedDepartments.map((d) => ({
      name: d.name.split(" ")[0],
      score: d.score,
      completion: d.kpiCompletionRate,
    }));
  }, [computedDepartments]);

  // Radar dataset
  const radarChartData = useMemo(() => {
    return computedDepartments.slice(0, 6).map((d) => ({
      subject: d.name.split(" ")[0],
      Score: d.score,
      Execution: d.taskRate,
      fullMark: 100,
    }));
  }, [computedDepartments]);

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="Department Hub"
            description="Manage business units, compare department velocity, review target vs actual performance, and explore team leaderboards."
          />
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/department-leaderboard">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Leaderboard</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Aggregated Quick Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Total Departments</span>
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <span className="text-[11px] text-slate-500">Active Business Units</span>
          </div>

          <div className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Avg Performance</span>
              <Target className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgScore}%</p>
            <span className="text-[11px] text-emerald-400">Cross-department benchmark</span>
          </div>

          <div className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Total Staff Assigned</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
            <span className="text-[11px] text-slate-500">Across all teams</span>
          </div>

          <div className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Mapped Department KPIs</span>
              <Layers className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalActiveKPIs}</p>
            <span className="text-[11px] text-slate-500">Tracked metrics</span>
          </div>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "cards"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Department Cards</span>
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "table"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Comparative Table</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics & Radar</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* View 1: Department Cards Grid */}
        {activeTab === "cards" && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {filteredDepartments.map((dept, index) => (
              <div
                key={dept.id}
                className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-400">
                        #{index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white">{dept.name}</h4>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      dept.score >= 85
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : dept.score >= 70
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    }`}>
                      {dept.score}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{dept.description}</p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-900/70 border border-slate-800/60 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Team Head</span>
                      <span className="font-semibold text-slate-200 truncate block">{dept.head}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Staff Size</span>
                      <span className="font-semibold text-slate-200">{dept.employeeCount} Members</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active KPIs</span>
                      <span className="font-semibold text-slate-200">{dept.activeKPIs} KPIs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Task Execution</span>
                      <span className="font-semibold text-slate-200">{dept.taskRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{dept.kpiCompletionRate}% Target Met</span>
                  </div>
                  <Link
                    href={`/department-rankings/${dept.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    Drilldown <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View 2: Comparative Table */}
        {activeTab === "table" && (
          <div className="glass-card border border-slate-800/80 bg-[#080d1a]/95 rounded-xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank & Department</th>
                    <th className="py-3 px-3">Head of Department</th>
                    <th className="py-3 px-3 text-center">Employees</th>
                    <th className="py-3 px-3 text-center">Active KPIs</th>
                    <th className="py-3 px-3 text-center">KPI Completion</th>
                    <th className="py-3 px-3 text-center">Task Velocity</th>
                    <th className="py-3 px-3 text-center">Performance Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDepartments.map((dept, index) => (
                    <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{dept.name}</p>
                            <p className="text-[10px] text-slate-400">{dept.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{dept.head}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-300">{dept.employeeCount}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-300">{dept.activeKPIs}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-emerald-400">{dept.kpiCompletionRate}%</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-blue-400">{dept.taskRate}%</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                          dept.score >= 85
                            ? "text-emerald-400 bg-emerald-500/10"
                            : dept.score >= 70
                            ? "text-amber-400 bg-amber-500/10"
                            : "text-rose-400 bg-rose-500/10"
                        }`}>
                          {dept.score}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/department-rankings/${dept.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 3: Analytics & Radar */}
        {activeTab === "analytics" && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
            <div className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-1">Performance Benchmarks</h3>
              <p className="text-xs text-slate-400 mb-4">Department KPI performance vs completion rate</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="score" fill="#3b82f6" name="KPI Score %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completion" fill="#10b981" name="Completion %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-1">Cross-Department Balance Radar</h3>
              <p className="text-xs text-slate-400 mb-4">Relative execution balance across key departments</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                    <PolarRadiusAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                    <Radar name="Score" dataKey="Score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    <Radar name="Execution" dataKey="Execution" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
