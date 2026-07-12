import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

type VerifyRequest = IncomingMessage & {
  body?: unknown
}

type VerifyResponse = ServerResponse & {
  status: (statusCode: number) => VerifyResponse
  json: (body: unknown) => void
}

function getPassword(body: unknown) {
  const payload = typeof body === 'string' ? JSON.parse(body) : body

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const password = (payload as Record<string, unknown>).password
  return typeof password === 'string' ? password : ''
}

export default function handler(request: VerifyRequest, response: VerifyResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const configuredPassword = process.env.ADMIN_MASTER_PASSWORD

  if (!configuredPassword) {
    return response.status(500).json({ success: false, error: 'Admin password is not configured' })
  }

  try {
    const submittedPassword = getPassword(request.body)
    const expected = Buffer.from(configuredPassword)
    const submitted = Buffer.from(submittedPassword)
    const isValid = expected.length === submitted.length && timingSafeEqual(expected, submitted)

    if (!isValid) {
      return response.status(401).json({ success: false, error: 'Invalid password' })
    }

    return response.status(200).json({ success: true })
  } catch {
    return response.status(400).json({ success: false, error: 'Invalid password' })
  }
}
