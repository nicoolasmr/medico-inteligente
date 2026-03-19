import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireEnv } from '../env'

export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
        requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (pairs) => pairs.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                ),
            },
        }
    )
}
