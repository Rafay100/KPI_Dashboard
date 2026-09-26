"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClickUpEmbed } from "@/components/ui/ClickUpEmbed";
import { CLICKUP_EMBED_CONFIG } from "@/config/clickup";
import { ListTodo } from "lucide-react";

export default function TodosPage() {
  const item = CLICKUP_EMBED_CONFIG.todos;

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title={item.title}
          description="Live ClickUp To-Do embedded list for real-time action items and to-do tracking."
        />

        {/* Reusable Responsive ClickUp Embed Container */}
        <ClickUpEmbed
          title={item.title}
          itemName="To-Do list"
          description="Live ClickUp To-Do embedded list for real-time action items and to-do execution."
          embedUrl={item.url}
          envVarName={item.envVar}
          icon={ListTodo}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
