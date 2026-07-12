type SummaryCardsProps = {
  total: number
  paid: number
  came: number
  shown: number
}

const items = [
  { key: 'total', label: 'All students', color: 'text-slate-950' },
  { key: 'paid', label: 'Paid', color: 'text-emerald-700' },
  { key: 'came', label: 'Came', color: 'text-sky-700' },
  { key: 'shown', label: 'Results', color: 'text-slate-950' },
] as const

export function SummaryCards({ total, paid, came, shown }: SummaryCardsProps) {
  const values = { total, paid, came, shown }
  return (
    <section className="hidden gap-3 sm:grid sm:grid-cols-4" aria-label="Student summary">
      {items.map((item) => (
        <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className={`mt-2 text-3xl font-semibold ${item.color}`}>{values[item.key]}</p>
        </div>
      ))}
    </section>
  )
}

export function MobileStatsStrip({ total, paid, came, shown }: SummaryCardsProps) {
  const values = { total, paid, came, shown }
  return (
    <section className="grid grid-cols-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:hidden" aria-label="Student summary">
      {items.map((item, index) => (
        <div key={item.key} className={`px-2 py-3 text-center ${index < items.length - 1 ? 'border-r border-slate-100' : ''}`}>
          <p className={`text-lg font-semibold leading-none ${item.color}`}>{values[item.key]}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{item.label}</p>
        </div>
      ))}
    </section>
  )
}
