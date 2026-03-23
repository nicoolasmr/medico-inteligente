import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiRatelimit } from './lib/ratelimit'

const PROTECTED_PREFIXES = [
    '/portal',
    '/dashboard',
    '/patients',
    '/agenda',
    '/pipeline',
    '/financeiro',
    '/automacoes',
    '/insights',
    '/configuracoes',
] as const

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password'] as const
const RATE_LIMITED_PREFIXES = ['/api', ...PROTECTED_PREFIXES] as const

function getRequestIdentifier(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (!forwardedFor) return '127.0.0.1'

    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1'
}

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
    return prefixes.some(prefix => pathname.startsWith(prefix))
}

function isRateLimitedPath(pathname: string) {
    return matchesPrefix(pathname, RATE_LIMITED_PREFIXES)
}

function getRequestIdentifier(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (!forwardedFor) return '127.0.0.1'

    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1'
}

function getRequestIdentifier(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (!forwardedFor) return '127.0.0.1'

    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1'
}

function getRequestIdentifier(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (!forwardedFor) return '127.0.0.1'

    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1'
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({ request })

    if (pathname.startsWith('/api') || PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
        try {
            const identifier = getRequestIdentifier(request)
            const { success } = await apiRatelimit.limit(identifier)

            if (!success) {
                return new NextResponse('Too Many Requests', { status: 429 })
            }
        } catch (error) {
            console.error('[middleware] Rate limit check failed; continuing request.', error)
        }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return response

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (pairs: { name: string; value: string; options: any }[]) =>
                    pairs.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    ),
            },
        },
    )

    const { data: { session } } = await supabase.auth.getSession()

    const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES)
    const isAuthRoute = matchesPrefix(pathname, AUTH_PREFIXES)

    if (isProtected && !session) {
        const url = new URL('/login', request.url)
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
    ],
}
