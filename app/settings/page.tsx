"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className || ""}`} />;
}

import { 
  Settings as SettingsIcon, 
  Building, 
  Users, 
  Bell, 
  Database, 
  FileSpreadsheet, 
  Lock, 
  ShieldAlert, 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  Check, 
  AlertTriangle, 
  Eye, 
  Sparkles,
  Archive,
  RefreshCw,
  X,
  HelpCircle,
  Copy,
  Activity,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  EyeOff
} from "lucide-react";

type Section = 
  | "home"
  | "general"
  | "company"
  | "organization"
  | "kpi-config"
  | "notifications"
  | "data-source"
  | "import-mapping"
  | "security"
  | "audit"
  | "validation"
  | "alerts";

interface Department {
  id: string;
  departmentName: string;
  description: string;
  headOfDepartment: string;
}

interface Team {
  id: string;
  teamName: string;
  department: string;
  teamLead: string;
  description: string;
  status: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department?: string;
}

interface AppSettings {
  companyName: string;
  companyLogo: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  reportingPeriod: string;
  appName: string;
  themeBranding: string;
}

// KPI Configuration structures
interface KPICategory {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
}

interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
}

interface KPITemplate {
  id: string;
  name: string;
  department: string;
  category: string;
  unit: string;
  frequency: string;
  weight: number;
  thresholdWarning: number;
  thresholdCritical: number;
  thresholdSuccess: number;
  formula: string;
  statusRules: string;
  status: "active" | "archived";
}

// Import Mapping structures
interface ImportMapping {
  id: string;
  sourceField: string;
  destinationField: string;
  defaultValue: string;
  required: "Yes" | "No";
  active: "Yes" | "No";
  transformationRule: string;
}

// Security Configuration
interface SecurityConfig {
  sessionTimeout: number;
  autoLogout: boolean;
  passwordPolicy: "basic" | "medium" | "strong";
  loginAttemptLimit: number;
  rateLimit: number;
  privateDataVisibility: "full" | "restricted" | "hidden";
  sensitiveDataProtection: boolean;
  exportPermission: "admin-only" | "manager-higher" | "all";
  printPermission: "admin-only" | "manager-higher" | "all";
}

// Audit Log Entry
interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  record: string;
  status: string;
  ip?: string;
  device?: string;
}

// Validation Issue
interface ValidationIssue {
  id: string;
  severity: "High" | "Medium" | "Low";
  category: string;
  entity: string;
  record: string;
  description: string;
  status: "Unresolved" | "Resolved" | "Dismissed";
}

