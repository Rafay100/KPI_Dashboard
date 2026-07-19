import { LucideIcon } from "lucide-react";
import { memo } from "react";

interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const ActivityItem = memo(function ActivityItem({
  icon: Icon,
  title,
  description,
  timestamp,
  user,
}: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        <div className="flex items-center space-x-2 mt-1">
          {user && (
            <>
              <span className="text-xs text-gray-500">{user}</span>
              <span className="text-xs text-gray-600">•</span>
            </>
          )}
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
      </div>
    </div>
  );
});

interface ActivityCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}

export const ActivityCard = memo(function ActivityCard({ title, children, loading }: ActivityCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
});

