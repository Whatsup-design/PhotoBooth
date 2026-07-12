import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getConfigApiEnvironment, callConfigApi, logConfigServiceError } from '../../server/configApi.js'
import { hasAdminSession } from '../../server/adminSession.js'

type AdminRequest = IncomingMessage & {
  body?: unknown
}

type AdminResponse = ServerResponse & {
  status: (statusCode: number) => AdminResponse
  json: (body: unknown) => void
}

function readBody(body: unknown) {
  return typeof body === 'string' ? JSON.parse(body) : body
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

  const { apiUrl, secret } = getConfigApiEnvironment()

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
      const result = await callConfigApi(apiUrl, secret, 'getPassword', requestId)
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

      const result = await callConfigApi(apiUrl, secret, 'setPassword', requestId, password)
      return response.status(result.success ? 200 : 502).json({ ...result, requestId })
    }

    if (action === 'generatePassword') {
      const result = await callConfigApi(apiUrl, secret, 'generatePassword', requestId)
      return response.status(result.success ? 200 : 502).json({ ...result, requestId })
    }

    return response.status(400).json({ success: false, error: 'Unsupported action' })
  } catch (error) {
    logConfigServiceError(requestId, request.method === 'GET' ? 'getPassword' : 'adminPasswordUpdate', error)
    return response.status(502).json({
      success: false,
      error: 'Could not reach Google config service',
      requestId,
    })
  }
}
