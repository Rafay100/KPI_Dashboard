import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "purple" | "orange" | "red";
  loading?: boolean;
}

const colorClasses = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
};

export const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
        <div className="h-8 w-32 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass-card group p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>

          {trend && (
            <div className="mt-2 flex items-center space-x-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg",
            colorClasses[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
});
