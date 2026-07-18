"use client";

import { useState, useMemo, Suspense, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTasks, useEmployees, useKPIs } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import {
  CheckSquare, Search, ArrowUpDown, SlidersHorizontal, ChevronDown,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Database, Download,
  CheckCircle, Clock, X, Sparkles, Bookmark, Filter, Trash2,
  MoreHorizontal, Eye, Edit3, Copy, Archive, User, Tag, Zap,
  Users, AlertTriangle, CheckCircle2, Ban, Layers, ShieldAlert,
} from "lucide-react";
import type { Task, Employee, KPI } from "@/types/models";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnterpriseTask extends Task {
  department: string;
  team: string;
  progress: number;
  startDate: string;
  completionDate: string;
  estimatedHours: number;
  actualHours: number;
  impactLevel: string;
  createdBy: string;
  syncStatus: "Synced" | "Pending";
  kpiName: string;
}

interface ColumnConfig {
  key: keyof EnterpriseTask | "select" | "actions";
  label: string;
  visible: boolean;
  width: number;
}

type ToastMsg = { text: string; type: "success" | "error" | "info"; id: number };

type DialogType =
  | "delete-single" | "delete-bulk"
  | "archive-single" | "archive-bulk"
  | "edit-single" | "duplicate-single"
  | "assign-single" | "assign-bulk"
  | "status-single" | "status-bulk"
  | "priority-single" | "priority-bulk";

interface DialogState {
  type: DialogType;
  taskId?: string;
  taskName?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["not-started", "planned", "in-progress", "blocked", "under-review", "completed", "archived"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Not Started", "planned": "Planned", "in-progress": "In Progress",
  "blocked": "Blocked", "under-review": "Under Review", "completed": "Completed", "archived": "Archived",
};

const STATUS_STYLE: Record<string, string> = {
  "not-started":  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "planned":      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "in-progress":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "blocked":      "bg-red-500/10 text-red-400 border-red-500/20",
  "under-review": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "completed":    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "archived":     "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "todo":         "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low:      "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function patchTask(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Update failed");
  return res.json();
}

async function deleteTask(id: string) {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
  return res.json();
}

async function bulkOp(action: string, ids: string[], value?: string) {
  const res = await fetch("/api/tasks/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ids, value }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Bulk operation failed");
  return res.json();
}

async function createTaskDuplicate(task: EnterpriseTask) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskName: `${task.taskName} (Copy)`,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: "not-started",
      dueDate: task.dueDate,
      kpiId: task.kpiId,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Duplicate failed");
  return res.json();
}

