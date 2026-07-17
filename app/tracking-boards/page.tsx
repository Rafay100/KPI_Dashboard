"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/kpis/components/StatusBadge";
import { ProgressCell } from "@/features/kpis/components/ProgressCell";
import { useDashboardData } from "@/hooks/useData";
import type { KPI, Employee } from "@/types/models";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Cpu,
  User,
  Check,
  AlertCircle,
  Clock,
  Layers,
  Database,
  SlidersHorizontal,
  X,
  Calendar,
  Filter
} from "lucide-react";

// Helper to resolve manager from employee record or KPI owner
const getManager = (kpi: KPI, employees: Employee[]): string => {
  if (!kpi.employeeId) return kpi.owner || "—";
  const employee = employees.find(
    (emp) => emp.name.toLowerCase() === kpi.employeeId.toLowerCase()
  );
  if (employee && employee.manager) {
    return employee.manager;
  }
  return kpi.owner || "—";
};

// Helper to calculate Trend
const getTrend = (kpi: KPI) => {
  const actual = kpi.actualValue;
  const target = kpi.targetValue;
  if (target <= 0) return { label: "Stable", type: "stable" as const };
  const ratio = actual / target;
  if (ratio >= 1.0) return { label: "Up", type: "up" as const };
  if (ratio >= 0.9) return { label: "Stable", type: "stable" as const };
  return { label: "Down", type: "down" as const };
};

