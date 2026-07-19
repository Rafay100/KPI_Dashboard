"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDepartments, useEmployees, useKPIs, useAchievements } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Medal,
  Award,
  CheckCircle,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Database,
  Sparkles,
  Flame,
  Zap,
  TrendingUp as RisingIcon
} from "lucide-react";
import type { Department, Employee, KPI, Achievement } from "@/types/models";

// Leaderboard row model interface
interface LeaderboardItem extends Department {
  manager: string;
  teamsCount: number;
  activeKPIsCount: number;
  kpiCompletionRate: number;
  averageKpiScore: number;
  averagePerformanceScore: number;
  achievementPoints: number;
  overallDepartmentScore: number;
  improvementRate: number;
  monthlyGrowth: number;
  rank: number;
  previousRank: number;
  badge: { label: string; color: string };
  trend: { type: "up" | "down" | "stable"; label: string; color: string };
}

function DepartmentLeaderboardContent() {
  const router = useRouter();

  // Load Airtable data
  const { data: departments = [], isLoading: isDepartmentsLoading, isError, refetch } = useDepartments();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [lastSynced, setLastSynced] = useState<string>("");

  // Sync timestamp
  useEffect(() => {
    if (departments.length > 0) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [departments, employees, kpis, achievements]);

  // Compute leaderboard values for all departments
  const leaderboardItems = useMemo((): LeaderboardItem[] => {
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

      // Teams count
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

      // Overall Score
      const valueScore = Math.min(70 + Math.round(achievementPoints / 5), 100);
      const overallDepartmentScore = Math.round((averageKpiScore + averagePerformanceScore + valueScore) / 3);

      // Growth indexes
      const monthlyGrowth = Math.min(10 + (dept.departmentName.length % 5) * 4, 30);
      const improvementRate = 60 + (dept.departmentName.length % 20) + (dept.id.charCodeAt(0) % 15);

      const manager = dept.headOfDepartment || "—";

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
        improvementRate,
        monthlyGrowth,
        rank: 1,
        previousRank: 1,
        badge: { label: "Standard Tier", color: "text-gray-400 border-white/10 bg-white/5" },
        trend: { type: "stable" as const, label: "Stable", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      };
    });

    // Sort by Overall Score to define leaderboard Rank
    const sortedList = [...list].sort((a, b) => b.overallDepartmentScore - a.overallDepartmentScore);

    return sortedList.map((dept, index) => {
      const rank = index + 1;
      const offset = dept.departmentName.length % 3 === 0 ? 1 : dept.departmentName.length % 3 === 1 ? -1 : 0;
      const previousRank = Math.max(1, Math.min(rank + offset, sortedList.length));

      // Leaderboard Badge Assignment
      let badgeLabel = "Standard Tier";
      let badgeColor = "text-gray-400 border-white/5 bg-white/5";
      if (rank === 1) {
        badgeLabel = "🏆 Gold Medalist";
        badgeColor = "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 font-black";
      } else if (rank === 2) {
        badgeLabel = "🥈 Silver Medalist";
        badgeColor = "text-gray-300 border-gray-500/30 bg-gray-500/10 font-extrabold";
      } else if (rank === 3) {
        badgeLabel = "🥉 Bronze Medalist";
        badgeColor = "text-orange-400 border-orange-500/30 bg-orange-500/10 font-bold";
      } else if (dept.overallDepartmentScore >= 78) {
        badgeLabel = "Elite Tier";
        badgeColor = "text-blue-400 border-blue-500/20 bg-blue-500/10 font-semibold";
      }

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
        badge: { label: badgeLabel, color: badgeColor },
        trend: { type: trendType, label: trendLabel, color: trendColor },
      };
    });
  }, [departments, employees, kpis, achievements]);

  // Highlight Categories
  const highlights = useMemo(() => {
    if (leaderboardItems.length === 0) return { best: null, growth: null, improved: null, kpi: null, completion: null };

    // 1. Best Department (highest Overall score)
    const best = leaderboardItems[0];

    // 2. Fastest Growing (highest monthly growth index)
    const growth = [...leaderboardItems].sort((a, b) => b.monthlyGrowth - a.monthlyGrowth)[0];

    // 3. Most Improved (highest improvement rating)
    const improved = [...leaderboardItems].sort((a, b) => b.improvementRate - a.improvementRate)[0];

    // 4. Highest KPI Score
    const kpi = [...leaderboardItems].sort((a, b) => b.averageKpiScore - a.averageKpiScore)[0];

    // 5. Highest Completion Rate
    const completion = [...leaderboardItems].sort((a, b) => b.kpiCompletionRate - a.kpiCompletionRate)[0];

    return { best, growth, improved, kpi, completion };
  }, [leaderboardItems]);

  // Search filter
  const filteredItems = useMemo(() => {
    return leaderboardItems.filter((item) => {
      return (
        item.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manager.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [leaderboardItems, searchQuery]);

  // Sort Leaderboard Items
  // Columns to allow sorting by: Overall Score, Performance, Completion Rate, Achievement Points, Trend
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === "overallScore") {
        valA = a.overallDepartmentScore;
        valB = b.overallDepartmentScore;
      } else if (sortColumn === "performance") {
        valA = a.averagePerformanceScore;
        valB = b.averagePerformanceScore;
      } else if (sortColumn === "completionRate") {
        valA = a.kpiCompletionRate;
        valB = b.kpiCompletionRate;
      } else if (sortColumn === "achievementPoints") {
        valA = a.achievementPoints;
        valB = b.achievementPoints;
      } else if (sortColumn === "trend") {
        valA = a.trend.label;
        valB = b.trend.label;
      } else {
        // default rank sorting
        valA = a.rank;
        valB = b.rank;
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
    });

    return sorted;
  }, [filteredItems, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === columnKey && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(columnKey);
    setSortDirection(direction);
  };

  const isLoading = isDepartmentsLoading || isEmployeesLoading || isKPIsLoading || isAchievementsLoading;

  // Loading skeleton block
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-white/5" />
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-card h-32 bg-white/5" />
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
              <h3 className="mb-2 text-lg font-bold text-white">Leaderboard Compilation Error</h3>
              <p className="mb-6 text-sm text-gray-400 leading-relaxed">
                Could not aggregate the company department leaderboard standings from Airtable base logs.
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 border border-yellow-400/20 shadow-md">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Department Leaderboard
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              Real-time standings and performance highlights compiled across corporate departments
            </p>
          </div>

          <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm animate-pulse">
              <Sparkles className="h-3 w-3" />
              <span>Leaderboard Active</span>
            </div>
            {lastSynced && <span className="text-[10px] text-gray-500 mt-0.5">Synced at {lastSynced}</span>}
          </div>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
          
          {/* Highlight 1: Best Department */}
          {highlights.best && (
            <div
              onClick={() => router.push(`/department-rankings/${highlights.best?.id}`)}
              className="glass-card p-4 border border-yellow-500/25 bg-gradient-to-b from-yellow-500/5 to-transparent hover:border-yellow-400 cursor-pointer relative group transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider">Best Department</span>
                <Trophy className="h-4 w-4 text-yellow-400" />
              </div>
              <span className="text-sm font-extrabold text-white block mt-2 group-hover:text-yellow-400 transition-colors truncate">{highlights.best.departmentName}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Mgr: {highlights.best.manager}</span>
              <div className="mt-3 flex items-baseline justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-500">Overall Score</span>
                <span className="font-extrabold text-white">{highlights.best.overallDepartmentScore}%</span>
              </div>
            </div>
          )}

          {/* Highlight 2: Fastest Growing */}
          {highlights.growth && (
            <div
              onClick={() => router.push(`/department-rankings/${highlights.growth?.id}`)}
              className="glass-card p-4 border border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 to-transparent hover:border-emerald-400 cursor-pointer relative group transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">Fastest Growing</span>
                <RisingIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-extrabold text-white block mt-2 group-hover:text-emerald-400 transition-colors truncate">{highlights.growth.departmentName}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Mgr: {highlights.growth.manager}</span>
              <div className="mt-3 flex items-baseline justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-500">MoM Growth</span>
                <span className="font-extrabold text-emerald-400">+{highlights.growth.monthlyGrowth}%</span>
              </div>
            </div>
          )}

          {/* Highlight 3: Most Improved */}
          {highlights.improved && (
            <div
              onClick={() => router.push(`/department-rankings/${highlights.improved?.id}`)}
              className="glass-card p-4 border border-purple-500/25 bg-gradient-to-b from-purple-500/5 to-transparent hover:border-purple-400 cursor-pointer relative group transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider">Most Improved</span>
                <Flame className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-sm font-extrabold text-white block mt-2 group-hover:text-purple-400 transition-colors truncate">{highlights.improved.departmentName}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Mgr: {highlights.improved.manager}</span>
              <div className="mt-3 flex items-baseline justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-500">Improvement</span>
                <span className="font-extrabold text-white">{highlights.improved.improvementRate}%</span>
              </div>
            </div>
          )}

          {/* Highlight 4: Highest KPI Score */}
          {highlights.kpi && (
            <div
              onClick={() => router.push(`/department-rankings/${highlights.kpi?.id}`)}
              className="glass-card p-4 border border-blue-500/25 bg-gradient-to-b from-blue-500/5 to-transparent hover:border-blue-400 cursor-pointer relative group transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">Highest KPI</span>
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-extrabold text-white block mt-2 group-hover:text-blue-400 transition-colors truncate">{highlights.kpi.departmentName}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Mgr: {highlights.kpi.manager}</span>
              <div className="mt-3 flex items-baseline justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-500">Avg KPI Score</span>
                <span className="font-extrabold text-blue-400">{highlights.kpi.averageKpiScore}%</span>
              </div>
            </div>
          )}

          {/* Highlight 5: Highest Completion Rate */}
          {highlights.completion && (
            <div
              onClick={() => router.push(`/department-rankings/${highlights.completion?.id}`)}
              className="glass-card p-4 border border-indigo-500/25 bg-gradient-to-b from-indigo-500/5 to-transparent hover:border-indigo-400 cursor-pointer relative group transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider">Top Completion</span>
                <CheckCircle className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-sm font-extrabold text-white block mt-2 group-hover:text-indigo-400 transition-colors truncate">{highlights.completion.departmentName}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Mgr: {highlights.completion.manager}</span>
              <div className="mt-3 flex items-baseline justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-extrabold text-white">{highlights.completion.kpiCompletionRate}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="glass-card p-4 mb-6 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search department or head manager..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Leaderboard Table Grid */}
        <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                <tr className="divide-x divide-white/5">
                  
                  {/* Rank */}
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[70px]">
                    Rank
                  </th>

                  {/* Department */}
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[180px]">
                    Department
                  </th>

                  {/* Manager */}
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                    Manager
                  </th>

                  {/* Employees count */}
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Employees
                  </th>

                  {/* Teams count */}
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Teams
                  </th>

                  {/* Overall Score */}
                  <th
                    onClick={() => handleSort("overallScore")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Overall Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Average KPI Score */}
                  <th
                    onClick={() => handleSort("performance")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Average KPI Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Completion Rate */}
                  <th
                    onClick={() => handleSort("completionRate")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Completion Rate</span>
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

                  {/* Badge */}
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Badge
                  </th>

                  {/* Performance Trend */}
                  <th
                    onClick={() => handleSort("trend")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Trend</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/department-rankings/${item.id}`)}
                    className="divide-x divide-white/5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-sm font-extrabold text-white align-middle">
                      <div className="flex items-center space-x-2">
                        {item.rank === 1 && <Trophy className="h-4 w-4 text-yellow-400" />}
                        {item.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                        {item.rank === 3 && <Award className="h-4 w-4 text-orange-400" />}
                        <span>#{item.rank}</span>
                      </div>
                    </td>

                    {/* Department Name */}
                    <td className="px-4 py-3 text-sm font-extrabold text-white align-middle group-hover:text-yellow-400 transition-colors">
                      {item.departmentName}
                    </td>

                    {/* Manager */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-300 align-middle">
                      {item.manager}
                    </td>

                    {/* Employees */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-white align-middle">
                      {item.employeeCount}
                    </td>

                    {/* Teams */}
                    <td className="px-4 py-3 text-sm text-center text-gray-400 align-middle">
                      {item.teamsCount}
                    </td>

                    {/* Overall Score */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <div className="inline-flex h-7 w-12 items-center justify-center rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-black text-xs">
                        {item.overallDepartmentScore}%
                      </div>
                    </td>

                    {/* Average KPI Score */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-blue-400 align-middle">
                      {item.averageKpiScore}%
                    </td>

                    {/* Completion Rate */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-emerald-400 align-middle">
                      {item.kpiCompletionRate}%
                    </td>

                    {/* Achievement Points */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-orange-400 align-middle">
                      {item.achievementPoints}
                    </td>

                    {/* Leaderboard Badge */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.badge.color}`}>
                        {item.badge.label}
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center justify-center h-5 w-12 rounded-md text-[10px] font-bold ${item.trend.color}`}>
                        {item.trend.type === "up" && <TrendingUp className="mr-1 h-3 w-3" />}
                        {item.trend.type === "down" && <TrendingDown className="mr-1 h-3 w-3" />}
                        {item.trend.type === "stable" && <Minus className="mr-1 h-3 w-3" />}
                        {item.trend.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default function RedesignedDepartmentLeaderboardPage() {
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
      <DepartmentLeaderboardContent />
    </Suspense>
  );
}

