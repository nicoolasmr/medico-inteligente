import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClient = vi.fn()
const slugify = vi.fn((value: string) => value.toLowerCase().replace(/\s+/g, '-'))

vi.mock('../lib/supabase/admin', () => ({ createAdminClient }))
vi.mock('../lib/utils', async () => {
    const actual = await vi.importActual<typeof import('../lib/utils')>('../lib/utils')
    return { ...actual, slugify }
})

describe('registerClinic rollback coverage', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    function buildSupabaseAdmin(options?: {
        createUserError?: string
        clinicInsertError?: string
        userInsertError?: string
        automationInsertError?: string
    }) {
        const deleteEq = vi.fn().mockResolvedValue({ error: null })
        const deleteFactory = () => ({ delete: vi.fn().mockReturnValue({ eq: deleteEq }) })

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
            return deleteFactory()
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
        const supabaseAdmin = buildSupabaseAdmin()
        createAdminClient.mockReturnValue(supabaseAdmin)

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

    it('should fail cleanly after creating auth user and roll back auth user', async () => {
        const supabaseAdmin = buildSupabaseAdmin({ clinicInsertError: 'Falha ao criar clínica' })
        createAdminClient.mockReturnValue(supabaseAdmin)

        const { registerClinic } = await import('../app/(auth)/register/actions')
        const result = await registerClinic({
            userName: 'Dra. Alice',
            clinicName: 'Clínica Aurora',
            email: 'alice@example.com',
            password: 'Secret123!',
        })

        expect(result).toEqual({ success: false, error: 'Falha ao criar clínica' })
        expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
        expect(supabaseAdmin.deleteEq).not.toHaveBeenCalledWith('clinic_id', 'clinic-123')
    })

    it('should fail after creating clinic and roll back users, clinics and automations', async () => {
        const supabaseAdmin = buildSupabaseAdmin({ automationInsertError: 'queue storage unavailable' })
        createAdminClient.mockReturnValue(supabaseAdmin)

        const { registerClinic } = await import('../app/(auth)/register/actions')
        const result = await registerClinic({
            userName: 'Dra. Alice',
            clinicName: 'Clínica Aurora',
            email: 'alice@example.com',
            password: 'Secret123!',
        })

        expect(result).toEqual({ success: false, error: 'queue storage unavailable' })
        expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
        expect(supabaseAdmin.deleteEq).toHaveBeenCalledWith('clinic_id', 'clinic-123')
        expect(supabaseAdmin.deleteEq).toHaveBeenCalledWith('id', 'clinic-123')
    })
})
