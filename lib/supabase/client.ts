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

export function createClient() {
    if (browserClient) return browserClient

    const url = getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL')
    const key = getOptionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if (!url || !key) {
        return createMissingEnvProxy(
            'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY (browser Supabase client)'
        )
    }

    browserClient = createBrowserClient(url, key)
    return browserClient
}
