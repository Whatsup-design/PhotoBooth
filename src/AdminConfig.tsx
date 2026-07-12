import { useState, type FormEvent } from 'react'

type VerifyResponse = {
  success: boolean
  error?: string
}

async function readVerifyResponse(response: Response): Promise<VerifyResponse> {
  const body = await response.text()

  if (!body.trim()) {
    throw new Error(`Admin verification service returned an empty response (${response.status})`)
  }

  try {
    return JSON.parse(body) as VerifyResponse
  } catch {
    throw new Error(`Admin verification service returned an invalid response (${response.status})`)
  }
}

function createDailyCode() {
  const value = window.crypto.getRandomValues(new Uint32Array(1))[0] % 10_000
  return `KJ-${String(value).padStart(4, '0')}`
}

export function AdminConfig() {
  const [password, setPassword] = useState('')
  const [dailyCode, setDailyCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const verifyPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await readVerifyResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid password')
      }

      setIsVerified(true)
      setPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify password')
    } finally {
      setIsLoading(false)
    }
  }

  const saveDailyCode = () => {
    if (!dailyCode.trim()) {
      setError('Enter a daily staff code first')
      return
    }

    setError('')
    setSaveMessage('Daily code saving will be connected to the admin API next.')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        {!isVerified ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="admin-access-title">
            <p className="text-sm font-semibold text-slate-500">Admin only</p>
            <h1 id="admin-access-title" className="mt-1 text-2xl font-semibold">Admin Config</h1>
            <p className="mt-2 text-sm text-slate-600">Enter the admin master password to continue.</p>

            <form className="mt-6 grid gap-4" onSubmit={verifyPassword}>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Master password
                <input
                  className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">{error}</p> : null}

              <button className="h-12 rounded-lg bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400" type="submit" disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="admin-config-title">
            <p className="text-sm font-semibold text-emerald-700">Admin verified</p>
            <h1 id="admin-config-title" className="mt-1 text-2xl font-semibold">Admin Config</h1>
            <p className="mt-2 text-sm text-slate-600">Create the code staff use for daily check-in.</p>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-base font-semibold text-slate-950">Daily Staff Code</h2>
              <p className="mt-1 text-sm text-amber-800">This is for staff check-in only. It is not the admin master password.</p>

              <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-700">
                Daily code
                <input
                  className="h-12 rounded-lg border border-slate-300 bg-white px-3 font-mono text-base uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  type="text"
                  placeholder="KJ-1234"
                  value={dailyCode}
                  onChange={(event) => {
                    setDailyCode(event.target.value.toUpperCase())
                    setSaveMessage('')
                  }}
                />
              </label>

              {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">{error}</p> : null}
              {saveMessage ? <p className="mt-3 rounded-md bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">{saveMessage}</p> : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" type="button" onClick={() => {
                  setDailyCode(createDailyCode())
                  setSaveMessage('')
                  setError('')
                }}>
                  Generate Random Code
                </button>
                <button className="h-11 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800" type="button" onClick={saveDailyCode}>
                  Save Daily Code
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
