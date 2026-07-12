export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-950">No students found</h3>
      <p className="mt-2 text-sm text-slate-600">Check the ID or nickname and try again.</p>
    </div>
  )
}
