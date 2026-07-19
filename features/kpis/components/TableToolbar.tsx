"use client";

import { Search, Plus, RefreshCw, Download, Filter, Columns } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  loading,
}: TableToolbarProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search KPIs, employees, departments..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create KPI
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>

          <Button variant="outline" size="sm">
            <Columns className="mr-2 h-4 w-4" />
            Columns
          </Button>
        </div>
      </div>
    </div>
  );
}

