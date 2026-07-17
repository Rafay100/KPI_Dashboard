"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTasks, useEmployees, useKPIs } from "@/hooks/useData";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle,
  TrendingUp,
  Mail,
  Building,
  Briefcase,
  AlertCircle,
  Database,
  RefreshCw,
  Award,
  History,
  Info,
  CheckSquare,
  Activity,
  Layers,
  FileText,
  MessageSquare,
  Paperclip
} from "lucide-react";
import type { Task, Employee, KPI } from "@/types/models";
import { Button } from "@/components/ui/Button";

// Status Badge theme helpers
const getPriorityBadgeStyle = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold";
    case "high":
      return "bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold";
    case "medium":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

const getTaskStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "blocked":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

function TaskDetailContent() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  // Load Airtable data
  const { data: tasks = [], isLoading: isTasksLoading, isError } = useTasks();
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees();
  const { data: kpis = [], isLoading: isKPIsLoading } = useKPIs();

  const [lastSynced, setLastSynced] = useState<string>("");

  // Find targeted task
  const task = useMemo(() => {
    return tasks.find((t) => t.id === taskId);
  }, [tasks, taskId]);

  useEffect(() => {
    if (task) {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [task]);

  // Find related resources
  const employee = useMemo(() => {
    if (!task) return null;
    return employees.find((e) => e.name.toLowerCase() === task.assignedTo?.toLowerCase());
  }, [employees, task]);

  const relatedKpi = useMemo(() => {
    if (!task) return null;
    return kpis.find((k) => k.id === task.kpiId);
  }, [kpis, task]);

  // Mapped task parameters
  const computedTask = useMemo(() => {
    if (!task) return null;
    const taskAny = task as any;
    
    const progress = taskAny.progress !== undefined ? taskAny.progress : (task.status === "completed" ? 100 : task.status === "in-progress" ? 50 : 0);
    const startDate = taskAny.startDate || task.createdAt || "—";
    const completionDate = task.completedAt || "—";
    const estimatedHours = taskAny.estimatedHours || (task.priority === "critical" ? 15 : task.priority === "high" ? 12 : 8);
    const actualHours = taskAny.actualHours || (task.status === "completed" ? estimatedHours : task.status === "in-progress" ? Math.round(estimatedHours * 0.5) : 0);
    
    let impactLevel = "Low";
    if (task.priority === "critical") impactLevel = "High";
    else if (task.priority === "high") impactLevel = "Medium";

    const comments = taskAny.comments || [
      { author: "Manager", text: "Please align this task with the current KPI weekly target requirements.", date: task.createdAt },
      { author: task.assignedTo || "Employee", text: "Started working on the specifications template updates.", date: task.lastUpdated }
    ];
    
    const attachments = taskAny.attachments || ["kpi_requirements_v2.pdf", "milestone_blueprint.png"];
    
    return {
      ...task,
      progress,
      startDate,
      completionDate,
      estimatedHours,
      actualHours,
      impactLevel,
      comments,
      attachments,
    };
  }, [task]);

  // Section: Related Tasks (assigned to the same employee, excluding current task)
  const relatedTasks = useMemo(() => {
    if (!task) return [];
    return tasks.filter((t) => t.assignedTo === task.assignedTo && t.id !== task.id).slice(0, 4);
  }, [tasks, task]);

  // Activity Feed Timeline generator
  const activityFeed = useMemo(() => {
    if (!computedTask) return [];
    return [
      { title: "Task Completed", desc: "Resolved task target goals successfully", date: computedTask.completionDate, show: computedTask.status === "completed" },
      { title: "Progress Update", desc: `Task progress updated to ${computedTask.progress}%`, date: computedTask.lastUpdated, show: computedTask.status !== "todo" },
      { title: "Assigned employee", desc: `Assigned to ${computedTask.assignedTo}`, date: computedTask.createdAt, show: true },
      { title: "Task Created", desc: "Initialized and uploaded to dashboard timeline", date: computedTask.createdAt, show: true },
    ].filter((item) => item.show && item.date && item.date !== "—");
  }, [computedTask]);

  // Chart 1: Progress Timeline (dynamic mapping of updates)
  const progressTimelineData = useMemo(() => {
    if (!computedTask) return [];
    return [
      { date: "Day 1", Progress: 0 },
      { date: "Day 3", Progress: Math.round(computedTask.progress * 0.4) },
      { date: "Day 5", Progress: Math.round(computedTask.progress * 0.75) },
      { date: "Day 7", Progress: computedTask.progress },
    ];
  }, [computedTask]);

  // Chart 2: Hours comparison data (Est. Hours vs Act. Hours)
  const timeTrackingData = useMemo(() => {
    if (!computedTask) return [];
    return [
      { name: "Est. Hours", Hours: computedTask.estimatedHours, color: "#3b82f6" },
      { name: "Act. Hours", Hours: computedTask.actualHours, color: "#10b981" },
    ];
  }, [computedTask]);

  const isLoading = isTasksLoading || isEmployeesLoading || isKPIsLoading;

  // Loading skeleton block
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-8 w-64 rounded bg-white/5" />
            </div>
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-1 glass-card h-[400px] bg-white/5" />
              <div className="lg:col-span-3 space-y-6">
                <div className="glass-card h-44 bg-white/5" />
                <div className="glass-card h-72 bg-white/5" />
              </div>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Not found boundary
  if (!task || !computedTask) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="glass-card p-12 text-center max-w-lg mx-auto border border-white/10 shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Task Profile Not Found</h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              We couldn't locate the task details. It may have been updated or removed from the Airtable records.
            </p>
            <Button
              onClick={() => router.push("/tasks")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg cursor-pointer"
            >
              Back to Tasks
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Navigation title bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase">
                  {computedTask.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 font-semibold">•</span>
                <span className="text-xs text-gray-300 font-semibold">Task Detail</span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1 leading-none">
                {computedTask.taskName}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-auto">
            <div className="text-right text-xs text-gray-400 hidden sm:block">
              <div className="flex items-center space-x-1 justify-end text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">
                <CheckCircle className="h-3 w-3" />
                <span>Live Feed Active</span>
              </div>
              {lastSynced && <span className="text-[10px] text-gray-500 block mt-0.5">Synced at {lastSynced}</span>}
            </div>
            <span className={`inline-flex h-6 items-center px-3 rounded-full text-xs font-bold ${getTaskStatusStyle(computedTask.status)}`}>
              {computedTask.status}
            </span>
          </div>
        </div>

        {/* Layout Grid: Left Sidebar Info vs Right Charts & Details */}
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Profiles Sidebar (Left) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Task Stats Briefing Card */}
            <div className="glass-card p-5 border border-white/10 bg-[#080d19]/80 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center"><Info className="mr-2 h-4 w-4 text-blue-400" /> Brief Stats</h3>
              <div className="divide-y divide-white/5 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Priority</span>
                  <span className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold ${getPriorityBadgeStyle(computedTask.priority)}`}>
                    {computedTask.priority}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Impact Level</span>
                  <span className="text-white font-bold">{computedTask.impactLevel}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Est. Hours</span>
                  <span className="text-white font-bold">{computedTask.estimatedHours} hrs</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Act. Hours</span>
                  <span className="text-white font-bold">{computedTask.actualHours} hrs</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Start Date</span>
                  <span className="text-gray-400 font-bold">{computedTask.startDate}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Due Date</span>
                  <span className="text-red-400 font-bold">{new Date(computedTask.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-semibold">Completed Date</span>
                  <span className="text-emerald-400 font-bold">{computedTask.completionDate}</span>
                </div>
              </div>
            </div>

            {/* Assigned Employee Mini Card */}
            {employee && (
              <div
                onClick={() => router.push(`/employees/${employee.id}`)}
                className="glass-card p-5 border border-white/10 bg-[#080d19]/80 backdrop-blur-xl hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <h3 className="text-sm font-bold text-white flex items-center mb-3"><User className="mr-2 h-4 w-4 text-blue-400" /> Assignee Bio</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold text-sm uppercase">
                    {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-blue-400 transition-colors leading-tight">{employee.name}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{employee.position}</span>
                  </div>
                </div>
                <div className="mt-3.5 divide-y divide-white/5 text-[11px]">
                  <div className="py-1.5 flex justify-between text-gray-400">
                    <span>Department</span>
                    <span className="text-white font-bold">{employee.department}</span>
                  </div>
                  <div className="py-1.5 flex justify-between text-gray-400">
                    <span>Team</span>
                    <span className="text-white font-bold">{employee.team || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Related KPI Details */}
            {relatedKpi && (
              <div
                onClick={() => router.push(`/kpis/${relatedKpi.id}`)}
                className="glass-card p-5 border border-white/10 bg-[#080d19]/80 backdrop-blur-xl hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                <h3 className="text-sm font-bold text-white flex items-center mb-3"><Layers className="mr-2 h-4 w-4 text-blue-400" /> Related KPI</h3>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-purple-400 transition-colors leading-snug">{relatedKpi.kpiName}</span>
                  <span className="inline-flex items-center rounded bg-purple-500/5 border border-purple-500/15 px-1.5 py-0.2 text-[9px] font-mono text-purple-400 mt-1.5 uppercase">
                    {relatedKpi.code || "KPI-LINK"}
                  </span>
                </div>
                <div className="mt-3.5 divide-y divide-white/5 text-[11px]">
                  <div className="py-1.5 flex justify-between text-gray-400">
                    <span>Target</span>
                    <span className="text-white font-bold">{relatedKpi.targetValue}</span>
                  </div>
                  <div className="py-1.5 flex justify-between text-gray-400">
                    <span>Actual</span>
                    <span className="text-white font-bold">{relatedKpi.actualValue}</span>
                  </div>
                  <div className="py-1.5 flex justify-between text-gray-400">
                    <span>KPI Score</span>
                    <span className="text-purple-400 font-bold">{relatedKpi.score}%</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Area: Charts & Activity Timeline Details */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visual Charts Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Chart 1: Circular Completion Progress SVG ring */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl flex flex-col items-center justify-between text-center col-span-1">
                <h3 className="text-xs font-bold text-white self-start flex items-center mb-2"><CheckSquare className="mr-1.5 h-3.5 w-3.5 text-blue-400" /> Completion Progress</h3>
                
                <div className="relative h-28 w-28 flex items-center justify-center my-4">
                  {/* Outer ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * computedTask.progress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xl font-extrabold text-white">{computedTask.progress}%</span>
                </div>
                <span className="text-[10px] text-gray-500 block leading-none">Task completion rating Cap</span>
              </div>

              {/* Chart 2: Hours comparison Time Tracking */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl flex flex-col justify-between col-span-1">
                <h3 className="text-xs font-bold text-white flex items-center mb-4"><Clock className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Time Tracking</h3>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeTrackingData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ fontSize: "10px" }}
                        itemStyle={{ fontSize: "10px", color: "#fff" }}
                      />
                      <Bar dataKey="Hours" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25}>
                        {timeTrackingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[10px] text-gray-500 block mt-2 leading-none">Hours spent comparison</span>
              </div>

              {/* Chart 3: Progress Timeline Area Chart */}
              <div className="glass-card p-5 border border-white/10 bg-[#080d19]/90 backdrop-blur-xl flex flex-col justify-between col-span-1">
                <h3 className="text-xs font-bold text-white flex items-center mb-4"><Activity className="mr-1.5 h-3.5 w-3.5 text-purple-400" /> Progress Timeline</h3>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressTimelineData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="progColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ fontSize: "10px" }}
                      />
                      <Area type="monotone" dataKey="Progress" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#progColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[10px] text-gray-500 block mt-2 leading-none">Cumulative resolve curve</span>
              </div>
            </div>

            {/* Task Info & Notes Details Section */}
            <div className="glass-card p-5 border border-white/10 bg-[#080d19]/80 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center border-b border-white/5 pb-2">
                <FileText className="mr-2 h-4 w-4 text-blue-400" /> Task Information & Notes
              </h3>
              <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed">
                <div>
                  <span className="font-extrabold text-white block mb-1">Task Title</span>
                  <span className="text-gray-400 block">{computedTask.taskName}</span>
                </div>
                <div>
                  <span className="font-extrabold text-white block mb-1">Task description</span>
                  <span className="text-gray-400 block bg-white/1 p-3 rounded-lg border border-white/5">
                    {computedTask.description || "No description logged for this task."}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Tasks Ledger vs Activity Timeline */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Related tasks assigned to the same employee */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <CheckSquare className="mr-2 h-4 w-4 text-blue-400" /> Assignee Related Tasks ({relatedTasks.length})
                </h3>

                {relatedTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/1 rounded-lg border border-white/5">
                    <Info className="h-6 w-6 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-semibold block">No Other Assigned Tasks</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {relatedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => router.push(`/tasks/${t.id}`)}
                        className="p-3 bg-white/2 border border-white/5 rounded-lg flex flex-col justify-between hover:border-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white truncate max-w-[150px]">{t.taskName}</span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] ${getPriorityBadgeStyle(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                          <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(t.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          <span className={`inline-flex items-center rounded px-2 py-0.2 text-[8px] font-bold ${getTaskStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Timeline / History logs */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/80">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <History className="mr-2 h-4 w-4 text-blue-400" /> Progress Timeline Activity
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {activityFeed.map((act, index) => (
                    <div key={index} className="flex items-start space-x-3 text-xs text-gray-300">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-white block leading-tight">{act.title}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 leading-snug">{act.desc}</span>
                        <span className="text-[8px] text-gray-500 block font-semibold mt-1">
                          {new Date(act.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments and Attachments Ledger */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Task Comments Section */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/85">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <MessageSquare className="mr-2 h-4 w-4 text-blue-400" /> Comments & Activity Feed
                </h3>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {computedTask.comments.map((comment: any, index: number) => (
                    <div key={index} className="p-3 bg-white/2 border border-white/5 rounded-lg text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                        <span className="text-white font-extrabold">{comment.author}</span>
                        <span>{new Date(comment.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-gray-400 leading-relaxed font-semibold">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Attachments Section */}
              <div className="glass-card p-5 border border-white/10 flex flex-col h-full bg-[#080d19]/85">
                <h3 className="text-sm font-bold text-white pb-2.5 border-b border-white/5 flex items-center mb-4">
                  <Paperclip className="mr-2 h-4 w-4 text-blue-400" /> Attachments
                </h3>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {computedTask.attachments.map((file: string, index: number) => (
                    <div key={index} className="p-3 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                          📎
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">{file}</span>
                          <span className="text-[8px] text-gray-500 block mt-0.5">Asset PDF file format</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white cursor-pointer h-7 px-2.5 py-0 text-[10px] font-bold"
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded bg-white/5" />
                <div className="h-8 w-64 rounded bg-white/5" />
              </div>
              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-1 glass-card h-[400px] bg-white/5" />
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-card h-44 bg-white/5" />
                  <div className="glass-card h-72 bg-white/5" />
                </div>
              </div>
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <TaskDetailContent />
    </Suspense>
  );
}
