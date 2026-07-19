"use client";

import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationsDropdown } from "@/components/layout/NotificationsDropdown";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { useDashboardData } from "@/hooks/useData";
import { 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun, 
  Filter, 
  X, 
  Calendar, 
  RefreshCw, 
  CheckCircle,
  Database,
  Trash2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export function Header() {
  const [isDark, setIsDark] = useState(true);
  const { data, isLoading } = useDashboardData();
  const {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    activeFiltersCount,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen
  } = useGlobalFilters();

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showSyncFlash, setShowSyncFlash] = useState(false);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      setLastSyncTime(customEvent.detail?.time || new Date().toLocaleTimeString());
      setShowSyncFlash(true);
      const timer = setTimeout(() => setShowSyncFlash(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("dashboard-synced", handleSync);
    return () => window.removeEventListener("dashboard-synced", handleSync);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Extract select option values from Unified Dashboard Hook
  const departments = useMemo(() => data?.departments || [], [data?.departments]);
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  
  const teamsList = useMemo(() => {
    const names = new Set<string>();
    employees.forEach((emp) => {
      if (emp.team) names.add(emp.team);
    });
    return Array.from(names);
  }, [employees]);

  const kpiCategories = useMemo(() => {
    const cats = new Set<string>();
    data?.kpis?.forEach((k) => {
      if (k.category) cats.add(k.category);
    });
    return Array.from(cats);
  }, [data?.kpis]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-6">
        
        {/* Left Nav Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          {/* Sync Status Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-[10px] text-green-400 font-semibold">
            <CheckCircle className="h-3 w-3" />
            <span>Google Sheets Live</span>
          </div>

          {showSyncFlash && (
            <div className="hidden md:flex items-center space-x-1 rounded-full bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-[9px] text-blue-400 font-mono animate-pulse">
              <span>Synced {lastSyncTime}</span>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="mx-4 flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        {/* Right Side Buttons & Settings */}
        <div className="flex items-center space-x-2">
          {/* Filter Drawer Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`relative text-gray-400 hover:text-white ${
              activeFiltersCount > 0 ? "text-blue-400 bg-blue-500/10" : ""
            }`}
            title="Global Filter System"
          >
            <Filter className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-[#0a0e1a]">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Theme Toggler */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* Profile User Badge */}
          <div 
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white shadow-md border border-white/10"
            title="Current Administrator: John Doe"
          >
            JD
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-slate-950/20 px-6 py-2 animate-in fade-in duration-200">
          <span className="text-xs font-semibold text-gray-500 mr-1 uppercase tracking-wider">Active Filters:</span>
          {Object.entries(filters).map(([key, val]) => {
            if (!val) return null;
            const filterKey = key as keyof typeof filters;
            return (
              <div 
                key={filterKey}
                className="flex items-center space-x-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs text-blue-400 font-medium"
              >
                <span className="capitalize">{filterKey.replace(/([A-Z])/g, " $1")}:</span>
                <span className="text-white font-semibold">{val}</span>
                <button 
                  onClick={() => clearFilter(filterKey)}
                  className="ml-1 text-blue-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          <button 
            onClick={clearAllFilters}
            className="flex items-center text-xs text-red-400 hover:text-red-300 font-semibold ml-auto"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear All
          </button>
        </div>
      )}

      {/* Responsive Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-l border-white/10 bg-slate-950 p-6 shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Filter className="mr-2 h-5 w-5 text-blue-400" /> Global Filters Drawer
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Refine KPIs, scorecards, tasks, & analytics metrics.</p>
                </div>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Drawer Filters List */}
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Date Picker Range */}
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-xs font-semibold text-gray-400 block mb-2 flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5 text-blue-400" /> Date Reporting Range
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) => setFilter("startDate", e.target.value || null)}
                      className="rounded bg-black/40 border border-white/10 text-xs text-white p-2 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) => setFilter("endDate", e.target.value || null)}
                      className="rounded bg-black/40 border border-white/10 text-xs text-white p-2 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dropdowns */}
                {[
                  { key: "department" as const, label: "Department", list: departments.map((d) => d.departmentName) },
                  { key: "team" as const, label: "Team", list: teamsList },
                  { key: "employee" as const, label: "Employee Name", list: employees.map((e) => e.name) },
                  { key: "kpiCategory" as const, label: "KPI Category", list: kpiCategories },
                  { key: "kpiStatus" as const, label: "KPI Status", list: ["Active", "Archived", "Pending Approval"] },
                  { key: "kpiFrequency" as const, label: "KPI Frequency", list: ["Weekly", "Monthly", "Quarterly", "Annually"] },
                  { key: "taskStatus" as const, label: "Task Status", list: ["To Do", "In Progress", "In Review", "Completed"] },
                  { key: "performanceLevel" as const, label: "Performance Level", list: ["High Performer", "Meeting Standards", "Needs Improvement"] },
                  { key: "rankingType" as const, label: "Ranking Type", list: ["Top Performers", "Bottom Performers", "Department Rankings"] },
                  { key: "entryMethod" as const, label: "Entry Method", list: ["Manual Form", "CSV Upload", "Airtable Sync"] },
                  { key: "approvalStatus" as const, label: "Approval Status", list: ["Approved", "Pending", "Rejected"] },
                  { key: "sourceSystem" as const, label: "Source System", list: ["Airtable", "Salesforce API", "Jira Sync"] }
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 capitalize">{item.label}</label>
                    <select
                      value={filters[item.key] || ""}
                      onChange={(e) => setFilter(item.key, e.target.value || null)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">All {item.label}s</option>
                      {item.list.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div className="border-t border-white/10 pt-4 flex space-x-2">
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="flex-1 justify-center py-2"
              >
                Reset All
              </Button>
              <Button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 justify-center py-2"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

