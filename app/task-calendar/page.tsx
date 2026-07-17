"use client";

import {
  useState, useMemo, useCallback, useEffect, useRef, Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTasks, useEmployees, useKPIs } from "@/hooks/useData";
import {
  CalendarDays, ChevronLeft, ChevronRight, Search, Filter,
  X, RefreshCw, Database, User, BarChart2, Building2,
  Clock, AlertCircle, CheckCircle2, Ban, Layers, Zap,
  Eye, Archive, ChevronDown, List, CalendarRange,
} from "lucide-react";
import type { Task, Employee, KPI } from "@/types/models";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type CalView = "month" | "week" | "day" | "agenda";

// ─── Color helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; border: string; text: string; icon: React.ReactNode }> = {
  "not-started":  { label: "Not Started",   dot: "#6B7280", bg: "bg-slate-500/15",   border: "border-slate-500/30",   text: "text-slate-300",   icon: <Clock className="h-3 w-3" /> },
  "todo":         { label: "Not Started",   dot: "#6B7280", bg: "bg-slate-500/15",   border: "border-slate-500/30",   text: "text-slate-300",   icon: <Clock className="h-3 w-3" /> },
  "planned":      { label: "Planned",       dot: "#8B5CF6", bg: "bg-violet-500/15",  border: "border-violet-500/30",  text: "text-violet-300",  icon: <Layers className="h-3 w-3" /> },
  "in-progress":  { label: "In Progress",   dot: "#3B82F6", bg: "bg-blue-500/15",    border: "border-blue-500/30",    text: "text-blue-300",    icon: <Zap className="h-3 w-3" /> },
  "blocked":      { label: "Blocked",       dot: "#EF4444", bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-300",     icon: <Ban className="h-3 w-3" /> },
  "under-review": { label: "Under Review",  dot: "#F59E0B", bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-300",   icon: <Eye className="h-3 w-3" /> },
  "completed":    { label: "Completed",     dot: "#10B981", bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> },
  "archived":     { label: "Archived",      dot: "#374151", bg: "bg-zinc-500/15",    border: "border-zinc-500/30",    text: "text-zinc-400",    icon: <Archive className="h-3 w-3" /> },
};

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  high:     { color: "#F97316", bg: "rgba(249,115,22,0.15)" },
  medium:   { color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  low:      { color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
};

function normaliseStatus(raw: string = ""): string {
  const m: Record<string, string> = {
    "todo": "not-started", "not-started": "not-started", "planned": "planned",
    "in-progress": "in-progress", "blocked": "blocked",
    "under-review": "under-review", "completed": "completed", "archived": "archived",
  };
  return m[raw.toLowerCase()] ?? "not-started";
}

function progressFromTask(task: Task): number {
  const t = task as any;
  if (t.progress !== undefined) return Math.min(100, Math.max(0, Number(t.progress)));
  const s = normaliseStatus(task.status);
  if (s === "completed") return 100;
  if (s === "in-progress") return 50;
  return 0;
}

function isOverdue(task: Task): boolean {
  const done = ["completed", "archived"];
  if (done.includes(normaliseStatus(task.status))) return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("en-US", opts);
}

// ─── Enriched task type ────────────────────────────────────────────────────────
interface RichTask extends Task {
  department: string;
  kpiName: string;
  progress: number;
  startDate: Date | null;
  dueDate_d: Date | null;
  statusKey: string;
  overdue: boolean;
}

// ─── Task Chip (calendar event pill) ─────────────────────────────────────────
function TaskChip({ task, onClick, compact = false }: { task: RichTask; onClick: () => void; compact?: boolean }) {
  const meta = STATUS_META[task.statusKey] || STATUS_META["not-started"];
  const prio = PRIORITY_META[task.priority] || PRIORITY_META.low;
  const overdue = task.overdue;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`group w-full text-left rounded-md px-1.5 py-1 border transition-all duration-150
                  hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
                  ${meta.bg} ${meta.border} animate-chip-in`}
      style={{ borderLeftColor: overdue ? "#EF4444" : prio.color, borderLeftWidth: 3 }}
    >
      <div className={`flex items-center gap-1 ${compact ? "" : "mb-0.5"}`}>
        <span className={`flex-shrink-0 ${meta.text}`}>{meta.icon}</span>
        <span className={`font-semibold truncate leading-tight ${compact ? "text-[10px]" : "text-[11px]"} text-white`}>
          {task.taskName}
        </span>
      </div>
      {!compact && task.assignedTo && (
        <div className="flex items-center gap-1 text-[9px] text-gray-400 truncate pl-4">
          <User className="h-2.5 w-2.5 flex-shrink-0" />
          {task.assignedTo}
        </div>
      )}
    </button>
  );
}

