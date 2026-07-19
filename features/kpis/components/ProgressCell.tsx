import { cn } from "@/lib/utils";

interface ProgressCellProps {
  actual: number;
  target: number;
  score: number;
}

export function ProgressCell({ actual, target, score }: ProgressCellProps) {
  const percentage = Math.min(Math.max(score, 0), 100);

  const getColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {actual} / {target}
        </span>
        <span className="font-semibold text-white">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full transition-all duration-300", getColor(score))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

