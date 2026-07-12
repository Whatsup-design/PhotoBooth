import type { Student } from '../types/student'
import { StatusBadge } from './StatusBadge'

type StudentTableProps = {
  students: Student[]
  pendingStudentIds: string[]
  onSelectStudent: (student: Student) => void
  onToggleCome: (student: Student) => void
}

export function StudentTable({ students, pendingStudentIds, onSelectStudent, onToggleCome }: StudentTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:block">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">ID</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Thai nickname</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Nickname</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Paid</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Come</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((student) => {
            const isUpdating = pendingStudentIds.includes(student.id)
            return (
              <tr key={student.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => onSelectStudent(student)}>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">{student.id}</td>
                <td className="px-5 py-4 text-base font-medium text-slate-900">{student.thaiNickname || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{student.nickname || '-'}</td>
                <td className="whitespace-nowrap px-5 py-4"><StatusBadge status="paid" active={student.paid} /></td>
                <td className="whitespace-nowrap px-5 py-4"><StatusBadge status="come" active={student.come} /></td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <button
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                    type="button"
                    disabled={isUpdating}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleCome(student)
                    }}
                  >
                    {isUpdating ? 'Saving...' : student.come ? 'Undo Came' : 'Mark Came'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
