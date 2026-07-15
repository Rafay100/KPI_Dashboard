"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useAchievements } from "@/hooks/useData";
import { Trophy, Award, Star, TrendingUp } from "lucide-react";
import { AchievementDistributionChart } from "@/components/charts/AchievementDistributionChart";

export default function Achievements() {
  const { data: achievements, isLoading, isError } = useAchievements();

  const stats = useMemo(() => {
    if (!achievements) return { total: 0, points: 0, categories: 0 };

    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    const categories = new Set(achievements.map((a) => a.category)).size;

    return {
      total: achievements.length,
      points: totalPoints,
      categories,
    };
  }, [achievements]);

  const achievementDistribution = useMemo(() => {
    if (!achievements) return [];

    const categories = achievements.reduce((acc, a) => {
      const category = a.category.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [achievements]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Achievements" description="Loading..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (isError || !achievements) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Achievements" description="Error loading achievements" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Achievements"
          description="Celebrate milestones, completed KPIs, and team accomplishments"
        />

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Total Achievements"
            value={stats.total}
            icon={Trophy}
            color="purple"
          />
          <StatCard
            title="Achievement Points"
            value={stats.points}
            icon={Star}
            color="orange"
          />
          <StatCard
            title="Categories"
            value={stats.categories}
            icon={Award}
            color="blue"
          />
          <StatCard
            title="This Month"
            value={achievements.filter(a =>
              new Date(a.achievedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Chart */}
        {achievementDistribution.length > 0 && (
          <ChartCard title="Achievements by Category">
            <AchievementDistributionChart data={achievementDistribution} />
          </ChartCard>
        )}

        {/* Achievements Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Achievements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Earned Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((achievement) => (
                  <tr
                    key={achievement.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{achievement.title}</div>
                      <div className="text-sm text-gray-400">{achievement.description}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-white">
                      {achievement.employeeName}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-md bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-400">
                        {achievement.category.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {achievement.points}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(achievement.achievedAt).toLocaleDateString()}
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
