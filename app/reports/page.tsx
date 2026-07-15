"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDashboardData } from "@/hooks/useData";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceTrendChart } from "@/components/charts/PerformanceTrendChart";
import { DepartmentRankingChart } from "@/components/charts/DepartmentRankingChart";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMemo } from "react";

export default function Reports() {
  const { data, isLoading } = useDashboardData();

  const kpis = useMemo(() => data?.kpis || [], [data?.kpis]);
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  const departments = useMemo(() => data?.departments || [], [data?.departments]);
  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);

  const stats = useMemo(() => {
    const avgScore = kpis.length > 0
      ? Math.round(kpis.reduce((sum, k) => sum + k.score, 0) / kpis.length)
      : 0;

    return {
      totalKPIs: kpis.length,
      completedKPIs: kpis.filter(k => k.status === "completed").length,
      avgScore,
      completionRate: kpis.length > 0
        ? Math.round((kpis.filter(k => k.status === "completed").length / kpis.length) * 100)
        : 0,
    };
  }, [kpis]);

  const performanceData = [
    { month: "Jan", performance: 75, target: 80 },
    { month: "Feb", performance: 78, target: 80 },
    { month: "Mar", performance: 82, target: 80 },
    { month: "Apr", performance: 85, target: 85 },
    { month: "May", performance: 88, target: 85 },
    { month: "Jun", performance: 90, target: 90 },
  ];

  const deptData = useMemo(() => {
    return departments.slice(0, 5).map((dept) => ({
      name: dept.departmentName,
      score: dept.averageScore,
      kpis: dept.totalKPIs,
    }));
  }, [departments]);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex items-center justify-between">
          <PageHeader
            title="Reports"
            description="Generate and view comprehensive KPI reports and analytics"
          />
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Select Period
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Total KPIs"
            value={stats.totalKPIs}
            icon={FileText}
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="Completed KPIs"
            value={stats.completedKPIs}
            icon={TrendingUp}
            color="green"
            loading={isLoading}
          />
          <StatCard
            title="Average Score"
            value={`${stats.avgScore}%`}
            icon={TrendingUp}
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={TrendingUp}
            color="orange"
            loading={isLoading}
          />
        </div>

        {/* Report Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Company Performance Report"
            subtitle="Performance vs target over the last 6 months"
            loading={isLoading}
          >
            <PerformanceTrendChart data={performanceData} />
          </ChartCard>

          <ChartCard
            title="Department Performance Report"
            subtitle="Top 5 departments by average score"
            loading={isLoading}
          >
            <DepartmentRankingChart data={deptData} />
          </ChartCard>
        </div>

        {/* Report Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Employee Scorecard
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Employees</span>
                <span className="font-semibold text-white">{employees.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Employees</span>
                <span className="font-semibold text-white">{employees.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Performance</span>
                <span className="font-semibold text-white">
                  {employees.length > 0
                    ? Math.round(
                        employees.reduce((sum, e) => sum + e.overallScore, 0) /
                          employees.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              KPI Completion Report
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total KPIs</span>
                <span className="font-semibold text-white">{kpis.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completed</span>
                <span className="font-semibold text-white">{stats.completedKPIs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">In Progress</span>
                <span className="font-semibold text-white">
                  {kpis.filter((k) => k.status === "in-progress").length}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Task Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Tasks</span>
                <span className="font-semibold text-white">{tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completed</span>
                <span className="font-semibold text-white">
                  {tasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Completion Rate</span>
                <span className="font-semibold text-white">
                  {tasks.length > 0
                    ? Math.round(
                        (tasks.filter((t) => t.status === "completed").length /
                          tasks.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
