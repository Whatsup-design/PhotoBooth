import { useEffect, useState } from 'react'
import App from './App'
import { hasStaffAccess } from './utils/staffAccess'

export function StaffDashboard() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (!hasStaffAccess()) {
      window.location.replace('/')
      return
    }

    setHasAccess(true)
  }, [])

  if (!hasAccess) {
    return <main className="min-h-screen bg-slate-100" aria-busy="true" />
  }

  return <App />
}
