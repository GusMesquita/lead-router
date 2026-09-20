export function SkeletonRows() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-surface-hover" />
          <div className="h-3 w-32 rounded bg-surface-hover" />
          <div className="h-3 w-20 rounded bg-surface-hover" />
          <div className="ml-auto h-3 w-24 rounded bg-surface-hover" />
        </div>
      ))}
    </div>
  );
}
