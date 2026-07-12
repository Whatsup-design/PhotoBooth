import { randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { callConfigApi, getConfigApiEnvironment, logConfigServiceError } from '../../server/configApi.js'

type StaffRequest = IncomingMessage & {
  body?: unknown
}

type StaffResponse = ServerResponse & {
  status: (statusCode: number) => StaffResponse
  json: (body: unknown) => void
}

function readPassword(body: unknown) {
  const payload = typeof body === 'string' ? JSON.parse(body) : body

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const password = (payload as Record<string, unknown>).password
  return typeof password === 'string' ? password.trim() : ''
}

function passwordsMatch(expectedPassword: string, submittedPassword: string) {
  const expected = Buffer.from(expectedPassword)
  const submitted = Buffer.from(submittedPassword)
  return expected.length === submitted.length && timingSafeEqual(expected, submitted)
}

export default async function handler(request: StaffRequest, response: StaffResponse) {
  const requestId = randomUUID()

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const submittedPassword = readPassword(request.body)

    if (!submittedPassword) {
      return response.status(400).json({ success: false, error: 'Enter the daily password' })
    }

    const { apiUrl, secret } = getConfigApiEnvironment()

    if (!apiUrl || !secret) {
      console.error('Staff verification is not configured', {
        requestId,
        hasApiUrl: Boolean(apiUrl),
        hasSecret: Boolean(secret),
      })
      return response.status(500).json({ success: false, error: 'Staff verification is not configured' })
    }

    const result = await callConfigApi(apiUrl, secret, 'getPassword', requestId)

    if (!result.success || typeof result.password !== 'string') {
      console.warn('Staff verification received an unsuccessful config response', { requestId })
      return response.status(502).json({ success: false, error: 'Could not verify daily password', requestId })
    }

    if (!passwordsMatch(result.password, submittedPassword)) {
      return response.status(401).json({ success: false, error: 'Invalid daily password' })
    }

    return response.status(200).json({ success: true })
  } catch (error) {
    logConfigServiceError(requestId, 'staffVerify', error)
    return response.status(502).json({
      success: false,
      error: 'Could not verify daily password',
      requestId,
    })
  }
}
