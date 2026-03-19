import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn(() => { throw new Error('Redirect') })
const getClinicId = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()
const prisma = {
    patient: { findFirst: vi.fn() },
    appointment: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
}
const apiRatelimit = { limit: vi.fn() }
const getSession = vi.fn()
const createServerClient = vi.fn()

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('../lib/auth', () => ({ getClinicId }))
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
        headersMock.mockResolvedValue({ get: vi.fn(() => null) })
        cookiesMock.mockResolvedValue({ get: vi.fn(() => undefined) })
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

    it('should isolate portal data by patient identity and token', async () => {
        const { createPortalAccessToken } = await import('../lib/portal-auth')
        const token = createPortalAccessToken('clinic-123', 'patient-1')
        headersMock.mockResolvedValue({
            get: vi.fn((key: string) => {
                if (key === 'x-portal-patient-id') return 'patient-1'
                if (key === 'x-portal-access-token') return token
                return null
            }),
        })
        prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1', name: 'Alice Silva', phone: '11999999999' })
        prisma.appointment.findMany.mockResolvedValue([])
        prisma.payment.findMany.mockResolvedValue([])

        const PatientPortalPage = (await import('../app/portal/page')).default
        await PatientPortalPage()

        expect(prisma.patient.findFirst).toHaveBeenCalledWith({ where: { clinicId: 'clinic-123', id: 'patient-1' } })
        expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 'clinic-123', patientId: 'patient-1' }) }))
        expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 'clinic-123', patientId: 'patient-1' }) }))
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
