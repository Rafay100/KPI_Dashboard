"use client";

import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Globe, Bell } from "lucide-react";

type SettingsTab = "General" | "Appearance" | "Notifications" | "Profile" | "API Keys" | "About";

export default function Settings() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");

  const renderContent = () => {
    switch (activeTab) {
      case "Appearance":
        return (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Appearance</h3>
            <p className="text-sm text-gray-400">Theme and display preferences will appear here.</p>
          </div>
        );
      case "Notifications":
        return (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Notifications</h3>
            <p className="text-sm text-gray-400">Notification settings will appear here.</p>
          </div>
        );
      case "Profile":
        return (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Profile</h3>
            <p className="text-sm text-gray-400">Profile management will appear here.</p>
          </div>
        );
      case "API Keys":
        return (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">API Keys</h3>
            <p className="text-sm text-gray-400">API key management will appear here.</p>
          </div>
        );
      case "About":
        return (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">About</h3>
            <p className="text-sm text-gray-400">App details and version info will appear here.</p>
          </div>
        );
      case "General":
      default:
        return (
          <>
            <div className="glass-card p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">General Settings</h3>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                        {isDark ? (
                          <Moon className="h-5 w-5 text-purple-400" />
                        ) : (
                          <Sun className="h-5 w-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Dark Mode</div>
                        <div className="text-xs text-gray-400">
                          Toggle dark/light theme
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDark(!isDark)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDark ? "bg-blue-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDark ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Language</div>
                      <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <Bell className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        Notification Preferences
                      </div>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-gray-400">KPI updates</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-gray-400">Task deadlines</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span className="text-gray-400">Email notifications</span>
                        </label>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                System Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Version</span>
                  <span className="font-semibold text-white">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Build</span>
                  <span className="font-semibold text-white">2024.01</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Environment</span>
                  <span className="font-semibold text-white">Production</span>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Configure application preferences, notifications, and user settings"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="glass-card p-4">
            <nav className="space-y-1">
              {(["General", "Appearance", "Notifications", "Profile", "API Keys", "About"] as SettingsTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full rounded-lg px-4 py-2 text-left text-sm ${
                    activeTab === tab
                      ? "bg-white/10 font-medium text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            {renderContent()}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
