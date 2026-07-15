"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ExecutiveOverview() {
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="KPI Dashboard"
          description="Real-time KPI tracking and organizational performance metrics"
        />

        {/* Airtable Embedded Dashboard */}
        <div className="w-full">
          <iframe
            src="https://airtable.com/embed/appoKnor5NuMkA5DA/shrg0ucCUZl5lZMIt"
            width="100%"
            height="900"
            style={{ border: "none", borderRadius: "12px" }}
            title="KPI Dashboard"
          />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
