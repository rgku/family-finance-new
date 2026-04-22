export function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-container-high rounded w-3/4" />
              <div className="h-3 bg-surface-container-high rounded w-1/2" />
            </div>
            <div className="h-4 bg-surface-container-high rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TransactionTableSkeleton() {
  return (
    <div className="animate-pulse bg-surface-container rounded-lg overflow-hidden">
      <div className="bg-surface-container-low p-4">
        <div className="flex gap-4">
          <div className="h-4 bg-surface-container-high rounded w-1/4" />
          <div className="h-4 bg-surface-container-high rounded w-1/6" />
          <div className="h-4 bg-surface-container-high rounded w-1/6" />
          <div className="h-4 bg-surface-container-high rounded w-1/6" />
          <div className="h-4 bg-surface-container-high rounded w-1/6" />
        </div>
      </div>
      <div className="space-y-px">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex gap-4 border-t border-surface-container">
            <div className="h-4 bg-surface-container-high rounded w-1/4" />
            <div className="h-4 bg-surface-container-high rounded w-1/6" />
            <div className="h-4 bg-surface-container-high rounded w-1/6" />
            <div className="h-4 bg-surface-container-high rounded w-1/6" />
            <div className="h-4 bg-surface-container-high rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-surface-container-high rounded-full" />
            <div className="h-4 bg-surface-container-high rounded w-1/2" />
          </div>
          <div className="h-2 bg-surface-container-high rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 bg-surface-container-high rounded w-1/3" />
            <div className="h-3 bg-surface-container-high rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-surface-container-high rounded w-1/3" />
            <div className="h-4 bg-surface-container-high rounded w-1/4" />
          </div>
          <div className="h-2 bg-surface-container-high rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container rounded-lg p-6 space-y-3">
          <div className="h-3 bg-surface-container-high rounded w-1/2" />
          <div className="h-8 bg-surface-container-high rounded w-3/4" />
          <div className="h-6 bg-surface-container-high rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse bg-surface-container rounded-lg p-6">
      <div className="h-4 bg-surface-container-high rounded w-1/3 mb-4" />
      <div className="h-64 bg-surface-container-high rounded" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-surface-container-high rounded w-1/2" />
        <div className="h-4 bg-surface-container-high rounded w-1/3" />
      </div>
      <DashboardStatsSkeleton />
      <ChartSkeleton />
    </div>
  );
}
