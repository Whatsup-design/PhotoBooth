import type { Student } from '../types/student'

export type StudentStatusFilter = 'all' | 'paid' | 'unpaid' | 'came' | 'not-came'
export type StudentTimeSort = 'none' | 'oldest' | 'newest'

function localDateKey(timestamp: string) {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function timestampValue(timestamp?: string) {
  if (!timestamp) {
    return Number.NaN
  }

  return new Date(timestamp).getTime()
}

export function filterStudents(
  students: Student[],
  statusFilter: StudentStatusFilter,
  search: string,
  dateFilter: string,
  timeSort: StudentTimeSort,
) {
  const normalizedSearch = search.trim().toLocaleLowerCase()

  const filtered = students.filter((student) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && student.paid) ||
      (statusFilter === 'unpaid' && !student.paid) ||
      (statusFilter === 'came' && student.come) ||
      (statusFilter === 'not-came' && !student.come)

    const matchesSearch =
      normalizedSearch === '' ||
      [student.id, student.thaiNickname, student.nickname]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedSearch)

    const matchesDate = !dateFilter || (
      student.updatedAt !== undefined && localDateKey(student.updatedAt) === dateFilter
    )

    return matchesStatus && matchesSearch && matchesDate
  })

  if (timeSort === 'none') {
    return filtered
  }

  return filtered
    .filter((student) => Number.isFinite(timestampValue(student.updatedAt)))
    .sort((first, second) => {
      const difference = timestampValue(first.updatedAt) - timestampValue(second.updatedAt)
      return timeSort === 'oldest' ? difference : -difference
    })
}
