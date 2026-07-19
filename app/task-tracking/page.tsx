"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useTasks } from "@/hooks/useData";
import { CheckSquare, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { TaskStatusChart } from "@/components/charts/TaskStatusChart";

export default function TaskTracking() {
  const { data: tasks, isLoading, isError } = useTasks();

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, inProgress: 0, blocked: 0, completionRate: 0 };

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
        : 0,
    };
  }, [tasks]);

  const taskStatusData = useMemo(() => {
    if (!tasks) return [];
    return [
      { name: "Completed", value: tasks.filter((t) => t.status === "completed").length },
      { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length },
      { name: "Todo", value: tasks.filter((t) => t.status === "todo").length },
      { name: "Blocked", value: tasks.filter((t) => t.status === "blocked").length },
    ];
  }, [tasks]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Task Tracking" description="Loading..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (isError || !tasks) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader title="Task Tracking" description="Error loading tasks" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Task Tracking"
          description="Track tasks and action items associated with KPI achievement"
        />

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon={CheckSquare}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Blocked"
            value={stats.blocked}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={AlertCircle}
            color="purple"
          />
        </div>

        {/* Chart */}
        <ChartCard title="Task Status Distribution">
          <TaskStatusChart data={taskStatusData} />
        </ChartCard>

        {/* Tasks Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Task Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{task.taskName}</div>
                      <div className="text-sm text-gray-400">{task.description}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-white">{task.assignedTo}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                          task.priority === "critical"
                            ? "bg-red-500/10 text-red-400"
                            : task.priority === "high"
                            ? "bg-orange-500/10 text-orange-400"
                            : task.priority === "medium"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                          task.status === "completed"
                            ? "bg-green-500/10 text-green-400"
                            : task.status === "in-progress"
                            ? "bg-blue-500/10 text-blue-400"
                            : task.status === "blocked"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(task.dueDate).toLocaleDateString()}
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

