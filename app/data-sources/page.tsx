"use client";

import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, Settings as SettingsIcon } from "lucide-react";

const initialIntegrations = [
  {
    id: "airtable",
    name: "Airtable",
    description: "Connected to Airtable database for KPI data",
    status: "connected",
    lastSync: new Date().toISOString(),
  },
  {
    id: "clickup",
    name: "ClickUp",
    description: "Project management and task tracking",
    status: "coming-soon",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Issue tracking and agile project management",
    status: "coming-soon",
  },
  {
    id: "monday",
    name: "Monday.com",
    description: "Work operating system for team collaboration",
    status: "coming-soon",
  },
  {
    id: "asana",
    name: "Asana",
    description: "Work management platform for organizing tasks",
    status: "coming-soon",
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Spreadsheet integration for data import/export",
    status: "coming-soon",
  },
  {
    id: "csv",
    name: "CSV Import",
    description: "Import data from CSV files",
    status: "coming-soon",
  },
];

export default function DataSources() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Airtable is ready to sync.");

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setStatusMessage("Syncing data...");

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const data = await response.json();
      setIntegrations((current) =>
        current.map((integration) =>
          integration.id === id
            ? {
                ...integration,
                status: response.ok ? "connected" : "coming-soon",
                lastSync: new Date().toISOString(),
              }
            : integration
        )
      );
      setStatusMessage(
        response.ok
          ? `Synced successfully: ${data.message || "Airtable is healthy"}`
          : "Sync failed. Please check your Airtable connection."
      );
    } catch {
      setStatusMessage("Sync failed. Please check your Airtable connection.");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Data Sources"
          description="Manage and configure connected data sources for KPI tracking"
        />

        <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {statusMessage}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="glass-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {integration.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {integration.description}
                  </p>
                </div>
                {integration.status === "connected" ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div className="mb-4">
                {integration.status === "connected" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="font-semibold text-green-400">Connected</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Sync</span>
                      <span className="font-semibold text-white">
                        {new Date(integration.lastSync!).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-center">
                    <span className="text-sm font-semibold text-blue-400">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {integration.status === "connected" ? (
                  <>
                    <Button size="sm" className="flex-1" onClick={() => handleSync(integration.id)} disabled={syncingId === integration.id}>
                      {syncingId === integration.id ? "Syncing..." : "Sync Now"}
                    </Button>
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1" disabled>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

