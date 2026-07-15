/**
 * Loading Skeleton Components
 * Provide visual feedback while content is loading
 */

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-dark-700 rounded"></div>
        <div className="w-10 h-10 bg-dark-700 rounded-lg"></div>
      </div>
      <div className="h-8 w-20 bg-dark-700 rounded mb-2"></div>
      <div className="h-3 w-16 bg-dark-700 rounded"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-64 animate-pulse">
      <div className="h-full bg-dark-700/30 rounded-lg flex items-end justify-around p-4 gap-2">
        {[40, 60, 45, 80, 55, 70].map((height, i) => (
          <div
            key={i}
            className="bg-dark-600/50 rounded-t w-full"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-dark-700 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-dark-700 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-dark-700 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-dark-700 rounded"></div>
      </td>
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-dark-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 w-32 bg-dark-700 rounded mb-2"></div>
          <div className="h-3 w-24 bg-dark-700 rounded"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-dark-700 rounded"></div>
        <div className="h-3 w-4/5 bg-dark-700 rounded"></div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 bg-dark-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 w-48 bg-dark-700 rounded mb-2"></div>
        <div className="h-3 w-32 bg-dark-700 rounded"></div>
      </div>
      <div className="h-6 w-16 bg-dark-700 rounded-full"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="h-5 w-48 bg-dark-700 rounded mb-4 animate-pulse"></div>
          <ChartSkeleton />
        </div>
        <div className="glass-card p-6">
          <div className="h-5 w-48 bg-dark-700 rounded mb-4 animate-pulse"></div>
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-8 w-64 bg-dark-700 rounded mb-2"></div>
      <div className="h-4 w-96 bg-dark-700 rounded"></div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-4 w-32 bg-dark-700 rounded mb-2"></div>
        <div className="h-10 w-full bg-dark-700 rounded"></div>
      </div>
      <div>
        <div className="h-4 w-32 bg-dark-700 rounded mb-2"></div>
        <div className="h-10 w-full bg-dark-700 rounded"></div>
      </div>
      <div>
        <div className="h-4 w-32 bg-dark-700 rounded mb-2"></div>
        <div className="h-24 w-full bg-dark-700 rounded"></div>
      </div>
      <div className="h-10 w-32 bg-dark-700 rounded"></div>
    </div>
  );
}
