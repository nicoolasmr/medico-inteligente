import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../env'

/**
 * Admin client with service_role key — bypasses RLS.
 * Only use in trusted server contexts (seed, admin operations).
 * NEVER expose to client.
 */
export function createAdminClient() {
    return createClient(
        requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
        requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
        { auth: { persistSession: false, autoRefreshToken: false } }
    )
}
