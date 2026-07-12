import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

const COOKIE_NAME = 'admin_config_session'
const SESSION_MAX_AGE_SECONDS = 15 * 60

type SessionPayload = {
  expiresAt: number
  nonce: string
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function readCookie(request: IncomingMessage, name: string) {
  const cookieHeader = request.headers.cookie || ''
  const pair = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return pair ? pair.slice(name.length + 1) : ''
}

export function setAdminSessionCookie(response: ServerResponse, secret: string) {
  const payload: SessionPayload = {
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    nonce: randomBytes(16).toString('base64url'),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const token = `${encodedPayload}.${sign(encodedPayload, secret)}`
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`,
  )
}

export function hasAdminSession(request: IncomingMessage, secret: string) {
  try {
    const token = readCookie(request, COOKIE_NAME)
    const [encodedPayload, receivedSignature, extra] = token.split('.')

    if (!encodedPayload || !receivedSignature || extra) {
      return false
    }

    const expectedSignature = sign(encodedPayload, secret)
    const expected = Buffer.from(expectedSignature)
    const received = Buffer.from(receivedSignature)

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return false
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now()
  } catch {
    return false
  }
}
