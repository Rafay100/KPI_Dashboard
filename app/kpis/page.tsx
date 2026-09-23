"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/kpis/components/StatusBadge";
import { ProgressCell } from "@/features/kpis/components/ProgressCell";
import { KPIDetailDrawer } from "@/features/kpis/components/KPIDetailDrawer";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useKPIs, useEmployees, useDepartments } from "@/hooks/useData";
import type { KPI } from "@/types/models";
import {
  Target,
  Search,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Check
} from "lucide-react";

export default function UnifiedKPIPage() {
  const router = useRouter();
  const { data: kpis = [], isLoading, isError, refetch } = useKPIs();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();

  // Active Tab View: "table" | "scorecards" | "health"
  const [activeTab, setActiveTab] = useState<"table" | "scorecards" | "health">("table");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState<keyof KPI | "trend">("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination for Table View
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawer detail state
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleOpenDetail = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsDrawerOpen(true);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    kpis.forEach((k) => {
      if (k.category) set.add(k.category);
    });
    return Array.from(set);
  }, [kpis]);

  // Health Calculation helper
  const getKPIHealth = (kpi: KPI) => {
    const score = kpi.score ?? 0;
    if (score >= 90 || kpi.status === "completed") {
      return { label: "On Track", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 };
    } else if (score >= 70) {
      return { label: "Warning", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle };
    } else {
      return { label: "Critical", badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertOctagon };
    }
  };

  // Trend helper
  const getTrend = (kpi: KPI) => {
    const actual = kpi.actualValue;
    const target = kpi.targetValue;
    if (target <= 0) return { label: "Stable", icon: Minus, color: "text-slate-400" };
    const ratio = actual / target;
    if (ratio >= 1.0) return { label: "Up", icon: TrendingUp, color: "text-emerald-400" };
    if (ratio >= 0.9) return { label: "Stable", icon: Minus, color: "text-amber-400" };
    return { label: "Down", icon: TrendingDown, color: "text-rose-400" };
  };

  // Filtered and Sorted KPIs
  const filteredKPIs = useMemo(() => {
    return kpis.filter((kpi) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        kpi.kpiName.toLowerCase().includes(q) ||
        kpi.description?.toLowerCase().includes(q) ||
        kpi.departmentId?.toLowerCase().includes(q) ||
        kpi.employeeId?.toLowerCase().includes(q) ||
        kpi.code?.toLowerCase().includes(q);

      const matchDept = selectedDept === "all" || kpi.departmentId === selectedDept;
      const matchStatus = selectedStatus === "all" || kpi.status === selectedStatus;
      const matchCategory = selectedCategory === "all" || kpi.category === selectedCategory;

      return matchSearch && matchDept && matchStatus && matchCategory;
    }).sort((a, b) => {
      let aVal = a[sortField as keyof KPI] ?? 0;
      let bVal = b[sortField as keyof KPI] ?? 0;
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
      return sortDirection === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [kpis, searchQuery, selectedDept, selectedStatus, selectedCategory, sortField, sortDirection]);

  // Paginated KPIs
  const paginatedKPIs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKPIs.slice(start, start + pageSize);
  }, [filteredKPIs, currentPage]);

  const totalPages = Math.ceil(filteredKPIs.length / pageSize) || 1;

  // Toggle Sorting
  const handleSort = (field: keyof KPI) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="KPI Management"
            description="Comprehensive organizational KPIs, target tracking, actuals entry, and performance scorecards."
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
              <span>Sync</span>
            </Button>
            <Link href="/create-kpi">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create KPI</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => { setActiveTab("table"); setCurrentPage(1); }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "table"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tracking Table</span>
            </button>
            <button
              onClick={() => { setActiveTab("scorecards"); }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "scorecards"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Live Scorecards</span>
            </button>
            <button
              onClick={() => { setActiveTab("health"); }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "health"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Health & Risk Audit</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-semibold">{filteredKPIs.length}</span> of {kpis.length} KPIs
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-3.5 mb-6 border border-slate-800/80 bg-[#080d1a]/90 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search KPIs by name, code, owner..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.departmentName}>
                  {d.departmentName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="at-risk">At Risk</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {(searchQuery || selectedDept !== "all" || selectedStatus !== "all" || selectedCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDept("all");
                  setSelectedStatus("all");
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 h-auto"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* View 1: Master Tracking Table */}
        {activeTab === "table" && (
          <div className="glass-card border border-slate-800/80 bg-[#080d1a]/95 rounded-xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("kpiName")}>
                      <div className="flex items-center space-x-1">
                        <span>KPI Name & Code</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Owner / Assignee</th>
                    <th className="py-3 px-3 text-right cursor-pointer" onClick={() => handleSort("targetValue")}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Target</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right cursor-pointer" onClick={() => handleSort("actualValue")}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Actual</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 cursor-pointer" onClick={() => handleSort("score")}>
                      <div className="flex items-center space-x-1">
                        <span>Performance</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Trend</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        Loading KPI records...
                      </td>
                    </tr>
                  ) : paginatedKPIs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No KPIs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedKPIs.map((kpi) => {
                      const trend = getTrend(kpi);
                      const TrendIcon = trend.icon;
                      return (
                        <tr
                          key={kpi.id}
                          onClick={() => handleOpenDetail(kpi)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{kpi.kpiName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {kpi.code || kpi.id} • {kpi.category || "General"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{kpi.departmentId || "—"}</td>
                          <td className="py-3 px-3 text-slate-300">{kpi.employeeId || kpi.owner || "Unassigned"}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                            {kpi.targetValue} {kpi.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {kpi.actualValue} {kpi.unit}
                          </td>
                          <td className="py-3 px-3">
                            <ProgressCell score={kpi.score || 0} actual={kpi.actualValue || 0} target={kpi.targetValue || 0} />
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={kpi.status} />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className={`inline-flex items-center space-x-1 ${trend.color} font-medium`}>
                              <TrendIcon className="h-3.5 w-3.5" />
                              <span className="text-[11px]">{trend.label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetail(kpi)}
                                className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                              >
                                Quick View
                              </Button>
                              <Link href={`/kpis/${kpi.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 border-slate-800"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2 border-slate-800"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 2: Live Scorecards Grid */}
        {activeTab === "scorecards" && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {filteredKPIs.map((kpi) => {
              const trend = getTrend(kpi);
              const TrendIcon = trend.icon;
              return (
                <div
                  key={kpi.id}
                  onClick={() => handleOpenDetail(kpi)}
                  className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 hover:border-slate-700 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        {kpi.code || kpi.id}
                      </span>
                      <h4 className="text-sm font-semibold text-white leading-snug">{kpi.kpiName}</h4>
                    </div>
                    <StatusBadge status={kpi.status} />
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {kpi.description || "Continuous KPI tracking and telemetry stream."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/60 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {kpi.targetValue} {kpi.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Actual</span>
                      <span className="font-bold text-white font-mono">
                        {kpi.actualValue} {kpi.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Score</span>
                      <span className="font-bold text-white">{kpi.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          kpi.score >= 90 ? "bg-emerald-500" : kpi.score >= 70 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, kpi.score)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{kpi.departmentId || "General"}</span>
                    <div className={`flex items-center space-x-1 ${trend.color}`}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{trend.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 3: Health & Risk Audit */}
        {activeTab === "health" && (
          <div className="space-y-6 mb-6">
            {/* Grouped by Health: Critical, Warning, On Track */}
            {["Critical", "Warning", "On Track"].map((healthCategory) => {
              const items = filteredKPIs.filter((k) => getKPIHealth(k).label === healthCategory);
              const headerColor =
                healthCategory === "Critical"
                  ? "text-rose-400 border-rose-500/20 bg-rose-950/20"
                  : healthCategory === "Warning"
                  ? "text-amber-400 border-amber-500/20 bg-amber-950/20"
                  : "text-emerald-400 border-emerald-500/20 bg-emerald-950/20";

              return (
                <div key={healthCategory} className="glass-card border border-slate-800/80 bg-[#080d1a]/95 rounded-xl p-4">
                  <div className={`flex items-center justify-between p-3 rounded-lg border mb-4 ${headerColor}`}>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">{healthCategory} Standing</span>
                      <span className="text-xs opacity-80">({items.length} KPIs)</span>
                    </div>
                    <span className="text-xs font-semibold">
                      {healthCategory === "Critical" ? "Immediate Action Recommended" : healthCategory === "Warning" ? "Monitor Closely" : "Healthy Velocity"}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No KPIs in this category.</p>
                  ) : (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((kpi) => (
                        <div
                          key={kpi.id}
                          onClick={() => handleOpenDetail(kpi)}
                          className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{kpi.kpiName}</p>
                            <p className="text-[11px] text-slate-400">
                              {kpi.departmentId} • {kpi.actualValue}/{kpi.targetValue} {kpi.unit}
                            </p>
                          </div>
                          <span className="font-bold text-white text-sm">{kpi.score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* KPI Detail Drawer */}
        {selectedKPI && (
          <KPIDetailDrawer
            kpi={selectedKPI}
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setSelectedKPI(null);
            }}
          />
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
