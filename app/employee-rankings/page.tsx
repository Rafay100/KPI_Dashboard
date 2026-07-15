"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEmployees } from "@/hooks/useData";
import { Trophy, Medal, Award } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default function EmployeeRankings() {
  const { data: employees, isLoading, isError } = useEmployees();

  // Calculate rankings
  const rankedEmployees = useMemo(() => {
    if (!employees) return [];

    return [...employees]
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((emp, index) => ({
        ...emp,
        rank: index + 1,
      }));
  }, [employees]);

  const topPerformer = rankedEmployees[0];
  const avgScore = useMemo(() => {
    if (!employees || employees.length === 0) return 0;
    return Math.round(
      employees.reduce((sum, emp) => sum + emp.overallScore, 0) / employees.length
    );
  }, [employees]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Employee Rankings" description="Loading..." />
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card h-24 rounded-lg" />
            ))}
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (isError || !employees) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Employee Rankings" description="Error loading data" />
          <div className="glass-card p-8 text-center">
            <p className="text-gray-400">Failed to load employee rankings</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Employee Rankings"
          description="Performance rankings and scorecards for individual team members"
        />

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Employees"
            value={employees.length}
            icon={Trophy}
            color="blue"
          />
          <StatCard
            title="Average Score"
            value={`${avgScore}%`}
            icon={Medal}
            color="purple"
          />
          <StatCard
            title="Top Performer"
            value={topPerformer?.name || "—"}
            icon={Award}
            color="green"
          />
        </div>

        {/* Rankings Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Total KPIs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {employee.rank === 1 && (
                          <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                        )}
                        {employee.rank === 2 && (
                          <Medal className="mr-2 h-5 w-5 text-gray-400" />
                        )}
                        {employee.rank === 3 && (
                          <Award className="mr-2 h-5 w-5 text-orange-400" />
                        )}
                        <span className="font-semibold text-white">
                          #{employee.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{employee.name}</div>
                      <div className="text-sm text-gray-400">{employee.email}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-white">
                      {employee.department}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {employee.position || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-white">
                      {employee.totalKPIs}
                    </td>
                    <td className="px-4 py-4 text-sm text-white">
                      {employee.completedKPIs}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${employee.overallScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {employee.overallScore}%
                        </span>
                      </div>
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
