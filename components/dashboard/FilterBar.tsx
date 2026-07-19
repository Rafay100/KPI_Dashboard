"use client";

import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FilterBarProps {
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
}

export function FilterBar({ onRefresh, onSearch, loading }: FilterBarProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search KPIs, employees, departments..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Timeline Filter */}
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto">
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        {/* Department Filter */}
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto">
          <option value="">All Departments</option>
          <option value="sales">Sales</option>
          <option value="marketing">Marketing</option>
          <option value="engineering">Engineering</option>
          <option value="support">Support</option>
        </select>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="default"
          onClick={onRefresh}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

