import { useState, type FormEvent } from 'react'

type ApiResponse = {
  success: boolean
  password?: string
  error?: string
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const body = await response.text()

  if (!body.trim()) {
    throw new Error(`Admin service returned an empty response (${response.status})`)
  }

  try {
    return JSON.parse(body) as ApiResponse
  } catch {
    throw new Error(`Admin service returned an invalid response (${response.status})`)
  }
}

export function AdminConfig() {
  const [masterPassword, setMasterPassword] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [editingPassword, setEditingPassword] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const loadCurrentPassword = async () => {
    setError('')
    setSuccessMessage('')
    setIsLoadingPassword(true)

    try {
      const response = await fetch('/api/admin/password', { credentials: 'same-origin' })
      const result = await readApiResponse(response)

      if (!response.ok || !result.success || typeof result.password !== 'string') {
        if (response.status === 401) {
          setIsVerified(false)
        }
        throw new Error(result.error || 'Could not load daily password')
      }

      setCurrentPassword(result.password)
      setEditingPassword(result.password)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load daily password')
    } finally {
      setIsLoadingPassword(false)
    }
  }

  const verifyPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsChecking(true)

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword }),
      })
      const result = await readApiResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid password')
      }

      setMasterPassword('')
      setIsVerified(true)
      await loadCurrentPassword()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify password')
    } finally {
      setIsChecking(false)
    }
  }

  const savePassword = async () => {
    const password = editingPassword.trim()

    if (password.length < 4) {
      setError('Daily password must be at least 4 characters')
      return
    }

    setError('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setPassword', password }),
      })
      const result = await readApiResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not save daily password')
      }

      setCurrentPassword(password)
      setEditingPassword(password)
      setSuccessMessage('Daily password saved')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save daily password')
    } finally {
      setIsSaving(false)
    }
  }

  const generatePassword = async () => {
    setError('')
    setSuccessMessage('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generatePassword' }),
      })
      const result = await readApiResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not generate daily password')
      }

      if (typeof result.password === 'string') {
        setCurrentPassword(result.password)
        setEditingPassword(result.password)
      } else {
        await loadCurrentPassword()
      }

      setSuccessMessage('New daily password generated')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate daily password')
    } finally {
      setIsGenerating(false)
    }
  }

  const isBusy = isLoadingPassword || isSaving || isGenerating

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
                  value={masterPassword}
                  onChange={(event) => setMasterPassword(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">{error}</p> : null}

              <button className="h-12 rounded-lg bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400" type="submit" disabled={isChecking}>
                {isChecking ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="admin-config-title">
            <p className="text-sm font-semibold text-emerald-700">Admin verified</p>
            <h1 id="admin-config-title" className="mt-1 text-2xl font-semibold">Admin Config</h1>
            <p className="mt-2 text-sm text-slate-600">Daily password for staff check-in</p>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-base font-semibold text-slate-950">Current Daily Password</h2>
              <p className="mt-1 break-all rounded-md bg-slate-100 px-3 py-2 font-mono text-lg font-semibold text-slate-950">
                {isLoadingPassword ? 'Loading...' : currentPassword || '-'}
              </p>
              <p className="mt-2 text-sm text-amber-800">This code is for staff check-in only. It is not the admin master password.</p>

              <label className="mt-5 grid gap-1.5 text-sm font-semibold text-slate-700">
                Edit daily password
                <input
                  className="h-12 rounded-lg border border-slate-300 bg-white px-3 font-mono text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  type="text"
                  placeholder="KJ-1234"
                  value={editingPassword}
                  disabled={isBusy}
                  onChange={(event) => setEditingPassword(event.target.value)}
                />
              </label>

              {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">{error}</p> : null}
              {successMessage ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{successMessage}</p> : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={isBusy} onClick={generatePassword}>
                  {isGenerating ? 'Generating...' : 'Generate Random Password'}
                </button>
                <button className="h-11 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400" type="button" disabled={isBusy} onClick={savePassword}>
                  {isSaving ? 'Saving...' : 'Save Password'}
                </button>
              </div>
              <button className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" type="button" disabled={isBusy} onClick={loadCurrentPassword}>
                {isLoadingPassword ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
