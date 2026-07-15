import { ReactNode, memo } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  children,
  className,
  loading,
}: ChartCardProps) {
  if (loading) {
    return (
      <div className={cn("glass-card p-6", className)}>
        <div className="h-6 w-48 bg-white/10 rounded mb-2 animate-pulse"></div>
        {subtitle && (
          <div className="h-4 w-32 bg-white/10 rounded mb-6 animate-pulse"></div>
        )}
        <div className="h-64 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
});
