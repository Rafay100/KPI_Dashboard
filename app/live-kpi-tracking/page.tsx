import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export default function LiveKPITracking() {
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Live KPI Tracking"
          description="Real-time monitoring of KPI performance with live updates and alerts."
        />

        <Card>
          <p className="text-gray-400">
            This page will display real-time KPI data with live updates, progress bars,
            and instant notifications when KPIs are updated or thresholds are crossed.
          </p>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
