import type { Student } from '../types/student'

const API_URL = import.meta.env.VITE_STUDENTS_API_URL?.trim() || ''
const REQUEST_TIMEOUT_MS = 12_000

type StudentApiResponse =
  | {
      success: true
      action?: string
      count?: number
      data: unknown[]
    }
  | {
      success: false
      error?: string
    }

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  return typeof value === 'string' && value.trim().toLowerCase() === 'true'
}

function toFormat(value: unknown) {
  const format = Number(value)
  return Number.isInteger(format) && format >= 1 && format <= 11 ? format : undefined
}

function normalizeStudent(row: unknown): Student {
  const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
  const rowNumber = Number(record.rowNumber)

  return {
    ...(Number.isFinite(rowNumber) && rowNumber > 0 ? { rowNumber } : {}),
    id: String(record.id ?? '').trim(),
    thaiNickname: String(record.thaiNickname ?? '').trim(),
    nickname: String(record.nickname ?? '').trim(),
    paid: toBoolean(record.paid),
    come: toBoolean(record.come),
    format: toFormat(record.format),
  }
}

async function readApiResponse(response: Response): Promise<StudentApiResponse> {
  const responseText = await response.text()

  try {
    return JSON.parse(responseText) as StudentApiResponse
  } catch {
    throw new Error('Student API did not return JSON')
  }
}

function getErrorMessage(payload: StudentApiResponse, fallback: string) {
  return payload.success ? fallback : payload.error || fallback
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Student API request timed out. Please try again.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchStudentsFromApi(): Promise<Student[]> {
  if (!API_URL) {
    throw new Error('Missing VITE_STUDENTS_API_URL environment variable')
  }

  const url = new URL(API_URL)
  url.searchParams.set('action', 'all')

  const response = await fetchWithTimeout(url, { method: 'GET' })

  if (!response.ok) {
    throw new Error(`Student API returned ${response.status}`)
  }

  const payload = await readApiResponse(response)

  if (!payload.success) {
    throw new Error(getErrorMessage(payload, 'Student API returned an error'))
  }

  return payload.data.map(normalizeStudent).filter((student) => student.id !== '')
}

export async function updateCome(id: string, come: boolean, format?: number) {
  if (!API_URL) {
    throw new Error('Missing VITE_STUDENTS_API_URL environment variable')
  }

  const hasValidFormat = typeof format === 'number'
    && Number.isInteger(format)
    && format >= 1
    && format <= 11

  if (come && !hasValidFormat) {
    throw new Error('Select a valid frame format')
  }

  const response = await fetchWithTimeout(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'updateCome',
      id: String(id),
      come,
      ...(come && hasValidFormat ? { format } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`Student update API returned ${response.status}`)
  }

  const payload = await readApiResponse(response)

  if (!payload.success) {
    throw new Error(getErrorMessage(payload, 'Could not update student arrival status'))
  }

  return payload.data
}
