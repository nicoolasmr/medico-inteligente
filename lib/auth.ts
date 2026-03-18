import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '../types'

/**
 * Get the current authenticated user with clinic context.
 * Throws/redirects if not authenticated.
 */
export async function getCurrentUser(): Promise<User> {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) redirect('/login')

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

    if (error || !user) redirect('/login')

    return user as User
}

/**
 * Get the clinic_id for the current authenticated user.
 * Fast version — only fetches clinic_id.
 */
export async function getClinicId(): Promise<string> {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')

    const { data } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', session.user.id)
        .single()

    if (!data) redirect('/login')

    return data.clinic_id as string
}

/**
 * Check if current user has one of the required roles.
 */
export async function requireRole(
    allowedRoles: User['role'][]
): Promise<User> {
    const user = await getCurrentUser()
    if (!allowedRoles.includes(user.role)) {
        redirect('/dashboard?error=unauthorized')
    }
    return user
}
