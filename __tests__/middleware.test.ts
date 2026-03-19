import { beforeEach, describe, expect, it, vi } from 'vitest'

const limitMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('../lib/ratelimit', () => ({
    apiRatelimit: {
        limit: limitMock,
    },
}))

vi.mock('@supabase/ssr', () => ({
    createServerClient: createServerClientMock,
}))

describe('middleware rate limiting', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    it('applies the rate limiter to API routes that match the middleware config', async () => {
        const { config, middleware } = await import('../middleware')

        limitMock.mockResolvedValue({
            success: true,
            limit: 30,
            remaining: 29,
            reset: Date.now() + 60_000,
            pending: Promise.resolve(),
        })

        const request = createRequest('https://example.com/api/patients', '198.51.100.10')
        const response = await middleware(request)

        expect(response.status).toBe(200)
        expect(limitMock).toHaveBeenCalledWith('198.51.100.10')
        expect(config.matcher).toContain('/api/:path*')
        expect(config.matcher).not.toContain('/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)')
    })

    it('returns 429 after an API route exceeds the rate limit', async () => {
        const { middleware } = await import('../middleware')

        limitMock.mockResolvedValue({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60_000,
            pending: Promise.resolve(),
        })

        const request = createRequest('https://example.com/api/patients', '203.0.113.7')
        const response = await middleware(request)

        expect(limitMock).toHaveBeenCalledWith('203.0.113.7')
        expect(response.status).toBe(429)
        await expect(response.text()).resolves.toBe('Too Many Requests')
    })
})

function createRequest(url: string, forwardedFor?: string) {
    const headers = new Headers()

    if (forwardedFor) {
        headers.set('x-forwarded-for', forwardedFor)
    }

    return {
        headers,
        url,
        nextUrl: new URL(url),
        cookies: {
            getAll: () => [],
        },
    } as any
}
