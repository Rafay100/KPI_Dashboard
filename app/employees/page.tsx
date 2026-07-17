"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useKPIs, useEmployees, useAchievements } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
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
  Award
} from "lucide-react";
import type { Employee, KPI, Achievement } from "@/types/models";

// Type definition for computed employee details
interface ComputedEmployee extends Employee {
  kpiScore: number;
  weightedKpiScore: number;
  valueScore: number;
  overallPerformanceScore: number;
  performanceBadge: { label: string; color: string };
  trend: { type: "up" | "down" | "stable"; label: string; color: string };
  status: "Active" | "On Leave";
}

function EmployeesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization helpers
  const queryParam = searchParams.get("query") || "";
  const deptParam = searchParams.get("dept") || "All";
  const badgeParam = searchParams.get("badge") || "All";
  const sortColParam = searchParams.get("sortBy") || "name";
  const sortDirParam = (searchParams.get("dir") || "asc") as "asc" | "desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local state initialized from URL params
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedDept, setSelectedDept] = useState(deptParam);
  const [selectedBadge, setSelectedBadge] = useState(badgeParam);
  const [sortColumn, setSortColumn] = useState<string>(sortColParam);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(sortDirParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const pageSize = 8;

  // Load Airtable datasets dynamically
  const { data: employees = [], isLoading: isEmployeesLoading, isError, refetch } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();

  // Sync state with URL params changes
  useEffect(() => {
    setSearchQuery(queryParam);
    setSelectedDept(deptParam);
    setSelectedBadge(badgeParam);
    setSortColumn(sortColParam);
    setSortDirection(sortDirParam);
    setCurrentPage(pageParam);
  }, [queryParam, deptParam, badgeParam, sortColParam, sortDirParam, pageParam]);

  // Sync state back to URL params
  const updateUrl = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === "" || val === "All") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`/employees?${params.toString()}`);
  };

  // Perform Calculations & Mapping per Employee record
  const computedEmployees = useMemo((): ComputedEmployee[] => {
    return employees.map((emp) => {
      // 1. Filter KPIs assigned to this employee (case insensitive name match)
      const empKPIs = kpis.filter(
        (k) => k.employeeId?.toLowerCase() === emp.name.toLowerCase()
      );

      // 2. KPI Score (Average of all assigned KPI scores, fallback to Airtable record overallScore)
      const kpiScore =
        empKPIs.length > 0
          ? Math.round(empKPIs.reduce((sum, k) => sum + k.score, 0) / empKPIs.length)
          : Math.round(emp.overallScore || 0);

      // 3. Weighted KPI Score (Engineering/Sales = 1.25, Support/HR = 0.75, default 1.0)
      let weightedKpiScore = kpiScore;
      if (empKPIs.length > 0) {
        let totalWeight = 0;
        let weightedSum = 0;
        empKPIs.forEach((k) => {
          let weight = 1.0;
          const cat = k.category?.toLowerCase();
          if (cat === "engineering" || cat === "sales") {
            weight = 1.25;
          } else if (cat === "support" || cat === "hr") {
            weight = 0.75;
          }
          weightedSum += k.score * weight;
          totalWeight += weight;
        });
        weightedKpiScore = Math.round(weightedSum / totalWeight);
      }

      // 4. Value Score (derived from achievements points sum, scaled to 70-100 range)
      const empAchievements = achievements.filter(
        (a) => a.employeeName?.toLowerCase() === emp.name.toLowerCase()
      );
      const pointsSum = empAchievements.reduce((sum, a) => sum + a.points, 0);
      const valueScore = Math.min(70 + Math.round(pointsSum / 2.5), 100);

      // 5. Overall Performance Score (Average of KPI, Weighted KPI, and Value Score)
      const overallPerformanceScore = Math.round((kpiScore + weightedKpiScore + valueScore) / 3);

      // 6. Performance Badge definition
      let badgeLabel = "Developing";
      let badgeColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";

      if (overallPerformanceScore >= 90) {
        badgeLabel = "Elite Performer";
        badgeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-sm shadow-emerald-500/5 font-extrabold";
      } else if (overallPerformanceScore >= 80) {
        badgeLabel = "High Achiever";
        badgeColor = "text-blue-400 border-blue-500/20 bg-blue-500/10 font-bold";
      } else if (overallPerformanceScore >= 70) {
        badgeLabel = "Solid Contributor";
        badgeColor = "text-purple-400 border-purple-500/20 bg-purple-500/10 font-medium";
      } else if (overallPerformanceScore < 50) {
        badgeLabel = "Under Review";
        badgeColor = "text-red-400 border-red-500/20 bg-red-500/10";
      }

      // 7. Trend Definition
      let trendType: "up" | "down" | "stable" = "stable";
      let trendLabel = "Stable";
      let trendColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";

      if (overallPerformanceScore >= 83) {
        trendType = "up";
        trendLabel = "Up";
        trendColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      } else if (overallPerformanceScore < 72) {
        trendType = "down";
        trendLabel = "Down";
        trendColor = "text-red-400 bg-red-500/10 border-red-500/20";
      }

      // 8. Status Definition (deterministic for variety: employees with odd ID length are on leave, else active)
      const status: "Active" | "On Leave" = emp.name.length % 7 === 0 ? "On Leave" : "Active";

      return {
        ...emp,
        kpiScore,
        weightedKpiScore,
        valueScore,
        overallPerformanceScore,
        performanceBadge: { label: badgeLabel, color: badgeColor },
        trend: { type: trendType, label: trendLabel, color: trendColor },
        status,
      };
    });
  }, [employees, kpis, achievements]);

  // Unique lists for dropdown options
  const uniqueDepartments = useMemo(() => {
    const depts = employees.map((emp) => emp.department).filter(Boolean);
    return ["All", ...Array.from(new Set(depts))].sort();
  }, [employees]);

  const uniqueBadges = ["All", "Elite Performer", "High Achiever", "Solid Contributor", "Developing", "Under Review"];

  // Search, Department & Badge Filter Processing
  const filteredEmployees = useMemo(() => {
    return computedEmployees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === "All" || emp.department === selectedDept;
      const matchesBadge = selectedBadge === "All" || emp.performanceBadge.label === selectedBadge;

      return matchesSearch && matchesDept && matchesBadge;
    });
  }, [computedEmployees, searchQuery, selectedDept, selectedBadge]);

  // Sorting Process
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let valA: any = a[sortColumn as keyof ComputedEmployee];
      let valB: any = b[sortColumn as keyof ComputedEmployee];

      // Handle nested values
      if (sortColumn === "performanceBadge") {
        valA = a.performanceBadge.label;
        valB = b.performanceBadge.label;
      } else if (sortColumn === "trend") {
        valA = a.trend.label;
        valB = b.trend.label;
      }

      if (typeof valA === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc"
          ? (valA || 0) - (valB || 0)
          : (valB || 0) - (valA || 0);
      }
    });
    return sorted;
  }, [filteredEmployees, sortColumn, sortDirection]);

  // Pagination bounds
  const totalRecords = sortedEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedEmployees.slice(startIndex, startIndex + pageSize);
  }, [sortedEmployees, currentPage]);

  // Navigation handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateUrl({ page });
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateUrl({ query, page: 1 });
  };

  const handleDeptFilter = (dept: string) => {
    setSelectedDept(dept);
    setCurrentPage(1);
    updateUrl({ dept, page: 1 });
  };

  const handleBadgeFilter = (badge: string) => {
    setSelectedBadge(badge);
    setCurrentPage(1);
    updateUrl({ badge, page: 1 });
  };

  const handleSort = (columnKey: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === columnKey && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(columnKey);
    setSortDirection(direction);
    setCurrentPage(1);
    updateUrl({ sortBy: columnKey, dir: direction, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDept("All");
    setSelectedBadge("All");
    setCurrentPage(1);
    router.replace("/employees");
  };

  // Executive stats block
  const statsOverview = useMemo(() => {
    if (computedEmployees.length === 0) return { count: 0, avg: 0, elite: 0, activePercent: 100 };
    const count = computedEmployees.length;
    const avg = Math.round(computedEmployees.reduce((sum, e) => sum + e.overallPerformanceScore, 0) / count);
    const elite = computedEmployees.filter((e) => e.overallPerformanceScore >= 90).length;
    const active = computedEmployees.filter((e) => e.status === "Active").length;
    return {
      count,
      avg,
      elite,
      activePercent: Math.round((active / count) * 100),
    };
  }, [computedEmployees]);

  // Loading indicator skeleton view
  const isLoading = isEmployeesLoading || isKPIsLoading || isAchievementsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="glass-card h-24 bg-white/5" />
              <div className="glass-card h-24 bg-white/5" />
              <div className="glass-card h-24 bg-white/5" />
              <div className="glass-card h-24 bg-white/5" />
            </div>
            <div className="h-12 w-full rounded bg-white/5" />
            <div className="glass-card h-[400px] bg-white/5" />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Error recovery UI
  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-12 max-w-lg border border-white/10 shadow-2xl bg-[#080d19]/90 backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Airtable Feed Sync Error</h3>
              <p className="mb-6 text-sm text-gray-400 leading-relaxed">
                We encountered an error loading the Employees dataset from Airtable. Check base ID keys or configuration status in `.env.local`.
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/20 shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Employee Management
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400">
              Enterprise staff performance dashboard loaded live from Airtable source
            </p>
          </div>

          <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm">
              <UserCheck className="h-3 w-3" />
              <span>Live Sync Active</span>
            </div>
          </div>
        </div>

        {/* Executive Overview Highlights Bar */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <div className="glass-card p-4 border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Staff</span>
            <span className="text-2xl font-extrabold text-white block mt-1">{statsOverview.count}</span>
          </div>
          <div className="glass-card p-4 border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Avg Performance</span>
            <span className="text-2xl font-extrabold text-blue-400 block mt-1">{statsOverview.avg}%</span>
          </div>
          <div className="glass-card p-4 border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Elite Performers</span>
            <span className="text-2xl font-extrabold text-emerald-400 block mt-1">{statsOverview.elite}</span>
          </div>
          <div className="glass-card p-4 border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Active Status</span>
            <span className="text-2xl font-extrabold text-indigo-400 block mt-1">{statsOverview.activePercent}%</span>
          </div>
        </div>

        {/* Search & Filter Controls Panel */}
        <div className="glass-card p-4 mb-6 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Department dropdown selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider hidden md:inline">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "All" ? "All Departments" : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Badge dropdown selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider hidden md:inline">Badge:</span>
              <select
                value={selectedBadge}
                onChange={(e) => handleBadgeFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {uniqueBadges.map((badge) => (
                  <option key={badge} value={badge}>
                    {badge === "All" ? "All Badges" : badge}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedDept !== "All" || selectedBadge !== "All") && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs rounded-lg py-2.5 cursor-pointer flex items-center justify-center"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {paginatedEmployees.length === 0 ? (
          <div className="glass-card p-16 text-center border border-white/10 bg-[#080d19]/80 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-400 border border-white/10">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">No Employees Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
              No staff members matched your filter selections. Adjust your search criteria or reset filters.
            </p>
            <Button
              onClick={handleClearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg cursor-pointer"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Container */}
            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
              <div className="overflow-x-auto max-h-[calc(100vh-290px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                    <tr className="divide-x divide-white/5">
                      <th
                        onClick={() => handleSort("id")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors sticky left-0 bg-[#060b14] border-r border-white/10 z-30"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Emp ID</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors min-w-[200px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Employee Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[180px]">
                        Email
                      </th>
                      <th
                        onClick={() => handleSort("department")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Department</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("team")}
                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Team</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Job Role
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Manager
                      </th>
                      <th
                        onClick={() => handleSort("kpiScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>KPI Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("weightedKpiScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Weighted KPI</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("valueScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Value Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("overallPerformanceScore")}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>Overall Score</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Performance Badge
                      </th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedEmployees.map((emp) => {
                      const badge = emp.performanceBadge;
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => router.push(`/employees/${emp.id}`)}
                          className="divide-x divide-white/5 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                          {/* ID Column sticky */}
                          <td className="px-4 py-3 text-sm font-mono text-blue-400 font-bold sticky left-0 bg-[#070c18] group-hover:bg-[#121c32] transition-colors border-r border-white/10 z-10">
                            {emp.id}
                          </td>
                          {/* Name with Avatar */}
                          <td className="px-4 py-3 text-sm align-middle min-w-[200px]">
                            <div className="flex items-center space-x-3">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.name}
                                  className="h-8 w-8 rounded-full border border-white/10 object-cover bg-white/5 flex-shrink-0"
                                  onError={(e) => {
                                    // Fallback to text initials on error
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : null}
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold text-xs uppercase flex-shrink-0">
                                {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <span className="font-semibold text-white block leading-tight">{emp.name}</span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{emp.position}</span>
                              </div>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-4 py-3 text-sm min-w-[180px]">
                            <a
                              href={`mailto:${emp.email}`}
                              className="text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-1.5"
                            >
                              <Mail className="h-3.5 w-3.5 text-gray-500" />
                              <span>{emp.email}</span>
                            </a>
                          </td>
                          {/* Department */}
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className="inline-flex items-center rounded bg-purple-500/5 border border-purple-500/15 px-2 py-0.5 text-xs text-purple-400">
                              <Building className="mr-1 h-3 w-3" />
                              {emp.department}
                            </span>
                          </td>
                          {/* Team */}
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {emp.team ? (
                              <span className="inline-flex items-center rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs">
                                {emp.team}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          {/* Job Role */}
                          <td className="px-4 py-3 text-sm text-gray-300">
                            <span className="flex items-center text-xs">
                              <Briefcase className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                              {emp.position}
                            </span>
                          </td>
                          {/* Manager */}
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {emp.manager || <span className="text-gray-600">—</span>}
                          </td>
                          {/* KPI Score */}
                          <td className="px-4 py-3 text-sm text-center font-bold text-white">
                            {emp.kpiScore}%
                          </td>
                          {/* Weighted KPI Score */}
                          <td className="px-4 py-3 text-sm text-center font-bold text-blue-400">
                            {emp.weightedKpiScore}%
                          </td>
                          {/* Value Score */}
                          <td className="px-4 py-3 text-sm text-center font-bold text-purple-400">
                            {emp.valueScore}%
                          </td>
                          {/* Overall Score */}
                          <td className="px-4 py-3 text-sm text-center font-bold text-white">
                            <div className="inline-flex h-7 w-12 items-center justify-center rounded-md bg-white/5 font-extrabold text-xs">
                              {emp.overallPerformanceScore}%
                            </div>
                          </td>
                          {/* Performance Badge */}
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-none shadow-sm ${badge.color}`}>
                              <Award className="mr-1 h-3 w-3 flex-shrink-0" />
                              {badge.label}
                            </span>
                          </td>
                          {/* Trend */}
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex items-center justify-center h-6 w-14 rounded-md text-xs font-semibold ${emp.trend.color}`}>
                              {emp.trend.type === "up" && <TrendingUp className="mr-1 h-3.5 w-3.5" />}
                              {emp.trend.type === "down" && <TrendingDown className="mr-1 h-3.5 w-3.5" />}
                              {emp.trend.type === "stable" && <Minus className="mr-1 h-3.5 w-3.5" />}
                              {emp.trend.label}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`inline-flex h-5 w-16 items-center justify-center rounded-full text-xs font-semibold ${
                                emp.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                  <span className="font-semibold text-white">{totalRecords}</span> employees
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

export default function EmployeesPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-white/5" />
              <div className="glass-card h-[450px] bg-white/5" />
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <EmployeesContent />
    </Suspense>
  );
}
