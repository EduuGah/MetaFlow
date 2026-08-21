/**
 * Esqueletos que copiam a estrutura real de cada tela.
 * Um bloco cinza genérico não ajuda ninguém: o objetivo é que o layout
 * definitivo apareça exatamente onde o esqueleto estava, sem salto (CLS).
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ProjectRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 sm:px-5 py-4">
      <Skeleton className="h-[52px] w-[52px] rounded-full" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md hidden sm:block" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="px-4 sm:px-5 py-4 space-y-2.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="h-[18px] w-[18px] rounded-xs" />
      <Skeleton className="h-3.5 flex-1 max-w-[16rem]" />
    </div>
  );
}
