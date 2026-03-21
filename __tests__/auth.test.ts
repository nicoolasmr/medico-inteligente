import { describe, it, expect, vi } from 'vitest'
import { getCurrentUser } from '../lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'

vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('Redirect') }),
}))

describe('Auth Logic (Tenant Isolation)', () => {
    it('should redirect to login if no session exists', async () => {
        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
        }
            ; (createClient as any).mockResolvedValue(mockSupabase)

const redirect = vi.fn(() => { throw new Error('NEXT_REDIRECT') })
const getSession = vi.fn()
const from = vi.fn()
const createClient = vi.fn()
const upsert = vi.fn()
const adminFrom = vi.fn()
const createAdminClient = vi.fn()
const cookieGet = vi.fn()
const cookieSet = vi.fn()
const cookiesMock = vi.fn()
const prisma = {
    patient: { findUnique: vi.fn() },
}

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('../lib/supabase/server', () => ({ createClient }))
vi.mock('../lib/supabase/admin', () => ({ createAdminClient }))
vi.mock('next/headers', () => ({ cookies: cookiesMock }))
vi.mock('../lib/prisma', () => ({ prisma }))

describe('auth helpers', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()

        from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                }),
            }),
        })
        createClient.mockResolvedValue({ auth: { getSession }, from })

        upsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'repair failed' } }),
            }),
        })
        adminFrom.mockReturnValue({ upsert })
        createAdminClient.mockReturnValue({ from: adminFrom })

        cookiesMock.mockResolvedValue({ get: cookieGet, set: cookieSet })
        cookieGet.mockReturnValue(undefined)
        prisma.patient.findUnique.mockResolvedValue(null)
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('getCurrentUser should return the authenticated user when profile exists', async () => {
        const mockUser = { id: 'user-123', clinicId: 'clinic-456', role: 'admin' }
        getSession.mockResolvedValue({ data: { session: { user: { id: 'user-123', email: 'admin@example.com', user_metadata: {} } } }, error: null })
        from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
                }),
            }),
        })

        const { getCurrentUser } = await import('../lib/auth')
        const user = await getCurrentUser()

        expect(user.id).toBe('user-123')
        expect(user.clinicId).toBe('clinic-456')
        expect(user.role).toBe('admin')
        expect(redirect).not.toHaveBeenCalled()
    })

    it('getCurrentUser should redirect when no session exists', async () => {
        getSession.mockResolvedValue({ data: { session: null }, error: null })
        const { getCurrentUser } = await import('../lib/auth')

        await expect(getCurrentUser()).rejects.toThrow('NEXT_REDIRECT')
        expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('getCurrentUser should repair missing profile when metadata has clinic_id', async () => {
        const session = {
            user: {
                id: 'user-999',
                email: 'owner@example.com',
                user_metadata: {
                    clinic_id: 'clinic-xyz',
                    name: 'Dr. Owner',
                    role: 'owner',
                },
            },
        }
        const repairedUser = {
            id: 'user-999',
            clinicId: 'clinic-xyz',
            role: 'owner',
            email: 'owner@example.com',
            name: 'Dr. Owner',
        }

        getSession.mockResolvedValue({ data: { session }, error: null })
        from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'missing profile' } }),
                }),
            }),
        })
        upsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: repairedUser, error: null }),
            }),
        })

        const { getCurrentUser } = await import('../lib/auth')
        const user = await getCurrentUser()

        expect(createAdminClient).toHaveBeenCalled()
        expect(adminFrom).toHaveBeenCalledWith('users')
        expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
            id: 'user-999',
            clinic_id: 'clinic-xyz',
            role: 'owner',
        }), { onConflict: 'id' })
        expect(user).toEqual(repairedUser)
    })

    it('should default repair payload name and role when metadata is incomplete', async () => {
        const session = {
            user: {
                id: 'user-456',
                email: 'fallback@example.com',
                user_metadata: { clinic_id: 'clinic-456' },
            },
        }

        const repairQuery = {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'user-456', clinicId: 'clinic-456', role: 'owner' }, error: null }),
        }

        ; (createClient as any).mockResolvedValue({
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'missing profile' } }),
            }),
        })
        ; (createAdminClient as any).mockReturnValue({ from: vi.fn(() => repairQuery) })

        await ensureUserProfile(session as any)

        expect(repairQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
            name: 'fallback@example.com',
            role: 'owner',
        }), { onConflict: 'id' })
    })

    it('should return null from ensureUserProfile when repair fails', async () => {
        const session = {
            user: {
                id: 'user-123',
                email: 'owner@example.com',
                user_metadata: { clinic_id: 'clinic-456', name: 'Owner' },
            },
        }

        await expect(getCurrentUser()).rejects.toThrow('NEXT_REDIRECT')
        expect(redirect).toHaveBeenCalledWith('/login?error=profile_not_found')
    })

    it('getClinicId should return the clinic id for authenticated users', async () => {
        const session = { user: { id: 'user-123', email: 'admin@example.com', user_metadata: {} } }
        const mockUser = { id: 'user-123', clinicId: 'clinic-456', role: 'admin' }

        getSession.mockResolvedValue({ data: { session }, error: null })
        from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
                }),
            }),
        })

        const { getClinicId } = await import('../lib/auth')
        const clinicId = await getClinicId()

        expect(clinicId).toBe('clinic-456')
        expect(redirect).not.toHaveBeenCalled()
    })

    it('establishPatientPortalSession should create a dedicated patient session cookie', async () => {
        const { createPortalAccessToken, establishPatientPortalSession } = await import('../lib/auth')
        const token = createPortalAccessToken('clinic-456', 'patient-123')

        prisma.patient.findUnique.mockResolvedValue({ id: 'patient-123', clinicId: 'clinic-456' })

        const result = await establishPatientPortalSession(token)

        expect(result).toBe(true)
        expect(prisma.patient.findUnique).toHaveBeenCalledWith({
            where: { id: 'patient-123' },
            select: { id: true, clinicId: true },
        })
        expect(cookieSet).toHaveBeenCalledWith('portal_session', expect.any(String), expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 604800,
        }))
    })

    it('getAuthenticatedPatientPortalSession should resolve patient identity from the signed cookie', async () => {
        const { createPortalAccessToken, establishPatientPortalSession, getAuthenticatedPatientPortalSession } = await import('../lib/auth')
        const accessToken = createPortalAccessToken('clinic-456', 'patient-123')
        prisma.patient.findUnique.mockResolvedValue({ id: 'patient-123', clinicId: 'clinic-456' })

        await establishPatientPortalSession(accessToken)
        const sessionToken = cookieSet.mock.calls[0][1]
        cookieGet.mockReturnValue({ value: sessionToken })

        const session = await getAuthenticatedPatientPortalSession()

        expect(session).toEqual(expect.objectContaining({
            clinicId: 'clinic-456',
            patientId: 'patient-123',
            token: sessionToken,
        }))
        expect(session?.expiresAt).toBeInstanceOf(Date)
    })
})
