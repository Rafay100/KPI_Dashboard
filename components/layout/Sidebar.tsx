"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/constants/menu";
import {
  LayoutDashboard,
  Target,
  Users,
  Building2,
  Trophy,
  CheckSquare,
  Columns3,
  Calendar,
  BarChart3,
  LineChart,
  Layers,
  FileText,
  Database,
  ArrowDownToLine,
  Settings,
  X,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  kpis: Target,
  "kpi-monitoring": Target,
  employees: Users,
  departments: Building2,
  rankings: Trophy,
  tasks: CheckSquare,
  kanban: Columns3,
  "task-calendar": Calendar,
  "kpi-analytics": BarChart3,
  "employee-analytics": LineChart,
  "department-analytics": Layers,
  reports: FileText,
  "data-sources": Database,
  "import-mapping": ArrowDownToLine,
  settings: Settings,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    // Match exact or related sub-routes
    if (href === "/kpi-monitoring" || href === "/kpis") {
      return (
        pathname === "/kpi-monitoring" ||
        pathname === "/kpis" ||
        pathname.startsWith("/kpis/") ||
        pathname === "/tracking-boards" ||
        pathname === "/kpi-tracking-board" ||
        pathname === "/live-kpi-tracking" ||
        pathname === "/create-kpi"
      );
    }
    if (href === "/departments") {
      return (
        pathname === "/departments" ||
        pathname.startsWith("/departments/") ||
        pathname === "/department-rankings" ||
        pathname.startsWith("/department-rankings/") ||
        pathname === "/department-leaderboard"
      );
    }
    if (href === "/rankings") {
      return (
        pathname === "/rankings" ||
        pathname === "/employee-rankings" ||
        pathname === "/achievements"
      );
    }
    if (href === "/tasks") {
      return (
        pathname === "/tasks" ||
        pathname.startsWith("/tasks/") ||
        pathname === "/task-tracking" ||
        pathname === "/task-analytics"
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#080d1a] border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80 bg-[#080d1a]/95">
        <Link href="/" className="flex items-center space-x-3 group" onClick={onCloseMobile}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              KPI Pulse
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Enterprise Dashboard
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4 scrollbar-thin scrollbar-thumb-slate-800">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = iconMap[item.id] || Target;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                      active
                        ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20 shadow-sm shadow-blue-500/10"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-blue-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="border-t border-slate-800/80 p-3.5 bg-slate-900/40">
        <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">System Live</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v2.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 lg:block">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] shadow-2xl transition-transform">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
