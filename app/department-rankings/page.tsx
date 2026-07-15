"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDepartments } from "@/hooks/useData";
import { Building2, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DepartmentRankings() {
  const { data: departments, isLoading, isError } = useDepartments();

  const rankedDepartments = useMemo(() => {
    if (!departments) return [];
    return [...departments].sort((a, b) => b.averageScore - a.averageScore);
  }, [departments]);

  const chartData = useMemo(() => {
    return rankedDepartments.slice(0, 5).map((dept) => ({
      name: dept.departmentName,
      score: dept.averageScore,
    }));
  }, [rankedDepartments]);

  const avgScore = useMemo(() => {
    if (!departments || departments.length === 0) return 0;
    return Math.round(
      departments.reduce((sum, dept) => sum + dept.averageScore, 0) /
        departments.length
    );
  }, [departments]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Department Rankings" description="Loading..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (isError || !departments) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Department Rankings" description="Error loading data" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Department Rankings"
          description="Comparative performance analysis across departments and teams"
        />

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Departments"
            value={departments.length}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Average Score"
            value={`${avgScore}%`}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Total Employees"
            value={departments.reduce((sum, d) => sum + d.employeeCount, 0)}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Chart */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Top 5 Departments by Score
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="score" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rankedDepartments.map((dept, index) => (
            <div key={dept.id} className="glass-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400">
                    Rank #{index + 1}
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {dept.departmentName}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Employees</span>
                  <span className="font-semibold text-white">
                    {dept.employeeCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total KPIs</span>
                  <span className="font-semibold text-white">
                    {dept.totalKPIs}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Completed</span>
                  <span className="font-semibold text-white">
                    {dept.completedKPIs}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Average Score</span>
                  <span className="font-semibold text-white">
                    {dept.averageScore}%
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    style={{ width: `${dept.averageScore}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
