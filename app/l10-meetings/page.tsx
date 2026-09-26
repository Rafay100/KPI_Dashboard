"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClickUpEmbed } from "@/components/ui/ClickUpEmbed";
import { CLICKUP_EMBED_CONFIG } from "@/config/clickup";
import { CalendarCheck } from "lucide-react";

export default function L10MeetingsPage() {
  const item = CLICKUP_EMBED_CONFIG.l10;

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title={item.title}
          description="Level 10 weekly meeting cadence, agendas, and leadership alignment."
        />

        {/* Reusable Responsive ClickUp Embed Container */}
        <ClickUpEmbed
          title={item.title}
          itemName="L10 Meetings view"
          description="Level 10 weekly meeting cadence, agendas, to-dos, issues, and leadership alignment."
          embedUrl={item.url}
          envVarName={item.envVar}
          icon={CalendarCheck}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
