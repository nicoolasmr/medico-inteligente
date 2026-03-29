import { beforeEach, describe, expect, it, vi } from 'vitest'

const findFirstMock = vi.fn()
const createInteractionMock = vi.fn()
const sendWhatsAppMock = vi.fn()

vi.mock('../lib/prisma', () => ({
    prisma: {
        patient: {
            findFirst: findFirstMock,
        },
        patientInteraction: {
            create: createInteractionMock,
        },
    },
}))

vi.mock('../lib/auth', () => ({
    getClinicId: vi.fn().mockResolvedValue('clinic-1'),
    getCurrentUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
}))

vi.mock('../lib/whatsapp', () => ({
    sendWhatsApp: sendWhatsAppMock,
}))

describe('patient portal actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.PATIENT_PORTAL_SECRET = 'portal-secret'
        process.env.APP_URL = 'https://medico.example.com'
    })

    it('sends a patient portal link over WhatsApp and records an interaction', async () => {
        const { sendPatientPortalLink } = await import('../app/(dashboard)/patients/actions')

        findFirstMock.mockResolvedValue({
            id: 'patient-1',
            name: 'Maria Clara',
            phone: '+5511999999999',
        })

        const result = await sendPatientPortalLink('patient-1')

        expect(result.success).toBe(true)
        expect(sendWhatsAppMock).toHaveBeenCalledTimes(1)
        expect(createInteractionMock).toHaveBeenCalledTimes(1)
    })

    it('returns a friendly error when the patient has no phone number', async () => {
        const { sendPatientPortalLink } = await import('../app/(dashboard)/patients/actions')

        findFirstMock.mockResolvedValue({
            id: 'patient-1',
            name: 'Maria Clara',
            phone: null,
        })

        const result = await sendPatientPortalLink('patient-1')

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain('telefone')
        }
        expect(sendWhatsAppMock).not.toHaveBeenCalled()
    })
})
