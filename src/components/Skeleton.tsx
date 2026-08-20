export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border border-slate-100">
      <div className="flex items-center gap-3 w-full">
        <Skeleton className="h-4 w-4 rounded-xs" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}