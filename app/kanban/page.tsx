"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTasks, useEmployees, useKPIs } from "@/hooks/useData";
import {
  Kanban,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Archive,
  Eye,
  Ban,
  CalendarDays,
  User,
  BarChart2,
  Building2,
  ChevronDown,
  Layers,
  Sparkles,
  Database,
  GripVertical,
} from "lucide-react";
import type { Task, Employee, KPI } from "@/types/models";

// ─── Types ──────────────────────────────────────────────────────────────────

type KanbanStatus =
  | "not-started"
  | "planned"
  | "in-progress"
  | "blocked"
  | "under-review"
  | "completed"
  | "archived";

interface EnrichedTask extends Task {
  department: string;
  kpiName: string;
  progress: number;
  status: KanbanStatus;
}

interface Column {
  id: KanbanStatus;
  label: string;
  icon: React.ReactNode;
  color: string;        // gradient CSS
  borderColor: string;
  headerBg: string;
  badge: string;
}

// ─── Column Definitions ──────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  {
    id: "not-started",
    label: "Not Started",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "from-slate-500/20 to-slate-600/10",
    borderColor: "border-slate-500/30",
    headerBg: "bg-slate-500/15",
    badge: "bg-slate-500/20 text-slate-300",
  },
  {
    id: "planned",
    label: "Planned",
    icon: <Layers className="h-3.5 w-3.5" />,
    color: "from-violet-500/20 to-violet-600/10",
    borderColor: "border-violet-500/30",
    headerBg: "bg-violet-500/15",
    badge: "bg-violet-500/20 text-violet-300",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    headerBg: "bg-blue-500/15",
    badge: "bg-blue-500/20 text-blue-300",
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: <Ban className="h-3.5 w-3.5" />,
    color: "from-red-500/20 to-red-600/10",
    borderColor: "border-red-500/30",
    headerBg: "bg-red-500/15",
    badge: "bg-red-500/20 text-red-300",
  },
  {
    id: "under-review",
    label: "Under Review",
    icon: <Eye className="h-3.5 w-3.5" />,
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-500/30",
    headerBg: "bg-amber-500/15",
    badge: "bg-amber-500/20 text-amber-300",
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    headerBg: "bg-emerald-500/15",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  {
    id: "archived",
    label: "Archived",
    icon: <Archive className="h-3.5 w-3.5" />,
    color: "from-zinc-500/20 to-zinc-600/10",
    borderColor: "border-zinc-500/30",
    headerBg: "bg-zinc-500/15",
    badge: "bg-zinc-500/20 text-zinc-400",
  },
];

// ─── Priority helpers ─────────────────────────────────────────────────────────

function priorityStyle(priority: string) {
  switch (priority) {
    case "critical":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border border-slate-400/20";
  }
}

function progressColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 60)  return "bg-blue-500";
  if (p >= 30)  return "bg-amber-500";
  return "bg-red-500";
}

function dueDateStyle(dateStr: string) {
  if (!dateStr || dateStr === "—") return "text-gray-500";
  const due = new Date(dateStr).getTime();
  const now = Date.now();
  const diffDays = (due - now) / 86_400_000;
  if (diffDays < 0)  return "text-red-400";
  if (diffDays < 3)  return "text-amber-400";
  return "text-gray-400";
}

// ─── Status Validation ────────────────────────────────────────────────────────

function validateTransition(
  task: EnrichedTask,
  newStatus: KanbanStatus
): string | null {
  if (newStatus === "completed" && task.progress < 100) {
    return `"${task.taskName}" must be 100% complete before moving to Completed (currently ${task.progress}%).`;
  }
  if (newStatus === "archived" && task.status !== "completed") {
    return `Only completed tasks can be archived. Move "${task.taskName}" to Completed first.`;
  }
  return null;
}

// ─── Normalise incoming status ────────────────────────────────────────────────

function normaliseStatus(raw: string): KanbanStatus {
  const map: Record<string, KanbanStatus> = {
    "todo": "not-started",
    "not-started": "not-started",
    "not started": "not-started",
    "planned": "planned",
    "in-progress": "in-progress",
    "in progress": "in-progress",
    "blocked": "blocked",
    "under-review": "under-review",
    "under review": "under-review",
    "completed": "completed",
    "done": "completed",
    "complete": "completed",
    "archived": "archived",
  };
  return map[raw?.toLowerCase()] ?? "not-started";
}

// ─── Individual Task Card ─────────────────────────────────────────────────────

