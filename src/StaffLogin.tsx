import { useEffect, useState, type FormEvent } from 'react'
import { clearStaffAccess, grantStaffAccess, hasStaffAccess } from './utils/staffAccess'

type VerifyResponse = {
  success: boolean
  error?: string
}

async function readVerifyResponse(response: Response): Promise<VerifyResponse> {
  const body = await response.text()

  if (!body.trim()) {
    throw new Error(`Staff verification returned an empty response (${response.status})`)
  }

  try {
    return JSON.parse(body) as VerifyResponse
  } catch {
    throw new Error(`Staff verification returned an invalid response (${response.status})`)
  }
}

export function StaffLogin() {
  const [password, setPassword] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasStaffAccess()) {
      window.location.replace('/staff')
    }
  }, [])

  const verifyPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsChecking(true)

    try {
      const response = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await readVerifyResponse(response)

      if (!response.ok || !result.success) {
        clearStaffAccess()
        throw new Error(result.error || 'Invalid daily password')
      }

      grantStaffAccess()
      setPassword('')
      window.location.replace('/staff')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify daily password')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="staff-login-title">
          <p className="text-sm font-semibold text-slate-500">Photobooth staff</p>
          <h1 id="staff-login-title" className="mt-1 text-2xl font-semibold">Daily Staff Password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter today&apos;s password to open the student queue.</p>

          <form className="mt-6 grid gap-4" onSubmit={verifyPassword}>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Daily password
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

            <button
              className="h-12 rounded-lg bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              type="submit"
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Open Student Queue'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
