import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "not-started" | "in-progress" | "at-risk" | "completed" | "overdue";
}

const statusConfig = {
  "not-started": {
    label: "Not Started",
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  "at-risk": {
    label: "At Risk",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