// ─── Task Preview Card (hover/click tooltip) ──────────────────────────────────
function TaskPreview({ task, onNavigate, onClose }: { task: RichTask; onNavigate: (id: string) => void; onClose: () => void }) {
  const meta = STATUS_META[task.statusKey] || STATUS_META["not-started"];
  const prio = PRIORITY_META[task.priority] || PRIORITY_META.low;
  const progress = task.progress;

  return (
    <div className="w-72 rounded-xl border border-white/10 bg-[#080d19] shadow-2xl backdrop-blur-xl p-4 space-y-3 animate-preview-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white leading-snug line-clamp-2">{task.taskName}</p>
        </div>
        <button onClick={onClose} className="flex-shrink-0 text-gray-600 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.text} border ${meta.border}`}
        >
          {meta.icon} {meta.label}
        </span>
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.color}40` }}
        >
          {task.priority}
        </span>
        {task.overdue && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-[11px]">
        {task.assignedTo && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <User className="h-3 w-3 text-blue-400 flex-shrink-0" />
            <span className="truncate">{task.assignedTo}</span>
            {task.department !== "—" && <span className="text-gray-600">· {task.department}</span>}
          </div>
        )}
        {task.kpiName !== "—" && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <BarChart2 className="h-3 w-3 text-violet-400 flex-shrink-0" />
            <span className="truncate">{task.kpiName}</span>
          </div>
        )}
        {task.dueDate_d && (
          <div className={`flex items-center gap-1.5 font-medium ${task.overdue ? "text-red-400" : "text-gray-400"}`}>
            <CalendarDays className="h-3 w-3 flex-shrink-0" />
            <span>Due {fmtDate(task.dueDate_d, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        )}
        {task.startDate && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <CalendarRange className="h-3 w-3 flex-shrink-0 text-emerald-400" />
            <span>Start {fmtDate(task.startDate, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Progress</span>
          <span className="text-gray-300 font-bold">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: progress === 100 ? "#10B981" : progress >= 60 ? "#3B82F6" : progress >= 30 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate(task.id)}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-1.5 text-[11px] font-bold text-white transition-colors"
      >
        View Full Details →
      </button>
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({
  year, month, tasks, onTaskClick, today,
}: {
  year: number; month: number; tasks: RichTask[];
  onTaskClick: (task: RichTask) => void; today: Date;
}) {
  const MAX_VISIBLE = 3;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const tasksByDate = useMemo(() => {
    const map: Record<string, RichTask[]> = {};
    tasks.forEach(t => {
      [t.dueDate_d, t.startDate].forEach(d => {
        if (!d) return;
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = d.getDate().toString();
          if (!map[key]) map[key] = [];
          if (!map[key].some(x => x.id === t.id)) map[key].push(t);
        }
      });
    });
    return map;
  }, [tasks, year, month]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/8">
        {DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${totalCells / 7}, 1fr)` }}>
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - firstDay + 1;
          const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const cellDate = new Date(year, month, dayNum);
          const isToday = isCurrentMonth && sameDay(cellDate, today);
          const dayTasks = isCurrentMonth ? (tasksByDate[dayNum.toString()] || []) : [];
          const overflow = dayTasks.length - MAX_VISIBLE;

          return (
            <div
              key={i}
              className={`border-r border-b border-white/6 p-1.5 flex flex-col min-h-[90px]
                          ${!isCurrentMonth ? "bg-white/1" : "hover:bg-white/3 transition-colors"}
                          ${i % 7 === 6 ? "border-r-0" : ""}`}
            >
              {/* Date number */}
              <div className={`self-start mb-1 h-6 w-6 flex items-center justify-center rounded-full text-[11px] font-bold transition-colors
                              ${isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-300" : "text-gray-700"}`}>
                {isCurrentMonth ? dayNum : ""}
              </div>

              {/* Task chips */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, MAX_VISIBLE).map(t => (
                  <TaskChip key={t.id + "-" + dayNum} task={t} compact onClick={() => onTaskClick(t)} />
                ))}
                {overflow > 0 && (
                  <button className="text-[9px] text-blue-400 font-bold pl-1 hover:text-blue-300 transition-colors">
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({
  weekStart, tasks, onTaskClick, today,
}: {
  weekStart: Date; tasks: RichTask[];
  onTaskClick: (task: RichTask) => void; today: Date;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDay = useMemo(() => {
    return days.map(day => {
      return tasks.filter(t => {
        const dd = t.dueDate_d;
        const sd = t.startDate;
        return (dd && sameDay(dd, day)) || (sd && sameDay(sd, day));
      });
    });
  }, [tasks, days]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Headers */}
      <div className="grid grid-cols-7 border-b border-white/8">
        {days.map((day, i) => {
          const isToday = sameDay(day, today);
          return (
            <div key={i} className="py-3 text-center border-r border-white/6 last:border-r-0">
              <div className="text-[10px] font-bold text-gray-500 uppercase">{DAYS_SHORT[day.getDay()]}</div>
              <div className={`mx-auto mt-1 h-7 w-7 flex items-center justify-center rounded-full text-sm font-extrabold
                              ${isToday ? "bg-blue-600 text-white" : "text-gray-300"}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {tasksByDay.map((dayTasks, i) => (
          <div key={i} className="border-r border-white/6 last:border-r-0 p-1.5 space-y-1 min-h-[300px]">
            {dayTasks.length === 0 ? (
              <div className="h-full flex items-start justify-center pt-4">
                <span className="text-[10px] text-gray-700">—</span>
              </div>
            ) : (
              dayTasks.map(t => (
                <TaskChip key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({
  date, tasks, onTaskClick, today,
}: {
  date: Date; tasks: RichTask[];
  onTaskClick: (task: RichTask) => void; today: Date;
}) {
  const dayTasks = useMemo(() => {
    return tasks.filter(t => {
      const dd = t.dueDate_d;
      const sd = t.startDate;
      return (dd && sameDay(dd, date)) || (sd && sameDay(sd, date));
    });
  }, [tasks, date]);

  const isToday = sameDay(date, today);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
      {/* Day header */}
      <div className={`text-center pb-4 border-b border-white/8`}>
        <p className="text-xs font-bold text-gray-500 uppercase">{DAYS_SHORT[date.getDay()]}</p>
        <p className={`text-4xl font-extrabold mt-1 ${isToday ? "text-blue-400" : "text-white"}`}>{date.getDate()}</p>
        <p className="text-sm text-gray-400 mt-0.5">{fmtDate(date, { month: "long", year: "numeric" })}</p>
        {isToday && <span className="inline-block mt-2 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-0.5 text-[10px] font-bold text-blue-400">Today</span>}
      </div>

      {dayTasks.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">No tasks on this day</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] text-gray-500 font-bold uppercase">{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</p>
          {dayTasks.map(t => {
            const meta = STATUS_META[t.statusKey] || STATUS_META["not-started"];
            const prio = PRIORITY_META[t.priority] || PRIORITY_META.low;
            return (
              <button
                key={t.id}
                onClick={() => onTaskClick(t)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg ${meta.bg} ${meta.border} animate-chip-in`}
                style={{ borderLeftColor: prio.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-white leading-snug">{t.taskName}</p>
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.color}40` }}
                  >
                    {t.priority}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                  {t.assignedTo && <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.assignedTo}</span>}
                  {t.department !== "—" && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{t.department}</span>}
                  {t.dueDate_d && <span className={`flex items-center gap-1 ${t.overdue ? "text-red-400 font-bold" : ""}`}><CalendarDays className="h-3 w-3" />Due {fmtDate(t.dueDate_d, { month: "short", day: "numeric" })}</span>}
                </div>
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-300 font-bold">{t.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${t.progress}%`, background: prio.color }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Agenda View ──────────────────────────────────────────────────────────────
function AgendaView({
  tasks, onTaskClick,
}: {
  tasks: RichTask[];
  onTaskClick: (task: RichTask) => void;
}) {
  const grouped = useMemo(() => {
    const sorted = [...tasks]
      .filter(t => t.dueDate_d)
      .sort((a, b) => (a.dueDate_d?.getTime() ?? 0) - (b.dueDate_d?.getTime() ?? 0));

    const map: Record<string, RichTask[]> = {};
    sorted.forEach(t => {
      if (!t.dueDate_d) return;
      const key = fmtDate(t.dueDate_d, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map);
  }, [tasks]);

  if (grouped.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
        <List className="h-10 w-10 text-gray-700" />
        <p className="text-sm text-gray-600 font-medium">No upcoming tasks found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
      {grouped.map(([dateLabel, dayTasks]) => {
        const d = dayTasks[0].dueDate_d!;
        const isToday = sameDay(d, new Date());
        const isPast = d.getTime() < new Date().setHours(0, 0, 0, 0);

        return (
          <div key={dateLabel}>
            {/* Date header */}
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${isToday ? "border-blue-500/30" : "border-white/6"}`}>
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isToday ? "bg-blue-500" : isPast ? "bg-gray-700" : "bg-emerald-500"}`} />
              <p className={`text-xs font-extrabold uppercase tracking-wide ${isToday ? "text-blue-400" : isPast ? "text-gray-600" : "text-gray-300"}`}>
                {dateLabel}
              </p>
              <span className="text-[10px] text-gray-600 font-medium">{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</span>
              {isToday && <span className="ml-auto text-[9px] font-bold rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-blue-400">Today</span>}
            </div>

            {/* Task rows */}
            <div className="space-y-1.5">
              {dayTasks.map(t => {
                const meta = STATUS_META[t.statusKey] || STATUS_META["not-started"];
                const prio = PRIORITY_META[t.priority] || PRIORITY_META.low;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-all duration-150 hover:bg-white/5 flex items-center gap-3 ${meta.border}`}
                    style={{ borderLeftColor: prio.color, borderLeftWidth: 3 }}
                  >
                    <span className={`flex-shrink-0 ${meta.text}`}>{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{t.taskName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        {t.assignedTo && <span>{t.assignedTo}</span>}
                        {t.department !== "—" && <span>· {t.department}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                        style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.color}40` }}
                      >
                        {t.priority}
                      </span>
                      <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.progress}%`, background: prio.color }} />
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold w-8 text-right">{t.progress}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Calendar Component ──────────────────────────────────────────────────
function CalendarContent() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const { data: rawTasks = [], isLoading, isError, refetch } = useTasks();
  const { data: employees = [] } = useEmployees();
  const { data: kpis = [] } = useKPIs();

  // Navigation state
  const [view, setView] = useState<CalView>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Search & filter
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Task preview state
  const [preview, setPreview] = useState<RichTask | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Close preview on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        setPreview(null);
      }
    };
    if (preview) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [preview]);

  // ── Enrich tasks ─────────────────────────────────────────────────────────
  const richTasks = useMemo((): RichTask[] => {
    return rawTasks.map(task => {
      const taskAny = task as any;
      const emp = employees.find(e => e.name.toLowerCase() === task.assignedTo?.toLowerCase());
      const kpi = kpis.find(k => k.id === task.kpiId);
      const statusKey = normaliseStatus(task.status);

      const rawStart = taskAny.startDate || task.createdAt;
      const startDate = rawStart && rawStart !== "—" ? new Date(rawStart) : null;
      const dueDate_d = task.dueDate ? new Date(task.dueDate) : null;

      return {
        ...task,
        department: emp?.department || "—",
        kpiName: kpi?.kpiName || "—",
        progress: progressFromTask(task),
        startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        dueDate_d: dueDate_d && !isNaN(dueDate_d.getTime()) ? dueDate_d : null,
        statusKey,
        overdue: isOverdue(task),
      };
    });
  }, [rawTasks, employees, kpis]);

  // ── Unique filter options ─────────────────────────────────────────────────
  const uniqueEmployees = useMemo(() => [...new Set(richTasks.map(t => t.assignedTo).filter(Boolean))], [richTasks]);
  const uniqueDepts = useMemo(() => [...new Set(richTasks.map(t => t.department).filter(d => d && d !== "—"))], [richTasks]);

  // ── Filter tasks ──────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return richTasks.filter(t => {
      const matchSearch = !q || t.taskName.toLowerCase().includes(q) || t.assignedTo?.toLowerCase().includes(q) || t.kpiName.toLowerCase().includes(q) || t.department.toLowerCase().includes(q);
      const matchStatus = !filterStatus || t.statusKey === filterStatus;
      const matchPriority = !filterPriority || t.priority === filterPriority;
      const matchEmployee = !filterEmployee || t.assignedTo === filterEmployee;
      const matchDept = !filterDept || t.department === filterDept;
      return matchSearch && matchStatus && matchPriority && matchEmployee && matchDept;
    });
  }, [richTasks, search, filterStatus, filterPriority, filterEmployee, filterDept]);

  const activeFilters = [filterStatus, filterPriority, filterEmployee, filterDept].filter(Boolean).length;

  // ── Navigation helpers ────────────────────────────────────────────────────
  const navigate = useCallback((dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else if (view === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  }, [view]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  // ── Header label ──────────────────────────────────────────────────────────
  const headerLabel = useMemo(() => {
    if (view === "month") return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const we = addDays(weekStart, 6);
      if (weekStart.getMonth() === we.getMonth()) {
        return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${we.getDate()}, ${weekStart.getFullYear()}`;
      }
      return `${fmtDate(weekStart, { month: "short", day: "numeric" })} – ${fmtDate(we, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (view === "day") return fmtDate(currentDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return "Agenda";
  }, [view, currentDate, weekStart]);

  // ── Task click ────────────────────────────────────────────────────────────
  const handleTaskClick = useCallback((task: RichTask) => {
    setPreview(task);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    router.push(`/tasks/${id}`);
  }, [router]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Loading/Error ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading calendar…</p>
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
          <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-gray-300">Failed to load tasks from Airtable.</p>
            <button onClick={handleRefresh} className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* ── Page Header ── */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Task Calendar</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} · Click any task for preview · Open detail for full info
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <Database className="h-3 w-3" />
              Airtable Live
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Calendar Panel ── */}
        <div className="flex-1 glass-card border border-white/10 bg-[#080d19]/80 backdrop-blur-xl flex flex-col overflow-hidden rounded-2xl">

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 px-4 py-3 border-b border-white/8">

            {/* Row 1: Nav + View switcher */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={goToday} className="rounded-lg border border-white/10 bg-white/5 px-3 h-8 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                  Today
                </button>
                <button onClick={() => navigate(1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-white ml-1">{headerLabel}</span>
              </div>

              {/* View switcher */}
              <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
                {(["month", "week", "day", "agenda"] as CalView[]).map(v => (
                  <button
                    key={v}
                    id={`cal-view-${v}`}
                    onClick={() => setView(v)}
                    className={`px-3 h-7 rounded-md text-xs font-bold capitalize transition-all ${view === v ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Search + Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  id="cal-search"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="w-full h-8 rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-xs text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                id="cal-filter-toggle"
                onClick={() => setShowFilters(p => !p)}
                className={`flex items-center gap-1.5 h-8 rounded-lg border px-3 text-xs font-bold transition-all ${showFilters ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-gray-400 hover:text-white"}`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilters > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">{activeFilters}</span>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {/* Color legend mini */}
              <div className="hidden md:flex items-center gap-2 ml-2">
                {Object.entries(STATUS_META).slice(1, 5).map(([key, m]) => (
                  <div key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <div className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Clear */}
              {(activeFilters > 0 || search) && (
                <button onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); setFilterEmployee(""); setFilterDept(""); }}
                  className="flex items-center gap-1 h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-gray-400 hover:text-white transition-colors">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/5 animate-fade-in">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Status</label>
                  <select id="cal-filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="w-full h-7 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none">
                    <option value="">All</option>
                    {Object.entries(STATUS_META).filter(([k]) => k !== "todo").map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Priority</label>
                  <select id="cal-filter-priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                    className="w-full h-7 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none">
                    <option value="">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Employee</label>
                  <select id="cal-filter-employee" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                    className="w-full h-7 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none">
                    <option value="">All</option>
                    {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Department</label>
                  <select id="cal-filter-dept" value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    className="w-full h-7 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none">
                    <option value="">All</option>
                    {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── View Content ── */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {view === "month" && (
              <MonthView year={currentDate.getFullYear()} month={currentDate.getMonth()} tasks={filteredTasks} onTaskClick={handleTaskClick} today={today} />
            )}
            {view === "week" && (
              <WeekView weekStart={weekStart} tasks={filteredTasks} onTaskClick={handleTaskClick} today={today} />
            )}
            {view === "day" && (
              <DayView date={currentDate} tasks={filteredTasks} onTaskClick={handleTaskClick} today={today} />
            )}
            {view === "agenda" && (
              <AgendaView tasks={filteredTasks} onTaskClick={handleTaskClick} />
            )}
          </div>
        </div>
        </div>
        {/* ── Task Preview Overlay ── */}
        {preview && (
          <div ref={previewRef} className="fixed z-[150] right-6 bottom-6 md:right-8 md:bottom-8">
            <TaskPreview
              task={preview}
              onNavigate={id => { setPreview(null); handleNavigate(id); }}
              onClose={() => setPreview(null)}
            />
          </div>
        )}

      </PageContainer>
    </DashboardLayout>
  );
}

// ─── Keyframe styles ──────────────────────────────────────────────────────────
const calStyles = `
  @keyframes chip-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-chip-in { animation: chip-in 0.18s ease-out both; }

  @keyframes preview-in {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-preview-in { animation: preview-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .animate-fade-in { animation: fade-in 0.18s ease-out both; }
`;

export default function TaskCalendarPage() {
  return (
    <>
      <style>{calStyles}</style>
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
        <CalendarContent />
      </Suspense>
    </>
  );
}
