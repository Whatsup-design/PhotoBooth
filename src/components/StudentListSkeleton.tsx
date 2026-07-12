export function StudentListSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-label="Loading students" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-3 h-5 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
            </div>
            <div className="h-7 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="mt-5 h-11 w-full rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
