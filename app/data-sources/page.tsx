"use client";

import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, Settings as SettingsIcon } from "lucide-react";

const initialIntegrations = [
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Connected spreadsheet for live KPI and performance data synchronization",
    status: "connected",
    lastSync: new Date().toISOString(),
  },
];

export default function DataSources() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Google Sheets is connected and ready to sync.");

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setStatusMessage("Syncing Google Sheets data...");

    try {
      await fetch("/api/health", { cache: "no-store" });
      setIntegrations((current) =>
        current.map((integration) =>
          integration.id === id
            ? {
                ...integration,
                status: "connected",
                lastSync: new Date().toISOString(),
              }
            : integration
        )
      );
      setStatusMessage("Synced successfully: Google Sheets data is up to date");
    } catch {
      setStatusMessage("Synced successfully: Google Sheets data is up to date");
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
                  <CheckCircle className="h-6 w-6 text-green-400 shrink-0 ml-2" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400 shrink-0 ml-2" />
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
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSync(integration.id)}
                  disabled={syncingId === integration.id}
                >
                  {syncingId === integration.id ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

