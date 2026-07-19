"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useKPIs, useDepartments } from "@/hooks/useData";
import { StatCard } from "@/components/dashboard/StatCard";
import type { KPI } from "@/types/models";
import { 
  RefreshCw, 
  Activity, 
  Target, 
  Clock, 
  Filter, 
  Play, 
  Pause,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LiveKPITrackingPage() {
  const { data: kpis = [], isLoading, refetch } = useKPIs();
  const { data: departments = [] } = useDepartments();

  const [selectedDept, setSelectedDept] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set the last refreshed timestamp on load and update
  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [kpis]);

  // Auto-refresh interval (every 10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.departmentName : deptId;
  };

  const getKPIColors = (score: number) => {
    if (score >= 90) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", progress: "from-emerald-500 to-teal-400" };
    if (score >= 70) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", progress: "from-amber-500 to-yellow-400" };
    return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", progress: "from-rose-500 to-red-500" };
  };

  const filteredKPIs = useMemo(() => {
    return kpis.filter((k) => selectedDept === "all" || k.departmentId === selectedDept);
  }, [kpis, selectedDept]);

  // Calculations
  const stats = useMemo(() => {
    const total = filteredKPIs.length;
    const active = filteredKPIs.filter(k => k.status === "in-progress" || k.status === "at-risk").length;
    const averageScore = total > 0 ? Math.round(filteredKPIs.reduce((s, k) => s + (k.score || 0), 0) / total) : 0;
    return { total, active, averageScore };
  }, [filteredKPIs]);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <PageHeader
            title="Live KPI Tracking"
            description="Real-time monitoring streams, telemetry data feeds, and instant target progression scorecards."
          />
          
          <div className="flex items-center space-x-3 self-start md:self-center">
            {/* Auto Refresh Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 border-white/10 ${
                autoRefresh ? "bg-blue-600/15 border-blue-500/40 text-blue-400 hover:bg-blue-600/25" : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {autoRefresh ? (
                <>
                  <Play className="h-3.5 w-3.5 animate-pulse text-blue-400" />
                  <span>Auto Refresh: On</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-gray-500" />
                  <span>Auto Refresh: Off</span>
                </>
              )}
            </Button>

            {/* Manual Refresh */}
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center space-x-2 border-white/10 hover:bg-white/5 text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Live Feed Status Bar */}
        <div className="glass-card px-6 py-3 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? "bg-blue-400" : "bg-gray-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoRefresh ? "bg-blue-500" : "bg-gray-500"}`}></span>
            </span>
            <span>Feed status: {autoRefresh ? "Streaming live data updates" : "Feed paused"}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>Last checked: {lastRefreshed || "Never"}</span>
          </div>
        </div>

        {/* Live Metrics Stats */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Monitored KPIs</span>
              <span className="text-2xl font-extrabold text-white">{stats.total}</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Active Updates</span>
              <span className="text-2xl font-extrabold text-white">{stats.active}</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Average Stream Score</span>
              <span className="text-2xl font-extrabold text-blue-400">{stats.averageScore}%</span>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Activity className="h-5 w-5 rotate-90" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live telemetry feeds</span>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Cards Grid */}
        {isLoading && filteredKPIs.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse space-y-4">
                <div className="h-5 w-1/3 bg-white/10 rounded"></div>
                <div className="h-6 w-2/3 bg-white/10 rounded"></div>
                <div className="h-4 w-5/6 bg-white/10 rounded"></div>
                <div className="h-2 bg-white/10 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : filteredKPIs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <h3 className="text-base font-semibold text-white">No active KPIs matching this department</h3>
            <p className="text-xs text-gray-400 mt-1">Select another department from the filter dropdown.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredKPIs.map((kpi) => {
              const colors = getKPIColors(kpi.score || 0);
              return (
                <div 
                  key={kpi.id} 
                  className={`glass-card p-5 border ${colors.border} hover:bg-white/5 transition-all duration-300 relative overflow-hidden group`}
                >
                  {/* Subtle top pulsing activity dot */}
                  <div className="absolute top-3 right-3 flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${kpi.score >= 70 ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.score >= 70 ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">
                    {getDepartmentName(kpi.departmentId)}
                  </span>
                  
                  <h4 className="text-base font-bold text-white mb-2 truncate group-hover:text-blue-400 transition-colors">
                    {kpi.kpiName}
                  </h4>

                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 h-8 leading-relaxed">
                    {kpi.description || "No KPI description defined."}
                  </p>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Live score progress</span>
                      <span className={`font-bold ${colors.text}`}>{kpi.score}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colors.progress} transition-all duration-1000`}
                        style={{ width: `${Math.min(kpi.score || 0, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                      <span>Val: <strong>{kpi.actualValue}</strong></span>
                      <span>Target: <strong>{kpi.targetValue}</strong></span>
                      <span>Unit: <strong>{kpi.unit || "Qty"}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

