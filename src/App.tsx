import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { FilterBar } from './components/FilterBar'
import { StudentCard } from './components/StudentCard'
import { StudentDetail } from './components/StudentDetail'
import { StudentListSkeleton } from './components/StudentListSkeleton'
import { StudentTable } from './components/StudentTable'
import { MobileStatsStrip, SummaryCards } from './components/SummaryCards'
import { fetchStudentsFromApi, updateCome } from './data/studentsApi'
import type { Student } from './types/student'
import { filterStudents, type StudentStatusFilter } from './utils/filterStudents'

const FRAME_OPTIONS = Array.from({ length: 11 }, (_, index) => index + 1)

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
  const [studentRecords, setStudentRecords] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [studentLoadError, setStudentLoadError] = useState('')
  const [studentUpdateError, setStudentUpdateError] = useState('')
  const [pendingStudentIds, setPendingStudentIds] = useState<string[]>([])
  const [studentToMarkCame, setStudentToMarkCame] = useState<Student | null>(null)
  const [studentToMarkNotCame, setStudentToMarkNotCame] = useState<Student | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null)

  const loadStudents = async () => {
    setIsLoadingStudents(true)
    setStudentLoadError('')
    setStudentRecords([])
    setSelectedStudent(null)

    try {
      const apiStudents = await fetchStudentsFromApi()
      setStudentRecords(apiStudents)
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

  const requestMarkStudentCame = (student: Student) => {
    if (pendingStudentIds.includes(student.id)) {
      return
    }

    if (student.come) {
      setStudentUpdateError('')
      setStudentToMarkNotCame(student)
      return
    }

    if (!student.paid) {
      setStudentUpdateError(`${student.thaiNickname || student.nickname || student.id} has not paid yet and cannot be marked as came.`)
      return
    }

    setStudentUpdateError('')
    setSelectedFormat(null)
    setStudentToMarkCame(student)
  }

  const markStudentCame = async () => {
    const student = studentToMarkCame

    if (!student || !selectedFormat || pendingStudentIds.includes(student.id)) {
      return
    }

    const nextCome = true
    setStudentUpdateError('')
    setPendingStudentIds((currentIds) => [...currentIds, student.id])

    try {
      await updateCome(student.id, nextCome, selectedFormat)

      setStudentRecords((currentStudents) => {
        return currentStudents.map((currentStudent) =>
          currentStudent.id === student.id ? { ...currentStudent, come: nextCome, format: selectedFormat } : currentStudent,
        )
      })
      setSelectedStudent((currentStudent) =>
        currentStudent?.id === student.id ? { ...currentStudent, come: nextCome, format: selectedFormat } : currentStudent,
      )
    } catch (error) {
      setStudentUpdateError(error instanceof Error ? error.message : 'Could not update student arrival status')
      } finally {
        setPendingStudentIds((currentIds) => currentIds.filter((id) => id !== student.id))
        setSelectedFormat(null)
        setStudentToMarkCame(null)
    }
  }

  const markStudentNotCame = async (student: Student) => {
    setStudentUpdateError('')
    setPendingStudentIds((currentIds) => [...currentIds, student.id])

    try {
      await updateCome(student.id, false)

      setStudentRecords((currentStudents) => {
        return currentStudents.map((currentStudent) =>
          currentStudent.id === student.id ? { ...currentStudent, come: false, format: undefined } : currentStudent,
        )
      })
      setSelectedStudent((currentStudent) =>
        currentStudent?.id === student.id ? { ...currentStudent, come: false, format: undefined } : currentStudent,
      )
    } catch (error) {
      setStudentUpdateError(error instanceof Error ? error.message : 'Could not update student arrival status')
    } finally {
      setPendingStudentIds((currentIds) => currentIds.filter((id) => id !== student.id))
      setStudentToMarkNotCame(null)
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm" role="alert">
              <h3 className="text-lg font-semibold text-red-950">Could not fetch students</h3>
              <p className="mt-2 text-sm text-red-800">{studentLoadError}</p>
              <button
                className="mt-4 h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                type="button"
                onClick={loadStudents}
              >
                Try again
              </button>
            </div>
          ) : null}

          {studentUpdateError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
              Could not update arrival status. {studentUpdateError}
            </div>
          ) : null}

          {isLoadingStudents ? (
            <StudentListSkeleton />
          ) : studentLoadError ? null : filteredStudents.length > 0 ? (
            <>
              <StudentTable
                students={filteredStudents}
                pendingStudentIds={pendingStudentIds}
                onSelectStudent={setSelectedStudent}
                onMarkCome={requestMarkStudentCame}
              />
              <div className="grid gap-3 md:grid-cols-2 lg:hidden">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isUpdating={pendingStudentIds.includes(student.id)}
                    onClick={setSelectedStudent}
                    onMarkCome={requestMarkStudentCame}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>

      <StudentDetail
        student={selectedStudent}
        isUpdating={selectedStudent ? pendingStudentIds.includes(selectedStudent.id) : false}
        onClose={() => setSelectedStudent(null)}
        onMarkCome={requestMarkStudentCame}
      />

      {studentToMarkCame ? (
        <div className="animate-overlay-fade-in fixed inset-0 z-30 grid place-items-center bg-slate-950/25 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-came-title" onClick={() => !pendingStudentIds.includes(studentToMarkCame.id) && setStudentToMarkCame(null)}>
          <section className="animate-panel-slide-in flex max-h-[90svh] w-full max-w-3xl flex-col rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 id="confirm-came-title" className="text-lg font-semibold text-slate-950">Choose a photo frame</h2>
            <p className="mt-2 text-sm text-slate-600">
              Select one format for {studentToMarkCame.thaiNickname || studentToMarkCame.nickname || studentToMarkCame.id}. Marking came cannot be undone.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
              {FRAME_OPTIONS.map((format) => {
                const isSelected = selectedFormat === format
                return (
                  <button
                    key={format}
                    className={`overflow-hidden rounded-md border text-left transition focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                      isSelected ? 'border-slate-950 ring-2 ring-slate-950' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={pendingStudentIds.includes(studentToMarkCame.id)}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <img className="h-20 w-full bg-slate-100 object-contain sm:h-24" src={`/frame/Frame${format}.png`} alt={`Format ${format}`} />
                    <span className="block border-t border-slate-100 px-2 py-1.5 text-center text-xs font-semibold text-slate-700">Format {format}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={pendingStudentIds.includes(studentToMarkCame.id)} onClick={() => setStudentToMarkCame(null)}>
                Cancel
              </button>
              <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" type="button" disabled={!selectedFormat || pendingStudentIds.includes(studentToMarkCame.id)} onClick={markStudentCame}>
                {pendingStudentIds.includes(studentToMarkCame.id) ? 'Saving...' : 'Confirm came'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {studentToMarkNotCame ? (
        <div className="animate-overlay-fade-in fixed inset-0 z-30 grid place-items-center bg-slate-950/25 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-not-came-title" onClick={() => !pendingStudentIds.includes(studentToMarkNotCame.id) && setStudentToMarkNotCame(null)}>
          <section className="animate-panel-slide-in w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 id="confirm-not-came-title" className="text-lg font-semibold text-slate-950">Mark student as not came?</h2>
            <p className="mt-2 text-sm text-slate-600">
              {studentToMarkNotCame.thaiNickname || studentToMarkNotCame.nickname || studentToMarkNotCame.id} will be marked as not came and the selected frame will be cleared.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={pendingStudentIds.includes(studentToMarkNotCame.id)} onClick={() => setStudentToMarkNotCame(null)}>
                Keep Came
              </button>
              <button className="h-11 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={pendingStudentIds.includes(studentToMarkNotCame.id)} onClick={() => markStudentNotCame(studentToMarkNotCame)}>
                {pendingStudentIds.includes(studentToMarkNotCame.id) ? 'Saving...' : 'Mark Not Came'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