interface CardProps {
  task: EnrichedTask;
  column: Column;
  onDragStart: (task: EnrichedTask) => void;
  isKeyboardGrabbed: boolean;
  onKeyboardGrab: (task: EnrichedTask) => void;
}

function TaskCard({ task, column, onDragStart, isKeyboardGrabbed, onKeyboardGrab }: CardProps) {
  const dueCls = dueDateStyle(task.dueDate);
  const progressCapped = Math.min(100, Math.max(0, task.progress));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onKeyboardGrab(task);
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-grabbed={isKeyboardGrabbed}
      aria-describedby={`task-desc-${task.id}`}
      id={`task-card-${task.id}`}
      className={`group relative rounded-xl border p-3.5 select-none shadow-lg hover:shadow-xl
                 transition-all duration-200 hover:-translate-y-0.5 animate-card-in outline-none
                 ${isKeyboardGrabbed 
                   ? "ring-2 ring-blue-500 border-blue-500/50 bg-[#0d1320]" 
                   : "border-white/8 bg-[#0d1320]/80 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:border-blue-500/30"
                 }`}
      style={{ cursor: isKeyboardGrabbed ? "grabbing" : "grab" }}
    >
      <span id={`task-desc-${task.id}`} className="sr-only">
        Task {task.taskName}. Priority {task.priority}. Status {column.label}. Press Space or Enter to move.
      </span>

      {/* Drag handle hint */}
      <div className="absolute right-2.5 top-3 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Priority + Status row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityStyle(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${column.badge}`}>
          {column.icon}
          {column.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white leading-snug mb-2.5 pr-5 line-clamp-2">
        {task.taskName}
      </h3>

      {/* Meta grid */}
      <div className="space-y-1.5 mb-3">
        {/* Employee */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <User className="h-3 w-3 flex-shrink-0 text-blue-400" />
          <span className="truncate font-medium text-gray-300">{task.assignedTo || "—"}</span>
        </div>

        {/* KPI */}
        {task.kpiName && task.kpiName !== "—" && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <BarChart2 className="h-3 w-3 flex-shrink-0 text-violet-400" />
            <span className="truncate">{task.kpiName}</span>
          </div>
        )}

        {/* Department */}
        {task.department && task.department !== "—" && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Building2 className="h-3 w-3 flex-shrink-0 text-emerald-400" />
            <span className="truncate">{task.department}</span>
          </div>
        )}

        {/* Due Date */}
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${dueCls}`}>
          <CalendarDays className="h-3 w-3 flex-shrink-0" />
          <span>
            {task.dueDate && task.dueDate !== "—"
              ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "No due date"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium">Progress</span>
          <span className="text-[10px] font-bold text-gray-300">{progressCapped}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(progressCapped)}`}
            style={{ width: `${progressCapped}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Column Component ─────────────────────────────────────────────────────────

const CARDS_PER_LOAD = 10;

interface KanbanColumnProps {
  column: Column;
  tasks: EnrichedTask[];
  dragOverId: KanbanStatus | null;
  onDragStart: (task: EnrichedTask) => void;
  onDragOver: (e: React.DragEvent, colId: KanbanStatus) => void;
  onDrop: (colId: KanbanStatus) => void;
  onDragLeave: () => void;
  keyboardGrabbedId: string | null;
  onKeyboardGrab: (task: EnrichedTask) => void;
}

function KanbanColumn({
  column, tasks, dragOverId,
  onDragStart, onDragOver, onDrop, onDragLeave,
  keyboardGrabbedId, onKeyboardGrab,
}: KanbanColumnProps) {
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_LOAD);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOver = dragOverId === column.id;

  // Reset visible count when tasks change (filter / search)
  useEffect(() => {
    setVisibleCount(CARDS_PER_LOAD);
  }, [tasks.length]);

  // Infinite scroll within column
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom && visibleCount < tasks.length) {
      setVisibleCount((prev) => Math.min(prev + CARDS_PER_LOAD, tasks.length));
    }
  }, [visibleCount, tasks.length]);

  const visible = tasks.slice(0, visibleCount);

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.id)}
      onDrop={() => onDrop(column.id)}
      onDragLeave={onDragLeave}
      className={`flex flex-col rounded-2xl border bg-gradient-to-b ${column.color} ${column.borderColor}
                  min-w-[270px] max-w-[270px] transition-all duration-200
                  ${isOver ? "ring-2 ring-white/20 scale-[1.01] shadow-2xl" : ""}`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-3.5 py-3 rounded-t-2xl ${column.headerBg} border-b ${column.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={`flex items-center justify-center h-6 w-6 rounded-lg ${column.badge}`}>
            {column.icon}
          </span>
          <span className="text-sm font-bold text-white">{column.label}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${column.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Drop zone hint */}
      {isOver && (
        <div className="mx-3 mt-3 rounded-xl border-2 border-dashed border-white/25 bg-white/5 py-3 text-center text-[11px] text-gray-400 animate-pulse">
          Drop here
        </div>
      )}

      {/* Cards scroll area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[120px] max-h-[calc(100vh-260px)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {visible.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-3xl mb-2 opacity-20">◻</div>
            <p className="text-[11px] text-gray-600 font-medium">No tasks</p>
          </div>
        ) : (
          visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              column={column}
              onDragStart={onDragStart}
              isKeyboardGrabbed={keyboardGrabbedId === task.id}
              onKeyboardGrab={onKeyboardGrab}
            />
          ))
        )}

        {/* Load more indicator */}
        {visibleCount < tasks.length && (
          <div className="py-2 text-center">
            <span className="text-[10px] text-gray-600 font-medium">
              ↓ Scroll to load more ({tasks.length - visibleCount} remaining)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { text: string; type: "success" | "error" }

function Toast({ msg, onClose }: { msg: ToastMsg; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl
                     animate-slide-up max-w-sm
                     ${msg.type === "success"
                       ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                       : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
      {msg.type === "success"
        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      <span className="text-xs font-semibold leading-snug">{msg.text}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  priority: string;
  onPriority: (v: string) => void;
  department: string;
  onDepartment: (v: string) => void;
  departments: string[];
  employee: string;
  onEmployee: (v: string) => void;
  employees: string[];
  kpiFilter: string;
  onKpi: (v: string) => void;
  kpiNames: { id: string; name: string }[];
  activeCount: number;
  onClear: () => void;
  showPanel: boolean;
  onToggle: () => void;
}

function FilterBar({
  search, onSearch,
  priority, onPriority,
  department, onDepartment, departments,
  employee, onEmployee, employees,
  kpiFilter, onKpi, kpiNames,
  activeCount, onClear,
  showPanel, onToggle,
}: FilterBarProps) {
  return (
    <div className="glass-card border border-white/10 bg-[#080d19]/80 backdrop-blur-xl p-4 mb-5 relative z-40">
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            id="kanban-search"
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks, employees, KPIs…"
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2
                       text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none
                       transition-colors"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          id="kanban-filter-toggle"
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all
                      ${showPanel
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"}`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPanel ? "rotate-180" : ""}`} />
        </button>

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            id="kanban-clear-filters"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2
                       text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showPanel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5 animate-fade-in text-xs">
          {/* Priority */}
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block">Priority</label>
            <select
              id="kanban-filter-priority"
              value={priority}
              onChange={(e) => onPriority(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block">Department</label>
            <select
              id="kanban-filter-department"
              value={department}
              onChange={(e) => onDepartment(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Employee */}
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block">Employee</label>
            <select
              id="kanban-filter-employee"
              value={employee}
              onChange={(e) => onEmployee(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="">All Employees</option>
              {employees.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* KPI */}
          <div className="space-y-1">
            <label className="text-gray-400 font-bold block">KPI</label>
            <select
              id="kanban-filter-kpi"
              value={kpiFilter}
              onChange={(e) => onKpi(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="">All KPIs</option>
              {kpiNames.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}


function KanbanContent() {
  const queryClient = useQueryClient();

  // Data hooks
  const { data: rawTasks = [], isLoading: tasksLoading, isError, refetch } = useTasks();
  const { data: employeeList = [] } = useEmployees();
  const { data: kpiList = [] } = useKPIs();

  // Drag state
  const [dragging, setDragging] = useState<EnrichedTask | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);

  // Keyboard navigation state
  const [keyboardGrabbedTask, setKeyboardGrabbedTask] = useState<EnrichedTask | null>(null);

  // Optimistic local state (tasks map by id)
  const [localStatuses, setLocalStatuses] = useState<Record<string, KanbanStatus>>({});

  // Filters
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterKpi, setFilterKpi] = useState("");

  // Toast
  const [toast, setToast] = useState<ToastMsg | null>(null);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // ── Enrich tasks ─────────────────────────────────────────────────────────
  const enriched = useMemo((): EnrichedTask[] => {
    return rawTasks.map((task) => {
      const taskAny = task as any;
      const emp = employeeList.find(
        (e) => e.name.toLowerCase() === task.assignedTo?.toLowerCase()
      );
      const department = emp?.department || "—";

      const relatedKpi = kpiList.find((k) => k.id === task.kpiId);
      const kpiName = relatedKpi?.kpiName || "—";

      const rawProgress = taskAny.progress;
      const progress =
        rawProgress !== undefined
          ? Number(rawProgress)
          : task.status === "completed"
          ? 100
          : task.status === "in-progress"
          ? 50
          : 0;

      // Apply local status override (optimistic UI)
      const overridden = localStatuses[task.id];
      const status = normaliseStatus(overridden ?? task.status);

      return {
        ...task,
        status,
        department,
        kpiName,
        progress,
      } as EnrichedTask;
    });
  }, [rawTasks, employeeList, kpiList, localStatuses]);

  // ── Filter option lists ───────────────────────────────────────────────────
  const uniqueDepts = useMemo(
    () => [...new Set(enriched.map((t) => t.department).filter((d) => d && d !== "—"))],
    [enriched]
  );
  const uniqueEmployees = useMemo(
    () => [...new Set(enriched.map((t) => t.assignedTo).filter(Boolean))],
    [enriched]
  );
  const kpiOptions = useMemo(
    () => kpiList.map((k) => ({ id: k.id, name: k.kpiName })),
    [kpiList]
  );

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((t) => {
      const matchSearch =
        !q ||
        t.taskName?.toLowerCase().includes(q) ||
        t.assignedTo?.toLowerCase().includes(q) ||
        t.kpiName?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q);

      const matchPriority = !filterPriority || t.priority === filterPriority;
      const matchDept = !filterDept || t.department === filterDept;
      const matchEmp = !filterEmployee || t.assignedTo === filterEmployee;
      const matchKpi = !filterKpi || t.kpiId === filterKpi;

      return matchSearch && matchPriority && matchDept && matchEmp && matchKpi;
    });
  }, [enriched, search, filterPriority, filterDept, filterEmployee, filterKpi]);

  // ── Tasks grouped by column ───────────────────────────────────────────────
  const byColumn = useMemo(() => {
    const map: Record<KanbanStatus, EnrichedTask[]> = {
      "not-started": [],
      "planned": [],
      "in-progress": [],
      "blocked": [],
      "under-review": [],
      "completed": [],
      "archived": [],
    };
    for (const t of filtered) {
      map[t.status].push(t);
    }
    return map;
  }, [filtered]);

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilterCount = [filterPriority, filterDept, filterEmployee, filterKpi].filter(Boolean).length;

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((task: EnrichedTask) => {
    setDragging(task);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colId: KanbanStatus) => {
    e.preventDefault();
    setDragOverCol(colId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  // Common move function
  const executeMove = useCallback(
    async (task: EnrichedTask, targetColId: KanbanStatus) => {
      if (task.status === targetColId) return;

      // Status validation
      const err = validateTransition(task, targetColId);
      if (err) {
        setToast({ text: err, type: "error" });
        return;
      }

      const prevStatus = task.status;

      // Optimistic update
      setLocalStatuses((prev) => ({ ...prev, [task.id]: targetColId }));

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: targetColId,
            ...(targetColId === "completed" ? { completedAt: new Date().toISOString() } : {}),
          }),
        });

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const col = COLUMNS.find((c) => c.id === targetColId);
        setToast({
          text: `"${task.taskName}" moved to ${col?.label ?? targetColId} ✓`,
          type: "success",
        });

        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch (e) {
        // Rollback
        setLocalStatuses((prev) => ({ ...prev, [task.id]: prevStatus }));
        setToast({
          text: `Failed to update "${task.taskName}". Please try again.`,
          type: "error",
        });
      }
    },
    [queryClient]
  );

  const handleDrop = useCallback(
    (targetColId: KanbanStatus) => {
      setDragOverCol(null);
      if (!dragging) return;
      executeMove(dragging, targetColId);
      setDragging(null);
    },
    [dragging, executeMove]
  );

  // ── Keyboard grab-and-drop mechanics ──────────────────────────────────────
  const handleKeyboardGrab = useCallback((task: EnrichedTask) => {
    setKeyboardGrabbedTask(task);
    setToast({ text: `Grabbed "${task.taskName}". Use Left/Right Arrow keys to move column, Enter to drop, Escape to cancel.`, type: "success" });
  }, []);

  useEffect(() => {
    if (!keyboardGrabbedTask) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const colOrder: KanbanStatus[] = ["not-started", "planned", "in-progress", "blocked", "under-review", "completed", "archived"];
      const currentIndex = colOrder.indexOf(keyboardGrabbedTask.status);

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, colOrder.length - 1);
        if (nextIndex !== currentIndex) {
          const updatedTask = { ...keyboardGrabbedTask, status: colOrder[nextIndex] };
          setKeyboardGrabbedTask(updatedTask);
          setLocalStatuses(prev => ({ ...prev, [keyboardGrabbedTask.id]: colOrder[nextIndex] }));
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
          const updatedTask = { ...keyboardGrabbedTask, status: colOrder[prevIndex] };
          setKeyboardGrabbedTask(updatedTask);
          setLocalStatuses(prev => ({ ...prev, [keyboardGrabbedTask.id]: colOrder[prevIndex] }));
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeMove(keyboardGrabbedTask, keyboardGrabbedTask.status);
        setKeyboardGrabbedTask(null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        // Reset status to raw status
        const originalStatus = rawTasks.find(t => t.id === keyboardGrabbedTask.id)?.status;
        if (originalStatus) {
          setLocalStatuses(prev => {
            const copy = { ...prev };
            delete copy[keyboardGrabbedTask.id];
            return copy;
          });
        }
        setKeyboardGrabbedTask(null);
        setToast({ text: "Keyboard move cancelled", type: "error" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [keyboardGrabbedTask, executeMove, rawTasks]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await refetch();
    setRefreshing(false);
  }, [refetch, queryClient]);

  // ── Clear all filters ─────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterPriority("");
    setFilterDept("");
    setFilterEmployee("");
    setFilterKpi("");
  }, []);

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (tasksLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading Kanban board…</p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
              <p className="text-sm text-gray-300 font-medium">Failed to load tasks from Airtable.</p>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 mx-auto rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Keyboard instructions banner */}
        {keyboardGrabbedTask && (
          <div className="mb-4 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 flex items-center justify-between text-xs text-blue-300 font-bold animate-slide-up">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              <span>Moving task: "{keyboardGrabbedTask.taskName}". Press Left/Right Arrow to select column, Enter to Drop, Esc to Cancel.</span>
            </span>
            <button onClick={() => {
              setLocalStatuses(prev => { const c = { ...prev }; delete c[keyboardGrabbedTask.id]; return c; });
              setKeyboardGrabbedTask(null);
            }} className="text-blue-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <Kanban className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Kanban Board</h1>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {filtered.length} task{filtered.length !== 1 ? "s" : ""} across {COLUMNS.length} columns · Tab + Space/Enter to Grab & Move · Drag to move
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <Database className="h-3 w-3" />
              Airtable Live
            </div>
            <button
              id="kanban-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2
                         text-sm font-medium text-gray-300 hover:text-white hover:border-white/20
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Column stats strip ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`flex items-center gap-1.5 rounded-lg border ${col.borderColor} px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap flex-shrink-0 ${col.badge}`}
            >
              {col.icon}
              <span>{col.label}</span>
              <span className="opacity-70">({byColumn[col.id].length})</span>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <FilterBar
          search={search}
          onSearch={(v) => { setSearch(v); }}
          priority={filterPriority}
          onPriority={setFilterPriority}
          department={filterDept}
          onDepartment={setFilterDept}
          departments={uniqueDepts}
          employee={filterEmployee}
          onEmployee={setFilterEmployee}
          employees={uniqueEmployees}
          kpiFilter={filterKpi}
          onKpi={setFilterKpi}
          kpiNames={kpiOptions}
          activeCount={activeFilterCount}
          onClear={clearFilters}
          showPanel={showFilters}
          onToggle={() => setShowFilters((p) => !p)}
        />

        {/* ── Board ── */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={byColumn[col.id]}
              dragOverId={dragOverCol}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
              keyboardGrabbedId={keyboardGrabbedTask ? keyboardGrabbedTask.id : null}
              onKeyboardGrab={handleKeyboardGrab}
            />
          ))}
        </div>

        {/* ── Toast ── */}
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </PageContainer>
    </DashboardLayout>
  );
}

// ─── Keyframe styles injected via <style> ─────────────────────────────────────

const kanbanStyles = `
  @keyframes card-in {
    from { opacity: 0; transform: translateY(6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  .animate-card-in {
    animation: card-in 0.2s ease-out both;
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.25s ease-out both;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out both;
  }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
`;

export default function KanbanPage() {
  return (
    <>
      <style>{kanbanStyles}</style>
      <Suspense
        fallback={
          <DashboardLayout>
            <PageContainer>
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              </div>
            </PageContainer>
          </DashboardLayout>
        }
      >
        <KanbanContent />
      </Suspense>
    </>
  );
}
