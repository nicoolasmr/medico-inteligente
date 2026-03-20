import { createHmac, timingSafeEqual } from 'crypto'
import { requireEnv } from './env'

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

export function verifyPatientPortalToken(patientId: string, token: string) {
    const expected = createPatientPortalToken(patientId)
    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(token)

    if (expectedBuffer.length !== providedBuffer.length) {
        return false
    }

    return timingSafeEqual(expectedBuffer, providedBuffer)
}
