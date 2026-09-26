"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClickUpEmbed } from "@/components/ui/ClickUpEmbed";
import { CLICKUP_EMBED_CONFIG } from "@/config/clickup";
import { Mountain } from "lucide-react";

export default function RocksPage() {
  const item = CLICKUP_EMBED_CONFIG.rocks;

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title={item.title}
          description="Track and manage quarterly strategic priorities and milestone rocks."
        />

        {/* Reusable Responsive ClickUp Embed Container */}
        <ClickUpEmbed
          title={item.title}
          itemName="Rocks view"
          description="Track and manage quarterly strategic priorities, milestones, and milestone rocks."
          embedUrl={item.url}
          envVarName={item.envVar}
          icon={Mountain}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
