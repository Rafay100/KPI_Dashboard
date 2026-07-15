"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDashboardData } from "@/hooks/useData";
import Link from "next/link";

export function GlobalSearch() {
  const { data } = useDashboardData();
  const [query, setQuery] = useState("");

  const kpis = useMemo(() => data?.kpis || [], [data?.kpis]);
  const employees = useMemo(() => data?.employees || [], [data?.employees]);
  const departments = useMemo(() => data?.departments || [], [data?.departments]);
  const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);
  const achievements = useMemo(() => data?.achievements || [], [data?.achievements]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const combined = [
      ...kpis.map((item) => ({ type: "KPI", label: item.kpiName, href: "/kpis" })),
      ...departments.map((item) => ({ type: "Department", label: item.departmentName, href: "/department-rankings" })),
      ...employees.map((item) => ({ type: "Employee", label: item.name, href: "/employee-rankings" })),
      ...tasks.map((item) => ({ type: "Task", label: item.taskName, href: "/task-tracking" })),
      ...achievements.map((item) => ({ type: "Achievement", label: item.title, href: "/achievements" })),
    ];

    return combined.filter((item) => item.label.toLowerCase().includes(term)).slice(0, 6);
  }, [achievements, departments, employees, kpis, query, tasks]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        type="text"
        placeholder="Search KPIs, departments, employees, tasks, achievements"
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition focus:border-blue-500"
      />
      {query ? (
        <div className="absolute left-0 right-0 top-12 z-40 mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl">
          {results.length > 0 ? results.map((item) => (
            <Link key={`${item.type}-${item.label}`} href={item.href} className="flex items-center justify-between px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5">
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.type}</span>
            </Link>
          )) : <div className="px-4 py-3 text-sm text-slate-400">No matches found.</div>}
        </div>
      ) : null}
    </div>
  );
}
