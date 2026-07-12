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

  if (!text.trim()) {
    throw new Error('Config service returned an empty response')
  }

  try {
    return JSON.parse(text) as ConfigResponse
  } catch {
    throw new Error('Config service returned an invalid response')
  }
}

async function callConfigService(apiUrl: string, secret: string, action: string, password?: string) {
  if (action === 'getPassword') {
    const url = new URL(apiUrl)
    url.searchParams.set('action', 'getPassword')
    url.searchParams.set('secret', secret)
    return readConfigResponse(await fetch(url))
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...(password ? { password } : {}), secret }),
  })

  return readConfigResponse(response)
}

export default async function handler(request: AdminRequest, response: AdminResponse) {
  const masterPassword = process.env.ADMIN_MASTER_PASSWORD

  if (!masterPassword) {
    return response.status(500).json({ success: false, error: 'Admin password is not configured' })
  }

  if (!hasAdminSession(request, masterPassword)) {
    return response.status(401).json({ success: false, error: 'Admin verification required' })
  }

  const { apiUrl, secret } = getConfiguration()

  if (!apiUrl || !secret) {
    return response.status(500).json({ success: false, error: 'Google config API is not configured' })
  }

  try {
    if (request.method === 'GET') {
      const result = await callConfigService(apiUrl, secret, 'getPassword')
      return response.status(result.success ? 200 : 502).json(result)
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

      const result = await callConfigService(apiUrl, secret, 'setPassword', password)
      return response.status(result.success ? 200 : 502).json(result)
    }

    if (action === 'generatePassword') {
      const result = await callConfigService(apiUrl, secret, 'generatePassword')
      return response.status(result.success ? 200 : 502).json(result)
    }

    return response.status(400).json({ success: false, error: 'Unsupported action' })
  } catch {
    return response.status(502).json({ success: false, error: 'Could not reach Google config service' })
  }
}
