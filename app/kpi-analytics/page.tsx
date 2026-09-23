"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { useKPIs, useDepartments, useEmployees } from "@/hooks/useData";
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Filter,
  Download,
  Building2,
  Users
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function KPIAnalyticsPage() {
  const { data: kpis = [], isLoading, refetch } = useKPIs();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    kpis.forEach((k) => {
      if (k.category) set.add(k.category);
    });
    return Array.from(set);
  }, [kpis]);

  const filteredKPIs = useMemo(() => {
    return kpis.filter((k) => {
      const matchDept = selectedDept === "all" || k.departmentId === selectedDept;
      const matchCategory = selectedCategory === "all" || k.category === selectedCategory;
      return matchDept && matchCategory;
    });
  }, [kpis, selectedDept, selectedCategory]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = filteredKPIs.length;
    const completed = filteredKPIs.filter((k) => k.status === "completed").length;
    const inProgress = filteredKPIs.filter((k) => k.status === "in-progress").length;
    const atRisk = filteredKPIs.filter((k) => k.status === "at-risk" || k.status === "overdue").length;
    const avgScore = total > 0
      ? Math.round(filteredKPIs.reduce((sum, k) => sum + (k.score || 0), 0) / total)
      : 0;

    return { total, completed, inProgress, atRisk, avgScore };
  }, [filteredKPIs]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const map: Record<string, { count: number; avgScore: number; sum: number }> = {};
    filteredKPIs.forEach((k) => {
      const cat = k.category || "General";
      if (!map[cat]) map[cat] = { count: 0, avgScore: 0, sum: 0 };
      map[cat].count += 1;
      map[cat].sum += k.score || 0;
    });
    return Object.entries(map).map(([name, val]) => ({
      name,
      count: val.count,
      score: Math.round(val.sum / val.count),
    }));
  }, [filteredKPIs]);

  // Status Distribution for Pie Chart
  const statusPieData = useMemo(() => {
    return [
      { name: "Completed", value: stats.completed, color: "#10b981" },
      { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
      { name: "At Risk / Overdue", value: stats.atRisk, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Department Comparison Data
  const departmentData = useMemo(() => {
    return departments.map((dept) => {
      const deptKPIs = kpis.filter(
        (k) =>
          k.departmentId?.toLowerCase() === dept.departmentName?.toLowerCase() ||
          k.departmentId?.toLowerCase() === dept.id?.toLowerCase()
      );
      const score = deptKPIs.length > 0
        ? Math.round(deptKPIs.reduce((sum, k) => sum + (k.score || 0), 0) / deptKPIs.length)
        : Math.round(dept.averageScore || 0);
      return {
        name: dept.departmentName.split(" ")[0],
        score,
        kpiCount: deptKPIs.length,
      };
    });
  }, [departments, kpis]);

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="KPI Analytics & Intelligence"
            description="Deep dive telemetry, target attainment distribution, category velocity, and organizational health trends."
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
            <Link href="/reports">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
              >
                <span>Export Report</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-3.5 mb-6 border border-slate-800/80 bg-[#080d1a]/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">Filter Scope:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.departmentName}>
                  {d.departmentName}
                </option>
              ))}
            </select>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {(selectedDept !== "all" || selectedCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDept("all");
                  setSelectedCategory("all");
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 h-auto"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Average KPI Score"
            value={`${stats.avgScore}%`}
            icon={Target}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Completed Metrics"
            value={stats.completed}
            icon={CheckCircle2}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={TrendingUp}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="At Risk / Overdue"
            value={stats.atRisk}
            icon={AlertTriangle}
            color="red"
            loading={isLoading}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
          {/* Category Performance Bar Chart */}
          <div className="glass-card p-5 lg:col-span-2 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">Performance by Category</h3>
            <p className="text-xs text-slate-400 mb-4">Average attainment score and metric volume per category</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" name="Avg Score %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" fill="#8b5cf6" name="KPI Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Pie */}
          <div className="glass-card p-5 col-span-1 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">Health Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Proportion of KPIs across lifecycle stages</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cross-Department Score Comparison */}
        <div className="glass-card p-5 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Department Attainment Comparison</h3>
              <p className="text-xs text-slate-400">Benchmarking average KPI scores across all operational departments</p>
            </div>
            <Link href="/department-analytics" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View Radar & Analytics
            </Link>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="score" fill="#10b981" name="Score %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
