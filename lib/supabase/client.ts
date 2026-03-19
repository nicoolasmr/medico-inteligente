'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getOptionalEnv } from '../env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

function createMissingEnvProxy(message: string) {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(message)
            },
        }
    ) as ReturnType<typeof createBrowserClient>
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

function createMissingEnvProxy(message: string) {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(message)
            },
        }
    ) as ReturnType<typeof createBrowserClient>
}

export function createClient() {
    if (browserClient) return browserClient

    // In client bundles, Next.js only exposes NEXT_PUBLIC_* env vars when they
    // are accessed statically. Dynamic lookups like process.env[name] can end
    // up undefined in the browser even when the variables exist in Vercel.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !key) {
        const missing = [
            !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
            !key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
        ].filter(Boolean).join(', ')

        return createMissingEnvProxy(
            `Missing required environment variables: ${missing} (browser Supabase client)`
        )
    }

    browserClient = createBrowserClient(url, key)
    return browserClient
}
