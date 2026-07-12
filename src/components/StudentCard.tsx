import type { Student } from '../types/student'
import { StatusBadge } from './StatusBadge'

type StudentCardProps = {
  student: Student
  isUpdating: boolean
  onClick: (student: Student) => void
  onToggleCome: (student: Student) => void
}

export function StudentCard({ student, isUpdating, onClick, onToggleCome }: StudentCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <button type="button" className="w-full text-left focus:outline-none focus:ring-2 focus:ring-slate-300" onClick={() => onClick(student)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-500">ID {student.id}</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">{student.thaiNickname || '-'}</h3>
            <p className="mt-0.5 truncate text-sm text-slate-600">{student.nickname || '-'}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status="paid" active={student.paid} />
            <StatusBadge status="come" active={student.come} />
          </div>
        </div>
      </button>
      <button
        className={`mt-4 h-11 w-full rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
          student.come ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300' : 'bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-400'
        } disabled:cursor-wait disabled:opacity-60`}
        type="button"
        disabled={isUpdating}
        onClick={() => onToggleCome(student)}
      >
        {isUpdating ? 'Saving...' : student.come ? 'Undo Came' : 'Mark Came'}
      </button>
    </article>
  )
}
