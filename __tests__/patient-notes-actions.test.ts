import { beforeEach, describe, expect, it, vi } from 'vitest'

const findFirstMock = vi.fn()
const createInteractionMock = vi.fn()

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

describe('patient notes actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a patient note interaction', async () => {
        const { createPatientNote } = await import('../app/(dashboard)/patients/actions')

        findFirstMock.mockResolvedValue({ id: 'patient-1' })

        const result = await createPatientNote('patient-1', 'Paciente solicitou retorno em 15 dias.')

        expect(result.success).toBe(true)
        expect(createInteractionMock).toHaveBeenCalledTimes(1)
    })

    it('rejects empty notes with a friendly error', async () => {
        const { createPatientNote } = await import('../app/(dashboard)/patients/actions')

        const result = await createPatientNote('patient-1', '   ')

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain('conteúdo')
        }
        expect(createInteractionMock).not.toHaveBeenCalled()
    })
})
