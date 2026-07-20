import { useEffect, useState, type FormEvent } from 'react'
import type { EmergencyStudentInput } from '../data/studentsApi'

const FRAME_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

type EmergencyStudentDialogProps = {
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onCreate: (input: EmergencyStudentInput) => Promise<void>
}

export function EmergencyStudentDialog({ isOpen, isSaving, onClose, onCreate }: EmergencyStudentDialogProps) {
  const [id, setId] = useState('')
  const [thaiNickname, setThaiNickname] = useState('')
  const [nickname, setNickname] = useState('')
  const [come, setCome] = useState(false)
  const [format, setFormat] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setId('')
      setThaiNickname('')
      setNickname('')
      setCome(false)
      setFormat(null)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      await onCreate({
        id,
        thaiNickname,
        nickname,
        come,
        ...(come && format ? { format } : {}),
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add emergency student')
    }
  }

  return (
    <div className="animate-overlay-fade-in fixed inset-0 z-30 grid place-items-center bg-slate-950/25 p-4" role="dialog" aria-modal="true" aria-labelledby="emergency-student-title" onClick={() => !isSaving && onClose()}>
      <form className="animate-panel-slide-in flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-5">
          <h2 id="emergency-student-title" className="text-lg font-semibold text-slate-950">Emergency student</h2>
          <p className="mt-1 text-sm text-slate-600">A paid student will be added to the last row of the student list.</p>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Student ID
            <input className="h-11 rounded-md border border-slate-300 px-3 text-base font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={id} onChange={(event) => setId(event.target.value)} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Thai nickname
            <input className="h-11 rounded-md border border-slate-300 px-3 text-base font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={thaiNickname} onChange={(event) => setThaiNickname(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
            Nickname
            <input className="h-11 rounded-md border border-slate-300 px-3 text-base font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-slate-700">Arrival status</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className={`h-11 rounded-md border text-sm font-semibold transition ${!come ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`} type="button" disabled={isSaving} onClick={() => { setCome(false); setFormat(null) }}>
                Not Came
              </button>
              <button className={`h-11 rounded-md border text-sm font-semibold transition ${come ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`} type="button" disabled={isSaving} onClick={() => setCome(true)}>
                Came
              </button>
            </div>
          </fieldset>

          {come ? (
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold text-slate-700">Photo frame</legend>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {FRAME_OPTIONS.map((frame) => {
                  const isSelected = format === frame
                  return (
                    <button key={frame} className={`overflow-hidden rounded-md border text-left transition focus:outline-none focus:ring-2 focus:ring-slate-400 ${isSelected ? 'border-slate-950 ring-2 ring-slate-950' : 'border-slate-200 hover:border-slate-400'}`} type="button" aria-pressed={isSelected} disabled={isSaving} onClick={() => setFormat(frame)}>
                      <img className="h-20 w-full bg-slate-100 object-contain" src={`/frame/Frame${frame}.png`} alt={`Format ${frame}`} />
                      <span className="block border-t border-slate-100 px-2 py-1.5 text-center text-xs font-semibold text-slate-700">Format {frame}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ) : null}

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800 sm:col-span-2" role="alert">{error}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-5">
          <button className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={isSaving} onClick={onClose}>Cancel</button>
          <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400" type="submit" disabled={isSaving || !id.trim() || (come && !format)}>{isSaving ? 'Adding...' : 'Add student'}</button>
        </div>
      </form>
    </div>
  )
}
