import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { hasAdminSession } from '../../server/adminSession.js'

type AdminRequest = IncomingMessage & {
  body?: unknown
}

type AdminResponse = ServerResponse & {
  status: (statusCode: number) => AdminResponse
  json: (body: unknown) => void
}

type ConfigResponse = {
  success: boolean
  password?: string
  error?: string
}

class ConfigServiceError extends Error {
  status?: number
  contentType?: string
  responseLength?: number

  constructor(message: string, details: { status?: number; contentType?: string; responseLength?: number } = {}) {
    super(message)
    this.status = details.status
    this.contentType = details.contentType
    this.responseLength = details.responseLength
  }
}

function readBody(body: unknown) {
  return typeof body === 'string' ? JSON.parse(body) : body
}

function getConfiguration() {
  const apiUrl = process.env.GOOGLE_CONFIG_API_URL?.trim()
  const secret = process.env.GOOGLE_CONFIG_API_SECRET?.trim()

  return { apiUrl, secret }
}

async function readConfigResponse(response: Response): Promise<ConfigResponse> {
  const text = await response.text()
  const details = {
    status: response.status,
    contentType: response.headers.get('content-type') || 'unknown',
    responseLength: text.length,
  }

  if (!response.ok) {
    throw new ConfigServiceError('Config service returned an HTTP error', details)
  }

  if (!text.trim()) {
    throw new ConfigServiceError('Config service returned an empty response', details)
  }

  try {
    return JSON.parse(text) as ConfigResponse
  } catch {
    throw new ConfigServiceError('Config service returned an invalid response', details)
  }
}

async function callConfigService(
  apiUrl: string,
  secret: string,
  action: string,
  requestId: string,
  password?: string,
) {
  const startedAt = Date.now()

  if (action === 'getPassword') {
    const url = new URL(apiUrl)
    url.searchParams.set('action', 'getPassword')
    url.searchParams.set('secret', secret)
    const result = await readConfigResponse(await fetch(url))
    console.info('Admin config service response', {
      requestId,
      action,
      success: result.success,
      durationMs: Date.now() - startedAt,
    })
    return result
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...(password ? { password } : {}), secret }),
  })

  const result = await readConfigResponse(response)
  console.info('Admin config service response', {
    requestId,
    action,
    success: result.success,
    durationMs: Date.now() - startedAt,
  })
  return result
}

export default async function handler(request: AdminRequest, response: AdminResponse) {
  const requestId = randomUUID()
  const masterPassword = process.env.ADMIN_MASTER_PASSWORD

  if (!masterPassword) {
    return response.status(500).json({ success: false, error: 'Admin password is not configured' })
  }

  if (!hasAdminSession(request, masterPassword)) {
    return response.status(401).json({ success: false, error: 'Admin verification required' })
  }

  const { apiUrl, secret } = getConfiguration()

  if (!apiUrl || !secret) {
    console.error('Admin config bridge is not configured', {
      requestId,
      hasApiUrl: Boolean(apiUrl),
      hasSecret: Boolean(secret),
    })
    return response.status(500).json({ success: false, error: 'Google config API is not configured' })
  }

  try {
    if (request.method === 'GET') {
      const result = await callConfigService(apiUrl, secret, 'getPassword', requestId)
      return response.status(result.success ? 200 : 502).json({ ...result, requestId })
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST')
      return response.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const body = readBody(request.body)
    const action = body && typeof body === 'object' ? (body as Record<string, unknown>).action : ''

    if (action === 'setPassword') {
      const password = String((body as Record<string, unknown>).password || '').trim()

      if (password.length < 4) {
        return response.status(400).json({ success: false, error: 'Daily password must be at least 4 characters' })
      }

      const result = await callConfigService(apiUrl, secret, 'setPassword', requestId, password)
      return response.status(result.success ? 200 : 502).json({ ...result, requestId })
    }

    if (action === 'generatePassword') {
      const result = await callConfigService(apiUrl, secret, 'generatePassword', requestId)
      return response.status(result.success ? 200 : 502).json({ ...result, requestId })
    }

    return response.status(400).json({ success: false, error: 'Unsupported action' })
  } catch (error) {
    const details = error instanceof ConfigServiceError
      ? {
          upstreamStatus: error.status,
          contentType: error.contentType,
          responseLength: error.responseLength,
        }
      : {}

    console.error('Admin config service request failed', {
      requestId,
      method: request.method,
      message: error instanceof Error ? error.message : String(error),
      ...details,
    })

    return response.status(502).json({
      success: false,
      error: 'Could not reach Google config service',
      requestId,
    })
  }
}
