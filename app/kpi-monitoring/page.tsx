"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useKPIs, useEmployees, useDepartments } from "@/hooks/useData";
import { KPIDetailDrawer } from "@/features/kpis/components/KPIDetailDrawer";
import type { KPI } from "@/types/models";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Filter, 
  User,
  ArrowUpRight,
  Briefcase,
  AlertOctagon
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function KPIMonitoringPage() {
  const { data: kpis, isLoading: isKPIsLoading, isError, refetch } = useKPIs();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper to map employee ID to Name
  const getEmployeeName = (empId: string) => {
    const emp = employees?.find((e) => e.id === empId);
    return emp ? emp.name : "Unassigned";
  };

  // Helper to map department ID to Name
  const getDepartmentName = (deptId: string) => {
    const dept = departments?.find((d) => d.id === deptId);
    return dept ? dept.departmentName : deptId;
  };

  // Dynamically calculate KPI Status & health based on Score
  const getKPIHealth = (kpi: KPI) => {
    const score = kpi.score ?? 0;
    if (score >= 90 || kpi.status === "completed") {
      return {
        label: "On Track",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        barColor: "bg-emerald-500",
        severity: "success" as const,
        icon: CheckCircle2,
      };
    } else if (score >= 70) {
      return {
        label: "Warning",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        barColor: "bg-amber-500",
        severity: "warning" as const,
        icon: AlertTriangle,
      };
    } else {
      return {
        label: "Critical",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        barColor: "bg-rose-500",
        severity: "error" as const,
        icon: AlertOctagon,
      };
    }
  };

  // Filtering
  const filteredKPIs = useMemo(() => {
    return (kpis || []).filter((kpi) => {
      // Search match
      const query = searchQuery.toLowerCase();
      const nameMatch = kpi.kpiName.toLowerCase().includes(query) || kpi.description.toLowerCase().includes(query);
      
      // Department match
      const deptMatch = selectedDept === "all" || kpi.departmentId === selectedDept;

      // Status match based on computed score
      const health = getKPIHealth(kpi);
      const statusMatch = selectedStatus === "all" || health.label.toLowerCase() === selectedStatus.toLowerCase();

      return nameMatch && deptMatch && statusMatch;
    });
  }, [kpis, searchQuery, selectedDept, selectedStatus]);

  // Statistics Computations
  const stats = useMemo(() => {
    const list = kpis || [];
    const total = list.length;
    let onTrack = 0;
    let warning = 0;
    let critical = 0;
    
    list.forEach((k) => {
      const h = getKPIHealth(k);
      if (h.label === "On Track") onTrack++;
      else if (h.label === "Warning") warning++;
      else critical++;
    });

    const avgScore = total > 0 ? Math.round(list.reduce((sum, k) => sum + (k.score || 0), 0) / total) : 0;

    return { total, onTrack, warning, critical, avgScore };
  }, [kpis]);

  // Breached/Alert list
  const activeAlerts = useMemo(() => {
    return (kpis || [])
      .filter((k) => {
        const health = getKPIHealth(k);
        return health.label === "Critical" || health.label === "Warning";
      })
      .slice(0, 5);
  }, [kpis]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredKPIs.length === 0) return;
    
    const headers = ["KPI Name", "Description", "Department", "Owner", "Target Value", "Actual Value", "Score (%)", "Status", "Last Updated"];
    const rows = filteredKPIs.map((k) => [
      k.kpiName,
      k.description,
      getDepartmentName(k.departmentId),
      getEmployeeName(k.employeeId),
      k.targetValue,
      k.actualValue,
      k.score,
      getKPIHealth(k).label,
      new Date(k.lastUpdated).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kpi_monitoring_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsDrawerOpen(true);
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <PageHeader
            title="KPI Monitoring"
            description="Real-time health telemetry, threshold breaches, and performance metrics across departments."
          />
          <div className="flex items-center space-x-3 self-start md:self-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isKPIsLoading}
              className="flex items-center space-x-2 border-white/10 hover:bg-white/5 text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={filteredKPIs.length === 0}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="glass-card p-5">
            <span className="text-xs text-gray-400 block mb-1">Total Monitored KPIs</span>
            <span className="text-3xl font-extrabold text-white block">
              {isKPIsLoading ? "..." : stats.total}
            </span>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-emerald-500">
            <span className="text-xs text-emerald-400 font-medium block mb-1 flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> On Track
            </span>
            <span className="text-3xl font-extrabold text-white block">
              {isKPIsLoading ? "..." : stats.onTrack}
            </span>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-amber-500">
            <span className="text-xs text-amber-400 font-medium block mb-1 flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Warnings
            </span>
            <span className="text-3xl font-extrabold text-white block">
              {isKPIsLoading ? "..." : stats.warning}
            </span>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-rose-500">
            <span className="text-xs text-rose-400 font-medium block mb-1 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1" /> Critical / Breached
            </span>
            <span className="text-3xl font-extrabold text-white block">
              {isKPIsLoading ? "..." : stats.critical}
            </span>
          </div>
          <div className="glass-card p-5">
            <span className="text-xs text-gray-400 block mb-1">Average Score</span>
            <span className="text-3xl font-extrabold text-blue-400 block">
              {isKPIsLoading ? "..." : `${stats.avgScore}%`}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters and KPI List Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-500 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search monitored KPIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                {/* Department Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="on track">On Track</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* KPI Cards / List */}
            {isKPIsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="glass-card p-6 animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-48 bg-white/10 rounded"></div>
                      <div className="h-6 w-20 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="h-4 w-5/6 bg-white/10 rounded"></div>
                    <div className="space-y-2">
                      <div className="flex justify-between h-3 bg-white/10 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredKPIs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-400 mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No monitored KPIs match your filters</h3>
                <p className="text-sm text-gray-400">Try modifying your search or dropdown selections.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredKPIs.map((kpi) => {
                  const health = getKPIHealth(kpi);
                  const isUp = (kpi.score ?? 0) >= 80;
                  
                  return (
                    <div
                      key={kpi.id}
                      onClick={() => handleRowClick(kpi)}
                      className="glass-card p-5 hover:border-white/20 hover:bg-white/5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                              {getDepartmentName(kpi.departmentId)}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center">
                              <User className="h-2.5 w-2.5 mr-1" />
                              {getEmployeeName(kpi.employeeId)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            {kpi.kpiName}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${health.color}`}>
                            <health.icon className="h-3 w-3 mr-1" />
                            {health.label}
                          </span>
                          <span className="text-gray-500 hover:text-white transition-colors">
                            <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-400 line-clamp-2 mb-4 pr-6">
                        {kpi.description || "No description provided."}
                      </p>

                      {/* Score Metrics and Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400">
                              Actual: <strong className="text-white">{kpi.actualValue} {kpi.unit || ""}</strong>
                            </span>
                            <span className="text-gray-400">
                              Target: <strong className="text-white">{kpi.targetValue} {kpi.unit || ""}</strong>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-semibold text-white">
                            <span>{kpi.score}%</span>
                            {isUp ? (
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${health.barColor} transition-all duration-500`}
                            style={{ width: `${Math.min(kpi.score || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Alert Panel */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                <AlertOctagon className="h-4 w-4 mr-2 text-rose-400" />
                Active Alerts ({activeAlerts.length})
              </h3>
              
              {isKPIsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No active threshold breaches. All KPIs healthy!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((k) => {
                    const health = getKPIHealth(k);
                    return (
                      <div 
                        key={k.id}
                        onClick={() => handleRowClick(k)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer hover:bg-white/5 transition-all ${
                          health.label === "Critical" 
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-300" 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 font-semibold">
                          <span className="truncate max-w-[120px]">{k.kpiName}</span>
                          <span>{k.score}%</span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-normal">
                          {health.label === "Critical" 
                            ? `KPI has breached the critical threshold (<70%). Requires immediate attention.`
                            : `KPI is approaching critical limits. Review owner assignment.`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-blue-400" />
                Monitoring Insights
              </h3>
              <ul className="text-xs text-gray-400 space-y-3 leading-relaxed list-disc pl-4">
                <li>KPI values are synchronizing live from the configured source (currently <strong>google-sheets</strong>).</li>
                <li>Scores above 90% are flagged as <strong>On Track</strong>.</li>
                <li>Scores between 70% and 90% trigger a <strong>Warning</strong> state.</li>
                <li>Any score below 70% triggers a critical <strong>Alert</strong> indicating a priority threshold breach.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* KPI Detail Drawer */}
        <KPIDetailDrawer
          kpi={selectedKPI}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedKPI(null);
          }}
        />
      </PageContainer>
    </DashboardLayout>
  );
}

