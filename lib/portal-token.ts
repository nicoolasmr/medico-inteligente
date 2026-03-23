import { createHmac, timingSafeEqual } from 'crypto'
import { getOptionalEnv, requireEnv } from './env'

const PORTAL_TOKEN_VERSION = 'v2'
const DEFAULT_TOKEN_TTL_MINUTES = 60 * 24

type PortalTokenPayload = {
    v: string
    patientId: string
    iat: number
    exp: number
}

function signPayload(payload: string) {
    return createHmac('sha256', requireEnv('PATIENT_PORTAL_SECRET', { context: 'patient portal' }))
        .update(payload)
        .digest('base64url')
}

function encodePayload(payload: PortalTokenPayload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(token: string): PortalTokenPayload | null {
    const [encodedPayload] = token.split('.')
    if (!encodedPayload) return null

    try {
        const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<PortalTokenPayload>
        if (
            parsed.v !== PORTAL_TOKEN_VERSION
            || typeof parsed.patientId !== 'string'
            || typeof parsed.iat !== 'number'
            || typeof parsed.exp !== 'number'
        ) {
            return null
        }

        return parsed as PortalTokenPayload
    } catch {
        return null
    }
}

function getTokenTtlMinutes() {
    const ttlValue = getOptionalEnv('PATIENT_PORTAL_TOKEN_TTL_MINUTES')
    if (!ttlValue) return DEFAULT_TOKEN_TTL_MINUTES

    const ttl = Number(ttlValue)
    if (!Number.isFinite(ttl) || ttl <= 0) {
        throw new Error('PATIENT_PORTAL_TOKEN_TTL_MINUTES deve ser um número positivo.')
    }

    return ttl
}

function buildPayload(patientId: string): PortalTokenPayload {
    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAt = issuedAt + getTokenTtlMinutes() * 60

    return {
        v: PORTAL_TOKEN_VERSION,
        patientId,
        iat: issuedAt,
        exp: expiresAt,
    }
}

export function createPatientPortalToken(patientId: string) {
    const payload = buildPayload(patientId)
    const encodedPayload = encodePayload(payload)
    const signature = signPayload(encodedPayload)

    return `${encodedPayload}.${signature}`
}

export function getPatientPortalPath(patientId: string) {
    const token = createPatientPortalToken(patientId)
    const params = new URLSearchParams({
        patient: patientId,
        token,
    })

    return `/portal?${params.toString()}`
}

export function getPatientPortalAbsoluteUrl(patientId: string) {
    const baseUrl = getOptionalEnv('APP_URL') ?? getOptionalEnv('NEXT_PUBLIC_APP_URL')

    if (!baseUrl) {
        throw new Error('Defina APP_URL ou NEXT_PUBLIC_APP_URL para compartilhar links absolutos do portal.')
    }

    return `${baseUrl.replace(/\/$/, '')}${getPatientPortalPath(patientId)}`
}

export function getPatientPortalTokenExpiry(token: string) {
    const payload = decodePayload(token)
    return payload ? new Date(payload.exp * 1000) : null
}

export function verifyPatientPortalToken(patientId: string, token: string) {
    const [encodedPayload, providedSignature] = token.split('.')
    if (!encodedPayload || !providedSignature) {
        return false
    }

    const payload = decodePayload(token)
    if (!payload || payload.patientId !== patientId) {
        return false
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
        return false
    }

    const expectedSignature = signPayload(encodedPayload)
    const expectedBuffer = Buffer.from(expectedSignature)
    const providedBuffer = Buffer.from(providedSignature)

    if (expectedBuffer.length !== providedBuffer.length) {
        return false
    }

    return timingSafeEqual(expectedBuffer, providedBuffer)
}
