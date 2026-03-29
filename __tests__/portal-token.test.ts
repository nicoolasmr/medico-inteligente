import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createPatientPortalToken,
    getPatientPortalAbsoluteUrl,
    getPatientPortalPath,
    getPatientPortalTokenExpiry,
    verifyPatientPortalToken,
} from '../lib/portal-token'

describe('portal token helpers', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-23T12:00:00.000Z'))
        process.env.PATIENT_PORTAL_SECRET = 'portal-secret'
        process.env.APP_URL = 'https://medico.example.com'
        process.env.PATIENT_PORTAL_TOKEN_TTL_MINUTES = '30'
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('creates a verifiable portal token for a patient', () => {
        const token = createPatientPortalToken('patient-123')

        expect(token).toContain('.')
        expect(verifyPatientPortalToken('patient-123', token)).toBe(true)
        expect(verifyPatientPortalToken('patient-456', token)).toBe(false)
    })

    it('builds a portal path with patient and token query params', () => {
        const path = getPatientPortalPath('patient-123')
        const url = new URL(path, 'https://example.com')

        expect(url.pathname).toBe('/portal')
        expect(url.searchParams.get('patient')).toBe('patient-123')
        expect(url.searchParams.get('token')).toBeTruthy()
    })

    it('builds an absolute portal URL when APP_URL is configured', () => {
        expect(getPatientPortalAbsoluteUrl('patient-123')).toMatch(/^https:\/\/medico\.example\.com\/portal\?patient=patient-123&token=/)
    })

    it('exposes the token expiration timestamp', () => {
        const token = createPatientPortalToken('patient-123')
        const expiry = getPatientPortalTokenExpiry(token)

        expect(expiry?.toISOString()).toBe('2026-03-23T12:30:00.000Z')
    })

    it('rejects expired portal tokens', () => {
        const token = createPatientPortalToken('patient-123')

        vi.setSystemTime(new Date('2026-03-23T12:31:00.000Z'))

        expect(verifyPatientPortalToken('patient-123', token)).toBe(false)
    })
})
