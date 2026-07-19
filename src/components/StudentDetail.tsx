import type { Student } from '../types/student'
import { StatusBadge } from './StatusBadge'

type StudentDetailProps = {
  student: Student | null
  isUpdating: boolean
  onClose: () => void
  onMarkCome: (student: Student) => void
}

export function StudentDetail({ student, isUpdating, onClose, onMarkCome }: StudentDetailProps) {
  if (!student) {
    return null
  }

  const fields = [
    { label: 'ID', value: student.id },
    { label: 'Thai nickname', value: student.thaiNickname || '-' },
    { label: 'Nickname', value: student.nickname || '-' },
    { label: 'Format', value: student.format ?? '-' },
  ]

  return (
    <div className="animate-overlay-fade-in fixed inset-0 z-20 flex items-end bg-slate-950/20 p-0 sm:items-stretch sm:p-6" role="dialog" aria-modal="true" aria-labelledby="student-detail-title" onClick={onClose}>
      <div className="animate-panel-slide-in flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:ml-auto sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-lg" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">Student detail</p>
              <h2 id="student-detail-title" className="mt-1 truncate text-2xl font-semibold text-slate-950">{student.thaiNickname || student.nickname || student.id}</h2>
              <p className="mt-1 text-sm text-slate-600">{student.nickname || '-'}</p>
            </div>
            <button className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" type="button" onClick={onClose}>Close</button>
          </div>
          <div className="mt-4 flex gap-2"><StatusBadge status="paid" active={student.paid} /><StatusBadge status="come" active={student.come} /></div>
          {!student.come ? (
            <button
              className="mt-4 h-12 w-full rounded-lg bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkCome(student)}
            >
              {isUpdating ? 'Saving...' : 'Mark Came'}
            </button>
          ) : (
            <button
              className="mt-4 h-12 w-full rounded-lg border border-red-300 bg-white px-4 text-base font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkCome(student)}
            >
              {isUpdating ? 'Saving...' : 'Mark Not Came'}
            </button>
          )}
        </div>
        <dl className="grid gap-3 overflow-y-auto p-4 sm:p-5">
          {fields.map((field) => (
            <div key={field.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase text-slate-500">{field.label}</dt>
              <dd className="mt-1 break-words text-lg font-medium text-slate-950">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
