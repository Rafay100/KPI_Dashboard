import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface AlertCardProps {
  title: string;
  message: string;
  icon: LucideIcon;
  severity: "info" | "warning" | "error" | "success";
  timestamp?: string;
}

const severityStyles = {
  info: {
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "text-blue-400",
    text: "text-blue-300",
  },
  warning: {
    bg: "bg-orange-500/10 border-orange-500/20",
    icon: "text-orange-400",
    text: "text-orange-300",
  },
  error: {
    bg: "bg-red-500/10 border-red-500/20",
    icon: "text-red-400",
    text: "text-red-300",
  },
  success: {
    bg: "bg-green-500/10 border-green-500/20",
    icon: "text-green-400",
    text: "text-green-300",
  },
};

export const AlertCard = memo(function AlertCard({
  title,
  message,
  icon: Icon,
  severity,
  timestamp,
}: AlertCardProps) {
  const styles = severityStyles[severity];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all hover:shadow-lg",
        styles.bg
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("mt-0.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className={cn("mt-1 text-sm", styles.text)}>{message}</p>
          {timestamp && (
            <p className="mt-2 text-xs text-gray-500">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  );
});

