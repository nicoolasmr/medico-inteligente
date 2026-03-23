import { beforeEach, describe, expect, it } from 'vitest'
import { createPatientPortalToken, getPatientPortalAbsoluteUrl, getPatientPortalPath, verifyPatientPortalToken } from '../lib/portal-token'

describe('portal token helpers', () => {
    beforeEach(() => {
        process.env.PATIENT_PORTAL_SECRET = 'portal-secret'
        process.env.APP_URL = 'https://medico.example.com'
    })

    it('creates a verifiable portal token for a patient', () => {
        const token = createPatientPortalToken('patient-123')

        expect(token).toBeTruthy()
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
})
