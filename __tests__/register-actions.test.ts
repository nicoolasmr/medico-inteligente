import { beforeEach, describe, expect, it, vi } from 'vitest'

const limitMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('../lib/ratelimit', () => ({
    authRatelimit: {
        limit: limitMock,
    },
}))

vi.mock('../lib/supabase/admin', () => ({
    createAdminClient: createAdminClientMock,
}))

describe('registerClinic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('rejects registration bursts before touching Supabase', async () => {
        const { registerClinic } = await import('../app/(auth)/register/actions')
        limitMock.mockResolvedValue({ success: false })

        const result = await registerClinic({
            userName: 'Nicolas',
            clinicName: 'Clínica Premium',
            email: 'owner@example.com',
            password: 'senha-segura',
        })

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain('Muitas tentativas')
        }
        expect(createAdminClientMock).not.toHaveBeenCalled()
    })
})
