import { createHmac, timingSafeEqual } from 'crypto'
import { getOptionalEnv, requireEnv } from './env'

const PORTAL_TOKEN_VERSION = 'v1'

function buildPayload(patientId: string) {
    return `${PORTAL_TOKEN_VERSION}:${patientId}`
}

function signPayload(payload: string) {
    return createHmac('sha256', requireEnv('PATIENT_PORTAL_SECRET', { context: 'patient portal' }))
        .update(payload)
        .digest('hex')
}

export function createPatientPortalToken(patientId: string) {
    return signPayload(buildPayload(patientId))
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

export function verifyPatientPortalToken(patientId: string, token: string) {
    const expected = createPatientPortalToken(patientId)
    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(token)

    if (expectedBuffer.length !== providedBuffer.length) {
        return false
    }

    return timingSafeEqual(expectedBuffer, providedBuffer)
}
