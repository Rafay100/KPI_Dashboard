"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useKPIs, useEmployees, useAchievements, useTasks } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Medal,
  Award,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Building,
  Briefcase,
  AlertCircle,
  Database,
  RefreshCw,
  Sparkles,
  ChevronRight,
  User,
  Activity,
  Zap,
  TrendingUp as RisingIcon,
  Flame
} from "lucide-react";
import type { Employee, KPI, Achievement, Task } from "@/types/models";

// Computed Employee Ranking Interface
import { calculateEmployeeScorecard, matchesEmployee, type EmployeeScorecard } from "@/lib/scoring";

interface RankedEmployee extends EmployeeScorecard {
  rank: number;
  previousRank: number;
  consistency: number;
  improvement: number;
  badge: { label: string; color: string };
}

function EmployeeRankingsContent() {
  const router = useRouter();

  // Load Airtable data
  const { data: employees = [], isLoading: isEmployeesLoading, isError, refetch } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();
  const { data: achievements = [], isLoading: isAchievementsLoading } = useAchievements();
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Compute stats and scores dynamically for all staff members via centralized scoring engine
  const computedRankings = useMemo((): RankedEmployee[] => {
    // 1. Calculate standardized scorecard per employee
    const list = employees.map((emp) => {
      const scorecard = calculateEmployeeScorecard(emp, kpis, tasks, achievements);
      const empKPIs = kpis.filter((k) => matchesEmployee(k.employeeId, emp));

      // Consistency based on real KPI scores spread
      let consistency = 100;
      if (empKPIs.length > 1) {
        const allScores = empKPIs.map((k) => k.score || 0);
        consistency = 100 - (Math.max(...allScores) - Math.min(...allScores));
      }

      // Legitimate KPI completion percentage
      const improvement = scorecard.kpiCount > 0 
        ? Math.round((scorecard.completedKpiCount / scorecard.kpiCount) * 100)
        : scorecard.kpiScore;

      return {
        ...scorecard,
        rank: 1,
        previousRank: 1,
        consistency,
        improvement,
        badge: scorecard.performanceBadge,
      };
    });

    // 2. Sort by overallScore descending to assign legitimate ranks
    const sortedList = [...list].sort((a, b) => b.overallScore - a.overallScore);

    return sortedList.map((emp, index) => {
      const rank = index + 1;
      return {
        ...emp,
        rank,
        previousRank: rank,
      };
    });
  }, [employees, kpis, achievements, tasks]);

  // Unique departments for filtering
  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  }, [employees]);

  // Filter rankings based on search and department filter
  const filteredRankings = useMemo(() => {
    return computedRankings.filter((emp) => {
      const matchSearch = !searchQuery || emp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = !deptFilter || emp.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [computedRankings, searchQuery, deptFilter]);

  // Derive Top 3 Highlight Cards
  const topThree = useMemo(() => {
    return computedRankings.slice(0, 3);
  }, [computedRankings]);

  // Sort Ranked List
  const sortedRankings = useMemo(() => {
    const sorted = [...filteredRankings];
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let valA: any = a[sortColumn as keyof RankedEmployee];
      let valB: any = b[sortColumn as keyof RankedEmployee];

      // Nested values mapping
      if (sortColumn === "badge") {
        valA = a.badge.label;
        valB = b.badge.label;
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
  }, [computedRankings, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortColumn === columnKey && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(columnKey);
    setSortDirection(direction);
  };

  const isLoading = isEmployeesLoading || isKPIsLoading || isAchievementsLoading || isTasksLoading;

  // Loading indicator skeleton view
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-5">
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
              <h3 className="mb-2 text-lg font-bold text-white">Ranking Compilation Error</h3>
              <p className="mb-6 text-sm text-gray-400 leading-relaxed">
                Could not compile ranking metrics. Ensure Airtable bases are online and the API tokens are authorized.
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
                Employee Rankings
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              Performance rankings and dynamic scoreboards resolved across multiple Airtable logs
            </p>
          </div>
        </div>

        {/* Top 3 Highlight Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
          {topThree.map((emp, idx) => {
            const colors = [
              { border: "border-yellow-500/25", bg: "from-yellow-500/5", text: "text-yellow-400", label: "1st Place", icon: Trophy },
              { border: "border-slate-400/25", bg: "from-slate-400/5", text: "text-slate-400", label: "2nd Place", icon: Medal },
              { border: "border-amber-600/25", bg: "from-amber-600/5", text: "text-amber-600", label: "3rd Place", icon: Award }
            ][idx] || { border: "border-white/10", bg: "from-white/5", text: "text-white", label: `${idx + 1}th Place`, icon: Medal };

            const Icon = colors.icon;

            return (
              <div
                key={emp.id}
                onClick={() => router.push(`/employees/${emp.id}`)}
                className={`glass-card p-5 border ${colors.border} bg-gradient-to-b ${colors.bg} to-transparent hover:border-blue-500/50 transition-all cursor-pointer relative group`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] ${colors.text} font-extrabold uppercase tracking-wider`}>{colors.label}</span>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <span className="text-base font-extrabold text-white block mt-3 group-hover:text-blue-400 transition-colors truncate">{emp.name}</span>
                <span className="text-xs text-gray-400 block mt-0.5 truncate">{emp.position}</span>
                <div className="mt-4 flex items-baseline justify-between text-xs">
                  <span className="text-gray-500">Overall Score</span>
                  <span className="font-extrabold text-white">{emp.overallScore}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="w-full sm:max-w-xs">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#080d19] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {uniqueDepts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sortable Table Container */}
        <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                <tr className="divide-x divide-white/5">
                  
                  {/* Rank Column */}
                  <th
                    onClick={() => handleSort("rank")}
                    className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Rank</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Previous Rank Column */}
                  <th
                    onClick={() => handleSort("previousRank")}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Prev Rank</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Employee Name */}
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors min-w-[200px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Employee</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Department */}
                  <th
                    onClick={() => handleSort("department")}
                    className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Department</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Team */}
                  <th
                    onClick={() => handleSort("team")}
                    className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Team</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Job Role */}
                  <th
                    onClick={() => handleSort("position")}
                    className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors min-w-[150px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Role</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* KPI Score */}
                  <th
                    onClick={() => handleSort("kpiScore")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>KPI Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Value Score */}
                  <th
                    onClick={() => handleSort("valueScore")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Value Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Achievement Badge */}
                  <th
                    onClick={() => handleSort("achievementPoints")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Ach. Badge</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Impact Level */}
                  <th
                    onClick={() => handleSort("achievementPoints")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Impact</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Overall Performance */}
                  <th
                    onClick={() => handleSort("overallScore")}
                    className="px-4 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Overall Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Badge */}
                  <th
                    onClick={() => handleSort("badge")}
                    className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Performance Badge</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Trend */}
                  <th
                    onClick={() => handleSort("trend")}
                    className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Trend</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedRankings.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    className="divide-x divide-white/5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-sm font-bold text-white align-middle">
                      <div className="flex items-center space-x-2">
                        {emp.rank === 1 && <Trophy className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                        {emp.rank === 2 && <Medal className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        {emp.rank === 3 && <Award className="h-4 w-4 text-orange-400 flex-shrink-0" />}
                        <span>#{emp.rank}</span>
                      </div>
                    </td>

                    {/* Previous Rank */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-500 align-middle">
                      #{emp.previousRank}
                    </td>

                    {/* Employee Profile Name */}
                    <td className="px-4 py-3 text-sm align-middle min-w-[200px]">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold text-xs uppercase flex-shrink-0">
                          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-white block group-hover:text-blue-400 transition-colors leading-tight">{emp.name}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5 leading-none">{emp.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-sm font-medium align-middle">
                      <span className="inline-flex items-center rounded bg-purple-500/5 border border-purple-500/15 px-2 py-0.5 text-xs text-purple-400">
                        <Building className="mr-1.5 h-3 w-3" />
                        {emp.department}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3 text-sm text-gray-300 align-middle">
                      {emp.team ? (
                        <span className="inline-flex items-center rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs">
                          {emp.team}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-sm text-gray-300 align-middle">
                      <span className="flex items-center text-xs">
                        <Briefcase className="mr-1.5 h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        {emp.position}
                      </span>
                    </td>

                    {/* KPI Score */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-white align-middle">
                      {emp.kpiScore}%
                    </td>

                    {/* Value Score */}
                    <td className="px-4 py-3 text-sm text-center font-bold text-purple-400 align-middle">
                      {emp.valueScore}%
                    </td>

                    {/* Achievement Badge */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${emp.achievementBadge.color}`}>
                        {emp.achievementBadge.label}
                      </span>
                    </td>

                    {/* Impact Level */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        emp.impactLevel === "High"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : emp.impactLevel === "Medium"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {emp.impactLevel}
                      </span>
                    </td>

                    {/* Overall performance score bar */}
                    <td className="px-4 py-3 text-sm align-middle min-w-[150px]">
                      <div className="flex items-center space-x-3.5 justify-center">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 hidden md:block">
                          <div
                             className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                             style={{ width: `${emp.overallScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-white">
                          {emp.overallScore}%
                        </span>
                      </div>
                    </td>

                    {/* Performance Badge */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${emp.badge.color}`}>
                        {emp.badge.label}
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="px-4 py-3 text-sm text-center align-middle">
                      <span className={`inline-flex items-center justify-center h-5 w-12 rounded-md text-[10px] font-bold ${emp.trend.color}`}>
                        {emp.trend.type === "up" && <TrendingUp className="mr-1 h-3 w-3" />}
                        {emp.trend.type === "down" && <TrendingDown className="mr-1 h-3 w-3" />}
                        {emp.trend.type === "stable" && <Minus className="mr-1 h-3 w-3" />}
                        {emp.trend.label}
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

export default function RedesignedEmployeeRankingsPage() {
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
      <EmployeeRankingsContent />
    </Suspense>
  );
}

