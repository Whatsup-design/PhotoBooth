type StatusBadgeProps = {
  status: 'paid' | 'come'
  active: boolean
}

export function StatusBadge({ status, active }: StatusBadgeProps) {
  const isPaid = status === 'paid'
  const label = isPaid ? (active ? 'Paid' : 'Unpaid') : active ? 'Came' : 'Not Came'
  const colors = active
    ? isPaid
      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
      : 'bg-sky-100 text-sky-800 ring-sky-200'
    : isPaid
      ? 'bg-amber-100 text-amber-900 ring-amber-200'
      : 'bg-slate-100 text-slate-700 ring-slate-200'

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colors}`}>{label}</span>
}
