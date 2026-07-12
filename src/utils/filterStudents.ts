import type { Student } from '../types/student'

export type StudentStatusFilter = 'all' | 'paid' | 'unpaid' | 'came' | 'not-came'

export function filterStudents(students: Student[], statusFilter: StudentStatusFilter, search: string) {
  const normalizedSearch = search.trim().toLocaleLowerCase()

  return students.filter((student) => {
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

    return matchesStatus && matchesSearch
  })
}
