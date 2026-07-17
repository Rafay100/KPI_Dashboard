"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useDashboardData } from "@/hooks/useData";
import {
  Trophy, Award, Star, TrendingUp, Search, Filter,
  ArrowUpDown, X, ChevronLeft, ChevronRight, AlertCircle, RefreshCw,
  Eye, SlidersHorizontal, CalendarDays, Zap, Building2, User
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/Button";
import type { Achievement } from "@/types/models";

// ─── Constants & Types ────────────────────────────────────────────────────────

type SortKey = "title" | "employeeName" | "department" | "category" | "points" | "achievedAt" | "badge" | "impactLevel";
type SortDirection = "asc" | "desc";

interface EnrichedAchievement extends Achievement {
  department: string;
  badgeType: string;
  impactLevel: "High" | "Medium" | "Low";
}

interface ColumnConfig {
  key: SortKey;
  label: string;
  visible: boolean;
}

const CATEGORIES = ["kpi-completion", "milestone", "excellence", "teamwork"];
const IMPACTS = ["High", "Medium", "Low"] as const;

export default function Achievements() {
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardData();
  const achievements = useMemo(() => dashboardData?.achievements || [], [dashboardData]);
  const employees = useMemo(() => dashboardData?.employees || [], [dashboardData]);

  // Client mount state for lazy rendering charts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Toolbar States ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [impactFilter, setImpactFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // ── Sort States ─────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>("achievedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // ── Pagination States ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // ── Column Visibility ──────────────────────────────────────────────────────
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "title", label: "Achievement Title", visible: true },
    { key: "employeeName", label: "Employee Name", visible: true },
    { key: "department", label: "Department", visible: true },
    { key: "category", label: "Category", visible: true },
    { key: "badge", label: "Badge Type", visible: true },
    { key: "impactLevel", label: "Impact", visible: true },
    { key: "points", label: "Points", visible: true },
    { key: "achievedAt", label: "Earned Date", visible: true },
  ]);

  const handleRefresh = async () => {
    await refetch();
  };

  // ── Enrich Achievements with Department & Impact Level ──────────────────────
  const enrichedAchievements = useMemo((): EnrichedAchievement[] => {
    return achievements.map((a) => {
      // Find employee's department from the live employee hook
      const emp = employees.find(e => e.name.toLowerCase() === a.employeeName.toLowerCase());
      const department = emp?.department || "Unassigned";

      // Dynamically define Badge Type fallback
      const badgeType = a.badge || "Standard";

      // Map Impact Level dynamically based on points weight to keep business logic clean
      let impactLevel: "High" | "Medium" | "Low" = "Low";
      if (a.points >= 100) impactLevel = "High";
      else if (a.points >= 50) impactLevel = "Medium";

      return {
        ...a,
        department,
        badgeType,
        impactLevel,
      };
    });
  }, [achievements, employees]);

  // Unique list generators for filter options
  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(enrichedAchievements.map(a => a.department).filter(Boolean)));
  }, [enrichedAchievements]);

  const uniqueEmployees = useMemo(() => {
    return Array.from(new Set(enrichedAchievements.map(a => a.employeeName).filter(Boolean)));
  }, [enrichedAchievements]);

  const uniqueBadges = useMemo(() => {
    return Array.from(new Set(enrichedAchievements.map(a => a.badgeType).filter(Boolean)));
  }, [enrichedAchievements]);

  // ── Advanced Filtering ──────────────────────────────────────────────────────
  const filteredAchievements = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return enrichedAchievements.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.employeeName.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q);

      const matchDept = !deptFilter || a.department === deptFilter;
      const matchEmp = !empFilter || a.employeeName === empFilter;
      const matchCategory = !categoryFilter || a.category === categoryFilter;
      const matchBadge = !badgeFilter || a.badgeType === badgeFilter;
      const matchImpact = !impactFilter || a.impactLevel === impactFilter;

      let matchDates = true;
      if (startDate || endDate) {
        const itemTime = new Date(a.achievedAt).getTime();
        if (startDate && itemTime < new Date(startDate).getTime()) matchDates = false;
        if (endDate && itemTime > new Date(endDate).getTime()) matchDates = false;
      }

      return matchSearch && matchDept && matchEmp && matchCategory && matchBadge && matchImpact && matchDates;
    });
  }, [enrichedAchievements, searchQuery, deptFilter, empFilter, categoryFilter, badgeFilter, impactFilter, startDate, endDate]);

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const sortedAchievements = useMemo(() => {
    const sorted = [...filteredAchievements];
    sorted.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === "achievedAt") {
        const tA = new Date(a.achievedAt).getTime();
        const tB = new Date(b.achievedAt).getTime();
        return sortDir === "asc" ? tA - tB : tB - tA;
      }

      if (typeof valA === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA);
      } else {
        return sortDir === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });
    return sorted;
  }, [filteredAchievements, sortKey, sortDir]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalRecords = sortedAchievements.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedAchievements = useMemo(() => {
    return sortedAchievements.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedAchievements, currentPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const toggleColumnVisibility = (key: SortKey) => {
    setColumns(prev =>
      prev.map(col => col.key === key ? { ...col, visible: !col.visible } : col)
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setDeptFilter("");
    setEmpFilter("");
    setCategoryFilter("");
    setBadgeFilter("");
    setImpactFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    deptFilter, empFilter, categoryFilter, badgeFilter, impactFilter, startDate, endDate
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    if (!achievements.length) return { total: 0, points: 0, categories: 0 };
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    const categoriesCount = new Set(achievements.map((a) => a.category)).size;
    return {
      total: achievements.length,
      points: totalPoints,
      categories: categoriesCount,
    };
  }, [achievements]);

  const monthlyTrendData = useMemo(() => {
    if (!achievements.length) return [];
    const groups: Record<string, number> = {};
    achievements.forEach((a) => {
      if (!a.achievedAt) return;
      const date = new Date(a.achievedAt);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.keys(groups)
      .sort()
      .map((key) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        return {
          month: monthName,
          count: groups[key],
        };
      });
  }, [achievements]);

  const departmentDistributionData = useMemo(() => {
    if (!enrichedAchievements.length) return [];
    const groups: Record<string, number> = {};
    enrichedAchievements.forEach((a) => {
      const dept = a.department || "Unassigned";
      groups[dept] = (groups[dept] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({
      name,
      value,
    }));
  }, [enrichedAchievements]);



  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Achievements" description="Celebrate milestones, completed KPIs, and team accomplishments" />
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-28 animate-pulse bg-white/5" />
            ))}
          </div>

          <div className="glass-card h-80 animate-pulse bg-white/5 mb-6" />
          <div className="glass-card h-96 animate-pulse bg-white/5" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  // ── Error State ──
  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-12 w-12 text-red-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Data Connection Failure</h2>
            <p className="text-sm text-gray-400">Failed to load Achievements from Airtable backend.</p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Achievements"
          description="Celebrate milestones, completed KPIs, and team accomplishments"
        />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <StatCard
            title="Total Achievements"
            value={stats.total}
            icon={Trophy}
            color="purple"
          />
          <StatCard
            title="Total Achievement Points"
            value={stats.points}
            icon={Star}
            color="orange"
          />
          <StatCard
            title="High Impact Achievements"
            value={achievements.filter(a => a.points >= 100).length}
            icon={Award}
            color="red"
          />
          <StatCard
            title="KPI Linked Achievements"
            value={achievements.filter(a => a.category === "kpi-completion").length}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Monthly Achievement Trend">
            {isMounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Achievements"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center bg-white/5 animate-pulse rounded-lg" />
            )}
          </ChartCard>

          <ChartCard title="Achievement Distribution by Department">
            {isMounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    name="Achievements"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center bg-white/5 animate-pulse rounded-lg" />
            )}
          </ChartCard>
        </div>

        {/* Toolbar */}
        <div className="glass-card p-4 mb-4 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl relative z-40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            
            {/* Search */}
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Title, Employee, Department..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center space-x-2 self-end md:self-auto">
              {/* Columns Visibility Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                  className="border-white/10 text-white cursor-pointer bg-white/5 flex items-center space-x-1.5"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Columns</span>
                </Button>
                {showColumnsMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-white/10 bg-[#080d19] shadow-2xl z-50 p-2.5 space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase px-2 py-1 block">Visible Columns</span>
                    {columns.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center space-x-2.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-xs font-semibold text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="rounded border-white/10 text-blue-600 bg-white/5 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters Panel Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`border-white/10 text-white cursor-pointer bg-white/5 flex items-center space-x-1.5 ${
                  showFilters ? "border-blue-500/50 bg-blue-500/5" : ""
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">{activeFiltersCount}</span>
                )}
              </Button>

              {(activeFiltersCount > 0 || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 py-0.5 px-2 h-9 text-[10px] font-bold cursor-pointer rounded"
                >
                  Clear Filters
                </Button>
              )}
            </div>

          </div>

          {/* Advanced Filter grid */}
          {showFilters && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 border-t border-white/5 mt-4 pt-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Department</span>
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Departments</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Employee</span>
                <select
                  value={empFilter}
                  onChange={(e) => { setEmpFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Employees</option>
                  {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Category</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, " ")}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Badge Type</span>
                <select
                  value={badgeFilter}
                  onChange={(e) => { setBadgeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Badges</option>
                  {uniqueBadges.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Impact Level</span>
                <select
                  value={impactFilter}
                  onChange={(e) => { setImpactFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Impact</option>
                  {IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Earned From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold block">Earned To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1 text-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table list */}
        <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                <tr className="divide-x divide-white/5">
                  {columns.filter(c => c.visible).map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider relative group"
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center space-x-1.5 hover:text-white transition-colors focus:outline-none font-bold"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedAchievements.length === 0 ? (
                  <tr>
                    <td colSpan={columns.filter(c => c.visible).length} className="px-4 py-16 text-center text-xs text-gray-500">
                      <Trophy className="h-8 w-8 text-gray-700 mx-auto mb-2 opacity-50" />
                      No achievements match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedAchievements.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5 divide-x divide-white/5"
                    >
                      {columns.find(c => c.key === "title")?.visible && (
                        <td className="px-4 py-3 text-xs font-bold align-middle">
                          <div className="font-extrabold text-sm text-white">{item.title}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{item.description}</div>
                        </td>
                      )}
                      
                      {columns.find(c => c.key === "employeeName")?.visible && (
                        <td className="px-4 py-3 text-sm font-bold text-white align-middle">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            {item.employeeName}
                          </div>
                        </td>
                      )}

                      {columns.find(c => c.key === "department")?.visible && (
                        <td className="px-4 py-3 text-xs font-medium align-middle text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            {item.department}
                          </div>
                        </td>
                      )}

                      {columns.find(c => c.key === "category")?.visible && (
                        <td className="px-4 py-3 text-xs font-semibold align-middle text-purple-400 capitalize">
                          <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5">
                            {item.category.replace(/-/g, " ")}
                          </span>
                        </td>
                      )}

                      {columns.find(c => c.key === "badge")?.visible && (
                        <td className="px-4 py-3 text-xs font-bold align-middle text-violet-300">
                          <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5">
                            {item.badgeType}
                          </span>
                        </td>
                      )}

                      {columns.find(c => c.key === "impactLevel")?.visible && (
                        <td className="px-4 py-3 text-xs font-bold align-middle">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 ${
                            item.impactLevel === "High"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : item.impactLevel === "Medium"
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {item.impactLevel}
                          </span>
                        </td>
                      )}

                      {columns.find(c => c.key === "points")?.visible && (
                        <td className="px-4 py-3 text-sm font-bold text-orange-400 align-middle">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-orange-400/20" />
                            +{item.points} pts
                          </div>
                        </td>
                      )}

                      {columns.find(c => c.key === "achievedAt")?.visible && (
                        <td className="px-4 py-3 text-xs text-gray-400 align-middle">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                            {new Date(item.achievedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30">
              <span>
                Showing <span className="font-semibold text-white">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span>–<span className="font-semibold text-white">{Math.min(currentPage * pageSize, totalRecords)}</span> of{" "}
                <span className="font-semibold text-white">{totalRecords}</span> entries
              </span>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="border-white/10 text-white cursor-pointer h-8 py-0"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                
                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <Button
                      key={pNum}
                      variant={currentPage === pNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pNum)}
                      className={`h-8 w-8 p-0 cursor-pointer font-bold ${
                        currentPage === pNum ? "bg-blue-600 text-white border-blue-500" : "border-white/10 text-white"
                      }`}
                    >
                      {pNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="border-white/10 text-white cursor-pointer h-8 py-0"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
