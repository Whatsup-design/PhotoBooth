export type ConfigApiResponse = {
  success: boolean
  password?: string
  error?: string
}

export class ConfigServiceError extends Error {
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

export function getConfigApiEnvironment() {
  return {
    apiUrl: process.env.GOOGLE_CONFIG_API_URL?.trim(),
    secret: process.env.GOOGLE_CONFIG_API_SECRET?.trim(),
  }
}

async function readConfigResponse(response: Response): Promise<ConfigApiResponse> {
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
    return JSON.parse(text) as ConfigApiResponse
  } catch {
    throw new ConfigServiceError('Config service returned an invalid response', details)
  }
}

export async function callConfigApi(
  apiUrl: string,
  secret: string,
  action: 'getPassword' | 'setPassword' | 'generatePassword',
  requestId: string,
  password?: string,
) {
  const startedAt = Date.now()
  let response: Response

  if (action === 'getPassword') {
    const url = new URL(apiUrl)
    url.searchParams.set('action', action)
    url.searchParams.set('secret', secret)
    response = await fetch(url)
  } else {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...(password ? { password } : {}), secret }),
    })
  }

  const result = await readConfigResponse(response)
  console.info('Google config API response', {
    requestId,
    action,
    success: result.success,
    upstreamStatus: response.status,
    durationMs: Date.now() - startedAt,
  })

  return result
}

export function logConfigServiceError(requestId: string, action: string, error: unknown) {
  const details = error instanceof ConfigServiceError
    ? {
        upstreamStatus: error.status,
        contentType: error.contentType,
        responseLength: error.responseLength,
      }
    : {}

  console.error('Google config API request failed', {
    requestId,
    action,
    message: error instanceof Error ? error.message : String(error),
    ...details,
  })
}
