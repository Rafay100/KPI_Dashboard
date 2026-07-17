"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDashboardData } from "@/hooks/useData";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import {
  Users, Building, Target, CheckSquare, Trophy,
  Search, Calendar, Filter, RefreshCw, ArrowUpDown,
  Download, Eye, AlertCircle, ChevronLeft, ChevronRight,
  TrendingUp, Activity, Sparkles, X, AlertTriangle, CheckCircle2,
  Clock, Award, Settings, Printer, Save, FolderOpen, Trash2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer
} from "recharts";

type ReportTab = "kpi" | "employee" | "department" | "task" | "achievement" | "analytics";
type TimeFilter = "weekly" | "monthly" | "quarterly" | "yearly";

interface ReportSettings {
  defaultView: ReportTab;
  rowsPerPage: number;
  defaultExportFormat: "csv" | "excel";
  defaultDateRange: "all" | "weekly" | "monthly" | "yearly";
}

interface SavedFilterPreset {
  id: string;
  name: string;
  tab: ReportTab;
  globalSearch: string;
  selectedDept: string;
  startDate: string;
  endDate: string;
}

type ToastMsg = { text: string; type: "success" | "error" | "info"; id: number };

export default function ReportsPage() {
  const { data, isLoading, isError, refetch } = useDashboardData();

  const kpis = useMemo(() => data?.kpis || [], [data?.kpis]);
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  const departments = useMemo(() => data?.departments || [], [data?.departments]);
  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);
  const achievements = useMemo(() => data?.achievements || [], [data?.achievements]);

  // ── Toast System ─────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { text, type, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Settings & Presets ──────────────────────────────────────────────────────
  const [settings, setSettings] = useState<ReportSettings>({
    defaultView: "kpi",
    rowsPerPage: 8,
    defaultExportFormat: "csv",
    defaultDateRange: "all"
  });
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");

  // Load Settings from LocalStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("reports_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      const savedFilters = localStorage.getItem("reports_filter_presets");
      if (savedFilters) {
        setSavedPresets(JSON.parse(savedFilters));
      }
    } catch (e) {
      console.error("Failed to load reports configuration from local storage", e);
    }
  }, []);

  // ── Global Filter States ────────────────────────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("kpi");

  // Apply default view and date range on load
  useEffect(() => {
    if (settings.defaultView) {
      setActiveTab(settings.defaultView);
    }
    if (settings.defaultDateRange !== "all") {
      const now = new Date();
      let start = "";
      if (settings.defaultDateRange === "weekly") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = weekAgo.toISOString().split("T")[0];
      } else if (settings.defaultDateRange === "monthly") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start = monthAgo.toISOString().split("T")[0];
      } else if (settings.defaultDateRange === "yearly") {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        start = yearAgo.toISOString().split("T")[0];
      }
      setStartDate(start);
      setEndDate(now.toISOString().split("T")[0]);
    }
  }, [settings]);

  // ── KPI Report Specific States ──────────────────────────────────────────────
  const [kpiEmployeeFilter, setKpiEmployeeFilter] = useState("");
  const [kpiSelectFilter, setKpiSelectFilter] = useState("");
  const [kpiStatusFilter, setKpiStatusFilter] = useState("");
  const [kpiSortColumn, setKpiSortColumn] = useState("kpiName");
  const [kpiSortDir, setKpiSortDir] = useState<"asc" | "desc">("asc");
  const [kpiPage, setKpiPage] = useState(1);

  // ── Employee Report Specific States ─────────────────────────────────────────
  const [empSelectFilter, setEmpSelectFilter] = useState("");
  const [empSortColumn, setEmpSortColumn] = useState("overallScore");
  const [empSortDir, setEmpSortDir] = useState<"asc" | "desc">("desc");
  const [empPage, setEmpPage] = useState(1);

  // ── Department Report Specific States ───────────────────────────────────────
  const [deptSortColumn, setDeptSortColumn] = useState("averagePerformance");
  const [deptSortDir, setDeptSortDir] = useState<"asc" | "desc">("desc");
  const [deptPage, setDeptPage] = useState(1);

  // ── Task Report Specific States ─────────────────────────────────────────────
  const [taskStatusFilter, setTaskStatusFilter] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("");
  const [taskEmployeeFilter, setTaskEmployeeFilter] = useState("");
  const [taskSortColumn, setTaskSortColumn] = useState("dueDate");
  const [taskSortDir, setTaskSortDir] = useState<"asc" | "desc">("asc");
  const [taskPage, setTaskPage] = useState(1);

  // ── Achievement Report Specific States ──────────────────────────────────────
  const [achievementEmployeeFilter, setAchievementEmployeeFilter] = useState("");
  const [achievementTypeFilter, setAchievementTypeFilter] = useState("");
  const [achievementSortColumn, setAchievementSortColumn] = useState("achievedAt");
  const [achievementSortDir, setAchievementSortDir] = useState<"asc" | "desc">("desc");
  const [achievementPage, setAchievementPage] = useState(1);

  // ── Analytics States ────────────────────────────────────────────────────────
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<TimeFilter>("monthly");

  const pageSize = settings.rowsPerPage || 8;

  // Client mount state for Recharts hydration safety
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset pagination on filter changes
  useEffect(() => {
    setKpiPage(1);
    setEmpPage(1);
    setDeptPage(1);
    setTaskPage(1);
    setAchievementPage(1);
  }, [
    globalSearch, selectedDept, startDate, endDate, kpiEmployeeFilter,
    kpiSelectFilter, kpiStatusFilter, empSelectFilter, taskStatusFilter,
    taskPriorityFilter, taskEmployeeFilter, achievementEmployeeFilter,
    achievementTypeFilter, pageSize
  ]);

  // ── Export Helpers ──────────────────────────────────────────────────────────
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
    addToast(`Exported report to CSV: ${filename}`, "success");
  };

  const handleExportExcel = (headers: string[], rows: any[][], filename: string) => {
    const excelContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    downloadFile(excelContent, filename, "application/vnd.ms-excel;charset=utf-8;");
    addToast(`Exported report to Excel: ${filename}`, "success");
  };

  // ── PDF/Print Action ────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
    addToast("Initiated printing layout", "info");
  };

  // ── Save/Load Filters Preset ────────────────────────────────────────────────
  const saveCurrentFilterPreset = () => {
    if (!presetNameInput.trim()) {
      addToast("Please enter a name for the filter preset", "error");
      return;
    }
    const newPreset: SavedFilterPreset = {
      id: String(Date.now()),
      name: presetNameInput,
      tab: activeTab,
      globalSearch,
      selectedDept,
      startDate,
      endDate
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem("reports_filter_presets", JSON.stringify(updated));
    setPresetNameInput("");
    addToast(`Saved filter preset "${newPreset.name}"`, "success");
  };

  const loadPreset = (preset: SavedFilterPreset) => {
    setGlobalSearch(preset.globalSearch || "");
    setSelectedDept(preset.selectedDept || "");
    setStartDate(preset.startDate || "");
    setEndDate(preset.endDate || "");
    setActiveTab(preset.tab);
    addToast(`Loaded preset "${preset.name}"`, "info");
  };

  const deletePreset = (id: string, name: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem("reports_filter_presets", JSON.stringify(updated));
    addToast(`Deleted preset "${name}"`, "info");
  };

  // Save Settings Changes
  const updateSettingsValue = (key: keyof ReportSettings, value: any) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    localStorage.setItem("reports_settings", JSON.stringify(nextSettings));
  };

  // ── KPI Report calculations ──────────────────────────────────────────────────
  const filteredKPIs = useMemo(() => {
    return kpis.filter(k => {
      const matchGlobal = !globalSearch || 
        k.kpiName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        k.employeeId?.toLowerCase().includes(globalSearch.toLowerCase());
      
      const matchDept = !selectedDept || k.category?.toLowerCase() === selectedDept.toLowerCase();
      const matchEmp = !kpiEmployeeFilter || k.employeeId?.toLowerCase() === kpiEmployeeFilter.toLowerCase();
      const matchKpiName = !kpiSelectFilter || k.kpiName === kpiSelectFilter;
      const matchStatus = !kpiStatusFilter || k.status === kpiStatusFilter;

      let matchDates = true;
      if (startDate || endDate) {
        const itemTime = k.lastUpdated ? new Date(k.lastUpdated).getTime() : 0;
        if (startDate && itemTime < new Date(startDate).getTime()) matchDates = false;
        if (endDate && itemTime > new Date(endDate).getTime()) matchDates = false;
      }

      return matchGlobal && matchDept && matchEmp && matchKpiName && matchStatus && matchDates;
    });
  }, [kpis, globalSearch, selectedDept, kpiEmployeeFilter, kpiSelectFilter, kpiStatusFilter, startDate, endDate]);

  const sortedKPIs = useMemo(() => {
    const sorted = [...filteredKPIs];
    sorted.sort((a, b) => {
      let valA: any = a[kpiSortColumn as keyof typeof a] ?? "";
      let valB: any = b[kpiSortColumn as keyof typeof b] ?? "";

      if (kpiSortColumn === "achievement") {
        valA = a.targetValue > 0 ? (a.actualValue / a.targetValue) * 100 : 0;
        valB = b.targetValue > 0 ? (b.actualValue / b.targetValue) * 100 : 0;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return kpiSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return kpiSortDir === "asc" ? numA - numB : numB - numA;
      }
    });
    return sorted;
  }, [filteredKPIs, kpiSortColumn, kpiSortDir]);

  const paginatedKPIs = useMemo(() => {
    return sortedKPIs.slice((kpiPage - 1) * pageSize, kpiPage * pageSize);
  }, [sortedKPIs, kpiPage, pageSize]);

  // ── Employee Report calculations ─────────────────────────────────────────────
  const enrichedEmployees = useMemo(() => {
    const list = employees.map(emp => {
      const empKPIs = kpis.filter(k => k.employeeId?.toLowerCase() === emp.name.toLowerCase());
      const empTasks = tasks.filter(t => t.assignedTo?.toLowerCase() === emp.name.toLowerCase());
      const empAchievements = achievements.filter(a => a.employeeName?.toLowerCase() === emp.name.toLowerCase());

      const assignedKPIs = empKPIs.length;
      const completedKPIs = empKPIs.filter(k => k.status === "completed").length;
      const pendingKPIs = assignedKPIs - completedKPIs;

      const completedTasks = empTasks.filter(t => t.status === "completed").length;
      const pendingTasks = empTasks.length - completedTasks;
      const achievementsCount = empAchievements.length;

      return {
        ...emp,
        assignedKPIs,
        completedKPIs,
        pendingKPIs,
        completedTasks,
        pendingTasks,
        achievementsCount,
      };
    });

    const sortedByScore = [...list].sort((a, b) => b.overallScore - a.overallScore);
    return sortedByScore.map((emp, index) => ({
      ...emp,
      ranking: index + 1
    }));
  }, [employees, kpis, tasks, achievements]);

  const filteredEmployees = useMemo(() => {
    return enrichedEmployees.filter(emp => {
      const matchGlobal = !globalSearch ||
        emp.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        emp.department?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchDept = !selectedDept || emp.department === selectedDept;
      const matchEmp = !empSelectFilter || emp.name === empSelectFilter;

      let matchDates = true;
      if (startDate || endDate) {
        const empAchievements = achievements.filter(a => a.employeeName?.toLowerCase() === emp.name.toLowerCase());
        const hasAchievementInRange = empAchievements.some(a => {
          const itemTime = new Date(a.achievedAt).getTime();
          if (startDate && itemTime < new Date(startDate).getTime()) return false;
          if (endDate && itemTime > new Date(endDate).getTime()) return false;
          return true;
        });
        matchDates = hasAchievementInRange || empAchievements.length === 0;
      }

      return matchGlobal && matchDept && matchEmp && matchDates;
    });
  }, [enrichedEmployees, globalSearch, selectedDept, empSelectFilter, startDate, endDate, achievements]);

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    sorted.sort((a, b) => {
      const valA = a[empSortColumn as keyof typeof a] ?? "";
      const valB = b[empSortColumn as keyof typeof b] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return empSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return empSortDir === "asc" ? numA - numB : numB - numA;
      }
    });
    return sorted;
  }, [filteredEmployees, empSortColumn, empSortDir]);

  const paginatedEmployees = useMemo(() => {
    return sortedEmployees.slice((empPage - 1) * pageSize, empPage * pageSize);
  }, [sortedEmployees, empPage, pageSize]);

  // ── Department Report calculations ───────────────────────────────────────────
  const enrichedDepartments = useMemo(() => {
    const list = departments.map(dept => {
      const deptKPIs = kpis.filter(k => k.category?.toLowerCase() === dept.departmentName.toLowerCase());
      const deptEmployees = employees.filter(e => e.department?.toLowerCase() === dept.departmentName.toLowerCase());
      const deptTasks = tasks.filter(t => 
        deptEmployees.some(e => e.name.toLowerCase() === t.assignedTo?.toLowerCase())
      );
      const deptAchievements = achievements.filter(a =>
        deptEmployees.some(e => e.name.toLowerCase() === a.employeeName?.toLowerCase())
      );

      const totalKPIs = deptKPIs.length;
      const completedKPIs = deptKPIs.filter(k => k.status === "completed").length;
      const kpiCompletionPct = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;

      const totalTasks = deptTasks.length;
      const completedTasks = deptTasks.filter(t => t.status === "completed").length;
      const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const totalAchievements = deptAchievements.length;
      
      const employeeCount = deptEmployees.length || dept.employeeCount || 0;
      const averagePerformance = deptEmployees.length > 0 
        ? Math.round(deptEmployees.reduce((sum, e) => sum + e.overallScore, 0) / deptEmployees.length)
        : Math.round(dept.averageScore) || 0;

      return {
        ...dept,
        employeeCount,
        totalKPIs,
        completedKPIs,
        kpiCompletionPct,
        totalTasks,
        completedTasks,
        taskCompletionPct,
        totalAchievements,
        averagePerformance,
      };
    });

    const sortedByPerformance = [...list].sort((a, b) => b.averagePerformance - a.averagePerformance);
    return sortedByPerformance.map((dept, index) => ({
      ...dept,
      ranking: index + 1
    }));
  }, [departments, kpis, employees, tasks, achievements]);

  const filteredDepartments = useMemo(() => {
    return enrichedDepartments.filter(dept => {
      const matchGlobal = !globalSearch || 
        dept.departmentName.toLowerCase().includes(globalSearch.toLowerCase());
      const matchDept = !selectedDept || dept.departmentName === selectedDept;

      let matchDates = true;
      if (startDate || endDate) {
        const itemTime = dept.lastUpdated ? new Date(dept.lastUpdated).getTime() : 0;
        if (startDate && itemTime < new Date(startDate).getTime()) matchDates = false;
        if (endDate && itemTime > new Date(endDate).getTime()) matchDates = false;
      }

      return matchGlobal && matchDept && matchDates;
    });
  }, [enrichedDepartments, globalSearch, selectedDept, startDate, endDate]);

  const sortedDepartments = useMemo(() => {
    const sorted = [...filteredDepartments];
    sorted.sort((a, b) => {
      const valA = a[deptSortColumn as keyof typeof a] ?? "";
      const valB = b[deptSortColumn as keyof typeof b] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return deptSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return deptSortDir === "asc" ? numA - numB : numB - numA;
      }
    });
    return sorted;
  }, [filteredDepartments, deptSortColumn, deptSortDir]);

  const paginatedDepartments = useMemo(() => {
    return sortedDepartments.slice((deptPage - 1) * pageSize, deptPage * pageSize);
  }, [sortedDepartments, deptPage, pageSize]);

  // ── Task Report calculations ─────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchGlobal = !globalSearch ||
        t.taskName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.assignedTo?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchStatus = !taskStatusFilter || t.status === taskStatusFilter;
      const matchPriority = !taskPriorityFilter || t.priority === taskPriorityFilter;
      const matchEmp = !taskEmployeeFilter || t.assignedTo?.toLowerCase() === taskEmployeeFilter.toLowerCase();

      const empDept = employees.find(e => e.name.toLowerCase() === t.assignedTo?.toLowerCase())?.department;
      const matchDept = !selectedDept || empDept === selectedDept;

      let matchDates = true;
      if (startDate || endDate) {
        const itemTime = t.dueDate ? new Date(t.dueDate).getTime() : 0;
        if (startDate && itemTime < new Date(startDate).getTime()) matchDates = false;
        if (endDate && itemTime > new Date(endDate).getTime()) matchDates = false;
      }

      return matchGlobal && matchStatus && matchPriority && matchEmp && matchDept && matchDates;
    });
  }, [tasks, globalSearch, taskStatusFilter, taskPriorityFilter, taskEmployeeFilter, employees, selectedDept, startDate, endDate]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      const valA = a[taskSortColumn as keyof typeof a] ?? "";
      const valB = b[taskSortColumn as keyof typeof b] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return taskSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return taskSortDir === "asc" ? numA - numB : numB - numA;
      }
    });
    return sorted;
  }, [filteredTasks, taskSortColumn, taskSortDir]);

  const paginatedTasks = useMemo(() => {
    return sortedTasks.slice((taskPage - 1) * pageSize, taskPage * pageSize);
  }, [sortedTasks, taskPage, pageSize]);

  // ── Achievement Report calculations ──────────────────────────────────────────
  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const matchGlobal = !globalSearch ||
        a.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        a.employeeName?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchEmp = !achievementEmployeeFilter || a.employeeName?.toLowerCase() === achievementEmployeeFilter.toLowerCase();
      const matchType = !achievementTypeFilter || a.category === achievementTypeFilter;

      const empDept = employees.find(e => e.name.toLowerCase() === a.employeeName?.toLowerCase())?.department;
      const matchDept = !selectedDept || empDept === selectedDept;

      let matchDates = true;
      if (startDate || endDate) {
        const itemTime = a.achievedAt ? new Date(a.achievedAt).getTime() : 0;
        if (startDate && itemTime < new Date(startDate).getTime()) matchDates = false;
        if (endDate && itemTime > new Date(endDate).getTime()) matchDates = false;
      }

      return matchGlobal && matchEmp && matchType && matchDept && matchDates;
    });
  }, [achievements, globalSearch, achievementEmployeeFilter, achievementTypeFilter, employees, selectedDept, startDate, endDate]);

  const sortedAchievements = useMemo(() => {
    const sorted = [...filteredAchievements];
    sorted.sort((a, b) => {
      const valA = a[achievementSortColumn as keyof typeof a] ?? "";
      const valB = b[achievementSortColumn as keyof typeof b] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return achievementSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        return achievementSortDir === "asc" ? numA - numB : numB - numA;
      }
    });
    return sorted;
  }, [filteredAchievements, achievementSortColumn, achievementSortDir]);

  const paginatedAchievements = useMemo(() => {
    return sortedAchievements.slice((achievementPage - 1) * pageSize, achievementPage * pageSize);
  }, [sortedAchievements, achievementPage, pageSize]);

  const uniqueEmployeeNames = useMemo(() => Array.from(new Set(employees.map(e => e.name))), [employees]);
  const uniqueKPIs = useMemo(() => Array.from(new Set(kpis.map(k => k.kpiName))), [kpis]);

  const timeThresholdMs = useMemo(() => {
    const now = new Date().getTime();
    if (analyticsTimeFilter === "weekly") return now - 7 * 24 * 60 * 60 * 1000;
    if (analyticsTimeFilter === "monthly") return now - 30 * 24 * 60 * 60 * 1000;
    if (analyticsTimeFilter === "quarterly") return now - 90 * 24 * 60 * 60 * 1000;
    return now - 365 * 24 * 60 * 60 * 1000; // Yearly
  }, [analyticsTimeFilter]);

  // ── Export Triggers ──────────────────────────────────────────────────────────
  const exportKPIReport = (format: "csv" | "excel") => {
    const headers = ["KPI Name", "Assignee/Category", "Target", "Actual", "Achievement %", "Status", "Last Updated"];
    const rows = sortedKPIs.map(k => [
      k.kpiName, k.employeeId || "Unassigned", k.targetValue, k.actualValue,
      k.targetValue > 0 ? `${Math.round((k.actualValue / k.targetValue) * 100)}%` : "0%",
      k.status.toUpperCase(), k.lastUpdated ? new Date(k.lastUpdated).toLocaleDateString() : "N/A"
    ]);
    if (format === "csv") handleExportCSV(headers, rows, "KPI_Performance_Report.csv");
    else handleExportExcel(headers, rows, "KPI_Performance_Report.xls");
  };

  const exportEmployeeReport = (format: "csv" | "excel") => {
    const headers = ["Rank", "Employee Name", "Department", "Assigned KPIs", "Completed KPIs", "Pending KPIs", "Completed Tasks", "Pending Tasks", "Achievements", "Overall Score"];
    const rows = sortedEmployees.map(emp => [
      `#${emp.ranking}`, emp.name, emp.department, emp.assignedKPIs, emp.completedKPIs, emp.pendingKPIs,
      emp.completedTasks, emp.pendingTasks, emp.achievementsCount, `${emp.overallScore}%`
    ]);
    if (format === "csv") handleExportCSV(headers, rows, "Employee_Performance_Report.csv");
    else handleExportExcel(headers, rows, "Employee_Performance_Report.xls");
  };

  const exportDepartmentReport = (format: "csv" | "excel") => {
    const headers = ["Rank", "Department Name", "Employees", "Total KPIs", "KPI Completion %", "Total Tasks", "Task Completion %", "Achievements", "Avg Performance"];
    const rows = sortedDepartments.map(dept => [
      `#${dept.ranking}`, dept.departmentName, dept.employeeCount, dept.totalKPIs, `${dept.kpiCompletionPct}%`,
      dept.totalTasks, `${dept.taskCompletionPct}%`, dept.totalAchievements, `${dept.averagePerformance}%`
    ]);
    if (format === "csv") handleExportCSV(headers, rows, "Department_Performance_Report.csv");
    else handleExportExcel(headers, rows, "Department_Performance_Report.xls");
  };

  const exportTaskReport = (format: "csv" | "excel") => {
    const headers = ["Task Name", "Assigned Employee", "Department", "Priority", "Due Date", "Status", "Completion %"];
    const rows = sortedTasks.map(t => {
      const empDept = employees.find(e => e.name.toLowerCase() === t.assignedTo?.toLowerCase())?.department || "N/A";
      return [
        t.taskName, t.assignedTo || "Unassigned", empDept, t.priority.toUpperCase(),
        t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A", t.status.toUpperCase(),
        t.status === "completed" ? "100%" : "0%"
      ];
    });
    if (format === "csv") handleExportCSV(headers, rows, "Task_Performance_Report.csv");
    else handleExportExcel(headers, rows, "Task_Performance_Report.xls");
  };

  const exportAchievementReport = (format: "csv" | "excel") => {
    const headers = ["Achievement Title", "Employee Name", "Department", "Category/Type", "Date Earned", "Points", "Impact Level"];
    const rows = sortedAchievements.map(a => {
      const empDept = employees.find(e => e.name.toLowerCase() === a.employeeName?.toLowerCase())?.department || "N/A";
      const impact = a.points >= 100 ? "High" : a.points >= 50 ? "Medium" : "Low";
      return [
        a.title, a.employeeName, empDept, a.category,
        a.achievedAt ? new Date(a.achievedAt).toLocaleDateString() : "N/A", a.points, impact
      ];
    });
    if (format === "csv") handleExportCSV(headers, rows, "Achievements_Report.csv");
    else handleExportExcel(headers, rows, "Achievements_Report.xls");
  };

  const handleClearFilters = () => {
    setGlobalSearch("");
    setSelectedDept("");
    setStartDate("");
    setEndDate("");
    setKpiEmployeeFilter("");
    setKpiSelectFilter("");
    setKpiStatusFilter("");
    setEmpSelectFilter("");
    setTaskStatusFilter("");
    setTaskPriorityFilter("");
    setTaskEmployeeFilter("");
    setAchievementEmployeeFilter("");
    setAchievementTypeFilter("");
    addToast("Cleared all active filters", "info");
  };

  const activeFiltersCount = useMemo(() => {
    return [
      selectedDept, startDate, endDate,
      activeTab === "kpi" ? kpiEmployeeFilter : null,
      activeTab === "kpi" ? kpiSelectFilter : null,
      activeTab === "kpi" ? kpiStatusFilter : null,
      activeTab === "employee" ? empSelectFilter : null,
      activeTab === "task" ? taskStatusFilter : null,
      activeTab === "task" ? taskPriorityFilter : null,
      activeTab === "task" ? taskEmployeeFilter : null,
      activeTab === "achievement" ? achievementEmployeeFilter : null,
      activeTab === "achievement" ? achievementTypeFilter : null
    ].filter(Boolean).length;
  }, [
    selectedDept, startDate, endDate, activeTab, kpiEmployeeFilter,
    kpiSelectFilter, kpiStatusFilter, empSelectFilter, taskStatusFilter,
    taskPriorityFilter, taskEmployeeFilter, achievementEmployeeFilter,
    achievementTypeFilter
  ]);

  // ── Analytics calculations based on selected TimeFilter ──────────────────────
  const analyticsKPITrend = useMemo(() => {
    const items = kpis.filter(k => k.lastUpdated && new Date(k.lastUpdated).getTime() > timeThresholdMs);
    const groups: Record<string, { total: number; sum: number }> = {};
    items.forEach(k => {
      const dateKey = new Date(k.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!groups[dateKey]) groups[dateKey] = { total: 0, sum: 0 };
      groups[dateKey].total++;
      groups[dateKey].sum += k.targetValue > 0 ? (k.actualValue / k.targetValue) * 100 : 0;
    });
    return Object.entries(groups).map(([date, val]) => ({
      date,
      value: Math.round(val.sum / val.total),
    })).slice(0, 10);
  }, [kpis, timeThresholdMs]);

  const analyticsEmployeeScores = useMemo(() => {
    return enrichedEmployees
      .slice(0, 8)
      .map(emp => ({ name: emp.name, score: emp.overallScore }));
  }, [enrichedEmployees]);

  const analyticsDepartmentPerformance = useMemo(() => {
    return enrichedDepartments
      .map(dept => ({ name: dept.departmentName, score: dept.averagePerformance }));
  }, [enrichedDepartments]);

  const analyticsTaskCompletion = useMemo(() => {
    const items = tasks.filter(t => t.status === "completed" && t.dueDate && new Date(t.dueDate).getTime() > timeThresholdMs);
    const groups: Record<string, number> = {};
    items.forEach(t => {
      const dateKey = new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      groups[dateKey] = (groups[dateKey] || 0) + 1;
    });
    return Object.entries(groups).map(([date, count]) => ({ date, count })).slice(0, 10);
  }, [tasks, timeThresholdMs]);

  const analyticsAchievementsTrend = useMemo(() => {
    const items = achievements.filter(a => a.achievedAt && new Date(a.achievedAt).getTime() > timeThresholdMs);
    const groups: Record<string, number> = {};
    items.forEach(a => {
      const dateKey = new Date(a.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      groups[dateKey] = (groups[dateKey] || 0) + 1;
    });
    return Object.entries(groups).map(([date, count]) => ({ date, count })).slice(0, 10);
  }, [achievements, timeThresholdMs]);

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Toast Panel */}
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
          {toasts.map(t => (
            <div
              key={t.id}
              onClick={() => dismissToast(t.id)}
              className={`p-3 rounded-lg border shadow-xl flex items-center justify-between cursor-pointer transition-all animate-bounce ${
                t.type === "success"
                  ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/20"
                  : t.type === "error"
                  ? "bg-red-950/90 text-red-400 border-red-500/20"
                  : "bg-blue-950/90 text-blue-400 border-blue-500/20"
              }`}
            >
              <span className="text-xs font-semibold">{t.text}</span>
              <X className="h-3 w-3 text-gray-400 ml-2" />
            </div>
          ))}
        </div>

        {/* Print-Only Header Block */}
        <div className="hidden print:block mb-8 text-black border-b border-gray-300 pb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Enterprise KPI Portal</h1>
            <span className="text-xs">Date: {new Date().toLocaleDateString()}</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-3 uppercase">
            {activeTab === "kpi" && "KPI Performance Report"}
            {activeTab === "employee" && "Employee Scorecard Report"}
            {activeTab === "department" && "Department Workload & Performance Report"}
            {activeTab === "task" && "Detailed Task Report"}
            {activeTab === "achievement" && "Achievement Milestones Tally"}
          </h2>
          <div className="mt-2 text-xs text-gray-500">
            <strong>Applied Filters:</strong>{" "}
            {selectedDept && `Dept: ${selectedDept} | `}
            {startDate && `From: ${startDate} | `}
            {endDate && `To: ${endDate} | `}
            {globalSearch && `Search: ${globalSearch}`}
            {!selectedDept && !startDate && !endDate && !globalSearch && "None"}
          </div>
        </div>

        {/* Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          <div>
            <PageHeader
              title="Reports Portal"
              description="Aggregate performance reports, KPI scorecards, and historical tallies"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="border-white/10 text-white cursor-pointer bg-white/5"
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-white/10 text-white cursor-pointer bg-white/5"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-white/10 text-white cursor-pointer bg-white/5"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Settings Dialog Modal (Hidden on Print) */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
            <div className="glass-card p-6 max-w-md w-full border border-white/10 bg-[#080d19] shadow-2xl relative">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Reports Preferences
              </h3>

              <div className="space-y-4 text-xs">
                {/* Default view */}
                <div>
                  <label className="text-gray-400 block mb-1">Default Report View</label>
                  <select
                    value={settings.defaultView}
                    onChange={(e) => updateSettingsValue("defaultView", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0c111d] p-2 text-white"
                  >
                    <option value="kpi">KPI Performance</option>
                    <option value="employee">Employee Performance</option>
                    <option value="department">Department Performance</option>
                    <option value="task">Task Report</option>
                    <option value="achievement">Achievements Log</option>
                    <option value="analytics">Analytics Dashboard</option>
                  </select>
                </div>

                {/* Rows per page */}
                <div>
                  <label className="text-gray-400 block mb-1">Rows Per Page</label>
                  <select
                    value={settings.rowsPerPage}
                    onChange={(e) => updateSettingsValue("rowsPerPage", Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0c111d] p-2 text-white"
                  >
                    <option value={5}>5 Rows</option>
                    <option value={8}>8 Rows</option>
                    <option value={10}>10 Rows</option>
                    <option value={15}>15 Rows</option>
                    <option value={20}>20 Rows</option>
                  </select>
                </div>

                {/* Export format */}
                <div>
                  <label className="text-gray-400 block mb-1">Default Export Format</label>
                  <select
                    value={settings.defaultExportFormat}
                    onChange={(e) => updateSettingsValue("defaultExportFormat", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0c111d] p-2 text-white"
                  >
                    <option value="csv">Standard CSV</option>
                    <option value="excel">Excel compatible (.xls)</option>
                  </select>
                </div>

                {/* Date range default */}
                <div>
                  <label className="text-gray-400 block mb-1">Default Date Range Filter</label>
                  <select
                    value={settings.defaultDateRange}
                    onChange={(e) => updateSettingsValue("defaultDateRange", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0c111d] p-2 text-white"
                  >
                    <option value="all">All-time Log</option>
                    <option value="weekly">Past 7 Days</option>
                    <option value="monthly">Past 30 Days</option>
                    <option value="yearly">Past Year</option>
                  </select>
                </div>

                {/* Filter Presets Tally */}
                <div className="border-t border-white/5 pt-4">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-1"><FolderOpen className="h-4 w-4" />Saved Filter Presets ({savedPresets.length})</h4>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {savedPresets.map(preset => (
                      <div key={preset.id} className="flex justify-between items-center bg-white/5 p-1.5 rounded">
                        <button
                          onClick={() => { loadPreset(preset); setShowSettingsModal(false); }}
                          className="text-blue-400 hover:underline text-[10px] font-semibold text-left truncate max-w-[200px]"
                        >
                          {preset.name} ({preset.tab})
                        </button>
                        <button
                          onClick={() => deletePreset(preset.id, preset.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {savedPresets.length === 0 && <span className="text-gray-500 italic block">No filter presets saved.</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats Grid (Hidden on Print) */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6 print:hidden">
          <StatCard title="Total Employees" value={employees.length} icon={Users} color="blue" />
          <StatCard title="Total Departments" value={departments.length} icon={Building} color="purple" />
          <StatCard title="Total KPIs" value={kpis.length} icon={Target} color="orange" />
          <StatCard title="Total Tasks" value={tasks.length} icon={CheckSquare} color="green" />
          <StatCard title="Total Achievements" value={achievements.length} icon={Trophy} color="red" />
        </div>

        {/* Global Control Toolbar (Hidden on Print) */}
        <div className="glass-card p-4 mb-6 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl relative z-40 print:hidden">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4 items-center">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global Search..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#080d19] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.departmentName}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Preset Saving & Filter Clear (Hidden on Print) */}
          <div className="mt-3 flex flex-wrap justify-between gap-2 items-center text-xs">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="Preset Name..."
                className="bg-[#0c111d] border border-white/10 px-2 py-1 rounded text-white text-[11px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={saveCurrentFilterPreset}
                className="h-7 py-0 px-2 border-white/10 text-white cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Preset
              </Button>
            </div>

            {(activeFiltersCount > 0 || globalSearch) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 py-1 px-3 text-xs cursor-pointer rounded-lg"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Tab Headers (Hidden on Print) */}
        <div className="flex overflow-x-auto border-b border-white/10 mb-6 scrollbar-none gap-2 print:hidden" role="tablist">
          {[
            { id: "kpi", label: "KPI Performance" },
            { id: "employee", label: "Employee Performance" },
            { id: "department", label: "Department Performance" },
            { id: "task", label: "Task Report" },
            { id: "achievement", label: "Achievements Log" },
            { id: "analytics", label: "Analytics Dashboard" }
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI Tab */}
        {activeTab === "kpi" && (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-[#080d19]/40 p-4 rounded-lg border border-white/5 text-xs print:hidden">
              <div>
                <span className="text-gray-400 block mb-1">Employee Filter</span>
                <select
                  value={kpiEmployeeFilter}
                  onChange={(e) => setKpiEmployeeFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Employees</option>
                  {uniqueEmployeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">KPI Filter</span>
                <select
                  value={kpiSelectFilter}
                  onChange={(e) => setKpiSelectFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All KPIs</option>
                  {uniqueKPIs.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">KPI Status</span>
                <select
                  value={kpiStatusFilter}
                  onChange={(e) => setKpiStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="at-risk">At Risk</option>
                  <option value="not-started">Not Started</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#080d19]/40 p-3 rounded-lg border border-white/5 print:hidden">
              <span className="text-xs text-gray-400 font-bold">Matches: <span className="text-white font-extrabold">{sortedKPIs.length}</span></span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportKPIReport(settings.defaultExportFormat)} className="border-white/10 text-white cursor-pointer bg-white/5 text-xs py-1">
                  <Download className="h-3.5 w-3.5 mr-1" />Export ({settings.defaultExportFormat.toUpperCase()})
                </Button>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl print:border-none print:bg-transparent print:text-black">
              <div className="overflow-x-auto max-h-[500px] print:max-h-none">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20 print:relative print:bg-transparent print:text-black print:border-b-2 print:border-black">
                    <tr className="divide-x divide-white/5 print:divide-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setKpiSortColumn("kpiName"); setKpiSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>KPI Name</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setKpiSortColumn("employeeId"); setKpiSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>Assignee</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Target</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Actual</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Achievement %</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:hidden uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-300">
                    {paginatedKPIs.map(k => {
                      const pct = k.targetValue > 0 ? Math.round((k.actualValue / k.targetValue) * 100) : 0;
                      return (
                        <tr key={k.id} className="border-b border-white/5 print:border-gray-200 hover:bg-white/5 transition-colors divide-x divide-white/5 print:divide-gray-200 print:text-black">
                          <td className="px-4 py-3.5 text-sm font-extrabold text-white print:text-black align-middle">{k.kpiName}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-300 print:text-black align-middle">{k.employeeId || "Unassigned"}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-center align-middle text-gray-400 print:text-black">{k.targetValue}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-center align-middle text-white print:text-black">{k.actualValue}</td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 print:hidden hidden md:block">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs font-extrabold text-white print:text-black">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center align-middle text-xs">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 font-bold border print:border-none print:bg-transparent print:text-black ${
                              k.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : k.status === "in-progress"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>{k.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center align-middle print:hidden">
                            <Link href={`/kpis/${k.id}`}><Button variant="outline" size="sm" className="h-7 px-2 border-white/10 text-white"><Eye className="h-3.5 w-3.5" /></Button></Link>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedKPIs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center text-xs text-gray-500">No matching KPI performance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedKPIs.length > pageSize && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30 print:hidden">
                  <span>Showing <span className="font-semibold text-white">{(kpiPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-white">{Math.min(kpiPage * pageSize, sortedKPIs.length)}</span> of <span className="font-semibold text-white">{sortedKPIs.length}</span></span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={kpiPage === 1} onClick={() => setKpiPage(p => p - 1)} className="border-white/10 text-white"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={kpiPage * pageSize >= sortedKPIs.length} onClick={() => setKpiPage(p => p + 1)} className="border-white/10 text-white"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employee Tab */}
        {activeTab === "employee" && (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 bg-[#080d19]/40 p-4 rounded-lg border border-white/5 text-xs print:hidden">
              <div>
                <span className="text-gray-400 block mb-1">Select Employee</span>
                <select value={empSelectFilter} onChange={(e) => setEmpSelectFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Employees</option>
                  {uniqueEmployeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#080d19]/40 p-3 rounded-lg border border-white/5 print:hidden">
              <span className="text-xs text-gray-400 font-bold">Matches: <span className="text-white font-extrabold">{sortedEmployees.length}</span></span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportEmployeeReport(settings.defaultExportFormat)} className="border-white/10 text-white cursor-pointer bg-white/5 text-xs py-1">
                  <Download className="h-3.5 w-3.5 mr-1" />Export ({settings.defaultExportFormat.toUpperCase()})
                </Button>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl print:border-none print:bg-transparent print:text-black">
              <div className="overflow-x-auto max-h-[500px] print:max-h-none">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20 print:relative print:bg-transparent print:text-black print:border-b-2 print:border-black">
                    <tr className="divide-x divide-white/5 print:divide-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setEmpSortColumn("ranking"); setEmpSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>Rank</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">KPIs (All/Done/Pending)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Tasks (Done/Pending)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Achievements</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Overall Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-300">
                    {paginatedEmployees.map(emp => (
                      <tr key={emp.id} className="border-b border-white/5 print:border-gray-200 hover:bg-white/5 transition-colors divide-x divide-white/5 print:divide-gray-200 print:text-black">
                        <td className="px-4 py-3.5 text-xs font-extrabold text-blue-400 print:text-black align-middle">#{emp.ranking}</td>
                        <td className="px-4 py-3.5 text-sm font-extrabold text-white print:text-black align-middle">{emp.name}</td>
                        <td className="px-4 py-3.5 text-xs text-purple-400 print:text-black align-middle">{emp.department || "N/A"}</td>
                        <td className="px-4 py-3.5 text-center text-xs align-middle text-gray-300 print:text-black">
                          {emp.assignedKPIs} / <span className="text-emerald-400 print:text-black font-bold">{emp.completedKPIs}</span> / <span className="text-amber-500 print:text-black font-bold">{emp.pendingKPIs}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs align-middle text-gray-300 print:text-black">
                          <span className="text-emerald-400 print:text-black font-bold">{emp.completedTasks}</span> / <span className="text-amber-500 print:text-black font-bold">{emp.pendingTasks}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs font-bold text-orange-400 print:text-black align-middle">{emp.achievementsCount}</td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 print:hidden hidden md:block">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${emp.overallScore}%` }} />
                            </div>
                            <span className="text-xs font-extrabold text-white print:text-black">{emp.overallScore}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedEmployees.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center text-xs text-gray-500">No matching employee records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedEmployees.length > pageSize && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30 print:hidden">
                  <span>Showing <span className="font-semibold text-white">{(empPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-white">{Math.min(empPage * pageSize, sortedEmployees.length)}</span> of <span className="font-semibold text-white">{sortedEmployees.length}</span></span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={empPage === 1} onClick={() => setEmpPage(p => p - 1)} className="border-white/10 text-white"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={empPage * pageSize >= sortedEmployees.length} onClick={() => setEmpPage(p => p + 1)} className="border-white/10 text-white"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Department Tab */}
        {activeTab === "department" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#080d19]/40 p-3 rounded-lg border border-white/5 print:hidden">
              <span className="text-xs text-gray-400 font-bold">Matches: <span className="text-white font-extrabold">{sortedDepartments.length}</span></span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportDepartmentReport(settings.defaultExportFormat)} className="border-white/10 text-white cursor-pointer bg-white/5 text-xs py-1">
                  <Download className="h-3.5 w-3.5 mr-1" />Export ({settings.defaultExportFormat.toUpperCase()})
                </Button>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl print:border-none print:bg-transparent print:text-black">
              <div className="overflow-x-auto max-h-[500px] print:max-h-none">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20 print:relative print:bg-transparent print:text-black print:border-b-2 print:border-black">
                    <tr className="divide-x divide-white/5 print:divide-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setDeptSortColumn("ranking"); setDeptSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>Rank</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Department Name</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Employees</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Total KPIs</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">KPI Completion %</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Total Tasks</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Task Completion %</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Achievements</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Avg Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-300">
                    {paginatedDepartments.map(dept => (
                      <tr key={dept.id} className="border-b border-white/5 print:border-gray-200 hover:bg-white/5 transition-colors divide-x divide-white/5 print:divide-gray-200 print:text-black">
                        <td className="px-4 py-3.5 text-xs font-extrabold text-blue-400 print:text-black align-middle">#{dept.ranking}</td>
                        <td className="px-4 py-3.5 text-sm font-extrabold text-white print:text-black align-middle">{dept.departmentName}</td>
                        <td className="px-4 py-3.5 text-center text-sm text-gray-300 print:text-black align-middle">{dept.employeeCount}</td>
                        <td className="px-4 py-3.5 text-center text-sm text-gray-300 print:text-black align-middle">{dept.totalKPIs}</td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 print:hidden hidden md:block">
                              <div className="h-full bg-blue-500" style={{ width: `${dept.kpiCompletionPct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-white print:text-black">{dept.kpiCompletionPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm text-gray-300 print:text-black align-middle">{dept.totalTasks}</td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 print:hidden hidden md:block">
                              <div className="h-full bg-green-500" style={{ width: `${dept.taskCompletionPct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-white print:text-black">{dept.taskCompletionPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-bold text-orange-400 print:text-black align-middle">{dept.totalAchievements}</td>
                        <td className="px-4 py-3.5 text-center text-sm font-extrabold text-purple-400 print:text-black align-middle">{dept.averagePerformance}%</td>
                      </tr>
                    ))}
                    {paginatedDepartments.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-xs text-gray-500">No departments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedDepartments.length > pageSize && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30 print:hidden">
                  <span>Showing <span className="font-semibold text-white">{(deptPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-white">{Math.min(deptPage * pageSize, sortedDepartments.length)}</span> of <span className="font-semibold text-white">{sortedDepartments.length}</span></span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={deptPage === 1} onClick={() => setDeptPage(p => p - 1)} className="border-white/10 text-white"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={deptPage * pageSize >= sortedDepartments.length} onClick={() => setDeptPage(p => p + 1)} className="border-white/10 text-white"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task Tab */}
        {activeTab === "task" && (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-[#080d19]/40 p-4 rounded-lg border border-white/5 text-xs print:hidden">
              <div>
                <span className="text-gray-400 block mb-1">Task Status</span>
                <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Task Priority</span>
                <select value={taskPriorityFilter} onChange={(e) => setTaskPriorityFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Assigned Employee</span>
                <select value={taskEmployeeFilter} onChange={(e) => setTaskEmployeeFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Employees</option>
                  {uniqueEmployeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#080d19]/40 p-3 rounded-lg border border-white/5 print:hidden">
              <span className="text-xs text-gray-400 font-bold">Matches: <span className="text-white font-extrabold">{sortedTasks.length}</span></span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportTaskReport(settings.defaultExportFormat)} className="border-white/10 text-white cursor-pointer bg-white/5 text-xs py-1">
                  <Download className="h-3.5 w-3.5 mr-1" />Export ({settings.defaultExportFormat.toUpperCase()})
                </Button>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl print:border-none print:bg-transparent print:text-black">
              <div className="overflow-x-auto max-h-[500px] print:max-h-none">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20 print:relative print:bg-transparent print:text-black print:border-b-2 print:border-black">
                    <tr className="divide-x divide-white/5 print:divide-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setTaskSortColumn("taskName"); setTaskSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>Task Name</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Assigned Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Completion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-300">
                    {paginatedTasks.map(t => {
                      const isOverdue = t.status !== "completed" && t.dueDate && new Date(t.dueDate).getTime() < new Date().getTime();
                      return (
                        <tr key={t.id} className={`border-b border-white/5 print:border-gray-200 hover:bg-white/5 transition-colors divide-x divide-white/5 print:divide-gray-200 print:text-black ${
                          t.status === "completed"
                            ? "bg-emerald-500/5 print:bg-transparent"
                            : isOverdue
                            ? "bg-red-500/5 print:bg-transparent"
                            : "bg-blue-500/5 print:bg-transparent"
                        }`}>
                          <td className="px-4 py-3.5 text-sm font-extrabold text-white print:text-black align-middle">{t.taskName}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-300 print:text-black align-middle">{t.assignedTo || "Unassigned"}</td>
                          <td className="px-4 py-3.5 text-xs align-middle">
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase print:border print:border-black ${
                              t.priority === "critical"
                                ? "bg-red-500/25 text-red-400 print:text-black"
                                : t.priority === "high"
                                ? "bg-orange-500/25 text-orange-400 print:text-black"
                                : "bg-blue-500/25 text-blue-400 print:text-black"
                            }`}>{t.priority}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-300 print:text-black align-middle">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3.5 text-center align-middle text-xs font-bold">
                            {isOverdue ? (
                              <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 print:text-black print:border-none">Overdue</span>
                            ) : (
                              <span className="text-gray-300 print:text-black">{t.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-bold text-white print:text-black align-middle">
                            {t.status === "completed" ? "100%" : "0%"}
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedTasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center text-xs text-gray-500">No matching tasks found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedTasks.length > pageSize && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30 print:hidden">
                  <span>Showing <span className="font-semibold text-white">{(taskPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-white">{Math.min(taskPage * pageSize, sortedTasks.length)}</span> of <span className="font-semibold text-white">{sortedTasks.length}</span></span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={taskPage === 1} onClick={() => setTaskPage(p => p - 1)} className="border-white/10 text-white"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={taskPage * pageSize >= sortedTasks.length} onClick={() => setTaskPage(p => p + 1)} className="border-white/10 text-white"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements Log Tab */}
        {activeTab === "achievement" && (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 bg-[#080d19]/40 p-4 rounded-lg border border-white/5 text-xs print:hidden">
              <div>
                <span className="text-gray-400 block mb-1">Employee Name</span>
                <select value={achievementEmployeeFilter} onChange={(e) => setAchievementEmployeeFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Employees</option>
                  {uniqueEmployeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Achievement Category</span>
                <select value={achievementTypeFilter} onChange={(e) => setAchievementTypeFilter(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#080d19] px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Categories</option>
                  <option value="kpi-completion">KPI Completion</option>
                  <option value="milestone">Milestone</option>
                  <option value="excellence">Excellence</option>
                  <option value="teamwork">Teamwork</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#080d19]/40 p-3 rounded-lg border border-white/5 print:hidden">
              <span className="text-xs text-gray-400 font-bold">Matches: <span className="text-white font-extrabold">{sortedAchievements.length}</span></span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportAchievementReport(settings.defaultExportFormat)} className="border-white/10 text-white cursor-pointer bg-white/5 text-xs py-1">
                  <Download className="h-3.5 w-3.5 mr-1" />Export ({settings.defaultExportFormat.toUpperCase()})
                </Button>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl print:border-none print:bg-transparent print:text-black">
              <div className="overflow-x-auto max-h-[500px] print:max-h-none">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20 print:relative print:bg-transparent print:text-black print:border-b-2 print:border-black">
                    <tr className="divide-x divide-white/5 print:divide-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">
                        <button onClick={() => { setAchievementSortColumn("title"); setAchievementSortDir(p => p === "asc" ? "desc" : "asc"); }} className="flex items-center space-x-1.5 hover:text-white print:hover:text-black transition-colors"><span>Achievement Title</span><ArrowUpDown className="h-3 w-3 print:hidden" /></button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Employee Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Date Earned</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">KPI Contribution</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 print:text-black uppercase tracking-wider">Performance Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-300">
                    {paginatedAchievements.map(a => {
                      const isKPIContrib = a.category === "kpi-completion" ? "Yes" : "No";
                      const impact = a.points >= 100 ? "High" : a.points >= 50 ? "Medium" : "Low";
                      return (
                        <tr key={a.id} className="border-b border-white/5 print:border-gray-200 hover:bg-white/5 transition-colors divide-x divide-white/5 print:divide-gray-200 print:text-black">
                          <td className="px-4 py-3.5 text-sm font-extrabold text-white print:text-black align-middle">{a.title}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-300 print:text-black align-middle">{a.employeeName}</td>
                          <td className="px-4 py-3.5 text-xs text-purple-400 print:text-black align-middle font-medium uppercase">{a.category}</td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-300 print:text-black align-middle">{a.achievedAt ? new Date(a.achievedAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-300 print:text-black align-middle font-bold">
                            <span className={isKPIContrib === "Yes" ? "text-emerald-400" : "text-gray-500"}>{isKPIContrib}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center align-middle text-xs font-bold">
                            <span className={`inline-flex rounded px-1.5 py-0.5 print:border print:border-black ${
                              impact === "High" ? "bg-red-500/10 text-red-400" : impact === "Medium" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                            }`}>{impact} ({a.points} pts)</span>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedAchievements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center text-xs text-gray-500">No matching achievements found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedAchievements.length > pageSize && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#060b14]/30 print:hidden">
                  <span>Showing <span className="font-semibold text-white">{(achievementPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-white">{Math.min(achievementPage * pageSize, sortedAchievements.length)}</span> of <span className="font-semibold text-white">{sortedAchievements.length}</span></span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={achievementPage === 1} onClick={() => setAchievementPage(p => p - 1)} className="border-white/10 text-white"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={achievementPage * pageSize >= sortedAchievements.length} onClick={() => setAchievementPage(p => p + 1)} className="border-white/10 text-white"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6 print:hidden">
            <div className="flex justify-between items-center bg-[#080d19]/40 p-4 rounded-lg border border-white/5">
              <span className="text-xs text-gray-400 font-bold">Analytics Time Frame:</span>
              <div className="flex items-center space-x-2 text-xs">
                {(["weekly", "monthly", "quarterly", "yearly"] as TimeFilter[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setAnalyticsTimeFilter(tf)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-bold ${
                      analyticsTimeFilter === tf
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Grid */}
            {isMounted ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. KPI Trends */}
                <div className="glass-card p-5 border border-white/10 bg-[#080d19]/60">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-blue-400" />KPI Success Rate Trend (%)</h3>
                  <div className="h-[250px] w-full">
                    {analyticsKPITrend.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500">No KPIs updated in the selected period.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsKPITrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                          <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#0c101d", border: "1px solid #ffffff15" }} />
                          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} name="Success Rate" dot={{ fill: "#3B82F6", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. Employee Performance Trends */}
                <div className="glass-card p-5 border border-white/10 bg-[#080d19]/60">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Users className="h-4 w-4 text-purple-400" />Top Performers Overall Score</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsEmployeeScores}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#0c101d", border: "1px solid #ffffff15" }} />
                        <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Score (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Department Performance Trends */}
                <div className="glass-card p-5 border border-white/10 bg-[#080d19]/60">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Building className="h-4 w-4 text-orange-400" />Department Performance Scores</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsDepartmentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                        <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#0c101d", border: "1px solid #ffffff15" }} />
                        <Bar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Performance Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Task Completion Trends */}
                <div className="glass-card p-5 border border-white/10 bg-[#080d19]/60">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><CheckSquare className="h-4 w-4 text-green-400" />Completed Tasks Trend</h3>
                  <div className="h-[250px] w-full">
                    {analyticsTaskCompletion.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500">No tasks completed in this time frame.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsTaskCompletion}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                          <YAxis stroke="#9CA3AF" fontSize={11} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#0c101d", border: "1px solid #ffffff15" }} />
                          <Area type="monotone" dataKey="count" fill="#10B981" fillOpacity={0.15} stroke="#10B981" strokeWidth={2} name="Tasks Done" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 5. Achievement Trends */}
                <div className="glass-card p-5 border border-white/10 bg-[#080d19]/60 lg:col-span-2">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Trophy className="h-4 w-4 text-red-400" />Achievements Count Distribution</h3>
                  <div className="h-[250px] w-full">
                    {analyticsAchievementsTrend.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500">No achievements logged in this time frame.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsAchievementsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                          <YAxis stroke="#9CA3AF" fontSize={11} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#0c101d", border: "1px solid #ffffff15" }} />
                          <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2.5} name="Achievements Earned" dot={{ fill: "#EF4444", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Analytics...</div>
            )}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
