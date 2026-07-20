import { useState } from 'react'
import type { StudentStatusFilter, StudentTimeSort } from '../utils/filterStudents'

type FilterBarProps = {
  search: string
  statusFilter: StudentStatusFilter
  dateFilter: string
  timeSort: StudentTimeSort
  onSearchChange: (search: string) => void
  onStatusChange: (filter: StudentStatusFilter) => void
  onDateFilterChange: (date: string) => void
  onTimeSortChange: (sort: StudentTimeSort) => void
  onReset: () => void
}

const filterOptions: Array<{ value: StudentStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'came', label: 'Came' },
  { value: 'not-came', label: 'Not Came' },
]

export function FilterBar({ search, statusFilter, dateFilter, timeSort, onSearchChange, onStatusChange, onDateFilterChange, onTimeSortChange, onReset }: FilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const hasActiveFilters = search !== '' || statusFilter !== 'all' || dateFilter !== '' || timeSort !== 'none'

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="Student filters">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search students</span>
          <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
          <input
            className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            type="search"
            inputMode="search"
            placeholder="Search ID or nickname"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        {hasActiveFilters ? (
          <button className="h-12 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300" type="button" onClick={onReset}>
            Clear
          </button>
        ) : null}
        <button className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" type="button" aria-expanded={isAdvancedOpen} onClick={() => setIsAdvancedOpen((isOpen) => !isOpen)}>
          Filters
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Student status filters">
        {filterOptions.map((option) => {
          const isActive = statusFilter === option.value
          return (
            <button
              key={option.value}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                isActive ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              type="button"
              aria-pressed={isActive}
              onClick={() => onStatusChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {isAdvancedOpen ? (
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Came date
            <input className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" type="date" value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Time order
            <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base font-normal text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={timeSort} onChange={(event) => onTimeSortChange(event.target.value as StudentTimeSort)}>
              <option value="none">None</option>
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
      ) : null}
    </section>
  )
}
