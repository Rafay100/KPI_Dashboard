"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableToolbar } from "@/features/kpis/components/TableToolbar";
import { KPITable } from "@/features/kpis/components/KPITable";
import { KPIDetailDrawer } from "@/features/kpis/components/KPIDetailDrawer";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useKPIs } from "@/hooks/useData";
import type { KPI } from "@/types/models";
import { AlertCircle } from "lucide-react";

export default function KPITrackingBoard() {
  const router = useRouter();
  const { data: kpis, isLoading, isError, refetch } = useKPIs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedKPI(null);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Filter KPIs based on search query
  const filteredKPIs = kpis?.filter((kpi) => {
    const query = searchQuery.toLowerCase();
    return (
      kpi.kpiName.toLowerCase().includes(query) ||
      kpi.description.toLowerCase().includes(query) ||
      kpi.departmentId.toLowerCase().includes(query) ||
      kpi.employeeId.toLowerCase().includes(query)
    );
  }) || [];

  // Error State
  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader
            title="KPI Tracking Board"
            description="Unable to load KPI data"
          />
          <div className="glass-card p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Failed to Load KPIs
              </h3>
              <p className="mb-6 text-sm text-gray-400">
                There was an error loading the KPI data. Please check your
                connection and try again.
              </p>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Retry
              </button>
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
          title="KPI Tracking Board"
          description="Comprehensive board for tracking all organizational KPIs across teams and departments"
        />

        {/* Toolbar */}
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          loading={isLoading}
        />

        {/* Table or Empty State */}
        {!isLoading && filteredKPIs.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No KPIs Found" : "No KPIs Available"}
            description={
              searchQuery
                ? "Try adjusting your search query or filters"
                : "Get started by creating your first KPI"
            }
            actionLabel="Create KPI"
            onAction={() => router.push("/create-kpi")}
          />
        ) : (
          <KPITable
            data={filteredKPIs}
            onRowClick={handleRowClick}
            loading={isLoading}
          />
        )}

        {/* Detail Drawer */}
        <KPIDetailDrawer
          kpi={selectedKPI}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
