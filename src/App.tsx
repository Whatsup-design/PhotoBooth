import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { FilterBar } from './components/FilterBar'
import { StudentCard } from './components/StudentCard'
import { StudentDetail } from './components/StudentDetail'
import { StudentTable } from './components/StudentTable'
import { MobileStatsStrip, SummaryCards } from './components/SummaryCards'
import { fetchStudentsFromApi, updateCome } from './data/studentsApi'
import { students } from './data/mockStudents'
import type { Student } from './types/student'
import { filterStudents, type StudentStatusFilter } from './utils/filterStudents'

const STUDENT_CACHE_KEY = 'photobooth-all-students-cache-v1'

function isStudent(value: unknown): value is Student {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.thaiNickname === 'string' &&
    typeof record.nickname === 'string' &&
    typeof record.paid === 'boolean' &&
    typeof record.come === 'boolean'
  )
}

function getCachedStudents() {
  try {
    const cachedStudents = window.localStorage.getItem(STUDENT_CACHE_KEY)
    const parsed = cachedStudents ? (JSON.parse(cachedStudents) as unknown) : null
    return Array.isArray(parsed) && parsed.every(isStudent) ? parsed : students
  } catch {
    return students
  }
}

function cacheStudents(nextStudents: Student[]) {
  try {
    window.localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(nextStudents))
  } catch {
    // The cache is optional; live loading still works when storage is unavailable.
  }
}

function ReloadIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function App() {
  const [studentRecords, setStudentRecords] = useState<Student[]>(getCachedStudents)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [studentLoadError, setStudentLoadError] = useState('')
  const [studentUpdateError, setStudentUpdateError] = useState('')
  const [pendingStudentIds, setPendingStudentIds] = useState<string[]>([])

  const loadStudents = async () => {
    setIsLoadingStudents(true)

    try {
      const apiStudents = await fetchStudentsFromApi()
      setStudentRecords(apiStudents)
      cacheStudents(apiStudents)
      setSelectedStudent((student) =>
        student ? apiStudents.find((apiStudent) => apiStudent.id === student.id) || null : null,
      )
      setStudentLoadError('')
    } catch (error) {
      setStudentLoadError(error instanceof Error ? error.message : 'Could not load students')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filteredStudents = useMemo(
    () => filterStudents(studentRecords, statusFilter, search),
    [search, statusFilter, studentRecords],
  )
  const paidStudents = studentRecords.filter((student) => student.paid).length
  const cameStudents = studentRecords.filter((student) => student.come).length

  const toggleStudentCome = async (student: Student) => {
    if (pendingStudentIds.includes(student.id)) {
      return
    }

    if (!student.paid) {
      setStudentUpdateError(`${student.thaiNickname || student.nickname || student.id} has not paid yet and cannot be marked as came.`)
      return
    }

    const nextCome = !student.come
    setStudentUpdateError('')
    setPendingStudentIds((currentIds) => [...currentIds, student.id])

    try {
      await updateCome(student.id, nextCome)

      setStudentRecords((currentStudents) => {
        const nextStudents = currentStudents.map((currentStudent) =>
          currentStudent.id === student.id ? { ...currentStudent, come: nextCome } : currentStudent,
        )
        cacheStudents(nextStudents)
        return nextStudents
      })
      setSelectedStudent((currentStudent) =>
        currentStudent?.id === student.id ? { ...currentStudent, come: nextCome } : currentStudent,
      )
    } catch (error) {
      setStudentUpdateError(error instanceof Error ? error.message : 'Could not update student arrival status')
    } finally {
      setPendingStudentIds((currentIds) => currentIds.filter((id) => id !== student.id))
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">Photobooth staff</p>
            <h1 className="truncate text-xl font-semibold">Student Queue</h1>
            <p className="mt-0.5 text-sm text-slate-600">{filteredStudents.length} results</p>
          </div>
          <button
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            type="button"
            aria-label="Reload students"
            title="Reload students"
            disabled={isLoadingStudents}
            onClick={loadStudents}
          >
            <ReloadIcon spinning={isLoadingStudents} />
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5 lg:px-8">
        <header className="hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:block">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">Student Queue</h1>
              <p className="mt-2 text-base text-slate-600">Search payment and arrival status from Google Sheets</p>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              type="button"
              disabled={isLoadingStudents}
              onClick={loadStudents}
            >
              <ReloadIcon spinning={isLoadingStudents} />
              {isLoadingStudents ? 'Loading' : 'Reload'}
            </button>
          </div>
        </header>

        <SummaryCards total={studentRecords.length} paid={paidStudents} came={cameStudents} shown={filteredStudents.length} />
        <MobileStatsStrip total={studentRecords.length} paid={paidStudents} came={cameStudents} shown={filteredStudents.length} />

        <div className="sticky top-[85px] z-10 sm:static">
          <FilterBar
            search={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
            onReset={() => {
              setSearch('')
              setStatusFilter('all')
            }}
          />
        </div>

        <section className="flex flex-col gap-3" aria-label="Student list">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Students</h2>
            <p className="text-sm text-slate-600">
              {isLoadingStudents ? 'Syncing with Google Sheets' : `${filteredStudents.length} students shown`}
            </p>
          </div>

          {studentLoadError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              Live data unavailable. Showing the last saved list. {studentLoadError}
            </div>
          ) : null}

          {studentUpdateError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
              Could not update arrival status. {studentUpdateError}
            </div>
          ) : null}

          {filteredStudents.length > 0 ? (
            <>
              <StudentTable
                students={filteredStudents}
                pendingStudentIds={pendingStudentIds}
                onSelectStudent={setSelectedStudent}
                onToggleCome={toggleStudentCome}
              />
              <div className="grid gap-3 md:grid-cols-2 lg:hidden">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isUpdating={pendingStudentIds.includes(student.id)}
                    onClick={setSelectedStudent}
                    onToggleCome={toggleStudentCome}
                  />
                ))}
              </div>
            </>
          ) : isLoadingStudents ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm font-medium text-slate-600 shadow-sm">
              Loading students...
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>

      <StudentDetail
        student={selectedStudent}
        isUpdating={selectedStudent ? pendingStudentIds.includes(selectedStudent.id) : false}
        onClose={() => setSelectedStudent(null)}
        onToggleCome={toggleStudentCome}
      />
    </main>
  )
}

export default App
