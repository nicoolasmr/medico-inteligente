import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiRatelimit } from './lib/ratelimit'

const PROTECTED_PREFIXES = [
    '/dashboard',
    '/patients',
    '/agenda',
    '/pipeline',
    '/financeiro',
    '/automacoes',
    '/insights',
    '/configuracoes',
]

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({ request })

    // 1. Rate Limiting for API and sensitive routes
    if (pathname.startsWith('/api') || PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
        const { success } = await apiRatelimit.limit(ip)

        if (!success) {
            return new NextResponse('Too Many Requests', { status: 429 })
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
                        response.cookies.set(name, value, options)
                    ),
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
    const isAuthRoute = AUTH_PREFIXES.some(p => pathname.startsWith(p))

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
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)'],
}
