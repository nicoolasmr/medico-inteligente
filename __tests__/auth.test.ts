import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureUserProfile, getCurrentUser } from '../lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import { createAdminClient } from '../lib/supabase/admin'

vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('../lib/supabase/admin', () => ({
    createAdminClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('Redirect') }),
}))

describe('Auth Logic (Tenant Isolation)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should redirect to login if no session exists', async () => {
        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
        }
        ; (createClient as any).mockResolvedValue(mockSupabase)

        await expect(getCurrentUser()).rejects.toThrow('Redirect')
        expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('should return user data if session is valid', async () => {
        const mockUser = { id: 'user-123', clinicId: 'clinic-456', role: 'admin' }
        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-123', user_metadata: {} } } }, error: null }) },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }
        ; (createClient as any).mockResolvedValue(mockSupabase)

        const user = await getCurrentUser()
        expect(user.clinicId).toBe('clinic-456')
        expect(user.role).toBe('admin')
    })

    it('should redirect when session exists but profile cannot be repaired because metadata lacks clinic_id', async () => {
        const session = {
            user: {
                id: 'user-123',
                email: 'owner@example.com',
                user_metadata: { name: 'Owner' },
            },
        }

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }

        ; (createClient as any).mockResolvedValue(mockSupabase)

        await expect(getCurrentUser()).rejects.toThrow('Redirect')
        expect(redirect).toHaveBeenCalledWith('/login?error=profile_not_found')
        expect(createAdminClient).not.toHaveBeenCalled()
    })

    it('should repair missing internal profile through admin client when metadata contains clinic_id', async () => {
        const session = {
            user: {
                id: 'user-123',
                email: 'owner@example.com',
                user_metadata: { clinic_id: 'clinic-456', name: 'Owner', role: 'owner' },
            },
        }

        const repairedUser = {
            id: 'user-123',
            clinicId: 'clinic-456',
            name: 'Owner',
            role: 'owner',
            email: 'owner@example.com',
        }

        const userQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'missing profile' } }),
        }

        const repairQuery = {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: repairedUser, error: null }),
        }

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) },
            from: vi.fn(() => userQuery),
        }

        const adminClient = {
            from: vi.fn(() => repairQuery),
        }

        ; (createClient as any).mockResolvedValue(mockSupabase)
        ; (createAdminClient as any).mockReturnValue(adminClient)

        const user = await getCurrentUser()

        expect(user).toEqual(repairedUser)
        expect(adminClient.from).toHaveBeenCalledWith('users')
        expect(repairQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
            id: 'user-123',
            clinic_id: 'clinic-456',
            email: 'owner@example.com',
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

        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'missing profile' } }),
        }

        const adminClient = {
            from: vi.fn().mockReturnValue({
                upsert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'still missing' } }),
            }),
        }

        ; (createClient as any).mockResolvedValue(mockSupabase)
        ; (createAdminClient as any).mockReturnValue(adminClient)

        await expect(ensureUserProfile(session as any)).resolves.toBeNull()
    })
})
