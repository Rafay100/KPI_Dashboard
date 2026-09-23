"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useKPIs, useEmployees, useAchievements, useDepartments, useTasks } from "@/hooks/useData";
import {
  Trophy,
  Medal,
  Award,
  Users,
  Building2,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Flame,
  ArrowUpRight,
  ChevronRight,
  Star
} from "lucide-react";

import { calculateEmployeeScorecard, calculateDepartmentScorecard } from "@/lib/scoring";

export default function RankingsHubPage() {
  const { data: employees = [], isLoading: isEmpLoading, refetch } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: kpis = [] } = useKPIs();
  const { data: achievements = [] } = useAchievements();
  const { data: tasks = [] } = useTasks();

  const [activeTab, setActiveTab] = useState<"employees" | "departments" | "achievements">("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // 1. Standardized Computed Employee Rankings
  const rankedEmployees = useMemo(() => {
    return employees
      .map((emp) => {
        const scorecard = calculateEmployeeScorecard(emp, kpis, tasks, achievements);
        return {
          id: scorecard.id,
          name: scorecard.name,
          department: scorecard.department,
          kpiScore: scorecard.kpiScore,
          achievementPoints: scorecard.achievementPoints,
          taskRate: scorecard.taskCompletionRate,
          overallScore: scorecard.overallScore,
          kpiCount: scorecard.kpiCount,
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [employees, kpis, tasks, achievements]);

  // 2. Standardized Computed Department Rankings
  const rankedDepartments = useMemo(() => {
    return departments
      .map((dept) => {
        const scorecard = calculateDepartmentScorecard(dept, employees, kpis, tasks, achievements);
        return {
          id: scorecard.id,
          name: scorecard.name,
          head: scorecard.head,
          employeeCount: scorecard.employeeCount,
          activeKPIs: scorecard.activeKPIs,
          completionRate: scorecard.kpiCompletionRate,
          score: scorecard.score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [departments, kpis, employees, tasks, achievements]);

  // Filtered queries
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rankedEmployees.filter(
      (e) => !q || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    );
  }, [rankedEmployees, searchQuery]);

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rankedDepartments.filter((d) => !q || d.name.toLowerCase().includes(q));
  }, [rankedDepartments, searchQuery]);

  const filteredAchievements = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return achievements.filter(
      (a) => !q || a.title.toLowerCase().includes(q) || a.employeeName.toLowerCase().includes(q)
    );
  }, [achievements, searchQuery]);

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="Rankings & Leaderboards"
            description="Organizational excellence scorecards, top staff performers, department standings, and achievement recognitions."
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
              <span>Refresh Standings</span>
            </Button>
          </div>
        </div>

        {/* Podium Top 3 Highlights Banner */}
        {rankedEmployees.length >= 3 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
            {/* #2 Silver */}
            <div className="glass-card p-4 border border-slate-700/80 bg-slate-900/90 rounded-xl flex items-center space-x-3.5 order-2 md:order-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-400/10 text-slate-300 font-bold border border-slate-400/20 text-lg">
                🥈
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rank #2 • Silver</span>
                <h4 className="text-sm font-bold text-white truncate">{rankedEmployees[1]?.name}</h4>
                <p className="text-xs text-slate-400">{rankedEmployees[1]?.department} • {rankedEmployees[1]?.overallScore}% Score</p>
              </div>
            </div>

            {/* #1 Gold */}
            <div className="glass-card p-4 border border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-900/90 rounded-xl flex items-center space-x-3.5 order-1 md:order-2 shadow-lg shadow-amber-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 text-xl">
                👑
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Top Performer • Rank #1
                </span>
                <h4 className="text-sm font-bold text-white truncate">{rankedEmployees[0]?.name}</h4>
                <p className="text-xs text-amber-300/80">{rankedEmployees[0]?.department} • {rankedEmployees[0]?.overallScore}% Score</p>
              </div>
            </div>

            {/* #3 Bronze */}
            <div className="glass-card p-4 border border-amber-800/40 bg-slate-900/90 rounded-xl flex items-center space-x-3.5 order-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700/10 text-amber-600 font-bold border border-amber-700/20 text-lg">
                🥉
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-amber-600">Rank #3 • Bronze</span>
                <h4 className="text-sm font-bold text-white truncate">{rankedEmployees[2]?.name}</h4>
                <p className="text-xs text-slate-400">{rankedEmployees[2]?.department} • {rankedEmployees[2]?.overallScore}% Score</p>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab("employees")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "employees"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Staff Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab("departments")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "departments"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Department Standings</span>
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "achievements"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Honors & Awards</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search leaderboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Staff Leaderboard Table */}
        {activeTab === "employees" && (
          <div className="glass-card border border-slate-800/80 bg-[#080d1a]/95 rounded-xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank & Member</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3 text-center">Assigned KPIs</th>
                    <th className="py-3 px-3 text-center">KPI Score</th>
                    <th className="py-3 px-3 text-center">Task Velocity</th>
                    <th className="py-3 px-3 text-center">Achievement Pts</th>
                    <th className="py-3 px-3 text-center">Composite Score</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEmployees.map((emp, index) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            index === 0
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : index === 1
                              ? "bg-slate-300/20 text-slate-200 border border-slate-300/40"
                              : index === 2
                              ? "bg-amber-700/20 text-amber-600 border border-amber-700/40"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{emp.department}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-300">{emp.kpiCount}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-white">{emp.kpiScore}%</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-blue-400">{emp.taskRate}%</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">+{emp.achievementPoints}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25">
                          {emp.overallScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/employees/${emp.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300">
                            Profile
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

        {/* Tab 2: Department Standings Table */}
        {activeTab === "departments" && (
          <div className="glass-card border border-slate-800/80 bg-[#080d1a]/95 rounded-xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Rank & Department</th>
                    <th className="py-3 px-3">Head of Department</th>
                    <th className="py-3 px-3 text-center">Staff Count</th>
                    <th className="py-3 px-3 text-center">Active KPIs</th>
                    <th className="py-3 px-3 text-center">Target Completion</th>
                    <th className="py-3 px-3 text-center">Department Score</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDepartments.map((dept, index) => (
                    <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            index === 0
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold text-white">{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{dept.head}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{dept.employeeCount}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{dept.activeKPIs}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-emerald-400">{dept.completionRate}%</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-white text-xs">{dept.score}%</span>
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

        {/* Tab 3: Honors & Awards */}
        {activeTab === "achievements" && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.id}
                className="glass-card p-4 border border-slate-800/80 bg-[#080d1a]/95 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                      <p className="text-[11px] text-slate-400">{ach.employeeName}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    +{ach.points} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{ach.description || "Earned high achievement honors."}</p>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Badge: {ach.badge || "Star Performer"}</span>
                  <span>{new Date(ach.achievedAt || ach.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
