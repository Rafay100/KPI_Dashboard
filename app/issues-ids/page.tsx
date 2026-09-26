"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClickUpEmbed } from "@/components/ui/ClickUpEmbed";
import { CLICKUP_EMBED_CONFIG } from "@/config/clickup";
import { AlertCircle } from "lucide-react";

export default function IssuesIdsPage() {
  const item = CLICKUP_EMBED_CONFIG.issues;

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title={item.title}
          description="Identify, Discuss, and Solve organizational issues and hurdles in real-time."
        />

        {/* Reusable Responsive ClickUp Embed Container */}
        <ClickUpEmbed
          title={item.title}
          itemName="Issues / IDS view"
          description="Identify, Discuss, and Solve organizational issues, blockers, and hurdles."
          embedUrl={item.url}
          envVarName={item.envVar}
          icon={AlertCircle}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