interface SystemAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: "Information" | "Warning" | "High" | "Critical";
  status: "Open" | "Acknowledged" | "Resolved" | "Dismissed";
  category: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    companyName: "Enterprise KPI Portal",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    timezone: "UTC+5",
    currency: "PKR",
    dateFormat: "YYYY-MM-DD",
    reportingPeriod: "Monthly",
    appName: "KPI Board",
    themeBranding: "dark-blue",
  });
  const [originalSettings, setOriginalSettings] = useState<AppSettings>({ ...appSettings });
  
  // Organization Lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Archived IDs in local state
  const [archivedDeptIds, setArchivedDeptIds] = useState<string[]>([]);
  
  // Org Sub-tabs: "departments" | "teams" | "users"
  const [orgTab, setOrgTab] = useState<"departments" | "teams" | "users">("departments");

  // Search / Sort / Page
  const [deptSearch, setDeptSearch] = useState("");
  const [deptSortField, setDeptSortField] = useState<keyof Department>("departmentName");
  const [deptSortAsc, setDeptSortAsc] = useState(true);
  const [deptPage, setDeptPage] = useState(1);
  const itemsPerPage = 5;

  const [teamSearch, setTeamSearch] = useState("");
  const [teamSortField, setTeamSortField] = useState<keyof Team>("teamName");
  const [teamSortAsc, setTeamSortAsc] = useState(true);
  const [teamPage, setTeamPage] = useState(1);

  // Modals / Dialog State
  const [modalOpen, setModalOpen] = useState<{
    type: 
      | "create-dept" | "edit-dept" 
      | "create-team" | "edit-team" 
      | "edit-user" 
      | "create-kpi-cat" | "edit-kpi-cat"
      | "create-kpi-unit" | "edit-kpi-unit"
      | "create-kpi-template" | "edit-kpi-template"
      | "create-import-mapping" | "edit-import-mapping"
      | null;
    targetId?: string;
  }>({ type: null });

  // Form Fields State
  const [deptForm, setDeptForm] = useState({ departmentName: "", description: "", headOfDepartment: "" });
  const [teamForm, setTeamForm] = useState({ teamName: "", department: "", teamLead: "", description: "" });
  const [userForm, setUserForm] = useState({ role: "", status: "", department: "" });
  const [formError, setFormError] = useState("");

  // Confirmation Dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "department" | "team" | "kpi-template" | "import-mapping";
    id: string;
    name: string;
  } | null>(null);

  // Permissions Settings State
  const rolesList = ["Administrator", "Executive", "Department Manager", "Manager", "Employee", "Viewer"];
  const resourcesList = ["Dashboard", "KPIs", "Employees", "Departments", "Tasks", "Achievements", "Reports", "Settings", "Audit Logs", "Notifications"];
  const actionsList = ["read", "create", "update", "delete", "approve", "export", "print", "manage"] as const;
  
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, string[]>>>({});

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const toastIdRef = useRef(0);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // KPI Config state
  const [kpiCategories, setKpiCategories] = useState<KPICategory[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [kpiFrequencies, setKpiFrequencies] = useState<string[]>(["Weekly", "Monthly", "Quarterly", "Annually"]);
  const [kpiWeights, setKpiWeights] = useState({
    defaultWeight: 10,
    scoreCap: 120,
    thresholdWarning: 60,
    thresholdCritical: 40,
    thresholdSuccess: 90,
    stretchScore: 110,
    targetScore: 100,
    minAcceptableScore: 50
  });
  const [kpiFormCat, setKpiFormCat] = useState({ name: "", description: "" });

  // KPI Templates state
  const [kpiTemplates, setKpiTemplates] = useState<KPITemplate[]>([]);
  const [templateForm, setTemplateForm] = useState<Omit<KPITemplate, "id" | "status">>({
    name: "",
    department: "Sales",
    category: "",
    unit: "%",
    frequency: "Monthly",
    weight: 10,
    thresholdWarning: 60,
    thresholdCritical: 40,
    thresholdSuccess: 90,
    formula: "Actual / Target",
    statusRules: "Automatic Statusing"
  });

  // Notification Settings state
  const [notificationToggles, setNotificationToggles] = useState<Record<string, boolean>>({
    kpiRiskAlerts: true,
    missedKpiAlerts: true,
    overachievedKpiAlerts: false,
    approvalRequests: true,
    approvalCompleted: true,
    taskOverdue: true,
    achievementEarned: false,
    performanceDeclineEmp: false,
    performanceDeclineDept: true,
    syncFailureAirtable: true,
    validationErrorsData: true,
    reviewReminder: false,
    dueDateReminder: true
  });
  const [notificationConfig, setNotificationConfig] = useState({
    priority: "High",
    frequency: "Real-time",
    emailEnabled: true,
    inAppEnabled: true
  });

  // Airtable Connection state
  const [airtableConfigState, setAirtableConfigState] = useState({
    connectionStatus: "Connected",
    workspaceName: "Enterprise KPIs Workspace",
    baseName: "KPI Dashboard Prod",
    lastSuccessfulSync: "Never",
    lastFailedSync: "Never",
    recordsSynced: 342,
    schemaVersion: "v1.4.2",
    syncInterval: "30 Minutes",
    apiHealth: "100% (Excellent)"
  });
  const [airtableActionsLogs, setAirtableActionsLogs] = useState<string[]>([]);
  const [syncRunning, setSyncRunning] = useState(false);

  // Import Mapping state
  const [importMappings, setImportMappings] = useState<ImportMapping[]>([]);
  const [mappingForm, setMappingForm] = useState<Omit<ImportMapping, "id">>({
    sourceField: "",
    destinationField: "",
    defaultValue: "",
    required: "No",
    active: "Yes",
    transformationRule: "Direct Copy"
  });

  // --- PART 3 STATE ---
  // Security Config
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    sessionTimeout: 30,
    autoLogout: true,
    passwordPolicy: "strong",
    loginAttemptLimit: 5,
    rateLimit: 100,
    privateDataVisibility: "restricted",
    sensitiveDataProtection: true,
    exportPermission: "manager-higher",
    printPermission: "manager-higher"
  });
  const [originalSecurityConfig, setOriginalSecurityConfig] = useState<SecurityConfig>({ ...securityConfig });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilterUser, setAuditFilterUser] = useState("");
  const [auditFilterStatus, setAuditFilterStatus] = useState("");
  const [auditSortField, setAuditSortField] = useState<keyof AuditLog>("timestamp");
  const [auditSortAsc, setAuditSortAsc] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const auditItemsPerPage = 10;

  // Validation Center State
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validating, setValidating] = useState(false);
  const [validationSearch, setValidationSearch] = useState("");
  const [validationSeverityFilter, setValidationSeverityFilter] = useState("");
  const [validationCategoryFilter, setValidationCategoryFilter] = useState("");

  // System Alerts state
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [alertSearch, setAlertSearch] = useState("");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("");
  const [alertStatusFilter, setAlertStatusFilter] = useState("");
  const [alertSortField, setAlertSortField] = useState<keyof SystemAlert>("timestamp");
  const [alertSortAsc, setAlertSortAsc] = useState(false);
  const [alertPage, setAlertPage] = useState(1);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const alertItemsPerPage = 10;

  // Settings Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounced search hook
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(globalSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalSearchQuery]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Airtable Settings
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data?.map) {
        const map = settingsData.data.map;
        const mappedSettings = {
          companyName: map["Company Name"]?.value || "Enterprise KPI Portal",
          companyLogo: map["Company Logo URL"]?.value || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
          timezone: map["Timezone"]?.value || "UTC+5",
          currency: map["Currency"]?.value || "PKR",
          dateFormat: map["Date Format"]?.value || "YYYY-MM-DD",
          reportingPeriod: map["Default Reporting Period"]?.value || "Monthly",
          appName: map["Application Name"]?.value || "KPI Board",
          themeBranding: map["Theme Branding"]?.value || "dark-blue",
        };
        setAppSettings(mappedSettings);
        setOriginalSettings(mappedSettings);

        // Archived Departments
        if (map["Archived_Departments"]?.value) {
          try { setArchivedDeptIds(JSON.parse(map["Archived_Departments"].value)); } catch (_) {}
        }

        // Roles Permissions
        const perms: Record<string, Record<string, string[]>> = {};
        rolesList.forEach((role) => {
          const key = `Permissions_${role}`;
          if (map[key]?.value) {
            try { perms[role] = JSON.parse(map[key].value); } catch (_) { perms[role] = getDefaultRolePermissions(role); }
          } else {
            perms[role] = getDefaultRolePermissions(role);
          }
        });
        setRolePermissions(perms);

        // KPI Config (Categories, Units, Weights)
        if (map["KPI_Configuration"]?.value) {
          try {
            const parsed = JSON.parse(map["KPI_Configuration"].value);
            if (parsed.categories) setKpiCategories(parsed.categories);
            if (parsed.units) setMeasurementUnits(parsed.units);
            if (parsed.frequencies) setKpiFrequencies(parsed.frequencies);
            if (parsed.weights) setKpiWeights(parsed.weights);
          } catch (_) {}
        } else {
          setKpiCategories([
            { id: "cat-1", name: "Financial Growth", description: "Revenue and margin metrics", status: "active" },
            { id: "cat-2", name: "Customer Experience", description: "Net promoter score and retention", status: "active" },
            { id: "cat-3", name: "Delivery Rate", description: "Operational execution speed", status: "active" }
          ]);
          setMeasurementUnits([
            { id: "unit-1", name: "Percentage", symbol: "%" },
            { id: "unit-2", name: "Currency (PKR)", symbol: "PKR" },
            { id: "unit-3", name: "Numerical Count", symbol: "Qty" }
          ]);
        }

        // KPI Templates
        if (map["KPI_Templates"]?.value) {
          try { setKpiTemplates(JSON.parse(map["KPI_Templates"].value)); } catch (_) {}
        } else {
          setKpiTemplates([
            { id: "tmpl-1", name: "Monthly Sales Target", department: "Sales", category: "Financial Growth", unit: "PKR", frequency: "Monthly", weight: 15, thresholdWarning: 70, thresholdCritical: 50, thresholdSuccess: 100, formula: "Revenue / Target", statusRules: "Warning if below 70%", status: "active" },
            { id: "tmpl-2", name: "Product Feature Delivery", department: "Engineering", category: "Delivery Rate", unit: "%", frequency: "Monthly", weight: 10, thresholdWarning: 80, thresholdCritical: 60, thresholdSuccess: 95, formula: "Features Delivered / Planned", statusRules: "Critical if below 60%", status: "active" }
          ]);
        }

        // Notification Settings
        if (map["Notification_Settings"]?.value) {
          try {
            const parsed = JSON.parse(map["Notification_Settings"].value);
            if (parsed.toggles) setNotificationToggles(parsed.toggles);
            if (parsed.config) setNotificationConfig(parsed.config);
          } catch (_) {}
        }

        // Airtable Config
        if (map["Airtable_Configuration"]?.value) {
          try { setAirtableConfigState(JSON.parse(map["Airtable_Configuration"].value)); } catch (_) {}
        }

        // Import Mappings
        if (map["Import_Mappings"]?.value) {
          try { setImportMappings(JSON.parse(map["Import_Mappings"].value)); } catch (_) {}
        } else {
          setImportMappings([
            { id: "map-1", sourceField: "kpi_title", destinationField: "KPI Name", defaultValue: "KPI Target", required: "Yes", active: "Yes", transformationRule: "Direct Copy" },
            { id: "map-2", sourceField: "emp_mail", destinationField: "Assigned Employee", defaultValue: "admin@company.com", required: "Yes", active: "Yes", transformationRule: "Map Email to Name" }
          ]);
        }

        // --- PART 3 CONFIGS ---
        if (map["Security_Configuration"]?.value) {
          try {
            const parsed = JSON.parse(map["Security_Configuration"].value);
            setSecurityConfig(parsed);
            setOriginalSecurityConfig(parsed);
          } catch (_) {}
        }
      }

      // Fetch Audit Logs
      const auditRes = await fetch("/api/settings/audit-logs");
      const auditData = await auditRes.json();
      if (auditData.success) {
        setAuditLogs(auditData.data || []);
      }

      // Fetch validation scan issues
      const valRes = await fetch("/api/settings/validation");
      const valData = await valRes.json();
      if (valData.success) {
        setValidationIssues(valData.data || []);
      }

      // Fetch system alerts
      const alertsRes = await fetch("/api/settings/alerts");
      const alertsData = await alertsRes.json();
      if (alertsData.success) {
        setAlerts(alertsData.data || []);
      }

      // Load standard Org arrays
      const deptRes = await fetch("/api/departments");
      const deptData = await deptRes.json();
      if (deptData.success) setDepartments(deptData.data || []);

      const teamsRes = await fetch("/api/teams");
      const teamsData = await teamsRes.json();
      if (teamsData.success) setTeams(teamsData.data || []);

      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.data || []);

    } catch (error) {
      console.error("Error loading settings:", error);
      addToast("Failed to load settings from Airtable", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDefaultRolePermissions = (role: string): Record<string, string[]> => {
    const defaultActions = ["read"];
    const fullActions = ["read", "create", "update", "delete", "approve", "export", "print", "manage"];
    const defaults: Record<string, string[]> = {};
    resourcesList.forEach((res) => {
      defaults[res] = role === "Administrator" ? [...fullActions] : [...defaultActions];
    });
    return defaults;
  };

  // Helper to save structured JSON payloads
  const saveStructuredConfigs = async (key: string, value: any) => {
    setSaving(true);
    try {
      const payload = { [key]: JSON.stringify(value) };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Settings successfully saved to Airtable", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addToast(err.message || "Failed to save config to Airtable", "error");
    } finally {
      setSaving(false);
    }
  };

  // Write new log to Audit Trails
  const logAuditEvent = async (action: string, entity: string, record: string, status: "Success" | "Failed" = "Success") => {
    try {
      await fetch("/api/settings/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "Admin User",
          role: "Administrator",
          action,
          entity,
          record,
          status,
          ip: "192.168.1.50",
          device: "Chrome / Windows"
        }),
      });
      // Refresh audit logs list
      const auditRes = await fetch("/api/settings/audit-logs");
      const auditData = await auditRes.json();
      if (auditData.success) setAuditLogs(auditData.data || []);
    } catch (_) {}
  };

  // General Settings changes helper
  const hasUnsavedChanges = 
    JSON.stringify(appSettings) !== JSON.stringify(originalSettings);

  const handleResetSettings = () => {
    setAppSettings({ ...originalSettings });
    addToast("Settings reset to last saved state", "success");
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        "Company Name": appSettings.companyName,
        "Company Logo URL": appSettings.companyLogo,
        "Timezone": appSettings.timezone,
        "Currency": appSettings.currency,
        "Date Format": appSettings.dateFormat,
        "Default Reporting Period": appSettings.reportingPeriod,
        "Application Name": appSettings.appName,
        "Theme Branding": appSettings.themeBranding,
        "Archived_Departments": JSON.stringify(archivedDeptIds),
      };

      if (Object.keys(rolePermissions).length > 0) {
        Object.entries(rolePermissions).forEach(([role, perms]) => {
          payload[`Permissions_${role}`] = JSON.stringify(perms);
        });
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setOriginalSettings({ ...appSettings });
        addToast("Settings saved successfully to Airtable", "success");
        await logAuditEvent("Settings Changes", "Settings", "Updated General / Org matrix settings");
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      addToast(err.message || "Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- PART 3 SPECIFIC HANDLERS ---
  // Security save/reset
  const hasUnsavedSecurity = JSON.stringify(securityConfig) !== JSON.stringify(originalSecurityConfig);
  const handleSaveSecurity = async () => {
    await saveStructuredConfigs("Security_Configuration", securityConfig);
    setOriginalSecurityConfig({ ...securityConfig });
    await logAuditEvent("Permission Changes", "Security", "Updated system security configuration parameters");
  };
  const handleResetSecurity = () => {
    setSecurityConfig({ ...originalSecurityConfig });
    addToast("Security configurations reset", "success");
  };

  // Backup & Restore handlers
  const handleExportConfig = () => {
    const configBundle = {
      appSettings,
      rolePermissions,
      kpiCategories,
      measurementUnits,
      kpiFrequencies,
      kpiWeights,
      kpiTemplates,
      notificationToggles,
      notificationConfig,
      securityConfig,
      importMappings
    };
    const blob = new Blob([JSON.stringify(configBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kpi_dashboard_config_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    addToast("Backup configuration exported successfully", "success");
    logAuditEvent("Settings Changes", "Backup", "Exported settings backup configuration file");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        // Schema Validation checks
        if (!parsed.appSettings || !parsed.rolePermissions || !parsed.securityConfig) {
          throw new Error("Invalid schema: missing key structures.");
        }
        // Apply imported configs
        setAppSettings(parsed.appSettings);
        setRolePermissions(parsed.rolePermissions);
        if (parsed.kpiCategories) setKpiCategories(parsed.kpiCategories);
        if (parsed.kpiTemplates) setKpiTemplates(parsed.kpiTemplates);
        if (parsed.securityConfig) setSecurityConfig(parsed.securityConfig);
        if (parsed.importMappings) setImportMappings(parsed.importMappings);

        // Save immediately to Airtable
        setSaving(true);
        const payload: Record<string, any> = {
          "Company Name": parsed.appSettings.companyName,
          "Company Logo URL": parsed.appSettings.companyLogo,
          "Timezone": parsed.appSettings.timezone,
          "Currency": parsed.appSettings.currency,
          "Date Format": parsed.appSettings.dateFormat,
          "Default Reporting Period": parsed.appSettings.reportingPeriod,
          "Application Name": parsed.appSettings.appName,
          "Theme Branding": parsed.appSettings.themeBranding,
          "KPI_Configuration": JSON.stringify({
            categories: parsed.kpiCategories || [],
            units: parsed.measurementUnits || [],
            frequencies: parsed.kpiFrequencies || [],
            weights: parsed.kpiWeights || {}
          }),
          "KPI_Templates": JSON.stringify(parsed.kpiTemplates || []),
          "Notification_Settings": JSON.stringify({
            toggles: parsed.notificationToggles || {},
            config: parsed.notificationConfig || {}
          }),
          "Security_Configuration": JSON.stringify(parsed.securityConfig),
          "Import_Mappings": JSON.stringify(parsed.importMappings || [])
        };

        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: payload }),
        });
        const data = await res.json();
        if (data.success) {
          addToast("Configuration imported and verified successfully", "success");
          setOriginalSettings(parsed.appSettings);
          setOriginalSecurityConfig(parsed.securityConfig);
          await logAuditEvent("Settings Changes", "Backup", "Restored configurations from import backup file");
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        addToast(err.message || "Invalid backup configuration file formatting", "error");
        logAuditEvent("Failed Operations", "Backup", "Attempted to import an invalid configuration format", "Failed");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  // Run validation retry
  const handleRunValidationScan = async () => {
    setValidating(true);
    addToast("Initiating database validation checks...", "success");
    try {
      const res = await fetch("/api/settings/validation");
      const data = await res.json();
      if (data.success) {
        setValidationIssues(data.data || []);
        addToast("Database scan validation completed", "success");
      }
    } catch (_) {
      addToast("Failed to complete database checks", "error");
    } finally {
      setValidating(false);
    }
  };

  const handleAlertAction = async (action: string, alertId?: string, updatedStatus?: string) => {
    try {
      const res = await fetch("/api/settings/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          alertId,
          alertIds: action === "bulk-update" || action === "bulk-delete" ? selectedAlertIds : undefined,
          updatedStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
        setSelectedAlertIds([]);
        addToast(
          action === "delete" || action === "bulk-delete" 
            ? "Alert(s) deleted successfully" 
            : "Alert(s) status updated", 
          "success"
        );
      }
    } catch (_) {
      addToast("Failed to complete alert status modification", "error");
    }
  };

  // CSV Export for Audit Trails
  const handleExportAuditCSV = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Entity", "Record", "Status", "IP", "Device"];
    const escapeCSVCell = (val: any) => {
      const str = String(val || "");
      if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
        return `'${str}`;
      }
      return str;
    };

    const rows = filteredSortedAuditLogs.map((log) => [
      escapeCSVCell(log.timestamp),
      escapeCSVCell(log.user),
      escapeCSVCell(log.role),
      escapeCSVCell(log.action),
      escapeCSVCell(log.entity),
      escapeCSVCell(log.record),
      escapeCSVCell(log.status),
      escapeCSVCell(log.ip || ""),
      escapeCSVCell(log.device || "")
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kpi_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported filtered audit logs to CSV successfully", "success");
    logAuditEvent("Report Exports", "Audit Logs", "Exported audit trail reports to CSV");
  };

  // Organise lists & modal CRUDs
  const toggleArchiveDept = async (id: string) => {
    let updatedArchived: string[];
    const isArchived = archivedDeptIds.includes(id);
    if (isArchived) {
      updatedArchived = archivedDeptIds.filter((item) => item !== id);
      addToast("Department restored successfully", "success");
    } else {
      updatedArchived = [...archivedDeptIds, id];
      addToast("Department archived successfully", "success");
    }
    setArchivedDeptIds(updatedArchived);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { "Archived_Departments": JSON.stringify(updatedArchived) } }),
      });
    } catch (_) {}
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!deptForm.departmentName.trim()) {
      setFormError("Department Name is required");
      return;
    }
    setSaving(true);
    try {
      const isEdit = modalOpen.type === "edit-dept";
      const url = isEdit ? `/api/departments/${modalOpen.targetId}` : "/api/departments";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast(isEdit ? "Department updated successfully" : "Department created successfully", "success");
        setModalOpen({ type: null });
        setDeptForm({ departmentName: "", description: "", headOfDepartment: "" });
        const deptRes = await fetch("/api/departments");
        const deptData = await deptRes.json();
        if (deptData.success) setDepartments(deptData.data || []);
        await logAuditEvent(isEdit ? "Department Changes" : "Department Changes", "Departments", `Saved dept "${deptForm.departmentName}"`);
      } else {
        setFormError(data.error || "Failed to save department");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("Department deleted successfully", "success");
        setConfirmDelete(null);
        const deptRes = await fetch("/api/departments");
        const deptData = await deptRes.json();
        if (deptData.success) setDepartments(deptData.data || []);
        await logAuditEvent("Department Changes", "Departments", `Deleted department record: ${id}`);
      } else {
        addToast(data.error || "Could not delete department", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to delete department", "error");
    }
  };

  const handleToggleArchiveTeam = async (team: Team) => {
    const isArchived = team.status === "archived";
    const nextStatus = isArchived ? "active" : "archived";
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(isArchived ? "Team restored successfully" : "Team archived successfully", "success");
        const teamsRes = await fetch("/api/teams");
        const teamsData = await teamsRes.json();
        if (teamsData.success) setTeams(teamsData.data || []);
        await logAuditEvent("Employee Changes", "Teams", `Toggled team status for "${team.teamName}"`);
      } else {
        addToast(data.error || "Failed to update team status", "error");
      }
    } catch (err) {
      addToast("Failed to update team", "error");
    }
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!teamForm.teamName.trim()) {
      setFormError("Team Name is required");
      return;
    }
    setSaving(true);
    try {
      const isEdit = modalOpen.type === "edit-team";
      const url = isEdit ? `/api/teams/${modalOpen.targetId}` : "/api/teams";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast(isEdit ? "Team updated successfully" : "Team created successfully", "success");
        setModalOpen({ type: null });
        setTeamForm({ teamName: "", department: "", teamLead: "", description: "" });
        const teamsRes = await fetch("/api/teams");
        const teamsData = await teamsRes.json();
        if (teamsData.success) setTeams(teamsData.data || []);
        await logAuditEvent("Employee Changes", "Teams", `Saved team record "${teamForm.teamName}"`);
      } else {
        setFormError(data.error || "Failed to save team");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("Team deleted successfully", "success");
        setConfirmDelete(null);
        const teamsRes = await fetch("/api/teams");
        const teamsData = await teamsRes.json();
        if (teamsData.success) setTeams(teamsData.data || []);
        await logAuditEvent("Employee Changes", "Teams", `Deleted team record: ${id}`);
      } else {
        addToast(data.error || "Could not delete team", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to delete team", "error");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${modalOpen.targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast("User updated successfully", "success");
        setModalOpen({ type: null });
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data || []);
        await logAuditEvent("Employee Changes", "Users", `Updated user system access role settings: ${modalOpen.targetId}`);
      } else {
        setFormError(data.error || "Failed to update user");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (role: string, resource: string, action: string) => {
    setRolePermissions((prev) => {
      const currentRolePerms = prev[role] || {};
      const currentResPerms = currentRolePerms[resource] || [];
      let newResPerms;
      if (currentResPerms.includes(action)) {
        newResPerms = currentResPerms.filter((a) => a !== action);
      } else {
        newResPerms = [...currentResPerms, action];
      }
      return {
        ...prev,
        [role]: {
          ...currentRolePerms,
          [resource]: newResPerms,
        },
      };
    });
  };

  // Airtable actions
  const runAirtableAction = async (action: string) => {
    setSyncRunning(true);
    const logTime = () => new Date().toLocaleTimeString();
    setAirtableActionsLogs((prev) => [`[${logTime()}] Initiating action: ${action.replace("-", " ")}...`, ...prev]);
    
    try {
      const res = await fetch("/api/settings/airtable-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setAirtableActionsLogs((prev) => [
          `[${logTime()}] Success: ${data.message}`,
          `[${logTime()}] Result details: ${JSON.stringify(data.data)}`,
          ...prev
        ]);
        addToast(data.message, "success");

        if (action === "run-manual-sync") {
          const updatedConfig = {
            ...airtableConfigState,
            lastSuccessfulSync: new Date().toLocaleTimeString(),
            recordsSynced: data.data.recordsSynced
          };
          setAirtableConfigState(updatedConfig);
          await saveStructuredConfigs("Airtable_Configuration", updatedConfig);
          await logAuditEvent("Airtable Sync", "System", "Triggered manual Airtable database sync");
        }
      } else {
        setAirtableActionsLogs((prev) => [`[${logTime()}] Error: ${data.error}`, ...prev]);
        addToast(data.error || "Action execution failed", "error");
      }
    } catch (err: any) {
      setAirtableActionsLogs((prev) => [`[${logTime()}] Connection exception: ${err.message}`, ...prev]);
      addToast("Failed to communicate with Airtable API actions endpoint", "error");
    } finally {
      setSyncRunning(false);
    }
  };

  // --- PART 2 CRUD SAVES ---
  const handleSaveKpiCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!kpiFormCat.name.trim()) {
      setFormError("Category Name is required");
      return;
    }

    const isDuplicate = kpiCategories.some(
      (c) => c.name.toLowerCase().trim() === kpiFormCat.name.toLowerCase().trim() && c.id !== modalOpen.targetId
    );
    if (isDuplicate) {
      setFormError(`Category "${kpiFormCat.name}" already exists`);
      return;
    }

    let updatedList;
    if (modalOpen.type === "edit-kpi-cat") {
      updatedList = kpiCategories.map((c) => 
        c.id === modalOpen.targetId ? { ...c, name: kpiFormCat.name.trim(), description: kpiFormCat.description.trim() } : c
      );
    } else {
      updatedList = [
        ...kpiCategories,
        { id: `cat-${Date.now()}`, name: kpiFormCat.name.trim(), description: kpiFormCat.description.trim(), status: "active" as const }
      ];
    }
    setKpiCategories(updatedList);
    setModalOpen({ type: null });
    await saveStructuredConfigs("KPI_Configuration", {
      categories: updatedList,
      units: measurementUnits,
      frequencies: kpiFrequencies,
      weights: kpiWeights
    });
    await logAuditEvent("Settings Changes", "KPI Categories", `Saved KPI Category "${kpiFormCat.name}"`);
  };

  const toggleKpiCategoryStatus = async (id: string) => {
    const updated = kpiCategories.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === "active" ? "archived" as const : "active" as const;
        addToast(`Category ${nextStatus === "active" ? "restored" : "archived"} successfully`, "success");
        return { ...c, status: nextStatus };
      }
      return c;
    });
    setKpiCategories(updated);
    await saveStructuredConfigs("KPI_Configuration", {
      categories: updated,
      units: measurementUnits,
      frequencies: kpiFrequencies,
      weights: kpiWeights
    });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!templateForm.name.trim()) {
      setFormError("Template Name is required");
      return;
    }

    if (templateForm.thresholdCritical > templateForm.thresholdWarning) {
      setFormError("Critical Threshold cannot be greater than Warning Threshold");
      return;
    }
    if (templateForm.thresholdWarning > templateForm.thresholdSuccess) {
      setFormError("Warning Threshold cannot be greater than Success Threshold");
      return;
    }

    let updatedList;
    if (modalOpen.type === "edit-kpi-template") {
      updatedList = kpiTemplates.map((t) => 
        t.id === modalOpen.targetId ? { ...t, ...templateForm } : t
      );
    } else {
      updatedList = [
        ...kpiTemplates,
        { ...templateForm, id: `tmpl-${Date.now()}`, status: "active" as const }
      ];
    }
    setKpiTemplates(updatedList);
    setModalOpen({ type: null });
    await saveStructuredConfigs("KPI_Templates", updatedList);
    await logAuditEvent("Settings Changes", "KPI Templates", `Saved template: ${templateForm.name}`);
  };

  const handleDuplicateTemplate = async (tmpl: KPITemplate) => {
    const duplicated = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      name: `${tmpl.name} (Copy)`
    };
    const updated = [...kpiTemplates, duplicated];
    setKpiTemplates(updated);
    await saveStructuredConfigs("KPI_Templates", updated);
    addToast("Template duplicated successfully", "success");
  };

  const handleToggleArchiveTemplate = async (tmpl: KPITemplate) => {
    const isArchived = tmpl.status === "archived";
    const updated = kpiTemplates.map((t) => 
      t.id === tmpl.id ? { ...t, status: (isArchived ? "active" : "archived") as any } : t
    );
    setKpiTemplates(updated);
    await saveStructuredConfigs("KPI_Templates", updated);
    addToast(isArchived ? "Template restored successfully" : "Template archived successfully", "success");
  };

  const handleDeleteTemplate = async (id: string) => {
    const updated = kpiTemplates.filter((t) => t.id !== id);
    setKpiTemplates(updated);
    setConfirmDelete(null);
    await saveStructuredConfigs("KPI_Templates", updated);
    addToast("Template deleted successfully", "success");
  };

  const handleSaveImportMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!mappingForm.sourceField.trim() || !mappingForm.destinationField.trim()) {
      setFormError("Source field and Destination field are required");
      return;
    }

    const isDuplicate = importMappings.some(
      (m) => m.destinationField.toLowerCase().trim() === mappingForm.destinationField.toLowerCase().trim() && m.id !== modalOpen.targetId
    );
    if (isDuplicate) {
      setFormError(`Mapping for destination field "${mappingForm.destinationField}" already exists`);
      return;
    }

    let updatedList;
    if (modalOpen.type === "edit-import-mapping") {
      updatedList = importMappings.map((m) => 
        m.id === modalOpen.targetId ? { ...m, ...mappingForm } : m
      );
    } else {
      updatedList = [
        ...importMappings,
        { ...mappingForm, id: `map-${Date.now()}` }
      ];
    }
    setImportMappings(updatedList);
    setModalOpen({ type: null });
    await saveStructuredConfigs("Import_Mappings", updatedList);
    await logAuditEvent("Settings Changes", "Import Mappings", `Saved field map for column "${mappingForm.sourceField}"`);
  };

  const handleDuplicateImportMapping = async (mapping: ImportMapping) => {
    const duplicated = {
      ...mapping,
      id: `map-${Date.now()}`,
      sourceField: `${mapping.sourceField}_copy`,
      destinationField: `${mapping.destinationField} Copy`
    };
    const updated = [...importMappings, duplicated];
    setImportMappings(updated);
    await saveStructuredConfigs("Import_Mappings", updated);
    addToast("Import mapping duplicated successfully", "success");
  };

  const handleDeleteImportMapping = async (id: string) => {
    const updated = importMappings.filter((m) => m.id !== id);
    setImportMappings(updated);
    setConfirmDelete(null);
    await saveStructuredConfigs("Import_Mappings", updated);
    addToast("Import mapping deleted successfully", "success");
  };

  // --- FILTERS & COMPUTATIONS ---

  // Global Settings Search Filtering
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    const results: { section: Section; title: string; desc: string; match: string }[] = [];

    // Search indexes
    const indices: { section: Section; title: string; desc: string }[] = [
      { section: "general", title: "General Preferences", desc: "Company name, timezone, Currency format, reporting period, Logo Url" },
      { section: "company", title: "Company Branding Preview", desc: "Application Name, logo preview, theme gold green glass purple stylesheet style" },
      { section: "organization", title: "Organization Structure", desc: "Departments Head, teams lead, Employees list, positions, user roles" },
      { section: "kpi-config", title: "KPI Thresholds Configuration", desc: "Default weights, stretch score target, Warning thresholds category, units" },
      { section: "notifications", title: "Notification Priority Rules", desc: "KPI Risk missed overdue alerts, email toggles, sync failures notifications" },
      { section: "data-source", title: "Airtable Connection Configuration", desc: "API Status, manual sync actions, refresh metadata, repair indexes" },
      { section: "import-mapping", title: "CSV Import Mapping Schemes", desc: "Field destination transforms rule, source CSV column required maps" },
      { section: "security", title: "System Security Preferences", desc: "Session timeout limit, auto logout, password policy strength, rate limiting private data visibility" },
      { section: "audit", title: "Audit Trail log list", desc: "User activities histories login logout failures permissions changes export print logs" },
      { section: "validation", title: "Data Validation Center Diagnostics", desc: "Missing emails, duplicates, broken dates format relationships scan warning" }
    ];

    indices.forEach((item) => {
      if (item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)) {
        results.push({
          ...item,
          match: item.title
        });
      }
    });

    return results;
  }, [debouncedSearchQuery]);

  // Highlight matches helper
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-white rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Filtered & Sorted Audit Logs
  const filteredSortedAuditLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        const matchesSearch = 
          log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
          log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
          log.record.toLowerCase().includes(auditSearch.toLowerCase());
          
        const matchesUser = auditFilterUser ? log.role === auditFilterUser : true;
        const matchesStatus = auditFilterStatus ? log.status === auditFilterStatus : true;
        
        return matchesSearch && matchesUser && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[auditSortField];
        let valB = b[auditSortField];
        if (auditSortField === "timestamp") {
          return auditSortAsc 
            ? new Date(valA || "").getTime() - new Date(valB || "").getTime()
            : new Date(valB || "").getTime() - new Date(valA || "").getTime();
        }
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return auditSortAsc ? -1 : 1;
        if (valA > valB) return auditSortAsc ? 1 : -1;
        return 0;
      });
  }, [auditLogs, auditSearch, auditFilterUser, auditFilterStatus, auditSortField, auditSortAsc]);

  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditItemsPerPage;
    return filteredSortedAuditLogs.slice(start, start + auditItemsPerPage);
  }, [filteredSortedAuditLogs, auditPage]);

  const totalAuditPages = Math.ceil(filteredSortedAuditLogs.length / auditItemsPerPage) || 1;

  // Filtered Validation Issues
  const filteredValidationIssues = useMemo(() => {
    return validationIssues.filter((issue) => {
      const matchesSearch = 
        issue.description.toLowerCase().includes(validationSearch.toLowerCase()) ||
        issue.record.toLowerCase().includes(validationSearch.toLowerCase());
        
      const matchesSeverity = validationSeverityFilter ? issue.severity === validationSeverityFilter : true;
      const matchesCategory = validationCategoryFilter ? issue.category === validationCategoryFilter : true;
      
      return matchesSearch && matchesSeverity && matchesCategory && issue.status === "Unresolved";
    });
  }, [validationIssues, validationSearch, validationSeverityFilter, validationCategoryFilter]);

  // Filtered & Sorted System Alerts
  const filteredSortedAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        const matchesSearch = 
          alert.title.toLowerCase().includes(alertSearch.toLowerCase()) ||
          alert.description.toLowerCase().includes(alertSearch.toLowerCase()) ||
          alert.category.toLowerCase().includes(alertSearch.toLowerCase());
          
        const matchesSeverity = alertSeverityFilter ? alert.severity === alertSeverityFilter : true;
        const matchesStatus = alertStatusFilter ? alert.status === alertStatusFilter : true;
        
        return matchesSearch && matchesSeverity && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[alertSortField];
        let valB = b[alertSortField];
        if (alertSortField === "timestamp") {
          return alertSortAsc 
            ? new Date(valA || "").getTime() - new Date(valB || "").getTime()
            : new Date(valB || "").getTime() - new Date(valA || "").getTime();
        }
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return alertSortAsc ? -1 : 1;
        if (valA > valB) return alertSortAsc ? 1 : -1;
        return 0;
      });
  }, [alerts, alertSearch, alertSeverityFilter, alertStatusFilter, alertSortField, alertSortAsc]);

  const paginatedAlerts = useMemo(() => {
    const start = (alertPage - 1) * alertItemsPerPage;
    return filteredSortedAlerts.slice(start, start + alertItemsPerPage);
  }, [filteredSortedAlerts, alertPage]);

  const totalAlertPages = Math.ceil(filteredSortedAlerts.length / alertItemsPerPage) || 1;

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Toast Notifications */}
        <div className="fixed right-4 top-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center space-x-2 rounded-lg p-4 text-sm font-medium shadow-lg transition-all duration-300 transform translate-y-0 ${
                toast.type === "success" 
                  ? "bg-green-600/90 text-white border border-green-500/50 backdrop-blur-md" 
                  : "bg-red-600/90 text-white border border-red-500/50 backdrop-blur-md"
              }`}
            >
              {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        {/* Global Settings Search top bar */}
        <div className="relative mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search across all settings sections (e.g. timeout, logo, weights, templates)..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-gray-500"
            />
            {globalSearchQuery && (
              <button 
                onClick={() => setGlobalSearchQuery("")}
                className="absolute right-4 top-3 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {globalSearchQuery.trim() !== "" && (
            <div className="absolute top-14 left-0 w-full glass-card p-4 z-40 max-h-72 overflow-y-auto space-y-2 border border-blue-500/30 animate-in fade-in slide-in-from-top-2 duration-150 shadow-2xl">
              <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Search Matches ({searchResults.length})</h4>
              {searchResults.length === 0 ? (
                <div className="text-sm text-gray-400 py-2">No matching configurations found.</div>
              ) : (
                searchResults.map((res, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setActiveSection(res.section);
                      setGlobalSearchQuery("");
                    }}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer text-sm transition-colors border border-transparent hover:border-white/5"
                  >
                    <div>
                      <span className="font-semibold text-white">{highlightText(res.title, debouncedSearchQuery)}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{highlightText(res.desc, debouncedSearchQuery)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Back navigation header if in sub-section */}
        {activeSection !== "home" ? (
          <div className="mb-4">
            <button
              onClick={() => {
                setActiveSection("home");
                setFormError("");
              }}
              className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
            </button>
          </div>
        ) : null}

        <PageHeader
          title={
            activeSection === "home"
              ? "Settings"
              : activeSection === "kpi-config" 
              ? "KPI Configuration" 
              : activeSection === "security"
              ? "Security & Permissions"
              : activeSection === "audit"
              ? "Audit & Logs"
              : activeSection === "validation"
              ? "Validation Center"
              : activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace("-", " ")
          }
          description={
            activeSection === "home"
              ? "Configure enterprise-wide system settings, organizational structure, role permissions, and company branding."
              : `Manage preferences and configure settings for the ${activeSection.replace("-", " ")} module.`
          }
        />

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 1. SETTINGS HOME VIEW */}
            {activeSection === "home" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* General Settings Card */}
                <div 
                  onClick={() => setActiveSection("general")}
                  className="glass-card p-6 cursor-pointer hover:border-blue-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                      <SettingsIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">General Settings</h3>
                    <p className="text-sm text-gray-400">
                      Configure company details, timezones, local currencies, date formats, and reporting periods.
                    </p>
                  </div>
                  <span className="text-xs text-blue-400 font-medium mt-4 inline-flex items-center">
                    Configure <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Company Branding Card */}
                <div 
                  onClick={() => setActiveSection("company")}
                  className="glass-card p-6 cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                      <Building className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Company Branding</h3>
                    <p className="text-sm text-gray-400">
                      Upload company logo, set system-wide app name, and configure theme stylesheets.
                    </p>
                  </div>
                  <span className="text-xs text-purple-400 font-medium mt-4 inline-flex items-center">
                    Configure <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Organization Settings Card */}
                <div 
                  onClick={() => setActiveSection("organization")}
                  className="glass-card p-6 cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Organization Structure</h3>
                    <p className="text-sm text-gray-400">
                      Manage departments, team configurations, head managers, employee positions, and relationships.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium mt-4 inline-flex items-center">
                    Manage <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Security Settings Card */}
                <div 
                  onClick={() => setActiveSection("security")}
                  className="glass-card p-6 cursor-pointer hover:border-amber-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Security & Permissions</h3>
                    <p className="text-sm text-gray-400">
                      Configure session timeouts, password strength policies, role matrix permissions, rate limits, and visibilities.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-medium mt-4 inline-flex items-center">
                    Configure <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* KPI Configuration Card */}
                <div 
                  onClick={() => setActiveSection("kpi-config")}
                  className="glass-card p-6 cursor-pointer hover:border-pink-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">KPI Configuration</h3>
                    <p className="text-sm text-gray-400">
                      Configure measurement units, KPI frequencies, targets, categories, thresholds, and templates.
                    </p>
                  </div>
                  <span className="text-xs text-pink-400 font-medium mt-4 inline-flex items-center">
                    Configure KPIs <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Notifications Card */}
                <div 
                  onClick={() => setActiveSection("notifications")}
                  className="glass-card p-6 cursor-pointer hover:border-yellow-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                      <Bell className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Notifications</h3>
                    <p className="text-sm text-gray-400">
                      Manage alert triggers, performance degradation notices, sync failures, and notification priority.
                    </p>
                  </div>
                  <span className="text-xs text-yellow-400 font-medium mt-4 inline-flex items-center">
                    Configure Alerts <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Data Source Settings Card */}
                <div 
                  onClick={() => setActiveSection("data-source")}
                  className="glass-card p-6 cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                      <Database className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Airtable Configuration</h3>
                    <p className="text-sm text-gray-400">
                      Manage sync actions, test API connection health, run manual database syncing, and view metadata.
                    </p>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium mt-4 inline-flex items-center">
                    Database Settings <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Import Mapping Card */}
                <div 
                  onClick={() => setActiveSection("import-mapping")}
                  className="glass-card p-6 cursor-pointer hover:border-rose-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Import Mapping</h3>
                    <p className="text-sm text-gray-400">
                      Configure CSV integration import schemes, destination field links, and transformation rules.
                    </p>
                  </div>
                  <span className="text-xs text-rose-400 font-medium mt-4 inline-flex items-center">
                    Manage Mappings <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Audit & Logs Card */}
                <div 
                  onClick={() => setActiveSection("audit")}
                  className="glass-card p-6 cursor-pointer hover:border-gray-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400 mb-4 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Audit & Logs</h3>
                    <p className="text-sm text-gray-400">
                      Track changes, record updates history, and view active sync statistics.
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium mt-4 inline-flex items-center">
                    View Logs <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Validation Center Card */}
                <div 
                  onClick={() => setActiveSection("validation")}
                  className="glass-card p-6 cursor-pointer hover:border-red-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 mb-4 group-hover:scale-110 transition-transform">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Validation Center</h3>
                    <p className="text-sm text-gray-400">
                      Check system database for data anomalies, duplicate emails, invalid threshold ranges, and missing values.
                    </p>
                  </div>
                  <span className="text-xs text-red-400 font-medium mt-4 inline-flex items-center">
                    Run Diagnostics <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>

                {/* Global Alert Center Card */}
                <div 
                  onClick={() => setActiveSection("alerts")}
                  className="glass-card p-6 cursor-pointer hover:border-red-500/50 hover:bg-white/5 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 mb-4 group-hover:scale-110 transition-transform">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Alert Center</h3>
                    <p className="text-sm text-gray-400">
                      View and manage system alerts, critical threshold breaches, and unresolved import conflicts.
                    </p>
                  </div>
                  <span className="text-xs text-red-400 font-medium mt-4 inline-flex items-center">
                    Manage Alerts <ArrowLeft className="rotate-180 ml-1 h-3 w-3" />
                  </span>
                </div>
              </div>
            )}

            {/* 2. GENERAL SETTINGS */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">General Preferences</h3>
                    {hasUnsavedChanges && (
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30 flex items-center animate-pulse">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Unsaved Changes
                      </span>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={appSettings.companyName}
                        onChange={(e) => setAppSettings({ ...appSettings, companyName: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Logo URL</label>
                      <input
                        type="text"
                        value={appSettings.companyLogo}
                        onChange={(e) => setAppSettings({ ...appSettings, companyLogo: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                      <select
                        value={appSettings.timezone}
                        onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="UTC">UTC (GMT)</option>
                        <option value="UTC-5">EST (PST-3 / UTC-5)</option>
                        <option value="UTC+0">WET (UTC+0)</option>
                        <option value="UTC+1">CET (UTC+1)</option>
                        <option value="UTC+5">PKT (UTC+5)</option>
                        <option value="UTC+8">SGT (UTC+8)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Currency</label>
                      <select
                        value={appSettings.currency}
                        onChange={(e) => setAppSettings({ ...appSettings, currency: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="PKR">PKR (Rs.)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AED">AED (Dh)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Date Format</label>
                      <select
                        value={appSettings.dateFormat}
                        onChange={(e) => setAppSettings({ ...appSettings, dateFormat: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-18)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/07/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/18/2026)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Default Reporting Period</label>
                      <select
                        value={appSettings.reportingPeriod}
                        onChange={(e) => setAppSettings({ ...appSettings, reportingPeriod: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annually">Annually</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-3 border-t border-white/10 pt-6">
                    <Button 
                      variant="outline" 
                      onClick={handleResetSettings}
                      disabled={saving || !hasUnsavedChanges}
                    >
                      Reset Changes
                    </Button>
                    <Button 
                      onClick={() => handleSaveSettings()}
                      disabled={saving || !hasUnsavedChanges}
                    >
                      {saving ? "Saving to Airtable..." : "Save Preferences"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. COMPANY BRANDING */}
            {activeSection === "company" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-white">Theme & Branding</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Application Name</label>
                      <input
                        type="text"
                        value={appSettings.appName}
                        onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Logo URL</label>
                      <input
                        type="text"
                        value={appSettings.companyLogo}
                        onChange={(e) => setAppSettings({ ...appSettings, companyLogo: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Theme Branding</label>
                      <select
                        value={appSettings.themeBranding}
                        onChange={(e) => setAppSettings({ ...appSettings, themeBranding: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="dark-blue">Classic Dark Blue</option>
                        <option value="glass-purple">Glassmorphism Purple</option>
                        <option value="emerald-green">Emerald Green</option>
                        <option value="amber-gold">Amber Gold</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                    <Button 
                      variant="outline" 
                      onClick={() => setAppSettings({ ...originalSettings })}
                      disabled={saving || !hasUnsavedChanges}
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={() => handleSaveSettings()}
                      disabled={saving || !hasUnsavedChanges}
                    >
                      {saving ? "Saving..." : "Save Branding"}
                    </Button>
                  </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Company Preview</h3>
                    
                    <div className={`p-6 rounded-xl border border-white/10 bg-white/5 space-y-6 ${
                      appSettings.themeBranding === "glass-purple" ? "shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/20" :
                      appSettings.themeBranding === "emerald-green" ? "shadow-[0_0_20px_rgba(16,185,129,0.15)] border-emerald-500/20" :
                      appSettings.themeBranding === "amber-gold" ? "shadow-[0_0_20px_rgba(245,158,11,0.15)] border-amber-500/20" : 
                      "shadow-[0_0_20px_rgba(59,130,246,0.15)] border-blue-500/20"
                    }`}>
                      <div className="flex items-center space-x-4">
                        {appSettings.companyLogo ? (
                          <img
                            src={appSettings.companyLogo}
                            alt="Logo"
                            className="h-12 w-12 rounded-xl object-cover border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">{appSettings.appName}</div>
                          <div className="text-xs text-gray-400">{appSettings.companyName}</div>
                        </div>
                      </div>

                      <div className="space-y-3 bg-black/30 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="h-3 w-16 bg-white/10 rounded"></div>
                          <div className="h-3 w-8 bg-blue-500/20 rounded"></div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full w-2/3 ${
                            appSettings.themeBranding === "glass-purple" ? "bg-purple-500" :
                            appSettings.themeBranding === "emerald-green" ? "bg-emerald-500" :
                            appSettings.themeBranding === "amber-gold" ? "bg-amber-500" :
                            "bg-blue-500"
                          }`}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Progress</span>
                          <span>67%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-6">
                    * Real-time branding preview. Saves apply globally.
                  </div>
                </div>
              </div>
            )}

            {/* 4. ORGANIZATION */}
            {activeSection === "organization" && (
              <div className="space-y-6">
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setOrgTab("departments")}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                      orgTab === "departments" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Departments ({departments.length})
                  </button>
                  <button
                    onClick={() => setOrgTab("teams")}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                      orgTab === "teams" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Teams ({teams.length})
                  </button>
                  <button
                    onClick={() => setOrgTab("users")}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                      orgTab === "users" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Users & Roles ({users.length})
                  </button>
                </div>

                {orgTab === "departments" && (
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={deptSearch}
                          onChange={(e) => { setDeptSearch(e.target.value); setDeptPage(1); }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setDeptForm({ departmentName: "", description: "", headOfDepartment: "" });
                          setFormError("");
                          setModalOpen({ type: "create-dept" });
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Department</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => {
                              setDeptSortField("departmentName");
                              setDeptSortAsc(!deptSortAsc);
                            }}>
                              <div className="flex items-center font-bold">
                                Department Name
                                <ArrowUpDown className="ml-1 h-3 w-3" />
                              </div>
                            </th>
                            <th className="px-6 py-4 font-bold">Manager / Head</th>
                            <th className="px-6 py-4 font-bold">Description</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                          {departments
                            .filter((dept) => dept.departmentName.toLowerCase().includes(deptSearch.toLowerCase()))
                            .map((dept) => {
                              const isArchived = archivedDeptIds.includes(dept.id);
                              return (
                                <tr key={dept.id} className={`hover:bg-white/5 transition-colors ${isArchived ? "opacity-50" : ""}`}>
                                  <td className="px-6 py-4 font-semibold text-white">{dept.departmentName}</td>
                                  <td className="px-6 py-4">{dept.headOfDepartment || "Not Assigned"}</td>
                                  <td className="px-6 py-4 max-w-xs truncate">{dept.description || "-"}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                                      isArchived ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                                    }`}>
                                      {isArchived ? "Archived" : "Active"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => {
                                        setDeptForm({
                                          departmentName: dept.departmentName,
                                          description: dept.description || "",
                                          headOfDepartment: dept.headOfDepartment || "",
                                        });
                                        setFormError("");
                                        setModalOpen({ type: "edit-dept", targetId: dept.id });
                                      }}
                                      className="text-gray-400 hover:text-white transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4 inline" />
                                    </button>
                                    <button
                                      onClick={() => toggleArchiveDept(dept.id)}
                                      className="text-gray-400 hover:text-amber-400 transition-colors"
                                    >
                                      {isArchived ? <RefreshCw className="h-4 w-4 inline" /> : <Archive className="h-4 w-4 inline" />}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: "department", id: dept.id, name: dept.departmentName })}
                                      className="text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4 inline" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {orgTab === "teams" && (
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search teams..."
                          value={teamSearch}
                          onChange={(e) => { setTeamSearch(e.target.value); setTeamPage(1); }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setTeamForm({ teamName: "", department: "", teamLead: "", description: "" });
                          setFormError("");
                          setModalOpen({ type: "create-team" });
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Team</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <th className="px-6 py-4 font-bold">Team Name</th>
                            <th className="px-6 py-4 font-bold">Department</th>
                            <th className="px-6 py-4 font-bold">Team Lead</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                          {teams
                            .filter((t) => t.teamName.toLowerCase().includes(teamSearch.toLowerCase()))
                            .map((team) => {
                              const isArchived = team.status === "archived";
                              return (
                                <tr key={team.id} className={`hover:bg-white/5 transition-colors ${isArchived ? "opacity-50" : ""}`}>
                                  <td className="px-6 py-4 font-semibold text-white">{team.teamName}</td>
                                  <td className="px-6 py-4">{team.department || "-"}</td>
                                  <td className="px-6 py-4">{team.teamLead || "Not Assigned"}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                                      isArchived ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                                    }`}>
                                      {isArchived ? "Archived" : "Active"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => {
                                        setTeamForm({
                                          teamName: team.teamName,
                                          department: team.department || "",
                                          teamLead: team.teamLead || "",
                                          description: team.description || "",
                                        });
                                        setFormError("");
                                        setModalOpen({ type: "edit-team", targetId: team.id });
                                      }}
                                      className="text-gray-400 hover:text-white transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4 inline" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleArchiveTeam(team)}
                                      className="text-gray-400 hover:text-amber-400 transition-colors"
                                    >
                                      {isArchived ? <RefreshCw className="h-4 w-4 inline" /> : <Archive className="h-4 w-4 inline" />}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: "team", id: team.id, name: team.teamName })}
                                      className="text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4 inline" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {orgTab === "users" && (
                  <div className="glass-card p-6 space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <th className="px-6 py-4 font-bold">Username</th>
                            <th className="px-6 py-4 font-bold">Email</th>
                            <th className="px-6 py-4 font-bold">System Role</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-semibold text-white">{user.username}</td>
                              <td className="px-6 py-4 text-gray-400">{user.email}</td>
                              <td className="px-6 py-4">
                                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">{user.status}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setUserForm({ role: user.role, status: user.status, department: user.department || "" });
                                    setFormError("");
                                    setModalOpen({ type: "edit-user", targetId: user.id });
                                  }}
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  <Edit2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. SECURITY & PERMISSIONS MATRIX */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">System Security Policies</h3>
                    {hasUnsavedSecurity && (
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30 flex items-center animate-pulse">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Unsaved Changes
                      </span>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Session Timeout (Minutes)</label>
                      <input
                        type="number"
                        value={securityConfig.sessionTimeout}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, sessionTimeout: parseInt(e.target.value, 10) || 15 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Login Attempt Limit</label>
                      <input
                        type="number"
                        value={securityConfig.loginAttemptLimit}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, loginAttemptLimit: parseInt(e.target.value, 10) || 5 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">API Rate Limit (Req/Min)</label>
                      <input
                        type="number"
                        value={securityConfig.rateLimit}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, rateLimit: parseInt(e.target.value, 10) || 100 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Password Complexity Policy</label>
                      <select
                        value={securityConfig.passwordPolicy}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, passwordPolicy: e.target.value as any })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="basic">Basic (Min 6 Characters)</option>
                        <option value="medium">Medium (Alphanumeric, Min 8)</option>
                        <option value="strong">Strong (Caps, Numbers, Special Symbols, Min 10)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Private Data Visibility</label>
                      <select
                        value={securityConfig.privateDataVisibility}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, privateDataVisibility: e.target.value as any })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="full">Full Visibility (All Roles)</option>
                        <option value="restricted">Restricted (Hide salary & internal codes)</option>
                        <option value="hidden">Hidden from Employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Export Permissions Scope</label>
                      <select
                        value={securityConfig.exportPermission}
                        onChange={(e) => setSecurityConfig({ ...securityConfig, exportPermission: e.target.value as any })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="all">Allow All Users</option>
                        <option value="manager-higher">Managers & Administrators Only</option>
                        <option value="admin-only">Administrators Only</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityConfig.autoLogout}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, autoLogout: e.target.checked })}
                          className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500"
                        />
                        <span>Enable Auto Logout</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityConfig.sensitiveDataProtection}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, sensitiveDataProtection: e.target.checked })}
                          className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500"
                        />
                        <span>Enable Sensitive Data Encryption Protection</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-3 border-t border-white/10 pt-6">
                    <Button variant="outline" onClick={handleResetSecurity} disabled={saving || !hasUnsavedSecurity}>Reset Changes</Button>
                    <Button onClick={handleSaveSecurity} disabled={saving || !hasUnsavedSecurity}>Save Security configs</Button>
                  </div>
                </div>

                {/* Role Permissions Matrix */}
                <div className="glass-card p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Role Permissions Matrix</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Define and configure access levels for different user roles in the system. Changes are stored in Airtable.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          <th className="px-6 py-4 w-1/4 font-bold">System Role</th>
                          {resourcesList.map((res) => (
                            <th key={res} className="px-4 py-4 text-center font-bold">{res}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {rolesList.map((role) => (
                          <tr key={role} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">
                              <div>{role}</div>
                              <div className="text-[10px] text-gray-500 font-normal">
                                {role === "Administrator" ? "Full system access" : `Permissions for ${role} status`}
                              </div>
                            </td>
                            {resourcesList.map((res) => {
                              const currentPerms = rolePermissions[role]?.[res] || [];
                              return (
                                <td key={res} className="px-4 py-4">
                                  <div className="flex flex-col items-center space-y-1">
                                    {actionsList.map((act) => {
                                      const isChecked = currentPerms.includes(act);
                                      return (
                                        <label key={act} className="inline-flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => togglePermission(role, res, act)}
                                            disabled={role === "Administrator"}
                                            className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500 h-3 w-3"
                                          />
                                          <span className="text-[9px] uppercase font-mono text-gray-500 select-none">
                                            {act.slice(0, 3)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10 mt-6">
                    <Button onClick={() => handleSaveSettings()} disabled={saving}>Save Permissions Matrix</Button>
                  </div>
                </div>

                {/* Backup & Restore Panel */}
                <div className="glass-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Backup & Restore Settings Configuration</h3>
                    <p className="text-xs text-gray-400">Download system configuration bundle parameters or restore previous system backups.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button onClick={handleExportConfig} className="flex items-center justify-center">
                      <Download className="mr-2 h-4 w-4" /> Export Configuration JSON
                    </Button>
                    <label className="flex items-center justify-center px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                      <Upload className="mr-2 h-4 w-4" /> Import Configuration JSON
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportConfig} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. KPI CONFIGURATION PANEL */}
            {activeSection === "kpi-config" && (
              <div className="space-y-6">
                {/* Default Thresholds / Weights Form */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Default Thresholds & Targets</h3>
                  <div className="grid gap-6 md:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Default Warning Threshold (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.thresholdWarning}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, thresholdWarning: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Default Critical Threshold (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.thresholdCritical}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, thresholdCritical: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Default Success Threshold (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.thresholdSuccess}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, thresholdSuccess: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Score Cap (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.scoreCap}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, scoreCap: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Default Weight</label>
                      <input
                        type="number"
                        value={kpiWeights.defaultWeight}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, defaultWeight: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Stretch Score (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.stretchScore}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, stretchScore: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Target Score (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.targetScore}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, targetScore: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Min Acceptable Score (%)</label>
                      <input
                        type="number"
                        value={kpiWeights.minAcceptableScore}
                        onChange={(e) => setKpiWeights({ ...kpiWeights, minAcceptableScore: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => saveStructuredConfigs("KPI_Configuration", {
                      categories: kpiCategories,
                      units: measurementUnits,
                      frequencies: kpiFrequencies,
                      weights: kpiWeights
                    })}>
                      Save Threshold Defaults
                    </Button>
                  </div>
                </div>

                {/* Categories Management */}
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">KPI Categories</h3>
                    <Button onClick={() => {
                      setKpiFormCat({ name: "", description: "" });
                      setFormError("");
                      setModalOpen({ type: "create-kpi-cat" });
                    }} className="flex items-center space-x-1 py-1 px-3 text-xs">
                      <Plus className="h-3 w-3" />
                      <span>Add Category</span>
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3 font-bold">Category Name</th>
                          <th className="px-6 py-3 font-bold">Description</th>
                          <th className="px-6 py-3 font-bold">Status</th>
                          <th className="px-6 py-3 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {kpiCategories.map((cat) => (
                          <tr key={cat.id} className={cat.status === "archived" ? "opacity-50" : ""}>
                            <td className="px-6 py-4 font-semibold text-white">{cat.name}</td>
                            <td className="px-6 py-4 text-gray-400">{cat.description || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                cat.status === "active" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {cat.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => {
                                setKpiFormCat({ name: cat.name, description: cat.description });
                                setFormError("");
                                setModalOpen({ type: "edit-kpi-cat", targetId: cat.id });
                              }} className="text-gray-400 hover:text-white">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => toggleKpiCategoryStatus(cat.id)} className="text-gray-400 hover:text-amber-400">
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Templates Section */}
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">KPI Templates</h3>
                    <Button onClick={() => {
                      setTemplateForm({
                        name: "",
                        department: "Sales",
                        category: kpiCategories[0]?.name || "",
                        unit: "%",
                        frequency: "Monthly",
                        weight: 10,
                        thresholdWarning: 60,
                        thresholdCritical: 40,
                        thresholdSuccess: 90,
                        formula: "Actual / Target",
                        statusRules: "Automatic"
                      });
                      setFormError("");
                      setModalOpen({ type: "create-kpi-template" });
                    }} className="flex items-center space-x-1 py-1 px-3 text-xs">
                      <Plus className="h-3 w-3" />
                      <span>Add Template</span>
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3 font-bold">Template Name</th>
                          <th className="px-6 py-3 font-bold">Department</th>
                          <th className="px-6 py-3 font-bold">Unit</th>
                          <th className="px-6 py-3 font-bold">Weight</th>
                          <th className="px-6 py-3 font-bold">Formula</th>
                          <th className="px-6 py-3 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {kpiTemplates.map((tmpl) => (
                          <tr key={tmpl.id} className={tmpl.status === "archived" ? "opacity-50" : ""}>
                            <td className="px-6 py-4 font-semibold text-white">{tmpl.name}</td>
                            <td className="px-6 py-4 text-gray-400">{tmpl.department}</td>
                            <td className="px-6 py-4">{tmpl.unit}</td>
                            <td className="px-6 py-4">{tmpl.weight}</td>
                            <td className="px-6 py-4 truncate max-w-[120px] font-mono text-xs">{tmpl.formula}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => {
                                setTemplateForm({ ...tmpl });
                                setFormError("");
                                setModalOpen({ type: "edit-kpi-template", targetId: tmpl.id });
                              }} className="text-gray-400 hover:text-white" title="Edit">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDuplicateTemplate(tmpl)} className="text-gray-400 hover:text-blue-400" title="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleToggleArchiveTemplate(tmpl)} className="text-gray-400 hover:text-amber-400" title={tmpl.status === "active" ? "Archive" : "Restore"}>
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setConfirmDelete({ type: "kpi-template", id: tmpl.id, name: tmpl.name })} className="text-gray-400 hover:text-red-400" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7. NOTIFICATIONS PANEL */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Alert Triggers & Channels</h3>
                    <p className="text-xs text-gray-400">Configure which occurrences trigger system notifications.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white border-b border-white/5 pb-2">KPI & Metrics Alerts</h4>
                      {[
                        { key: "kpiRiskAlerts", label: "KPI Risk Alerts (Behind Targets)" },
                        { key: "missedKpiAlerts", label: "Missed KPI Alerts (Deadlines)" },
                        { key: "overachievedKpiAlerts", label: "Overachieved KPI Success Alerts" },
                        { key: "performanceDeclineEmp", label: "Employee Score Degradation Alerts" },
                        { key: "performanceDeclineDept", label: "Department Performance Decline" }
                      ].map((t) => (
                        <label key={t.key} className="flex items-center space-x-3 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationToggles[t.key]}
                            onChange={(e) => setNotificationToggles({ ...notificationToggles, [t.key]: e.target.checked })}
                            className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500"
                          />
                          <span>{t.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white border-b border-white/5 pb-2">Sync & System Alerts</h4>
                      {[
                        { key: "approvalRequests", label: "Approval Request Pending" },
                        { key: "approvalCompleted", label: "Approvals Outcome Notices" },
                        { key: "taskOverdue", label: "Task Overdue Reminders" },
                        { key: "syncFailureAirtable", label: "Airtable API Sync Failure Alert" },
                        { key: "validationErrorsData", label: "Data Integrity & Schema Warnings" }
                      ].map((t) => (
                        <label key={t.key} className="flex items-center space-x-3 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationToggles[t.key]}
                            onChange={(e) => setNotificationToggles({ ...notificationToggles, [t.key]: e.target.checked })}
                            className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500"
                          />
                          <span>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 border-t border-white/15 pt-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Notification Priority</label>
                      <select
                        value={notificationConfig.priority}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, priority: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="High">High (Immediate Alerts)</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Digest Frequency</label>
                      <select
                        value={notificationConfig.frequency}
                        onChange={(e) => setNotificationConfig({ ...notificationConfig, frequency: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="Real-time">Real-time alerts</option>
                        <option value="Daily">Daily Digest</option>
                        <option value="Weekly">Weekly Digest</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button onClick={() => saveStructuredConfigs("Notification_Settings", {
                      toggles: notificationToggles,
                      config: notificationConfig
                    })}>
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AIRTABLE CONFIGURATION PANEL */}
            {activeSection === "data-source" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Airtable API Integration Status</h3>
                      <p className="text-xs text-gray-400 font-normal">Manage connections and trigger synchronization maintenance actions.</p>
                    </div>
                    <span className="flex items-center space-x-1 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-xs text-green-400 font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" /> <span>Connected</span>
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 text-sm text-gray-300">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">Base Name</span>
                      <span className="font-semibold text-white">{airtableConfigState.baseName}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">Workspace</span>
                      <span className="font-semibold text-white">{airtableConfigState.workspaceName}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">API Health (Uptime)</span>
                      <span className="font-semibold text-emerald-400">{airtableConfigState.apiHealth}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">Schema Version</span>
                      <span className="font-mono font-semibold text-white">{airtableConfigState.schemaVersion}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">Last Sync Success</span>
                      <span className="font-semibold text-white">{airtableConfigState.lastSuccessfulSync}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 block mb-1">Sync Interval</span>
                      <span className="font-semibold text-white">{airtableConfigState.syncInterval}</span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-4">Operations & Actions</h4>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      <Button variant="outline" onClick={() => runAirtableAction("test-connection")} disabled={syncRunning} className="justify-center">
                        <Activity className="mr-2 h-4 w-4" /> Test Connection
                      </Button>
                      <Button variant="outline" onClick={() => runAirtableAction("refresh-metadata")} disabled={syncRunning} className="justify-center">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Metadata
                      </Button>
                      <Button variant="outline" onClick={() => runAirtableAction("run-manual-sync")} disabled={syncRunning} className="justify-center">
                        <Database className="mr-2 h-4 w-4" /> Run Manual Sync
                      </Button>
                      <Button variant="outline" onClick={() => runAirtableAction("retry-failed-sync")} disabled={syncRunning} className="justify-center">
                        <AlertCircle className="mr-2 h-4 w-4" /> Retry Failed Syncs
                      </Button>
                      <Button variant="outline" onClick={() => runAirtableAction("repair-schema")} disabled={syncRunning} className="justify-center">
                        <ShieldAlert className="mr-2 h-4 w-4" /> Repair Schema Indexes
                      </Button>
                      <Button variant="outline" onClick={() => runAirtableAction("initialize-base")} disabled={syncRunning} className="justify-center">
                        <Check className="mr-2 h-4 w-4" /> Initialize Base Setup
                      </Button>
                    </div>
                  </div>

                  {/* Logs Console */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Sync Execution Logs</h4>
                      <button onClick={() => setAirtableActionsLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
                    </div>
                    <div className="rounded-lg bg-black/40 p-4 border border-white/5 font-mono text-xs text-gray-400 max-h-40 overflow-y-auto space-y-1">
                      {airtableActionsLogs.length === 0 ? (
                        <span className="text-gray-600">Console idle. No actions triggered in session.</span>
                      ) : (
                        airtableActionsLogs.map((log, idx) => <div key={idx}>{log}</div>)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. IMPORT MAPPING PANEL */}
            {activeSection === "import-mapping" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Import Mapping Fields</h3>
                      <p className="text-xs text-gray-400 font-normal">Configure source CSV properties map to Airtable Fields.</p>
                    </div>
                    <Button onClick={() => {
                      setMappingForm({
                        sourceField: "",
                        destinationField: "",
                        defaultValue: "",
                        required: "No",
                        active: "Yes",
                        transformationRule: "Direct Copy"
                      });
                      setFormError("");
                      setModalOpen({ type: "create-import-mapping" });
                    }} className="flex items-center space-x-1 py-1 px-3 text-xs">
                      <Plus className="h-3 w-3" />
                      <span>Add Mapping</span>
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3 font-bold">Source Field</th>
                          <th className="px-6 py-3 font-bold">Airtable Field</th>
                          <th className="px-6 py-3 font-bold">Default Value</th>
                          <th className="px-6 py-3 font-bold">Required</th>
                          <th className="px-6 py-3 font-bold">Active</th>
                          <th className="px-6 py-3 font-bold">Transform</th>
                          <th className="px-6 py-3 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {importMappings.map((m) => (
                          <tr key={m.id} className={m.active === "No" ? "opacity-50" : ""}>
                            <td className="px-6 py-4 font-semibold text-white font-mono text-xs">{m.sourceField}</td>
                            <td className="px-6 py-4 text-blue-400">{m.destinationField}</td>
                            <td className="px-6 py-4 text-gray-400">{m.defaultValue || "-"}</td>
                            <td className="px-6 py-4">{m.required}</td>
                            <td className="px-6 py-4">{m.active}</td>
                            <td className="px-6 py-4 text-xs font-mono">{m.transformationRule}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => {
                                setMappingForm({ ...m });
                                setFormError("");
                                setModalOpen({ type: "edit-import-mapping", targetId: m.id });
                              }} className="text-gray-400 hover:text-white" title="Edit">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDuplicateImportMapping(m)} className="text-gray-400 hover:text-blue-400" title="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setConfirmDelete({ type: "import-mapping", id: m.id, name: m.sourceField })} className="text-gray-400 hover:text-red-400" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 10. AUDIT TRAILS & SYSTEM LOGS */}
            {activeSection === "audit" && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">System Audit Trails</h3>
                    <p className="text-xs text-gray-400 mt-1">Track modifications, access logins, exports, and updates.</p>
                  </div>
                  <Button onClick={handleExportAuditCSV} className="flex items-center space-x-1 py-1.5 text-xs">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export CSV Log</span>
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid gap-4 sm:grid-cols-3 bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users or actions..."
                      value={auditSearch}
                      onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={auditFilterUser}
                      onChange={(e) => { setAuditFilterUser(e.target.value); setAuditPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">All Roles</option>
                      {rolesList.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <select
                      value={auditFilterStatus}
                      onChange={(e) => { setAuditFilterStatus(e.target.value); setAuditPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                  <table className="w-full text-left text-sm text-gray-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider font-bold">
                        <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => { setAuditSortField("timestamp"); setAuditSortAsc(!auditSortAsc); }}>
                          Timestamp <ArrowUpDown className="inline ml-1 h-3 w-3" />
                        </th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Entity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">IP / Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {paginatedAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No logs found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-gray-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{log.user}</td>
                            <td className="px-6 py-4">{log.role}</td>
                            <td className="px-6 py-4 font-semibold text-blue-400">{log.action}</td>
                            <td className="px-6 py-4">{log.entity}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold leading-5 ${
                                log.status === "Success" ? "bg-green-500/10 text-green-400 border border-green-500/25" : "bg-red-500/10 text-red-400 border border-red-500/25"
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 font-mono">
                              {log.ip} <span className="block text-[10px]">{log.device}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Audit Pagination */}
                {totalAuditPages > 1 && (
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xs text-gray-400">
                      Showing Page {auditPage} of {totalAuditPages}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setAuditPage((p) => Math.max(p - 1, 1))}
                        disabled={auditPage === 1}
                        className="py-1 px-3 text-xs"
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAuditPage((p) => Math.min(p + 1, totalAuditPages))}
                        disabled={auditPage === totalAuditPages}
                        className="py-1 px-3 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 11. DATA VALIDATION CENTER PANEL */}
            {activeSection === "validation" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Database Integrity Scan</h3>
                      <p className="text-xs text-gray-400 mt-1">Scan departments, teams, employees, and KPIs for missing parameters or broken keys.</p>
                    </div>
                    <Button onClick={handleRunValidationScan} disabled={validating}>
                      <Activity className={`mr-2 h-4 w-4 ${validating ? "animate-spin" : ""}`} /> 
                      {validating ? "Running scan..." : "Run Diagnostics Check"}
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="grid gap-4 sm:grid-cols-3 bg-white/5 p-4 rounded-lg border border-white/5">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search issues..."
                        value={validationSearch}
                        onChange={(e) => setValidationSearch(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <select
                        value={validationSeverityFilter}
                        onChange={(e) => setValidationSeverityFilter(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="">All Severities</option>
                        <option value="High">High Severity</option>
                        <option value="Medium">Medium Severity</option>
                        <option value="Low">Low Severity</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={validationCategoryFilter}
                        onChange={(e) => setValidationCategoryFilter(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="">All Categories</option>
                        <option value="Missing Required Fields">Missing Fields</option>
                        <option value="Duplicate Records">Duplicates</option>
                        <option value="Invalid Email">Bad Email formats</option>
                        <option value="Invalid Dates">Invalid Dates</option>
                        <option value="Invalid Relationships">Broken Relations</option>
                      </select>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3">
                    {filteredValidationIssues.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center text-gray-400">
                        <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500 mb-4 animate-bounce" />
                        <p className="font-semibold text-white">All clean! No validation warnings found.</p>
                        <p className="text-xs text-gray-500 mt-1">Run diagnostics checks to check latest changes.</p>
                      </div>
                    ) : (
                      filteredValidationIssues.map((issue) => (
                        <div 
                          key={issue.id}
                          className={`p-4 rounded-xl border flex justify-between items-center transition-all bg-white/5 ${
                            issue.severity === "High" ? "border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.05)]" :
                            issue.severity === "Medium" ? "border-amber-500/30" : "border-blue-500/30"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              {issue.severity === "High" ? <AlertCircle className="h-5 w-5 text-red-500" /> :
                               issue.severity === "Medium" ? <AlertTriangle className="h-5 w-5 text-amber-500" /> :
                               <HelpCircle className="h-5 w-5 text-blue-500" />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                  issue.severity === "High" ? "bg-red-500/10 text-red-400" :
                                  issue.severity === "Medium" ? "bg-amber-500/10 text-amber-400" :
                                  "bg-blue-500/10 text-blue-400"
                                }`}>
                                  {issue.severity}
                                </span>
                                <span className="text-xs font-semibold text-gray-400">{issue.category}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-white mt-1">{issue.description}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Entity: {issue.entity} | Record: {issue.record}</p>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setValidationIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: "Resolved" as const } : i));
                                addToast("Issue marked as resolved locally", "success");
                              }}
                              className="py-1 px-3 text-xs"
                            >
                              Resolve
                            </Button>
                            <button
                              onClick={() => {
                                setValidationIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: "Dismissed" as const } : i));
                                addToast("Issue dismissed", "success");
                              }}
                              className="text-xs text-gray-500 hover:text-white px-2 py-1"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 12. GLOBAL ALERT CENTER PANEL */}
            {activeSection === "alerts" && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Global Alert Center</h3>
                    <p className="text-xs text-gray-400 mt-1">Review system triggers, critical falls, and pending task blockages.</p>
                  </div>
                  {selectedAlertIds.length > 0 && (
                    <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-lg border border-white/5 animate-in fade-in duration-200">
                      <span className="text-xs text-gray-400 mr-2">{selectedAlertIds.length} Selected</span>
                      <Button variant="outline" onClick={() => handleAlertAction("bulk-update", undefined, "Acknowledged")} className="py-1 px-2.5 text-xs">
                        Acknowledge
                      </Button>
                      <Button variant="outline" onClick={() => handleAlertAction("bulk-update", undefined, "Resolved")} className="py-1 px-2.5 text-xs">
                        Resolve
                      </Button>
                      <button onClick={() => handleAlertAction("bulk-delete")} className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 flex items-center">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="grid gap-4 sm:grid-cols-3 bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search alerts..."
                      value={alertSearch}
                      onChange={(e) => { setAlertSearch(e.target.value); setAlertPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={alertSeverityFilter}
                      onChange={(e) => { setAlertSeverityFilter(e.target.value); setAlertPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">All Severities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Warning">Warning</option>
                      <option value="Information">Information</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={alertStatusFilter}
                      onChange={(e) => { setAlertStatusFilter(e.target.value); setAlertPage(1); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Acknowledged">Acknowledged</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                  <table className="w-full text-left text-sm text-gray-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-xs text-gray-400 uppercase tracking-wider font-bold">
                        <th className="px-6 py-3 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAlertIds.length === paginatedAlerts.length && paginatedAlerts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAlertIds(paginatedAlerts.map(a => a.id));
                              } else {
                                setSelectedAlertIds([]);
                              }
                            }}
                            className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                        </th>
                        <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => { setAlertSortField("timestamp"); setAlertSortAsc(!alertSortAsc); }}>
                          Timestamp <ArrowUpDown className="inline ml-1 h-3 w-3" />
                        </th>
                        <th className="px-6 py-3">Alert Title</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Severity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {paginatedAlerts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No alerts matching filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedAlerts.map((alert) => (
                          <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedAlertIds.includes(alert.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAlertIds(prev => [...prev, alert.id]);
                                  } else {
                                    setSelectedAlertIds(prev => prev.filter(id => id !== alert.id));
                                  }
                                }}
                                className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono">
                              {new Date(alert.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{alert.title}</td>
                            <td className="px-6 py-4 max-w-xs truncate">{alert.description}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold leading-5 ${
                                alert.severity === "Critical" ? "bg-red-500/10 text-red-400 border border-red-500/25" :
                                alert.severity === "High" ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" :
                                alert.severity === "Warning" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25" :
                                "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                              }`}>
                                {alert.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                alert.status === "Open" ? "bg-red-500/10 text-red-400" :
                                alert.status === "Acknowledged" ? "bg-yellow-500/10 text-yellow-400" :
                                alert.status === "Resolved" ? "bg-green-500/10 text-green-400" :
                                "bg-gray-500/10 text-gray-400"
                              }`}>
                                {alert.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {alert.status === "Open" && (
                                <button onClick={() => handleAlertAction("update", alert.id, "Acknowledged")} className="text-xs text-yellow-400 hover:text-white" title="Acknowledge">
                                  Ack
                                </button>
                              )}
                              {alert.status !== "Resolved" && (
                                <button onClick={() => handleAlertAction("update", alert.id, "Resolved")} className="text-xs text-green-400 hover:text-white" title="Resolve">
                                  Resolve
                                </button>
                              )}
                              <button onClick={() => handleAlertAction("delete", alert.id)} className="text-gray-500 hover:text-red-400" title="Delete">
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalAlertPages > 1 && (
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xs text-gray-400">
                      Showing Page {alertPage} of {totalAlertPages}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                        disabled={alertPage === 1}
                        className="py-1 px-3 text-xs"
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAlertPage((p) => Math.min(p + 1, totalAlertPages))}
                        disabled={alertPage === totalAlertPages}
                        className="py-1 px-3 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        {modalOpen.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-md p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setModalOpen({ type: null })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-semibold text-white">
                {modalOpen.type === "create-dept" && "Create Department"}
                {modalOpen.type === "edit-dept" && "Edit Department"}
                {modalOpen.type === "create-team" && "Create Team"}
                {modalOpen.type === "edit-team" && "Edit Team"}
                {modalOpen.type === "edit-user" && "Update User Access"}
                {modalOpen.type === "create-kpi-cat" && "Create KPI Category"}
                {modalOpen.type === "edit-kpi-cat" && "Edit KPI Category"}
                {modalOpen.type === "create-kpi-template" && "Create KPI Template"}
                {modalOpen.type === "edit-kpi-template" && "Edit KPI Template"}
                {modalOpen.type === "create-import-mapping" && "Create Import Mapping"}
                {modalOpen.type === "edit-import-mapping" && "Edit Import Mapping"}
              </h3>

              {formError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" /> {formError}
                </div>
              )}

              {/* Department Form */}
              {(modalOpen.type === "create-dept" || modalOpen.type === "edit-dept") && (
                <form onSubmit={handleSubmitDept} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Department Name</label>
                    <input
                      type="text"
                      value={deptForm.departmentName}
                      onChange={(e) => setDeptForm({ ...deptForm, departmentName: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                    <textarea
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Manager</label>
                    <input
                      type="text"
                      value={deptForm.headOfDepartment}
                      onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={saving}>Save</Button>
                  </div>
                </form>
              )}

              {/* Team Form */}
              {(modalOpen.type === "create-team" || modalOpen.type === "edit-team") && (
                <form onSubmit={handleSubmitTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={teamForm.teamName}
                      onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Department</label>
                    <select
                      value={teamForm.department}
                      onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Team Lead</label>
                    <input
                      type="text"
                      value={teamForm.teamLead}
                      onChange={(e) => setTeamForm({ ...teamForm, teamLead: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={saving}>Save</Button>
                  </div>
                </form>
              )}

              {/* KPI Category Form */}
              {(modalOpen.type === "create-kpi-cat" || modalOpen.type === "edit-kpi-cat") && (
                <form onSubmit={handleSaveKpiCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Category Name</label>
                    <input
                      type="text"
                      value={kpiFormCat.name}
                      onChange={(e) => setKpiFormCat({ ...kpiFormCat, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                    <textarea
                      value={kpiFormCat.description}
                      onChange={(e) => setKpiFormCat({ ...kpiFormCat, description: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none h-20"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit">Save Category</Button>
                  </div>
                </form>
              )}

              {/* KPI Template Form */}
              {(modalOpen.type === "create-kpi-template" || modalOpen.type === "edit-kpi-template") && (
                <form onSubmit={handleSaveTemplate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Department</label>
                      <select
                        value={templateForm.department}
                        onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        {departments.map((d) => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        {kpiCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Warning</label>
                      <input
                        type="number"
                        value={templateForm.thresholdWarning}
                        onChange={(e) => setTemplateForm({ ...templateForm, thresholdWarning: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Critical</label>
                      <input
                        type="number"
                        value={templateForm.thresholdCritical}
                        onChange={(e) => setTemplateForm({ ...templateForm, thresholdCritical: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Success</label>
                      <input
                        type="number"
                        value={templateForm.thresholdSuccess}
                        onChange={(e) => setTemplateForm({ ...templateForm, thresholdSuccess: parseInt(e.target.value, 10) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Formula</label>
                    <input
                      type="text"
                      value={templateForm.formula}
                      onChange={(e) => setTemplateForm({ ...templateForm, formula: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit">Save Template</Button>
                  </div>
                </form>
              )}

              {/* Import Mapping Form */}
              {(modalOpen.type === "create-import-mapping" || modalOpen.type === "edit-import-mapping") && (
                <form onSubmit={handleSaveImportMapping} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Source CSV Column Field</label>
                    <input
                      type="text"
                      value={mappingForm.sourceField}
                      onChange={(e) => setMappingForm({ ...mappingForm, sourceField: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Destination Airtable Field</label>
                    <input
                      type="text"
                      value={mappingForm.destinationField}
                      onChange={(e) => setMappingForm({ ...mappingForm, destinationField: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Transformation Rule</label>
                    <select
                      value={mappingForm.transformationRule}
                      onChange={(e) => setMappingForm({ ...mappingForm, transformationRule: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="Direct Copy">Direct Copy</option>
                      <option value="Convert Case">Convert Case</option>
                      <option value="Parse Integer">Parse Integer</option>
                      <option value="Format Date">Format Date</option>
                      <option value="Map Department">Map Department</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Required</label>
                      <select
                        value={mappingForm.required}
                        onChange={(e) => setMappingForm({ ...mappingForm, required: e.target.value as any })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Active</label>
                      <select
                        value={mappingForm.active}
                        onChange={(e) => setMappingForm({ ...mappingForm, active: e.target.value as any })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit">Save Mapping</Button>
                  </div>
                </form>
              )}

              {/* User Form */}
              {modalOpen.type === "edit-user" && (
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">System Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Executive">Executive</option>
                      <option value="Department Manager">Department Manager</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                    <select
                      value={userForm.status}
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setModalOpen({ type: null })}>Cancel</Button>
                    <Button type="submit" disabled={saving}>Update User</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* CONFIRM DELETE DIALOG */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-sm p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Record</h3>
                <p className="text-sm text-gray-400 mt-2">
                  Are you sure you want to delete <strong>{confirmDelete.name}</strong>?
                </p>
              </div>

              <div className="flex justify-center space-x-2 pt-2">
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (confirmDelete.type === "department") {
                      handleDeleteDept(confirmDelete.id);
                    } else if (confirmDelete.type === "team") {
                      handleDeleteTeam(confirmDelete.id);
                    } else if (confirmDelete.type === "kpi-template") {
                      handleDeleteTemplate(confirmDelete.id);
                    } else if (confirmDelete.type === "import-mapping") {
                      handleDeleteImportMapping(confirmDelete.id);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 border-red-500"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
