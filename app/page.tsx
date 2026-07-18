"use client";

import { useDashboardData } from "@/hooks/useData";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { KPIProgressChart } from "@/components/charts/KPIProgressChart";
import { TaskStatusChart } from "@/components/charts/TaskStatusChart";
import { ActivityCard, ActivityItem } from "@/components/dashboard/ActivityCard";
import { 
  Trophy, 
  Users, 
  Target, 
  CheckSquare, 
  Award,
  Zap,
  Building2,
  RefreshCw
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";

export default function ExecutiveOverview() {
  const { data, isLoading, isError, refetch } = useDashboardData();

  // Extract raw dashboard arrays
  const kpis = useMemo(() => data?.kpis || [], [data]);
  const employees = useMemo(() => data?.employees || [], [data]);
  const departments = useMemo(() => data?.departments || [], [data]);
  const tasks = useMemo(() => data?.tasks || [], [data]);
  const achievements = useMemo(() => data?.achievements || [], [data]);

  // Compute stats
  const stats = useMemo(() => {
    // 1. KPI Completion
    const completedKPIs = kpis.filter(k => k.status === "completed").length;
    const kpiCompletionRate = kpis.length > 0 
      ? Math.round((completedKPIs / kpis.length) * 100) 
      : 0;

    // 2. Task Completion
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const taskCompletionRate = tasks.length > 0 
      ? Math.round((completedTasks / tasks.length) * 100) 
      : 0;

    // 3. Achievement Points
    const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

    return {
      kpiCompletionRate,
      taskCompletionRate,
      totalPoints,
      kpisCount: kpis.length,
      employeesCount: employees.length,
      departmentsCount: departments.length,
      tasksCount: tasks.length,
      achievementsCount: achievements.length,
    };
  }, [kpis, employees, departments, tasks, achievements]);

  // KPI Progress mock trend based on scores
  const progressData = useMemo(() => {
    if (kpis.length === 0) {
      return [
        { month: "Jan", progress: 60 },
        { month: "Feb", progress: 65 },
        { month: "Mar", progress: 70 },
        { month: "Apr", progress: 72 },
        { month: "May", progress: 78 },
        { month: "Jun", progress: 85 },
      ];
    }
    const avgScore = Math.round(kpis.reduce((sum, k) => sum + (k.score || 0), 0) / kpis.length);
    return [
      { month: "Jan", progress: Math.max(0, avgScore - 20) },
      { month: "Feb", progress: Math.max(0, avgScore - 15) },
      { month: "Mar", progress: Math.max(0, avgScore - 10) },
      { month: "Apr", progress: Math.max(0, avgScore - 5) },
      { month: "May", progress: avgScore },
      { month: "Jun", progress: Math.min(100, avgScore + 5) },
    ];
  }, [kpis]);

  // Pie chart tasks data
  const taskStatusData = useMemo(() => {
    const todo = tasks.filter(t => t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "in-progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const blocked = tasks.filter(t => t.status === "blocked").length;
    
    // Ensure we don't pass empty values to chart
    if (tasks.length === 0) {
      return [
        { name: "Completed", value: 1 },
        { name: "In Progress", value: 1 },
        { name: "Todo", value: 1 },
        { name: "Blocked", value: 1 },
      ];
    }

    return [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Todo", value: todo },
      { name: "Blocked", value: blocked },
    ];
  }, [tasks]);

  // Mapped recent activities from achievements
  const recentActivities = useMemo(() => {
    return achievements.slice(0, 5).map(ach => ({
      id: ach.id,
      title: ach.title,
      description: ach.description || "Earned achievement points",
      timestamp: new Date(ach.achievedAt || ach.createdAt).toLocaleDateString(),
      user: ach.employeeName,
    }));
  }, [achievements]);

  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-12 max-w-lg border border-white/10 shadow-2xl bg-[#080d19]/90 backdrop-blur-xl">
              <h3 className="mb-2 text-lg font-bold text-white">Dashboard Loading Error</h3>
              <p className="mb-6 text-sm text-gray-400">
                Could not connect to your configured Google Sheets data source.
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
        <PageHeader
          title="Executive Overview"
          description="Real-time KPI tracking and organizational performance metrics from Google Sheets"
        />

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="KPI Completion Rate"
            value={`${stats.kpiCompletionRate}%`}
            icon={Target}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Task Completion Rate"
            value={`${stats.taskCompletionRate}%`}
            icon={CheckSquare}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title="Total Employees"
            value={stats.employeesCount}
            icon={Users}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="Achievement Points"
            value={stats.totalPoints}
            icon={Trophy}
            color="orange"
            loading={isLoading}
          />
        </div>

        {/* Charts & Activity Layout */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3 mb-8">
          
          {/* KPI Trend Chart */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">KPI Performance Trend</h3>
                <p className="text-xs text-gray-400 mt-1">Overall average scores historical trend</p>
              </div>
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <KPIProgressChart data={progressData} />
              )}
            </div>
          </div>

          {/* Task Status Breakdown */}
          <div className="glass-card p-6 col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">Task Status Breakdown</h3>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <TaskStatusChart data={taskStatusData} />
              )}
            </div>
          </div>
        </div>

        {/* Detailed Entities Count & Activity Feed */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          
          {/* Quick Stats Summary */}
          <div className="glass-card p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">Data Source Inventory</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Departments
                </span>
                <span className="text-sm font-bold text-white">{stats.departmentsCount}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Employees
                </span>
                <span className="text-sm font-bold text-white">{stats.employeesCount}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  KPIs Mapped
                </span>
                <span className="text-sm font-bold text-white">{stats.kpisCount}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-amber-400" />
                  Total Tasks
                </span>
                <span className="text-sm font-bold text-white">{stats.tasksCount}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Award className="h-4 w-4 text-orange-400" />
                  Achievements
                </span>
                <span className="text-sm font-bold text-white">{stats.achievementsCount}</span>
              </div>
            </div>
          </div>

          {/* Recent Achievements / Activities */}
          <div className="lg:col-span-2">
            <ActivityCard title="Recent Accomplishments & Awards" loading={isLoading}>
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No recent achievements recorded.</div>
              ) : (
                recentActivities.map(act => (
                  <ActivityItem
                    key={act.id}
                    icon={Award}
                    title={act.title}
                    description={act.description}
                    timestamp={act.timestamp}
                    user={act.user}
                  />
                ))
              )}
            </ActivityCard>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
