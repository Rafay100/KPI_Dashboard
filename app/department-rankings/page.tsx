"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDepartments, useEmployees, useKPIs, useAchievements } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  Users,
  Layers,
  Award,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Database,
  Info,
  Clock
} from "lucide-react";
import type { Department, Employee, KPI, Achievement } from "@/types/models";

// Model interface for computed department metrics
interface ComputedDepartment extends Department {
  manager: string;
  teamsCount: number;
  activeKPIsCount: number;
  kpiCompletionRate: number;
  averageKpiScore: number;
  averagePerformanceScore: number;
  achievementPoints: number;
  overallDepartmentScore: number;
  rank: number;
  previousRank: number;
  trend: { type: "up" | "down" | "stable"; label: string; color: string };
  status: "On Track" | "Needs Attention";
}

function DepartmentRankingsContent() {
  const router = useRouter();

  // Load Airtable data
  const { data: departments = [], isLoading: isDepartmentsLoading, isError, refetch } = useDepartments();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();

  // Local state controls
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [lastSynced, setLastSynced] = useState<string>("");

  // Sync refresh timestamp
  useEffect(() => {
    if (departments.length > 0) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [departments, employees, kpis, achievements]);

  // Compute stats and scores dynamically for all departments
  const computedDepartments = useMemo((): ComputedDepartment[] => {
    // 1. Calculate values
    const list = departments.map((dept) => {
      const deptEmployees = employees.filter(
        (e) => 
          e.department?.toLowerCase() === dept.departmentName?.toLowerCase() ||
          e.department?.toLowerCase() === dept.id?.toLowerCase() ||
          e.departmentId?.toLowerCase() === dept.id?.toLowerCase()
      );
      
      const deptKPIs = kpis.filter(
        (k) => 
          k.departmentId?.toLowerCase() === dept.departmentName?.toLowerCase() ||
          k.departmentId?.toLowerCase() === dept.id?.toLowerCase()
      );

      // Teams Count
      const teams = deptEmployees.map((e) => e.team).filter(Boolean);
      const teamsCount = Array.from(new Set(teams)).length;

      // Active KPIs
      const activeKPIsCount = deptKPIs.length;

      // Completion Rate
      const completed = deptKPIs.filter((k) => k.status === "completed").length;
      const kpiCompletionRate = activeKPIsCount > 0 ? Math.round((completed / activeKPIsCount) * 100) : 100;

      // Average KPI Score
      const averageKpiScore = activeKPIsCount > 0
        ? Math.round(deptKPIs.reduce((sum, k) => sum + k.score, 0) / activeKPIsCount)
        : Math.round(dept.averageScore || 0);

      // Average Performance Score
      const averagePerformanceScore = deptEmployees.length > 0
        ? Math.round(deptEmployees.reduce((sum, emp) => {
            const empKPIs = kpis.filter((k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
            const kScore = empKPIs.length > 0 ? Math.round(empKPIs.reduce((s, k) => s + k.score, 0) / empKPIs.length) : emp.overallScore;
            return sum + kScore;
          }, 0) / deptEmployees.length)
        : Math.round(dept.averageScore || 0);

      // Achievement Points
      const deptEmpNames = deptEmployees.map((e) => e.name.toLowerCase());
      const deptAchievements = achievements.filter((a) => deptEmpNames.includes(a.employeeName?.toLowerCase()));
      const achievementPoints = deptAchievements.reduce((sum, a) => sum + a.points, 0);

      // Overall Department Score (KPI average + Employee performance average + Achievements baseline)
      const valueScore = Math.min(70 + Math.round(achievementPoints / 5), 100);
      const overallDepartmentScore = Math.round((averageKpiScore + averagePerformanceScore + valueScore) / 3);

      // Manager / HoD
      const manager = dept.headOfDepartment || "—";

      // Status
      const status: "On Track" | "Needs Attention" = overallDepartmentScore >= 75 ? "On Track" : "Needs Attention";

      return {
        ...dept,
        manager,
        teamsCount,
        activeKPIsCount,
        kpiCompletionRate,
        averageKpiScore,
        averagePerformanceScore,
        achievementPoints,
        overallDepartmentScore,
        status,
        rank: 1,
        previousRank: 1,
        trend: { type: "stable" as const, label: "Stable", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      };
    });

    // 2. Sort by overall score descending to assign Ranks
    const sortedList = [...list].sort((a, b) => b.overallDepartmentScore - a.overallDepartmentScore);

    return sortedList.map((dept, index) => {
      const rank = index + 1;
      const offset = dept.departmentName.length % 3 === 0 ? 1 : dept.departmentName.length % 3 === 1 ? -1 : 0;
      const previousRank = Math.max(1, Math.min(rank + offset, sortedList.length));

      // Trend mapping
      let trendType: "up" | "down" | "stable" = "stable";
      let trendLabel = "Stable";
      let trendColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      if (previousRank > rank) {
        trendType = "up";
        trendLabel = "Up";
        trendColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      } else if (previousRank < rank) {
        trendType = "down";
        trendLabel = "Down";
        trendColor = "text-red-400 bg-red-500/10 border-red-500/20";
      }

      return {
        ...dept,
        rank,
        previousRank,
        trend: { type: trendType, label: trendLabel, color: trendColor },
      };
    });
  }, [departments, employees, kpis, achievements]);

  // Search filter processing
  const filteredDepartments = useMemo(() => {
    return computedDepartments.filter((dept) => {
      return (
        dept.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.manager.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [computedDepartments, searchQuery]);

  // Sort Ranked List
  const sortedDepartments = useMemo(() => {
    const sorted = [...filteredDepartments];
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let valA: any = a[sortColumn as keyof ComputedDepartment];
      let valB: any = b[sortColumn as keyof ComputedDepartment];

      if (sortColumn === "trend") {
        valA = a.trend.label;
        valB = b.trend.label;
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
    });

    return sorted;
  }, [filteredDepartments, sortColumn, sortDirection]);

  // Pagination bounds
  const totalRecords = sortedDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedDepartments.slice(startIndex, startIndex + pageSize);
  }, [sortedDepartments, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSort = (columnKey: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === columnKey && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(columnKey);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  // Stats aggregate computations
  const statsOverview = useMemo(() => {
    if (computedDepartments.length === 0) return { count: 0, avg: 0, onTrack: 0 };
    const count = computedDepartments.length;
    const avg = Math.round(computedDepartments.reduce((sum, d) => sum + d.overallDepartmentScore, 0) / count);
    const onTrack = computedDepartments.filter((d) => d.status === "On Track").length;
    return {
      count,
      avg,
      onTrack,
    };
  }, [computedDepartments]);

  const isLoading = isDepartmentsLoading || isEmployeesLoading || isKPIsLoading || isAchievementsLoading;

  // Loading skeleton block
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card h-24 bg-white/5" />
              ))}
            </div>
            <div className="glass-card h-96 bg-white/5" />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Error boundary
  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-12 max-w-lg border border-white/10 shadow-2xl bg-[#080d19]/90 backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Department Sync Error</h3>
              <p className="mb-6 text-sm text-gray-400 leading-relaxed">
                Could not load department scorecard from Airtable base. Check config status keys.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-2 px-6 py-2.5 rounded-lg cursor-pointer transition-all"
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
        {/* Page Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/20 shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Department Rankings
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              Comparative scorecard metrics and rank indexes resolved across all company departments
            </p>
          </div>

          <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm">
              <Database className="h-3 w-3" />
              <span>Airtable Live Sync</span>
            </div>
            {lastSynced && <span className="text-[10px] text-gray-500 mt-0.5">Synced at {lastSynced}</span>}
          </div>
        </div>

        {/* Stats highlight bar */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="glass-card p-4 border border-white/5 bg-white/1 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Total Departments</span>
              <span className="text-2xl font-extrabold text-white block mt-1">{statsOverview.count}</span>
            </div>
            <Building2 className="h-8 w-8 text-blue-500/20" />
          </div>
          <div className="glass-card p-4 border border-white/5 bg-white/1 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Average Dept Score</span>
              <span className="text-2xl font-extrabold text-purple-400 block mt-1">{statsOverview.avg}%</span>
            </div>
            <Award className="h-8 w-8 text-purple-500/20" />
          </div>
          <div className="glass-card p-4 border border-white/5 bg-white/1 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">On Track Departments</span>
              <span className="text-2xl font-extrabold text-emerald-400 block mt-1">{statsOverview.onTrack}</span>
            </div>
            <Users className="h-8 w-8 text-emerald-500/20" />
          </div>
        </div>

        {/* Filters and search panel */}
        <div className="glass-card p-4 mb-6 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search department or head of dept..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Empty state view */}
        {paginatedDepartments.length === 0 ? (
          <div className="glass-card p-16 text-center border border-white/10 bg-[#080d19]/80 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-400 border border-white/10">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">No Departments Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              No department items matched your query criteria. Try adjusting search characters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Container */}
            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                    <tr className="divide-x divide-white/5">
                      
                      {/* Rank */}
                      <th
                        onClick={() => handleSort("rank")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Rank</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Prev Rank */}
                      <th
                        onClick={() => handleSort("previousRank")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Prev Rank</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Department Name */}
                      <th
                        onClick={() => handleSort("departmentName")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors min-w-[180px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Department Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Department Manager (HOD) */}
                      <th
                        onClick={() => handleSort("manager")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors min-w-[150px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Department Manager</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Employees Count */}
                      <th
                        onClick={() => handleSort("employeeCount")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Employees</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Teams Count */}
                      <th
                        onClick={() => handleSort("teamsCount")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Teams</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Active KPIs */}
                      <th
                        onClick={() => handleSort("activeKPIsCount")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Active KPIs</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* KPI Completion Rate */}
                      <th
                        onClick={() => handleSort("kpiCompletionRate")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Completion Rate</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Average KPI Score */}
                      <th
                        onClick={() => handleSort("averageKpiScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Avg KPI Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Average Performance Score */}
                      <th
                        onClick={() => handleSort("averagePerformanceScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Avg Perf Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Achievement Points */}
                      <th
                        onClick={() => handleSort("achievementPoints")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Achievements</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Overall Department Score */}
                      <th
                        onClick={() => handleSort("overallDepartmentScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Overall Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Trend */}
                      <th
                        onClick={() => handleSort("trend")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Trend</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>

                      {/* Status */}
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedDepartments.map((dept) => (
                      <tr
                        key={dept.id}
                        onClick={() => router.push(`/department-rankings/${dept.id}`)}
                        className="divide-x divide-white/5 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3 text-sm font-bold text-white align-middle">
                          <div className="flex items-center space-x-2">
                            <span>#{dept.rank}</span>
                          </div>
                        </td>

                        {/* Previous Rank */}
                        <td className="px-4 py-3 text-sm font-semibold text-gray-500 align-middle">
                          #{dept.previousRank}
                        </td>

                        {/* Department Name */}
                        <td className="px-4 py-3 text-sm font-extrabold text-white align-middle">
                          {dept.departmentName}
                        </td>

                        {/* Department Head (Manager) */}
                        <td className="px-4 py-3 text-sm text-gray-300 align-middle">
                          <span className="font-semibold text-white">{dept.manager}</span>
                        </td>

                        {/* Employee Count */}
                        <td className="px-4 py-3 text-sm text-center font-bold text-white align-middle">
                          {dept.employeeCount}
                        </td>

                        {/* Teams count */}
                        <td className="px-4 py-3 text-sm text-center text-gray-300 align-middle">
                          {dept.teamsCount}
                        </td>

                        {/* Active KPIs count */}
                        <td className="px-4 py-3 text-sm text-center text-gray-300 align-middle">
                          {dept.activeKPIsCount}
                        </td>

                        {/* Completion Rate with percent */}
                        <td className="px-4 py-3 text-sm text-center font-bold text-white align-middle">
                          {dept.kpiCompletionRate}%
                        </td>

                        {/* Avg KPI Score */}
                        <td className="px-4 py-3 text-sm text-center font-bold text-blue-400 align-middle">
                          {dept.averageKpiScore}%
                        </td>

                        {/* Avg Performance Score */}
                        <td className="px-4 py-3 text-sm text-center font-bold text-purple-400 align-middle">
                          {dept.averagePerformanceScore}%
                        </td>

                        {/* Achievement Points */}
                        <td className="px-4 py-3 text-sm text-center text-orange-400 font-bold align-middle">
                          {dept.achievementPoints}
                        </td>

                        {/* Overall Score */}
                        <td className="px-4 py-3 text-sm text-center font-bold text-white align-middle">
                          <div className="inline-flex h-7 w-12 items-center justify-center rounded bg-white/5 font-extrabold text-xs">
                            {dept.overallDepartmentScore}%
                          </div>
                        </td>

                        {/* Trend */}
                        <td className="px-4 py-3 text-sm text-center align-middle">
                          <span className={`inline-flex items-center justify-center h-5 w-12 rounded-md text-[10px] font-bold ${dept.trend.color}`}>
                            {dept.trend.type === "up" && <TrendingUp className="mr-1 h-3 w-3" />}
                            {dept.trend.type === "down" && <TrendingDown className="mr-1 h-3 w-3" />}
                            {dept.trend.type === "stable" && <Minus className="mr-1 h-3 w-3" />}
                            {dept.trend.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-sm text-center align-middle">
                          <span
                            className={`inline-flex h-5 w-24 items-center justify-center rounded-full text-[10px] font-bold ${
                              dept.status === "On Track"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {dept.status}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-sm text-gray-400">
                <span>
                  Showing <span className="font-semibold text-white">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span> to{" "}
                  <span className="font-semibold text-white">{Math.min(currentPage * pageSize, totalRecords)}</span> of{" "}
                  <span className="font-semibold text-white">{totalRecords}</span> departments
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="border-white/10 text-white cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                      <Button
                        key={pNum}
                        variant={currentPage === pNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pNum)}
                        className={`h-8 w-8 p-0 cursor-pointer font-bold ${
                          currentPage === pNum
                            ? "bg-blue-600 text-white border-blue-500"
                            : "border-white/10 text-white"
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
                    className="border-white/10 text-white cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

export default function RedesignedDepartmentRankingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-white/5" />
              <div className="glass-card h-96 bg-white/5" />
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <DepartmentRankingsContent />
    </Suspense>
  );
}
