export function Skeleton({ className = '' }) {
  return <div className={`lex-shimmer rounded-lg bg-lex-800 ${className}`} />
}

export function CardSkeletonGrid({ count = 8, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-lex-700 bg-lex-850 shadow-card">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 rounded-xl border border-lex-700 bg-lex-850 p-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
