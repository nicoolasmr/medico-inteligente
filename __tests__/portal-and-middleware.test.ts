import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn(() => { throw new Error('Redirect') })
const getClinicId = vi.fn()
const getAuthenticatedPatientPortalSession = vi.fn()
const setCookie = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()
const prisma = {
    patient: { findUnique: vi.fn() },
    appointment: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
}
const apiRatelimit = { limit: vi.fn() }
const getSession = vi.fn()
const createServerClient = vi.fn()

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('../lib/auth', () => ({
    createPortalAccessToken: vi.fn(async () => null),
    establishPatientPortalSession: vi.fn(),
    getAuthenticatedPatientPortalSession,
    getClinicId,
}))
vi.mock('next/headers', () => ({ headers: headersMock, cookies: cookiesMock }))
vi.mock('../lib/prisma', () => ({ prisma }))
vi.mock('./../lib/ratelimit', () => ({ apiRatelimit }))
vi.mock('@supabase/ssr', () => ({ createServerClient }))
vi.mock('next/server', async () => {
    const actual = await vi.importActual<typeof import('next/server')>('next/server')
    return {
        ...actual,
        NextResponse: {
            next: vi.fn(({ request }) => ({ type: 'next', request, cookies: { set: vi.fn() } })),
            redirect: vi.fn(url => ({ type: 'redirect', status: 307, headers: { location: url.toString() } })),
        },
    }
})

describe('portal isolation and middleware protection', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        getClinicId.mockResolvedValue('clinic-123')
        getAuthenticatedPatientPortalSession.mockResolvedValue(null)
        headersMock.mockResolvedValue({ get: vi.fn(() => null) })
        cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined), set: setCookie })
        apiRatelimit.limit.mockResolvedValue({ success: true })
        getSession.mockResolvedValue({ data: { session: null } })
        createServerClient.mockReturnValue({ auth: { getSession } })
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('should deny portal access when patient identity is missing', async () => {
        const PortalLayout = (await import('../app/portal/layout')).default
        await expect(PortalLayout({ children: null } as any)).rejects.toThrow('Redirect')
        expect(redirect).toHaveBeenCalledWith('/login?error=portal_identity_required')
    })

    it('should isolate portal data by authenticated patient session', async () => {
        getAuthenticatedPatientPortalSession.mockResolvedValue({
            clinicId: 'clinic-123',
            patientId: 'patient-1',
            token: 'patient-session-token',
            expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        })
        prisma.patient.findUnique.mockResolvedValue({
            id: 'patient-1',
            clinicId: 'clinic-123',
            name: 'Alice Silva',
            phone: '11999999999',
        })
        prisma.appointment.findMany.mockResolvedValue([])
        prisma.payment.findMany.mockResolvedValue([])

        const PatientPortalPage = (await import('../app/portal/page')).default
        await PatientPortalPage()

        expect(getAuthenticatedPatientPortalSession).toHaveBeenCalled()
        expect(prisma.patient.findUnique).toHaveBeenCalledWith({ where: { id: 'patient-1' } })
        expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 'clinic-123', patientId: 'patient-1' }) }))
        expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 'clinic-123', patientId: 'patient-1' }) }))
    })

    it('should block access when authenticated session points to another clinic', async () => {
        getAuthenticatedPatientPortalSession.mockResolvedValue({
            clinicId: 'clinic-123',
            patientId: 'patient-1',
            token: 'patient-session-token',
            expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        })
        prisma.patient.findUnique.mockResolvedValue({
            id: 'patient-1',
            clinicId: 'clinic-999',
            name: 'Alice Silva',
        })

        const PatientPortalPage = (await import('../app/portal/page')).default
        await expect(PatientPortalPage()).rejects.toThrow('Portal patient not found for current identity')
        expect(prisma.appointment.findMany).not.toHaveBeenCalled()
        expect(prisma.payment.findMany).not.toHaveBeenCalled()
    })

    it('should protect authenticated routes by redirecting anonymous requests', async () => {
        const { middleware } = await import('../middleware')
        const request = {
            url: 'https://example.com/dashboard',
            nextUrl: { pathname: '/dashboard' },
            headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
            cookies: { getAll: () => [] },
        }

        const response = await middleware(request as any)
        expect(apiRatelimit.limit).toHaveBeenCalledWith('1.2.3.4')
        expect(response).toEqual(expect.objectContaining({ type: 'redirect' }))
        expect(response.headers.location).toContain('/login?next=%2Fdashboard')
    })

    it('should rate limit api routes via matcher-compatible middleware execution', async () => {
        apiRatelimit.limit.mockResolvedValue({ success: false })
        const { middleware, config } = await import('../middleware')
        const request = {
            url: 'https://example.com/api/patients',
            nextUrl: { pathname: '/api/patients' },
            headers: new Headers({ 'x-forwarded-for': '9.9.9.9' }),
            cookies: { getAll: () => [] },
        }

        const response = await middleware(request as any)
        expect(config.matcher).toContain('/api/:path*')
        expect(apiRatelimit.limit).toHaveBeenCalledWith('9.9.9.9')
        expect(response.status).toBe(429)
    })
})
