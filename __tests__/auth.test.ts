import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureUserProfile, getCurrentUser } from '../lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import { createAdminClient } from '../lib/supabase/admin'

const slugify = vi.fn((value: string) => value.toLowerCase().replace(/\s+/g, '-'))

vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('../lib/supabase/admin', () => ({
    createAdminClient: vi.fn(),
}))

vi.mock('../lib/utils', async () => {
    const actual = await vi.importActual<typeof import('../lib/utils')>('../lib/utils')
    return { ...actual, slugify }
})

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('Redirect') }),
}))

describe('Auth Logic (Tenant Isolation)', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    function buildRegisterSupabaseAdmin(options?: {
        createUserError?: string
        clinicInsertError?: string
        userInsertError?: string
        automationInsertError?: string
    }) {
        const deleteEq = vi.fn().mockResolvedValue({ error: null })
        const clinicsSelect = {
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }

        const clinicsInsert = {
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(options?.clinicInsertError
                    ? { data: null, error: { message: options.clinicInsertError } }
                    : { data: { id: 'clinic-123' }, error: null }),
            }),
        }

        const usersInsert = vi.fn().mockResolvedValue(options?.userInsertError
            ? { error: { message: options.userInsertError } }
            : { error: null })
        const automationsInsert = vi.fn().mockResolvedValue(options?.automationInsertError
            ? { error: { message: options.automationInsertError } }
            : { error: null })

        const from = vi.fn((table: string) => {
            if (table === 'clinics') {
                return {
                    select: vi.fn((_columns?: string, _opts?: unknown) => clinicsSelect),
                    insert: vi.fn(() => clinicsInsert),
                    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
                }
            }
            if (table === 'users') {
                return {
                    insert: usersInsert,
                    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
                }
            }
            if (table === 'automations') {
                return {
                    insert: automationsInsert,
                    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
                }
            }
            return { delete: vi.fn().mockReturnValue({ eq: deleteEq }) }
        })

        return {
            auth: {
                admin: {
                    createUser: vi.fn().mockResolvedValue(options?.createUserError
                        ? { data: { user: null }, error: { message: options.createUserError } }
                        : { data: { user: { id: 'user-123' } }, error: null }),
                    updateUserById: vi.fn().mockResolvedValue({ error: null }),
                    deleteUser: vi.fn().mockResolvedValue({ error: null }),
                },
            },
            from,
            usersInsert,
            automationsInsert,
            deleteEq,
        }
    }

    it('should register clinic successfully end-to-end', async () => {
        const supabaseAdmin = buildRegisterSupabaseAdmin()
        ; (createAdminClient as any).mockReturnValue(supabaseAdmin)

        const { registerClinic } = await import('../app/(auth)/register/actions')
        const result = await registerClinic({
            userName: 'Dra. Alice',
            clinicName: 'Clínica Aurora',
            email: 'alice@example.com',
            password: 'Secret123!',
        })

        expect(result).toEqual({ success: true, redirectTo: '/login?registered=true' })
        expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalled()
        expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith('user-123', expect.objectContaining({
            user_metadata: expect.objectContaining({ clinic_id: 'clinic-123' }),
        }))
        expect(supabaseAdmin.usersInsert).toHaveBeenCalledWith(expect.objectContaining({ clinic_id: 'clinic-123' }))
        expect(supabaseAdmin.automationsInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ clinic_id: 'clinic-123' }),
        ]))
        expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled()
    })

    it('should rollback clinic resources and normalize support-facing onboarding errors', async () => {
        const supabaseAdmin = buildRegisterSupabaseAdmin({ automationInsertError: 'queue storage unavailable' })
        ; (createAdminClient as any).mockReturnValue(supabaseAdmin)

        const { registerClinic } = await import('../app/(auth)/register/actions')
        const result = await registerClinic({
            userName: 'Dra. Alice',
            clinicName: 'Clínica Aurora',
            email: 'alice@example.com',
            password: 'Secret123!',
        })

        expect(result).toEqual({
            success: false,
            error: 'Não foi possível concluir o cadastro agora. Tente novamente em instantes. Se o erro persistir, informe o código ONB-REG-UNEXPECTED ao suporte.',
        })
        expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
        expect(supabaseAdmin.deleteEq).toHaveBeenCalledWith('clinic_id', 'clinic-123')
        expect(supabaseAdmin.deleteEq).toHaveBeenCalledWith('id', 'clinic-123')
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

    it('should return existing internal profile from ensureUserProfile without admin repair', async () => {
        const mockUser = { id: 'user-123', clinicId: 'clinic-456', role: 'owner' }
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }
        ; (createClient as any).mockResolvedValue(mockSupabase)

        await expect(ensureUserProfile({ user: { id: 'user-123', user_metadata: {} } } as any)).resolves.toEqual(mockUser)
        expect(createAdminClient).not.toHaveBeenCalled()
    })

    it('should return null from ensureUserProfile when metadata lacks clinic_id', async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }

        ; (createClient as any).mockResolvedValue(mockSupabase)

        await expect(ensureUserProfile({
            user: {
                id: 'user-123',
                email: 'owner@example.com',
                user_metadata: { name: 'Owner' },
            },
        } as any)).resolves.toBeNull()
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
