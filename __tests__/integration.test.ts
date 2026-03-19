import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPatient } from '../app/(dashboard)/patients/actions'
import { createAppointment } from '../app/(dashboard)/agenda/actions'
import { prisma } from '../lib/prisma'
import { getClinicId } from '../lib/auth'

const { redirect, headersMock, cookiesMock, apiRatelimit, createServerClient, getSession } = vi.hoisted(() => ({
    redirect: vi.fn(() => { throw new Error('Redirect') }),
    headersMock: vi.fn(),
    cookiesMock: vi.fn(),
    apiRatelimit: { limit: vi.fn() },
    createServerClient: vi.fn(),
    getSession: vi.fn(),
}))

vi.mock('../lib/prisma', () => ({
    prisma: {
        patient: {
            create: vi.fn(),
            findFirst: vi.fn(),
        },
        appointment: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        payment: {
            findMany: vi.fn(),
        },
    },
}))

vi.mock('../lib/auth', () => ({
    getClinicId: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/headers', () => ({ headers: headersMock, cookies: cookiesMock }))
vi.mock('../lib/ratelimit', () => ({ apiRatelimit }))
vi.mock('@supabase/ssr', () => ({ createServerClient }))

describe('Patient Journey Integration (Logic Flow)', () => {
    const mockClinicId = '550e8400-e29b-41d4-a716-446655440000'

    beforeEach(() => {
        vi.clearAllMocks()
        ; (getClinicId as any).mockResolvedValue(mockClinicId)
        headersMock.mockResolvedValue({ get: vi.fn(() => null) })
        cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined) })
        apiRatelimit.limit.mockResolvedValue({ success: true })
        getSession.mockResolvedValue({ data: { session: null } })
        createServerClient.mockReturnValue({ auth: { getSession } })
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('should allow a full flow from patient registration to appointment', async () => {
        const mockPatientId = '550e8400-e29b-41d4-a716-446655442222'
        const mockAppointmentId = '660e8400-e29b-41d4-a716-446655443333'

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

    it('should keep protected routes working when Supabase env is missing', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        const { middleware } = await import('../middleware')

        const response = await middleware({
            url: 'https://example.com/dashboard',
            nextUrl: { pathname: '/dashboard' },
            headers: new Headers({ 'x-forwarded-for': '198.51.100.20' }),
            cookies: { getAll: () => [] },
        } as any)

        expect(apiRatelimit.limit).toHaveBeenCalledWith('198.51.100.20')
        expect(response.status).toBe(200)
    })

    it('should isolate portal queries by clinic and patient identity', async () => {
        const { createPortalAccessToken } = await import('../lib/portal-auth')
        const token = createPortalAccessToken(mockClinicId, 'patient-1')

        headersMock.mockResolvedValue({
            get: vi.fn((key: string) => {
                if (key === 'x-portal-patient-id') return 'patient-1'
                if (key === 'x-portal-access-token') return token
                return null
            }),
        })

        ; (prisma.patient.findFirst as any).mockResolvedValue({ id: 'patient-1', name: 'Alice Silva', phone: '11999999999' })
        ; (prisma.appointment.findMany as any).mockResolvedValue([])
        ; (prisma.payment.findMany as any).mockResolvedValue([])

        const PatientPortalPage = (await import('../app/portal/page')).default
        await PatientPortalPage()

        expect(prisma.patient.findFirst).toHaveBeenCalledWith({ where: { clinicId: mockClinicId, id: 'patient-1' } })
        expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ clinicId: mockClinicId, patientId: 'patient-1' }),
        }))
        expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ clinicId: mockClinicId, patientId: 'patient-1' }),
        }))
    })
})
