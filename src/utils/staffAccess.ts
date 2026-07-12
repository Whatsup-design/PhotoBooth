const STAFF_ACCESS_DATE_KEY = 'photobooth_staff_verified_on'

function todayLocalDate() {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 10)
}

export function hasStaffAccess() {
  try {
    return window.localStorage.getItem(STAFF_ACCESS_DATE_KEY) === todayLocalDate()
  } catch {
    return false
  }
}

export function grantStaffAccess() {
  try {
    window.localStorage.setItem(STAFF_ACCESS_DATE_KEY, todayLocalDate())
  } catch {
    // The current page remains usable even if storage is unavailable.
  }
}

export function clearStaffAccess() {
  try {
    window.localStorage.removeItem(STAFF_ACCESS_DATE_KEY)
  } catch {
    // There is no stored access to clear when storage is unavailable.
  }
}
