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

        await expect(getCurrentUser()).rejects.toThrow('Redirect')
        expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('should return user data if session is valid', async () => {
        const mockUser = { id: 'user-123', clinicId: 'clinic-456', role: 'admin' }
        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-123' } } }, error: null }) },
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
})
