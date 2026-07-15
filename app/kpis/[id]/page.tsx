"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useKPIs } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/kpis/components/StatusBadge";
import { ProgressCell } from "@/features/kpis/components/ProgressCell";
import { UpdateKPIModal } from "@/features/kpis/components/UpdateKPIModal";
import { ArrowLeft, Edit, History } from "lucide-react";

export default function KPIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: kpis, isLoading } = useKPIs();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const kpi = kpis?.find((k) => k.id === params.id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-white/10" />
            <div className="glass-card h-96" />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!kpi) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="glass-card p-8 text-center">
            <h2 className="text-xl font-semibold text-white">KPI Not Found</h2>
            <p className="mt-2 text-gray-400">
              The KPI you&apos;re looking for doesn&apos;t exist
            </p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="mb-6 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <PageHeader title={kpi.kpiName} description={kpi.description} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  KPI Information
                </h3>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => setIsUpdateModalOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Update
                  </Button>
                  <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Status
                  </label>
                  <div className="mt-2">
                    <StatusBadge status={kpi.status} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Progress
                  </label>
                  <div className="mt-2">
                    <ProgressCell
                      actual={kpi.actualValue}
                      target={kpi.targetValue}
                      score={kpi.score}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Department
                    </label>
                    <p className="mt-1 text-sm text-white">{kpi.departmentId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Employee
                    </label>
                    <p className="mt-1 text-sm text-white">{kpi.employeeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Target Value
                    </label>
                    <p className="mt-1 text-sm text-white">{kpi.targetValue}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Actual Value
                    </label>
                    <p className="mt-1 text-sm text-white">{kpi.actualValue}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Due Date
                    </label>
                    <p className="mt-1 text-sm text-white">
                      {new Date(kpi.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Last Updated
                    </label>
                    <p className="mt-1 text-sm text-white">
                      {new Date(kpi.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Score</span>
                  <span className="font-semibold text-white">{kpi.score}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Target</span>
                  <span className="font-semibold text-white">
                    {kpi.targetValue}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Actual</span>
                  <span className="font-semibold text-white">
                    {kpi.actualValue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Modal */}
        <UpdateKPIModal
          kpi={kpi}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
