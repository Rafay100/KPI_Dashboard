"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MENU_ITEMS } from "@/constants/menu";
import {
  LayoutDashboard,
  Target,
  Activity,
  PlusCircle,
  Users,
  Building2,
  Eye,
  CheckSquare,
  Trophy,
  FileText,
  Database,
  Settings
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "executive-overview": LayoutDashboard,
  "kpi-tracking-board": Target,
  "live-kpi-tracking": Activity,
  "create-kpi": PlusCircle,
  "employee-rankings": Users,
  "department-rankings": Building2,
  "kpi-monitoring": Eye,
  "task-tracking": CheckSquare,
  "achievements": Trophy,
  "reports": FileText,
  "data-sources": Database,
  "settings": Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-[#0a0e1a] lg:block hidden">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">KPI Dashboard</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {MENU_ITEMS.map((item) => {
            const Icon = iconMap[item.id];
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