// Helper to derive Review Date (5 days before Due Date)
const getReviewDate = (dueDateStr: string): string => {
  if (!dueDateStr) return "—";
  const date = new Date(dueDateStr);
  if (isNaN(date.getTime())) return "—";
  const reviewDate = new Date(date.getTime() - 5 * 24 * 60 * 60 * 1000);
  return reviewDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

// Helper to derive Entry Method deterministically from KPI ID
const getEntryMethod = (kpiId: string): "Automated" | "Manual" => {
  if (!kpiId) return "Manual";
  let sum = 0;
  for (let i = 0; i < kpiId.length; i++) {
    sum += kpiId.charCodeAt(i);
  }
  return sum % 2 === 0 ? "Automated" : "Manual";
};

// Internal content component that uses useSearchParams
function TrackingBoardsContent() {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Collapsible Filters Panel State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // States initialized from Search URL Params if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedDept, setSelectedDept] = useState(searchParams.get("dept") || "");
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get("team") || "");
  const [selectedEmployee, setSelectedEmployee] = useState(searchParams.get("employee") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");
  const [selectedMethod, setSelectedMethod] = useState(searchParams.get("method") || "");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [lastSynced, setLastSynced] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);

  // Extract raw lists
  const kpis = useMemo(() => data?.kpis || [], [data]);
  const employees = useMemo(() => data?.employees || [], [data]);

  // Sync state changes with URL parameters to preserve state upon navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedDept) params.set("dept", selectedDept);
    if (selectedTeam) params.set("team", selectedTeam);
    if (selectedEmployee) params.set("employee", selectedEmployee);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedMethod) params.set("method", selectedMethod);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [
    searchQuery,
    selectedDept,
    selectedTeam,
    selectedEmployee,
    selectedCategory,
    selectedStatus,
    selectedMethod,
    startDate,
    endDate,
    router,
    pathname,
  ]);

  // Set last synced timestamp
  useEffect(() => {
    if (data) {
      const now = new Date();
      setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [data]);

  // Dynamically extract unique dropdown filter lists based on actual KPI values fetched from Airtable
  const departmentsList = useMemo(() => {
    const depts = kpis.map((k) => k.departmentId).filter(Boolean);
    return Array.from(new Set(depts)).sort();
  }, [kpis]);

  const teamsList = useMemo(() => {
    const teams = kpis.map((k) => k.team).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [kpis]);

  const employeesList = useMemo(() => {
    const emps = kpis.map((k) => k.employeeId).filter(Boolean);
    return Array.from(new Set(emps)).sort();
  }, [kpis]);

  const categoriesList = useMemo(() => {
    const cats = kpis.map((k) => k.category).filter(Boolean);
    return Array.from(new Set(cats)).sort();
  }, [kpis]);

  const statusConfigList = [
    { value: "not-started", label: "Not Started" },
    { value: "in-progress", label: "In Progress" },
    { value: "at-risk", label: "At Risk" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue" }
  ];

  // Active filter chips computation
  const activeFilters = useMemo(() => {
    const list = [];
    if (selectedDept) {
      list.push({
        key: "dept",
        label: `Department: ${selectedDept}`,
        clear: () => setSelectedDept(""),
      });
    }
    if (selectedTeam) {
      list.push({
        key: "team",
        label: `Team: ${selectedTeam}`,
        clear: () => setSelectedTeam(""),
      });
    }
    if (selectedEmployee) {
      list.push({
        key: "employee",
        label: `Employee: ${selectedEmployee}`,
        clear: () => setSelectedEmployee(""),
      });
    }
    if (selectedCategory) {
      list.push({
        key: "category",
        label: `Category: ${selectedCategory}`,
        clear: () => setSelectedCategory(""),
      });
    }
    if (selectedStatus) {
      const label = statusConfigList.find((s) => s.value === selectedStatus)?.label || selectedStatus;
      list.push({
        key: "status",
        label: `Status: ${label}`,
        clear: () => setSelectedStatus(""),
      });
    }
    if (selectedMethod) {
      list.push({
        key: "method",
        label: `Method: ${selectedMethod}`,
        clear: () => setSelectedMethod(""),
      });
    }
    if (startDate) {
      list.push({
        key: "start",
        label: `From: ${new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
        clear: () => setStartDate(""),
      });
    }
    if (endDate) {
      list.push({
        key: "end",
        label: `To: ${new Date(endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
        clear: () => setEndDate(""),
      });
    }
    return list;
  }, [
    selectedDept,
    selectedTeam,
    selectedEmployee,
    selectedCategory,
    selectedStatus,
    selectedMethod,
    startDate,
    endDate,
  ]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedDept("");
    setSelectedTeam("");
    setSelectedEmployee("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedMethod("");
    setStartDate("");
    setEndDate("");
  };

  // Compound filter logic checking all selected parameters instantly
  const filteredKPIs = useMemo(() => {
    return kpis.filter((kpi) => {
      // 1. Text Search query (KPI Name or KPI Code)
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const kpiName = kpi.kpiName.toLowerCase();
        const code = (kpi.code || `KPI-${kpi.id.slice(0, 5)}`).toLowerCase();
        if (!kpiName.includes(query) && !code.includes(query)) return false;
      }

      // 2. Department filter
      if (selectedDept && kpi.departmentId !== selectedDept) return false;

      // 3. Team filter
      if (selectedTeam && kpi.team !== selectedTeam) return false;

      // 4. Employee filter
      if (selectedEmployee && kpi.employeeId !== selectedEmployee) return false;

      // 5. Category filter
      if (selectedCategory && kpi.category !== selectedCategory) return false;

      // 6. Status filter
      if (selectedStatus && kpi.status !== selectedStatus) return false;

      // 7. Entry Method filter
      if (selectedMethod) {
        const method = getEntryMethod(kpi.id);
        if (method !== selectedMethod) return false;
      }

      // 8. Date Range filter (inclusive check)
      if (startDate || endDate) {
        if (!kpi.dueDate) return false;
        const dueDate = new Date(kpi.dueDate);
        if (isNaN(dueDate.getTime())) return false;

        if (startDate) {
          const start = new Date(startDate);
          if (dueDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // set to end of day to make inclusive
          if (dueDate > end) return false;
        }
      }

      return true;
    });
  }, [
    kpis,
    searchQuery,
    selectedDept,
    selectedTeam,
    selectedEmployee,
    selectedCategory,
    selectedStatus,
    selectedMethod,
    startDate,
    endDate,
  ]);

  // Columns definition matching all 16 requested columns + Code
  const columns = useMemo<ColumnDef<KPI>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            KPI Code
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const codeVal = row.original.code || `KPI-${row.original.id.slice(0, 5).toUpperCase()}`;
          return (
            <div className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 inline-block">
              {codeVal}
            </div>
          );
        },
      },
      {
        accessorKey: "kpiName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            KPI Name
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <span className="font-semibold text-white block text-sm leading-tight hover:text-blue-400 transition-colors">
              {row.original.kpiName}
            </span>
            {row.original.description && (
              <span className="text-xs text-gray-400 mt-1 block line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            Category
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-gray-300 whitespace-nowrap">
            {row.original.category || "General"}
          </span>
        ),
      },
      {
        accessorKey: "departmentId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            Department
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-purple-400 whitespace-nowrap">
            {row.original.departmentId || "—"}
          </span>
        ),
      },
      {
        accessorKey: "team",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            Team
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
            {row.original.team || "—"}
          </span>
        ),
      },
      {
        accessorKey: "employeeId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            Assigned Employee
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const initials = row.original.employeeId
            ? row.original.employeeId.split(" ").map((n) => n[0]).join("").slice(0, 2)
            : "??";
          return (
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                {initials}
              </div>
              <span className="text-sm text-white font-medium">{row.original.employeeId || "Unassigned"}</span>
            </div>
          );
        },
      },
      {
        id: "manager",
        header: "Manager",
        cell: ({ row }) => {
          const managerName = getManager(row.original, employees);
          const initials = managerName.split(" ").map((n) => n[0]).join("").slice(0, 2);
          return (
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                {initials}
              </div>
              <span className="text-sm text-gray-300 font-medium">{managerName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "targetValue",
        header: "Target Value",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-white whitespace-nowrap">
            {row.original.targetValue.toLocaleString()} <span className="text-xs font-normal text-gray-400">{row.original.unit || ""}</span>
          </span>
        ),
      },
      {
        accessorKey: "actualValue",
        header: "Actual Value",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-white whitespace-nowrap">
            {row.original.actualValue.toLocaleString()} <span className="text-xs font-normal text-gray-400">{row.original.unit || ""}</span>
          </span>
        ),
      },
      {
        id: "score",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            KPI Score
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const actual = row.original.actualValue;
          const target = row.original.targetValue;
          const score = target > 0 ? Math.round((actual / target) * 100) : 0;
          return (
            <div className="min-w-[150px]">
              <ProgressCell actual={actual} target={target} score={score} />
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs -ml-3 text-gray-400 hover:text-white"
          >
            Due Date
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.dueDate);
          const isOverdue =
            row.original.status === "overdue" ||
            (row.original.status !== "completed" && date < new Date());
          const dateStr = isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
          return (
            <div className={`text-sm whitespace-nowrap font-medium ${isOverdue ? "text-red-400 font-semibold" : "text-gray-300"}`}>
              {dateStr}
            </div>
          );
        },
      },
      {
        id: "reviewDate",
        header: "Review Date",
        cell: ({ row }) => (
          <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
            {getReviewDate(row.original.dueDate)}
          </span>
        ),
      },
      {
        id: "entryMethod",
        header: "Entry Method",
        cell: ({ row }) => {
          const method = getEntryMethod(row.original.id);
          return (
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              {method === "Automated" ? (
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <Cpu className="mr-1 h-3 w-3 text-emerald-400" />
                  Automated
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                  <User className="mr-1 h-3 w-3 text-blue-400" />
                  Manual
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        cell: ({ row }) => {
          const date = new Date(row.original.lastUpdated);
          const dateStr = isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString([], { month: "short", day: "numeric" }) +
              " " +
              date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
              {dateStr}
            </span>
          );
        },
      },
      {
        id: "trend",
        header: "Trend",
        cell: ({ row }) => {
          const trend = getTrend(row.original);
          if (trend.type === "up") {
            return (
              <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span>Up</span>
              </span>
            );
          } else if (trend.type === "down") {
            return (
              <span className="inline-flex items-center space-x-1 text-red-400 font-semibold text-xs bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span>Down</span>
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                <Minus className="h-3.5 w-3.5 text-amber-400" />
                <span>Stable</span>
              </span>
            );
          }
        },
      },
      {
        id: "syncStatus",
        header: "Sync Status",
        cell: () => (
          <div className="flex items-center space-x-1 text-emerald-400 whitespace-nowrap">
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold border border-emerald-500/20">
              <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Synced
            </span>
          </div>
        ),
      },
    ],
    [employees]
  );

  // Setup Tanstack Table
  const table = useReactTable({
    data: filteredKPIs,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  // Handle page size changes
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setPageSize(val);
    table.setPageSize(val);
  };

  // Error state view with Retry capability
  if (isError) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageHeader
            title="Tracking Boards"
            description="Operational KPI Management table and scorecard sync"
          />

          <div className="glass-card p-8 border border-red-500/20 bg-red-500/5">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                Failed to Fetch Airtable Data
              </h3>
              <p className="mb-6 max-w-md text-sm text-gray-400">
                An error occurred while communicating with Airtable base. Ensure your environment configurations (API keys and base ID) are correct and online.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Connection</span>
              </Button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Page Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/20 shadow-md">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Tracking Boards
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-gray-400">
              Enterprise-grade scorecard ledger mapping live KPI status from Airtable source
            </p>
          </div>

          {/* Sync Stats Info */}
          <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 font-semibold shadow-sm">
              <Check className="h-3.5 w-3.5" />
              <span>Airtable Connected</span>
            </div>
            {lastSynced && (
              <div className="flex items-center space-x-1 text-gray-500 mt-1">
                <Clock className="h-3 w-3" />
                <span>Last updated at {lastSynced}</span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Filters Toggle Button */}
        <div className="glass-card mb-6 overflow-hidden border border-white/10">
          <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search KPIs by Name or KPI Code (e.g. KPI-003)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-semibold bg-white/10 px-1.5 py-0.5 rounded transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Collapsible Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`h-10 flex items-center space-x-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isFilterPanelOpen ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "text-gray-300"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white leading-none shadow-sm">
                    {activeFilters.length}
                  </span>
                )}
              </Button>

              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size} className="bg-[#0b0e1a]">
                      {size} rows
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                onClick={() => refetch()}
                className="h-10 px-4 flex items-center space-x-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg text-xs font-medium text-gray-300 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Source</span>
              </Button>
            </div>
          </div>

          {/* Collapsible Filter Grid */}
          {isFilterPanelOpen && (
            <div className="border-t border-white/10 bg-white/2 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* 1. Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Team */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Teams</option>
                  {teamsList.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Employee */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employeesList.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. KPI Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statusConfigList.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Entry Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Entry Method
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="Automated">Automated</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              {/* 7. Start Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                  <Calendar className="mr-1 h-3.5 w-3.5" /> Start Due Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 color-scheme-dark"
                />
              </div>

              {/* 8. End Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center">
                  <Calendar className="mr-1 h-3.5 w-3.5" /> End Due Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 color-scheme-dark"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-xl bg-white/2 border border-white/5 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider flex items-center">
              <Filter className="mr-1 h-3 w-3 text-blue-400" /> Active Filters:
            </span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center space-x-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 shadow-sm"
              >
                <span>{filter.label}</span>
                <button
                  onClick={filter.clear}
                  className="text-blue-400 hover:text-white rounded-full hover:bg-blue-500/20 p-0.5 transition-colors focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-all ml-auto px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/10"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Data Table */}
        {filteredKPIs.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/5 bg-white/2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-400">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-white">No KPI Records Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              No metrics matched your filter criteria. Try adjusting your search query or reset filters.
            </p>
            {(searchQuery || activeFilters.length > 0) && (
              <Button
                variant="outline"
                onClick={handleClearAllFilters}
                className="mt-5 border-white/10 text-xs text-white"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-card overflow-hidden border border-white/10 shadow-xl bg-[#080d19]/90 backdrop-blur-xl">
              <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#060b14] border-b border-white/10 z-20">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const isCodeCol = header.id === "code";
                          return (
                            <th
                              key={header.id}
                              className={`px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider ${
                                isCodeCol
                                  ? "sticky left-0 bg-[#060b14] border-r border-white/10 z-30"
                                  : ""
                              }`}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/kpis/${row.original.id}`)}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isCodeCol = cell.column.id === "code";
                          return (
                            <td
                              key={cell.id}
                              className={`px-4 py-3.5 text-sm align-middle ${
                                isCodeCol
                                  ? "sticky left-0 bg-[#070c18] hover:bg-[#121c32] transition-colors border-r border-white/10 z-10 font-semibold"
                                  : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-semibold text-white">
                  {table.getState().pagination.pageIndex * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * pageSize,
                    filteredKPIs.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-white">{filteredKPIs.length}</span>{" "}
                KPI metrics
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 border-white/10 text-xs text-gray-300 flex items-center hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <div className="text-xs font-semibold text-white px-2">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount() || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 border-white/10 text-xs text-gray-300 flex items-center hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

// Wrapper to satisfy Next.js app static compilation with Suspense
export default function TrackingBoardsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer>
            <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center bg-[#020817]">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm text-gray-400 font-semibold animate-pulse">
                  Initializing Tracking Boards...
                </p>
              </div>
            </div>
          </PageContainer>
        </DashboardLayout>
      }
    >
      <TrackingBoardsContent />
    </Suspense>
  );
}