// ─── Toast System ─────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-xl max-w-sm animate-slide-up
            ${t.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : t.type === "error" ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
        >
          {t.type === "success" && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
          {t.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {t.type === "info" && <Sparkles className="h-4 w-4 flex-shrink-0" />}
          <span className="text-xs font-bold flex-1">{t.text}</span>
          <button onClick={() => onDismiss(t.id)} className="text-current opacity-60 hover:opacity-100 flex-shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  dialog: DialogState | null;
  employees: Employee[];
  selectedCount: number;
  onConfirm: (extra?: { value?: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({ dialog, employees, selectedCount, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const [selectValue, setSelectValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectValue("");
  }, [dialog]);

  // Accessibility: Focus trap & Escape dismissal
  useEffect(() => {
    if (!dialog) return;

    // Focus the modal container
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      
      // Simple focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button, select, input, [tabindex='0']");
        if (focusable.length > 0) {
          const first = focusable[0] as HTMLElement;
          const last = focusable[focusable.length - 1] as HTMLElement;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dialog, onCancel]);

  if (!dialog) return null;

  const isBulk = dialog.type.includes("bulk");
  const isDestructive = dialog.type.includes("delete");
  const count = isBulk ? selectedCount : 1;
  const target = isBulk ? `${count} tasks` : `"${dialog.taskName}"`;

  const configs: Record<DialogType, { icon: React.ReactNode; title: string; desc: string; confirmLabel: string; input?: React.ReactNode }> = {
    "delete-single": {
      icon: <Trash2 className="h-6 w-6 text-red-400" />,
      title: "Delete Task",
      desc: `This will permanently remove ${target} from Airtable. This action cannot be undone.`,
      confirmLabel: "Delete Permanently",
    },
    "delete-bulk": {
      icon: <Trash2 className="h-6 w-6 text-red-400" />,
      title: `Delete ${count} Tasks`,
      desc: `This will permanently remove ${target} from Airtable. This action cannot be undone.`,
      confirmLabel: `Delete ${count} Tasks`,
    },
    "archive-single": {
      icon: <Archive className="h-6 w-6 text-zinc-400" />,
      title: "Archive Task",
      desc: `Archive ${target}? Status will be set to Archived in Airtable.`,
      confirmLabel: "Archive",
    },
    "archive-bulk": {
      icon: <Archive className="h-6 w-6 text-zinc-400" />,
      title: `Archive ${count} Tasks`,
      desc: `Archive ${target}? All will be set to Archived status in Airtable.`,
      confirmLabel: `Archive ${count} Tasks`,
    },
    "edit-single": {
      icon: <Edit3 className="h-6 w-6 text-blue-400" />,
      title: "Edit Task",
      desc: `You'll be redirected to the task detail page to edit ${target}.`,
      confirmLabel: "Go to Edit",
    },
    "duplicate-single": {
      icon: <Copy className="h-6 w-6 text-violet-400" />,
      title: "Duplicate Task",
      desc: `Create a copy of ${target}? The duplicate will be added as a new task in Airtable with status "Not Started".`,
      confirmLabel: "Duplicate",
    },
    "assign-single": {
      icon: <User className="h-6 w-6 text-blue-400" />,
      title: "Assign Employee",
      desc: `Select an employee to assign ${target} to.`,
      confirmLabel: "Assign",
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Employee —</option>
          {employees.map(e => <option key={e.id} value={e.name}>{e.name} {e.department ? `· ${e.department}` : ""}</option>)}
        </select>
      ),
    },
    "assign-bulk": {
      icon: <Users className="h-6 w-6 text-blue-400" />,
      title: `Assign ${count} Tasks`,
      desc: `Select an employee to assign ${target} to.`,
      confirmLabel: `Assign ${count} Tasks`,
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Employee —</option>
          {employees.map(e => <option key={e.id} value={e.name}>{e.name} {e.department ? `· ${e.department}` : ""}</option>)}
        </select>
      ),
    },
    "status-single": {
      icon: <Tag className="h-6 w-6 text-blue-400" />,
      title: "Change Status",
      desc: `Select a new status for ${target}.`,
      confirmLabel: "Change Status",
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Status —</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      ),
    },
    "status-bulk": {
      icon: <Tag className="h-6 w-6 text-blue-400" />,
      title: `Change Status for ${count} Tasks`,
      desc: `Select a new status to apply to ${target}.`,
      confirmLabel: `Update ${count} Tasks`,
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Status —</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      ),
    },
    "priority-single": {
      icon: <Zap className="h-6 w-6 text-amber-400" />,
      title: "Change Priority",
      desc: `Select a new priority for ${target}.`,
      confirmLabel: "Change Priority",
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Priority —</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      ),
    },
    "priority-bulk": {
      icon: <Zap className="h-6 w-6 text-amber-400" />,
      title: `Change Priority for ${count} Tasks`,
      desc: `Select a new priority to apply to ${target}.`,
      confirmLabel: `Update ${count} Tasks`,
      input: (
        <select value={selectValue} onChange={e => setSelectValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 mt-3">
          <option value="">— Select Priority —</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      ),
    },
  };

  const cfg = configs[dialog.type];
  const needsSelect = !!cfg.input;
  const canConfirm = !needsSelect || !!selectValue;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#080d19] shadow-2xl p-6 animate-dialog-in outline-none"
      >
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border ${isDestructive ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"}`}>
          {cfg.icon}
        </div>

        <h3 className="text-center text-lg font-extrabold text-white mb-2">{cfg.title}</h3>
        <p className="text-center text-sm text-gray-400 leading-relaxed">{cfg.desc}</p>

        {cfg.input && <div className="mt-1">{cfg.input}</div>}

        {isDestructive && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/5 border border-red-500/15 p-3">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-medium leading-snug">This action is permanent and cannot be reversed.</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(needsSelect ? { value: selectValue } : undefined)}
            disabled={!canConfirm || loading}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2
              ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

interface ActionMenuProps {
  task: EnterpriseTask;
  onAction: (type: DialogType, task: EnterpriseTask) => void;
}

function RowActionMenu({ task, onAction }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = [
    { label: "View Details", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); router.push(`/tasks/${task.id}`); } },
    { label: "Edit", icon: <Edit3 className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("edit-single", task); }, divider: true },
    { label: "Duplicate", icon: <Copy className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("duplicate-single", task); } },
    { label: "Assign Employee", icon: <User className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("assign-single", task); }, divider: true },
    { label: "Change Status", icon: <Tag className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("status-single", task); } },
    { label: "Change Priority", icon: <Zap className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("priority-single", task); }, divider: true },
    { label: "Archive", icon: <Archive className="h-3.5 w-3.5" />, onClick: () => { setOpen(false); onAction("archive-single", task); } },
    { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5 text-red-400" />, onClick: () => { setOpen(false); onAction("delete-single", task); }, danger: true },
  ];

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/10 bg-[#080d19] shadow-2xl z-50 py-1.5 animate-menu-in">
          {actions.map((a, i) => (
            <div key={i}>
              {a.divider && i > 0 && <div className="my-1 h-px bg-white/6" />}
              <button
                onClick={a.onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold transition-colors
                  ${a.danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
              >
                {a.icon}
                {a.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function TasksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: isTasksLoading, isError, refetch } = useTasks();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();

  // ── Filter States ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [kpiFilter, setKpiFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [completionStateFilter, setCompletionStateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState("");

  // ── UI State ───────────────────────────────────────────────────────────────
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState<Array<{ key: keyof EnterpriseTask; direction: "asc" | "desc" }>>([
    { key: "dueDate", direction: "asc" },
  ]);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "id",              label: "Task ID",         visible: true,  width: 90 },
    { key: "taskName",        label: "Task Title",      visible: true,  width: 220 },
    { key: "description",     label: "Description",     visible: true,  width: 200 },
    { key: "assignedTo",      label: "Employee",        visible: true,  width: 140 },
    { key: "department",      label: "Department",      visible: true,  width: 130 },
    { key: "team",            label: "Team",            visible: true,  width: 110 },
    { key: "kpiName",         label: "Related KPI",     visible: true,  width: 150 },
    { key: "priority",        label: "Priority",        visible: true,  width: 90 },
    { key: "status",          label: "Status",          visible: true,  width: 120 },
    { key: "progress",        label: "Progress",        visible: true,  width: 120 },
    { key: "startDate",       label: "Start Date",      visible: false, width: 110 },
    { key: "dueDate",         label: "Due Date",        visible: true,  width: 110 },
    { key: "completionDate",  label: "Completion Date", visible: false, width: 110 },
    { key: "estimatedHours",  label: "Est. Hours",      visible: false, width: 90 },
    { key: "actualHours",     label: "Act. Hours",      visible: false, width: 90 },
    { key: "impactLevel",     label: "Impact",          visible: true,  width: 90 },
    { key: "createdBy",       label: "Created By",      visible: false, width: 120 },
    { key: "lastUpdated",     label: "Last Updated",    visible: false, width: 120 },
    { key: "syncStatus",      label: "Sync Status",     visible: true,  width: 100 },
    { key: "actions",         label: "Actions",         visible: true,  width: 60 },
  ]);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showFiltersGrid, setShowFiltersGrid] = useState(false);

  // ── Action state ───────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [actionTask, setActionTask] = useState<EnterpriseTask | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { text, type, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams) {
      setSearchQuery(searchParams.get("q") || "");
      setDeptFilter(searchParams.get("department") || "");
      setTeamFilter(searchParams.get("team") || "");
      setEmpFilter(searchParams.get("employee") || "");
      setKpiFilter(searchParams.get("kpi") || "");
      setPriorityFilter(searchParams.get("priority") || "");
      setStatusFilter(searchParams.get("status") || "");
      setProgressFilter(searchParams.get("progress") || "");
      setStartDateFilter(searchParams.get("startDate") || "");
      setEndDateFilter(searchParams.get("endDate") || "");
      setCompletionStateFilter(searchParams.get("completionState") || "");
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (deptFilter) params.set("department", deptFilter);
    if (teamFilter) params.set("team", teamFilter);
    if (empFilter) params.set("employee", empFilter);
    if (kpiFilter) params.set("kpi", kpiFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (progressFilter) params.set("progress", progressFilter);
    if (startDateFilter) params.set("startDate", startDateFilter);
    if (endDateFilter) params.set("endDate", endDateFilter);
    if (completionStateFilter) params.set("completionState", completionStateFilter);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchQuery, deptFilter, teamFilter, empFilter, kpiFilter, priorityFilter, statusFilter, progressFilter, startDateFilter, endDateFilter, completionStateFilter, router, pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("tasks_filter_presets");
    if (saved) { try { setSavedPresets(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [tasks]);

  // ── Compute tasks ──────────────────────────────────────────────────────────
  const computedTasks = useMemo((): EnterpriseTask[] => {
    return tasks.map((task) => {
      const taskAny = task as any;
      const emp = employees.find((e) => e.name.toLowerCase() === task.assignedTo?.toLowerCase());
      const relatedKpi = kpis.find((k) => k.id === task.kpiId);
      const progress = taskAny.progress !== undefined ? taskAny.progress : (task.status === "completed" ? 100 : task.status === "in-progress" ? 50 : 0);
      let impactLevel = "Low";
      if (task.priority === "critical") impactLevel = "High";
      else if (task.priority === "high") impactLevel = "Medium";
      return {
        ...task,
        department: emp?.department || "—",
        team: emp?.team || "—",
        progress,
        startDate: taskAny.startDate || task.createdAt || "—",
        completionDate: task.completedAt || "—",
        estimatedHours: taskAny.estimatedHours || 0,
        actualHours: taskAny.actualHours || 0,
        impactLevel,
        createdBy: taskAny.createdBy || "System",
        syncStatus: "Synced" as const,
        kpiName: relatedKpi?.kpiName || "—",
      };
    });
  }, [tasks, employees, kpis]);

  const uniqueDepts = useMemo(() => Array.from(new Set(computedTasks.map(t => t.department).filter(v => v && v !== "—"))), [computedTasks]);
  const uniqueTeams = useMemo(() => Array.from(new Set(computedTasks.map(t => t.team).filter(v => v && v !== "—"))), [computedTasks]);
  const uniqueStaff = useMemo(() => Array.from(new Set(computedTasks.map(t => t.assignedTo).filter(Boolean))), [computedTasks]);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return computedTasks.filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || task.taskName?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q) || task.id?.toLowerCase().includes(q) || task.assignedTo?.toLowerCase().includes(q);
      const matchesDept = !deptFilter || task.department.toLowerCase() === deptFilter.toLowerCase();
      const matchesTeam = !teamFilter || task.team.toLowerCase() === teamFilter.toLowerCase();
      const matchesEmp = !empFilter || task.assignedTo.toLowerCase() === empFilter.toLowerCase();
      const matchesKPI = !kpiFilter || task.kpiId === kpiFilter;
      const matchesPriority = !priorityFilter || task.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesStatus = !statusFilter || task.status.toLowerCase() === statusFilter.toLowerCase();
      let matchesProgress = true;
      if (progressFilter === "completed") matchesProgress = task.progress === 100;
      else if (progressFilter === "in-progress") matchesProgress = task.progress > 0 && task.progress < 100;
      else if (progressFilter === "not-started") matchesProgress = task.progress === 0;
      let matchesCompletionState = true;
      if (completionStateFilter === "completed") matchesCompletionState = task.status === "completed";
      else if (completionStateFilter === "incomplete") matchesCompletionState = task.status !== "completed";
      let matchesDate = true;
      if (startDateFilter || endDateFilter) {
        const taskDate = new Date(task.dueDate).getTime();
        if (startDateFilter && taskDate < new Date(startDateFilter).getTime()) matchesDate = false;
        if (endDateFilter && taskDate > new Date(endDateFilter).getTime()) matchesDate = false;
      }
      return matchesSearch && matchesDept && matchesTeam && matchesEmp && matchesKPI && matchesPriority && matchesStatus && matchesProgress && matchesCompletionState && matchesDate;
    });
  }, [computedTasks, searchQuery, deptFilter, teamFilter, empFilter, kpiFilter, priorityFilter, statusFilter, progressFilter, startDateFilter, endDateFilter, completionStateFilter]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] as any;
        let valB = b[sort.key] as any;
        if (typeof valA === "string") {
          const cmp = valA.localeCompare(valB as string);
          if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
        } else {
          const diff = (Number(valA) || 0) - (Number(valB) || 0);
          if (diff !== 0) return sort.direction === "asc" ? diff : -diff;
        }
      }
      return 0;
    });
    return sorted;
  }, [filteredTasks, sortConfig]);

  const totalRecords = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedTasks = useMemo(() => sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sortedTasks, currentPage]);

  const isAllVisibleSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedIds.includes(t.id));

  // ── Action handlers ────────────────────────────────────────────────────────
  const openDialog = useCallback((type: DialogType, task?: EnterpriseTask) => {
    setActionTask(task || null);
    setDialog({ type, taskId: task?.id, taskName: task?.taskName });
  }, []);

  const invalidateAndRefetch = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await refetch();
  }, [queryClient, refetch]);

  const handleConfirm = useCallback(async (extra?: { value?: string }) => {
    if (!dialog) return;
    setActionLoading(true);

    try {
      const isBulk = dialog.type.includes("bulk");
      const ids = isBulk ? selectedIds : (dialog.taskId ? [dialog.taskId] : []);

      if (dialog.type === "delete-single" && dialog.taskId) {
        await deleteTask(dialog.taskId);
        addToast(`Task "${dialog.taskName}" deleted from Airtable`, "success");

      } else if (dialog.type === "delete-bulk") {
        const res = await bulkOp("delete", ids);
        addToast(res.message || `Deleted ${ids.length} tasks`, "success");

      } else if (dialog.type === "archive-single" && dialog.taskId) {
        await patchTask(dialog.taskId, { status: "archived" });
        addToast(`Task "${dialog.taskName}" archived`, "success");

      } else if (dialog.type === "archive-bulk") {
        const res = await bulkOp("archive", ids);
        addToast(res.message || `Archived ${ids.length} tasks`, "success");

      } else if (dialog.type === "edit-single" && dialog.taskId) {
        setDialog(null);
        router.push(`/tasks/${dialog.taskId}`);
        return;

      } else if (dialog.type === "duplicate-single" && actionTask) {
        await createTaskDuplicate(actionTask);
        addToast(`Task "${dialog.taskName}" duplicated in Airtable`, "success");

      } else if (dialog.type === "assign-single" && dialog.taskId && extra?.value) {
        await patchTask(dialog.taskId, { assignedTo: extra.value });
        addToast(`Assigned "${dialog.taskName}" to ${extra.value}`, "success");

      } else if (dialog.type === "assign-bulk" && extra?.value) {
        const res = await bulkOp("assign", ids, extra.value);
        addToast(res.message || `Assigned ${ids.length} tasks to ${extra.value}`, "success");

      } else if (dialog.type === "status-single" && dialog.taskId && extra?.value) {
        await patchTask(dialog.taskId, { status: extra.value });
        addToast(`Status updated for "${dialog.taskName}"`, "success");

      } else if (dialog.type === "status-bulk" && extra?.value) {
        const res = await bulkOp("status", ids, extra.value);
        addToast(res.message || `Updated status for ${ids.length} tasks`, "success");

      } else if (dialog.type === "priority-single" && dialog.taskId && extra?.value) {
        await patchTask(dialog.taskId, { priority: extra.value });
        addToast(`Priority updated for "${dialog.taskName}"`, "success");

      } else if (dialog.type === "priority-bulk" && extra?.value) {
        const res = await bulkOp("priority", ids, extra.value);
        addToast(res.message || `Updated priority for ${ids.length} tasks`, "success");
      }

      await invalidateAndRefetch();
      if (isBulk) setSelectedIds([]);
      setDialog(null);
    } catch (err: any) {
      addToast(err?.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  }, [dialog, selectedIds, actionTask, router, addToast, invalidateAndRefetch]);

  // ── Preset handlers ────────────────────────────────────────────────────────
  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    const name = presetNameInput.trim();
    if (savedPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) { addToast("Preset name already exists!", "error"); return; }
    const updated = [...savedPresets, { name, filters: { deptFilter, teamFilter, empFilter, kpiFilter, priorityFilter, statusFilter, progressFilter, startDateFilter, endDateFilter, completionStateFilter } }];
    setSavedPresets(updated);
    localStorage.setItem("tasks_filter_presets", JSON.stringify(updated));
    setPresetNameInput("");
    addToast(`Preset "${name}" saved`, "success");
  };

  const handleLoadPreset = (preset: any) => {
    const f = preset.filters;
    setDeptFilter(f.deptFilter || ""); setTeamFilter(f.teamFilter || ""); setEmpFilter(f.empFilter || "");
    setKpiFilter(f.kpiFilter || ""); setPriorityFilter(f.priorityFilter || ""); setStatusFilter(f.statusFilter || "");
    setProgressFilter(f.progressFilter || ""); setStartDateFilter(f.startDateFilter || ""); setEndDateFilter(f.endDateFilter || "");
    setCompletionStateFilter(f.completionStateFilter || ""); setShowPresetsMenu(false);
    addToast(`Loaded preset "${preset.name}"`, "info");
  };

  const handleDeletePreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.name !== name);
    setSavedPresets(updated);
    localStorage.setItem("tasks_filter_presets", JSON.stringify(updated));
    addToast(`Deleted preset "${name}"`, "info");
  };

  const handleClearFilters = () => {
    setDeptFilter(""); setTeamFilter(""); setEmpFilter(""); setKpiFilter(""); setPriorityFilter("");
    setStatusFilter(""); setProgressFilter(""); setStartDateFilter(""); setEndDateFilter("");
    setCompletionStateFilter(""); setSearchQuery("");
    addToast("All filters cleared", "info");
  };

  const handleSort = (key: keyof EnterpriseTask, e: React.MouseEvent) => {
    setSortConfig(prev => {
      if (e.shiftKey) {
        const idx = prev.findIndex(s => s.key === key);
        if (idx !== -1) { const u = [...prev]; const dir = u[idx].direction; if (dir === "asc") { u[idx].direction = "desc"; } else { u.splice(idx, 1); } return u; }
        return [...prev, { key, direction: "asc" }];
      }
      const current = prev.find(s => s.key === key);
      if (current) return current.direction === "asc" ? [{ key, direction: "desc" as const }] : [];
      return [{ key, direction: "asc" as const }];
    });
    setCurrentPage(1);
  };

  const handleColumnResize = (idx: number, width: number) => {
    setColumns(prev => { const u = [...prev]; u[idx] = { ...u[idx], width: Math.max(width, 50) }; return u; });
  };

  const toggleSelectRow = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAllVisible = () => {
    const visibleIds = paginatedTasks.map(t => t.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  };
  const toggleColumnVisibility = (key: string) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const hasActiveFilters = !!(deptFilter || teamFilter || empFilter || kpiFilter || priorityFilter || statusFilter || progressFilter || startDateFilter || endDateFilter || completionStateFilter);

  const bulkExportJSON = () => {
    const items = computedTasks.filter(t => selectedIds.includes(t.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `tasks_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setSelectedIds([]);
    addToast("JSON export downloaded", "success");
  };

  const isLoading = isTasksLoading || isEmployeesLoading || isKPIsLoading;

  return (
    <DashboardLayout>
      <PageContainer>

        {/* ── Toast System ── */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* ── Confirmation Dialog ── */}
        <ConfirmDialog
          dialog={dialog}
          employees={employees}
          selectedCount={selectedIds.length}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
          loading={actionLoading}
        />

        {/* ── Page Header ── */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/20 shadow-md">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Tasks</h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              Enterprise Task Management · {computedTasks.length} total tasks · All actions sync to Airtable immediately
            </p>
          </div>
          <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm">
              <Database className="h-3 w-3" />
              <span>Google Sheets Live</span>
            </div>
            {lastSynced && <span className="text-[10px] text-gray-500 font-mono">Synced at {lastSynced}</span>}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="glass-card p-4 mb-4 border border-white/10 shadow-lg bg-[#080d19]/80 backdrop-blur-xl relative z-40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search title, description, assignee…"
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 self-end md:self-auto flex-wrap gap-2">
              {/* Presets */}
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                  className="border-white/10 text-white cursor-pointer bg-white/5 flex items-center space-x-1.5">
                  <Bookmark className="h-4 w-4" /><span>Presets</span><ChevronDown className="h-3 w-3" />
                </Button>
                {showPresetsMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 rounded-lg border border-white/10 bg-[#080d19] shadow-2xl z-50 p-3 space-y-2.5">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase block">Saved Presets</span>
                    {savedPresets.length === 0 ? (
                      <span className="text-xs text-gray-500 block px-1">No presets saved yet.</span>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {savedPresets.map(preset => (
                          <div key={preset.name} onClick={() => handleLoadPreset(preset)}
                            className="flex justify-between items-center p-2 rounded hover:bg-white/5 cursor-pointer text-xs font-semibold text-gray-300">
                            <span className="truncate max-w-[150px]">{preset.name}</span>
                            <button onClick={e => handleDeletePreset(preset.name, e)} className="text-gray-500 hover:text-red-400 p-0.5">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-white/5 pt-2 flex items-center space-x-1">
                      <input type="text" value={presetNameInput} onChange={e => setPresetNameInput(e.target.value)}
                        placeholder="Preset Name…"
                        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none" />
                      <Button size="sm" onClick={handleSavePreset} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1 px-2.5 h-7 rounded">Save</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <Button variant="outline" size="sm" onClick={() => setShowFiltersGrid(!showFiltersGrid)}
                className={`border-white/10 text-white cursor-pointer bg-white/5 flex items-center space-x-1.5 ${showFiltersGrid ? "border-blue-500/50 bg-blue-500/5" : ""}`}>
                <Filter className="h-4 w-4" /><span>Filters</span>
              </Button>

              {/* Columns */}
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                  className="border-white/10 text-white cursor-pointer bg-white/5 flex items-center space-x-1.5">
                  <SlidersHorizontal className="h-4 w-4" /><span>Columns</span><ChevronDown className="h-3 w-3" />
                </Button>
                {showVisibilityMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 max-h-[300px] overflow-y-auto rounded-lg border border-white/10 bg-[#080d19] shadow-2xl z-50 p-2.5 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase px-2 py-1 block">Toggle Columns</span>
                    {columns.filter(c => c.key !== "actions").map(col => (
                      <label key={col.key} className="flex items-center space-x-2.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-xs font-semibold text-gray-300">
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumnVisibility(col.key as string)}
                          className="rounded border-white/10 text-blue-600 bg-white/5 cursor-pointer" />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => refetch()}
                className="border-white/10 text-white cursor-pointer bg-white/5 flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" /><span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Filters Grid */}
          {showFiltersGrid && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5 border-t border-white/5 mt-4 pt-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Department</span>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Departments</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Team</span>
                <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Teams</option>
                  {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Employee</span>
                <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All Employees</option>
                  {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">KPI Link</span>
                <select value={kpiFilter} onChange={e => setKpiFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All KPIs</option>
                  {kpis.map(k => <option key={k.id} value={k.id}>{k.kpiName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Priority</span>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All</option>
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Status</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All</option>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Progress</span>
                <select value={progressFilter} onChange={e => setProgressFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All</option>
                  <option value="completed">100%</option><option value="in-progress">1–99%</option><option value="not-started">0%</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Completion</span>
                <select value={completionStateFilter} onChange={e => setCompletionStateFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none">
                  <option value="">All</option><option value="completed">Completed</option><option value="incomplete">Incomplete</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Due From</span>
                <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-bold">Due To</span>
                <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-white focus:outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* ── Active Filter Chips ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-in">
            <span className="text-[10px] text-gray-500 font-extrabold uppercase px-1">Active:</span>
            {[
              [deptFilter, "Dept", () => setDeptFilter("")],
              [teamFilter, "Team", () => setTeamFilter("")],
              [empFilter, "Staff", () => setEmpFilter("")],
              [kpiFilter, "KPI", () => setKpiFilter("")],
              [priorityFilter, "Priority", () => setPriorityFilter("")],
              [statusFilter, "Status", () => setStatusFilter("")],
              [progressFilter, "Progress", () => setProgressFilter("")],
              [completionStateFilter, "State", () => setCompletionStateFilter("")],
              [startDateFilter, "From", () => setStartDateFilter("")],
              [endDateFilter, "To", () => setEndDateFilter("")],
            ].filter(([v]) => v).map(([val, label, clear], i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-xs font-semibold">
                {label as string}: {val as string}
                <button onClick={clear as any}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <Button variant="outline" size="sm" onClick={handleClearFilters}
              className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 py-0.5 px-2 h-6 text-[10px] font-bold cursor-pointer rounded">
              Clear All
            </Button>
          </div>
        )}

        {/* ── Bulk Action Bar ── */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl shadow-xl animate-fade-in">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{selectedIds.length}</span>
              <span className="text-xs font-bold text-white">tasks selected</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => openDialog("status-bulk")}
                className="border-white/10 text-white bg-white/5 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Tag className="h-3.5 w-3.5 text-blue-400" /> Set Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDialog("priority-bulk")}
                className="border-white/10 text-white bg-white/5 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Set Priority
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDialog("assign-bulk")}
                className="border-white/10 text-white bg-white/5 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Users className="h-3.5 w-3.5 text-violet-400" /> Assign
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDialog("archive-bulk")}
                className="border-white/10 text-white bg-white/5 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Archive className="h-3.5 w-3.5 text-zinc-400" /> Archive
              </Button>
              <Button variant="outline" size="sm" onClick={bulkExportJSON}
                className="border-white/10 text-white bg-white/5 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Download className="h-3.5 w-3.5 text-yellow-400" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDialog("delete-bulk")}
                className="border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/15 flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {paginatedTasks.length === 0 && !isLoading ? (
          <div className="glass-card p-16 text-center border border-white/10 bg-[#080d19]/80 backdrop-blur-xl">
            <CheckSquare className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Tasks Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl relative z-10">
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                    <tr className="divide-x divide-white/5">
                      <th className="px-4 py-3.5 text-center min-w-[50px] w-[50px]">
                        <input type="checkbox" checked={isAllVisibleSelected} onChange={toggleSelectAllVisible}
                          className="rounded border-white/10 text-blue-600 bg-white/5 cursor-pointer" />
                      </th>
                      {columns.filter(c => c.visible).map((col, idx) => (
                        <th key={col.key} style={{ minWidth: col.width, width: col.width }}
                          className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider relative group">
                          {col.key === "actions" ? (
                            <span className="text-gray-600">Actions</span>
                          ) : (
                            <div onClick={(e) => col.key !== "select" && handleSort(col.key as keyof EnterpriseTask, e)}
                              className="flex items-center space-x-1.5 cursor-pointer hover:text-white transition-colors">
                              <span>{col.label}</span>
                              <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
                            </div>
                          )}
                          <div
                            onMouseDown={(e) => {
                              const startX = e.pageX; const startWidth = col.width;
                              const onMouseMove = (me: MouseEvent) => handleColumnResize(idx, startWidth + (me.pageX - startX));
                              const onMouseUp = () => { document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp); };
                              document.addEventListener("mousemove", onMouseMove); document.addEventListener("mouseup", onMouseUp);
                            }}
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-white/0 hover:bg-blue-500/50 group-hover:bg-white/5 z-30"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={columns.filter(c => c.visible).length + 1} className="px-4 py-3">
                              <div className="h-4 bg-white/5 rounded w-full" />
                            </td>
                          </tr>
                        ))
                      : paginatedTasks.map((task) => (
                          <tr key={task.id}
                            onClick={(e) => { if ((e.target as HTMLElement).closest("button, input, select")) return; router.push(`/tasks/${task.id}`); }}
                            className={`divide-x divide-white/5 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer ${selectedIds.includes(task.id) ? "bg-blue-500/5" : ""}`}
                          >
                            <td className="px-4 py-3 text-center align-middle">
                              <input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => toggleSelectRow(task.id)}
                                className="rounded border-white/10 text-blue-600 bg-white/5 cursor-pointer" />
                            </td>

                            {columns.find(c => c.key === "id")?.visible && (
                              <td className="px-4 py-3 text-xs font-mono font-bold text-blue-400 align-middle">{task.id.slice(0, 8).toUpperCase()}</td>
                            )}
                            {columns.find(c => c.key === "taskName")?.visible && (
                              <td className="px-4 py-3 text-sm font-extrabold text-white align-middle">{task.taskName}</td>
                            )}
                            {columns.find(c => c.key === "description")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle truncate max-w-[200px]" title={task.description}>{task.description}</td>
                            )}
                            {columns.find(c => c.key === "assignedTo")?.visible && (
                              <td className="px-4 py-3 text-sm font-bold text-white align-middle">{task.assignedTo}</td>
                            )}
                            {columns.find(c => c.key === "department")?.visible && (
                              <td className="px-4 py-3 text-xs font-medium align-middle text-gray-300">{task.department}</td>
                            )}
                            {columns.find(c => c.key === "team")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-300 align-middle">{task.team}</td>
                            )}
                            {columns.find(c => c.key === "kpiName")?.visible && (
                              <td className="px-4 py-3 text-xs text-blue-400 font-semibold align-middle truncate max-w-[150px]" title={task.kpiName}>{task.kpiName}</td>
                            )}
                            {columns.find(c => c.key === "priority")?.visible && (
                              <td className="px-4 py-3 text-sm align-middle">
                                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold border ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.low}`}>{task.priority}</span>
                              </td>
                            )}
                            {columns.find(c => c.key === "status")?.visible && (
                              <td className="px-4 py-3 text-sm align-middle">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[task.status] || STATUS_STYLE["not-started"]}`}>
                                  {STATUS_LABEL[task.status] || task.status}
                                </span>
                              </td>
                            )}
                            {columns.find(c => c.key === "progress")?.visible && (
                              <td className="px-4 py-3 text-xs align-middle">
                                <div className="flex items-center space-x-2">
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full bg-blue-500" style={{ width: `${task.progress}%` }} />
                                  </div>
                                  <span className="text-[10px] text-white font-bold">{task.progress}%</span>
                                </div>
                              </td>
                            )}
                            {columns.find(c => c.key === "startDate")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle">{task.startDate}</td>
                            )}
                            {columns.find(c => c.key === "dueDate")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle">
                                {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                            )}
                            {columns.find(c => c.key === "completionDate")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle">{task.completionDate}</td>
                            )}
                            {columns.find(c => c.key === "estimatedHours")?.visible && (
                              <td className="px-4 py-3 text-xs text-center font-bold text-white align-middle">{task.estimatedHours} hrs</td>
                            )}
                            {columns.find(c => c.key === "actualHours")?.visible && (
                              <td className="px-4 py-3 text-xs text-center font-bold text-white align-middle">{task.actualHours} hrs</td>
                            )}
                            {columns.find(c => c.key === "impactLevel")?.visible && (
                              <td className="px-4 py-3 text-xs align-middle font-bold text-white">{task.impactLevel}</td>
                            )}
                            {columns.find(c => c.key === "createdBy")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle">{task.createdBy}</td>
                            )}
                            {columns.find(c => c.key === "lastUpdated")?.visible && (
                              <td className="px-4 py-3 text-xs text-gray-400 align-middle">{task.lastUpdated}</td>
                            )}
                            {columns.find(c => c.key === "syncStatus")?.visible && (
                              <td className="px-4 py-3 text-xs align-middle">
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{task.syncStatus}</span>
                              </td>
                            )}
                            {/* Actions column — always last */}
                            {columns.find(c => c.key === "actions")?.visible && (
                              <td className="px-3 py-3 align-middle text-right">
                                <RowActionMenu task={task} onAction={openDialog} />
                              </td>
                            )}
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-sm text-gray-400">
                <span>
                  Showing <span className="font-semibold text-white">{Math.min((currentPage - 1) * pageSize + 1, totalRecords)}</span>–<span className="font-semibold text-white">{Math.min(currentPage * pageSize, totalRecords)}</span> of{" "}
                  <span className="font-semibold text-white">{totalRecords}</span> tasks
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="border-white/10 text-white cursor-pointer">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pNum => (
                    <Button key={pNum} variant={currentPage === pNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pNum)}
                      className={`h-8 w-8 p-0 cursor-pointer font-bold ${currentPage === pNum ? "bg-blue-600 text-white border-blue-500" : "border-white/10 text-white"}`}>
                      {pNum}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="border-white/10 text-white cursor-pointer">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>

      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.22s ease-out both; }
        @keyframes dialog-in { from { opacity:0; transform:scale(0.95) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-dialog-in { animation: dialog-in 0.24s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes menu-in { from { opacity:0; transform:translateY(-6px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .animate-menu-in { animation: menu-in 0.15s ease-out both; }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out both; }
      `}</style>
    </DashboardLayout>
  );
}

export default function RedesignedTasksPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-white/5" />
              <div className="glass-card h-96 bg-white/5" />
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
