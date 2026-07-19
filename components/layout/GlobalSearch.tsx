"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search, Clock, ArrowRight, CornerDownLeft, X } from "lucide-react";
import { useDashboardData } from "@/hooks/useData";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "KPI" | "Employee" | "Department" | "Team" | "Task" | "Achievement" | "Report";
  label: string;
  href: string;
  details?: string;
}

export function GlobalSearch() {
  const { data, isLoading } = useDashboardData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load recent searches on client mount
  useEffect(() => {
    const saved = localStorage.getItem("recent_global_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Click outside close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const kpis = useMemo(() => data?.kpis || [], [data?.kpis]);
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  const departments = useMemo(() => data?.departments || [], [data?.departments]);
  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);
  const achievements = useMemo(() => data?.achievements || [], [data?.achievements]);
  
  // Extract Teams from employees/departments data or predefined
  const teamsList = useMemo(() => {
    const names = new Set<string>();
    employees.forEach((emp) => {
      if (emp.team) names.add(emp.team);
    });
    return Array.from(names).map((name, i) => ({ id: `team-${i}`, teamName: name }));
  }, [employees]);

  // Static Reports index
  const reportsList = [
    { id: "rep-1", label: "Executive KPI Summary", href: "/reports?type=exec" },
    { id: "rep-2", label: "Department Performance Analytics", href: "/reports?type=dept" },
    { id: "rep-3", label: "Employee Scorecard Export", href: "/reports?type=emp" }
  ];

  const filteredResults = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return [];

    const combined: SearchResult[] = [
      ...kpis.map((item) => ({ id: item.id || `kpi-${item.kpiName}`, type: "KPI" as const, label: item.kpiName, href: `/kpis/${item.id}`, details: `Target: ${item.targetValue} | Category: ${item.category}` })),
      ...departments.map((item) => ({ id: item.id || `dept-${item.departmentName}`, type: "Department" as const, label: item.departmentName, href: `/department-rankings/${item.id}`, details: `Manager: ${item.headOfDepartment || "N/A"}` })),
      ...employees.map((item) => ({ id: item.id || `emp-${item.name}`, type: "Employee" as const, label: item.name, href: `/employees/${item.id}`, details: `Role: ${item.position} | Team: ${item.team || "N/A"}` })),
      ...teamsList.map((item) => ({ id: item.id, type: "Team" as const, label: item.teamName, href: "/settings", details: "Organization Structure Team" })),
      ...tasks.map((item) => ({ id: item.id || `task-${item.taskName}`, type: "Task" as const, label: item.taskName, href: `/tasks/${item.id}`, details: `Status: ${item.status} | Assigned: ${item.assignedTo || "N/A"}` })),
      ...achievements.map((item) => ({ id: item.id || `ach-${item.title}`, type: "Achievement" as const, label: item.title, href: "/achievements", details: item.description })),
      ...reportsList.map((item) => ({ id: item.id, type: "Report" as const, label: item.label, href: item.href, details: "Standard System Report" }))
    ];

    return combined.filter((item) => item.label.toLowerCase().includes(term));
  }, [achievements, departments, employees, kpis, debouncedQuery, tasks, teamsList]);

  // Grouped results
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((res) => {
      if (!groups[res.type]) groups[res.type] = [];
      groups[res.type].push(res);
    });
    return groups;
  }, [filteredResults]);

  // Linear results array for keyboard indices navigation
  const flatResultsList = useMemo(() => {
    return Object.values(groupedResults).flat();
  }, [groupedResults]);

  // Key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatResultsList.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatResultsList.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResultsList.length) {
        const item = flatResultsList[selectedIndex];
        handleSelect(item);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SearchResult) => {
    // Add to recents
    const updated = [item.label, ...recentSearches.filter((q) => q !== item.label)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_global_searches", JSON.stringify(updated));

    setQuery("");
    setIsOpen(false);
    router.push(item.href);
  };

  const highlightMatch = (text: string, queryText: string) => {
    if (!queryText.trim()) return text;
    const regex = new RegExp(`(${queryText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === queryText.toLowerCase() ? (
            <mark key={i} className="bg-blue-500/30 text-white rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          type="text"
          placeholder="Search KPIs, employees, departments, teams, reports..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-white placeholder-slate-400 outline-none transition-all duration-300 focus:border-blue-500/50 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/20"
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setSelectedIndex(-1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-13 z-50 mt-2 max-h-[75vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3 py-2">
              <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse"></div>
              <div className="h-8 w-full bg-white/5 rounded animate-pulse"></div>
              <div className="h-8 w-full bg-white/5 rounded animate-pulse"></div>
            </div>
          )}

          {/* Empty Search - Show Recent Searches */}
          {!query.trim() && !isLoading && (
            <div>
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                <Clock className="mr-1.5 h-3.5 w-3.5" /> Recent Searches
              </h4>
              {recentSearches.length === 0 ? (
                <p className="text-xs text-gray-500 py-1">No recent searches</p>
              ) : (
                <div className="space-y-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(term);
                        setIsOpen(true);
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <span>{term}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Result Matches grouped by Entity */}
          {query.trim() && !isLoading && (
            <div>
              {flatResultsList.length === 0 ? (
                <div className="text-sm text-slate-400 py-6 text-center">
                  No matching parameters found for "{query}"
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedResults).map(([type, items]) => (
                    <div key={type}>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-2">
                        {type}s ({items.length})
                      </h4>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const itemFlatIndex = flatResultsList.findIndex((f) => f.id === item.id);
                          const isSelected = itemFlatIndex === selectedIndex;
                          
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(itemFlatIndex)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                                isSelected 
                                  ? "bg-blue-500/20 border border-blue-500/30 text-white" 
                                  : "border border-transparent hover:bg-white/5 text-slate-300"
                              }`}
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {highlightMatch(item.label, debouncedQuery)}
                                </div>
                                {item.details && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {item.details}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <span className="text-[10px] text-blue-400 flex items-center bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                                  Select <CornerDownLeft className="ml-1 h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

