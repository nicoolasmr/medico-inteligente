import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPatient } from '@/app/(dashboard)/patients/actions'
import { createAppointment } from '@/app/(dashboard)/agenda/actions'
import { prisma } from '@/lib/prisma'
import { getClinicId } from '@/lib/auth'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        patient: {
            create: vi.fn(),
            findFirst: vi.fn(),
        },
        appointment: {
            create: vi.fn()
        },
    },
}))

vi.mock('@/lib/auth', () => ({
    getClinicId: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Patient Journey Integration (Logic Flow)', () => {
    const mockClinicId = '550e8400-e29b-41d4-a716-446655440000'

    beforeEach(() => {
        vi.clearAllMocks()
            ; (getClinicId as any).mockResolvedValue(mockClinicId)
    })

    it('should allow a full flow from patient registration to appointment', async () => {
        const mockPatientId = '550e8400-e29b-41d4-a716-446655442222'
        const mockAppointmentId = '660e8400-e29b-41d4-a716-446655443333'

        // 1. Create Patient
        const patientData = {
            name: 'John Doe',
            phone: '11999999999',
            email: 'john@example.com',
            cpf: '123.456.789-00',
            tags: [],
        }

        const mockPatient = { id: mockPatientId, ...patientData, clinicId: mockClinicId }
            ; (prisma.patient.create as any).mockResolvedValue(mockPatient)

        const patientResult = await createPatient(patientData as any)
        expect(patientResult.success).toBe(true)
        if (patientResult.success) {
            expect(patientResult.data?.id).toBe(mockPatientId)
        }

        // 2. Schedule Appointment
        const appointmentData = {
            patientId: mockPatientId,
            scheduledAt: new Date().toISOString(),
            durationMin: 30,
        }

        const mockAppointment = { id: mockAppointmentId, ...appointmentData, clinicId: mockClinicId }
            ; (prisma.appointment.create as any).mockResolvedValue(mockAppointment)

        const appResult = await createAppointment(appointmentData as any)
        expect(appResult.success).toBe(true)
        if (appResult.success) {
            expect(appResult.data?.id).toBe(mockAppointmentId)
            expect(appResult.data?.clinicId).toBe(mockClinicId)
        }
    })
})
