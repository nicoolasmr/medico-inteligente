import type { Session } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'
import type { User } from '../types'

type UserMetadata = {
    clinic_id?: string
    name?: string
    role?: string
}

export async function ensureUserProfile(session: Session) {
    const supabase = await createClient()

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

    if (!error && user) {
        return user as User
    }

    const metadata = (session.user.user_metadata ?? {}) as UserMetadata
    const clinicId = metadata.clinic_id

    if (!clinicId) return null

    const admin = createAdminClient()
    const { data: repairedUser, error: repairError } = await admin
        .from('users')
        .upsert({
            id: session.user.id,
            clinic_id: clinicId,
            name: metadata.name ?? session.user.email ?? 'Usuário',
            email: session.user.email ?? '',
            role: metadata.role ?? 'owner',
        }, { onConflict: 'id' })
        .select('*')
        .single()

    if (repairError || !repairedUser) {
        return null
    }

    return repairedUser as User
}

export async function getCurrentUser(): Promise<User> {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) redirect('/login')

    const user = await ensureUserProfile(session)
    if (!user) redirect('/login?error=profile_not_found')

    return user
}

export async function getClinicId(): Promise<string> {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')

    const user = await ensureUserProfile(session)
    if (!user) redirect('/login?error=profile_not_found')

    return user.clinicId
}

export async function requireRole(
    allowedRoles: User['role'][]
): Promise<User> {
    const user = await getCurrentUser()
    if (!allowedRoles.includes(user.role)) {
        redirect('/dashboard?error=unauthorized')
    }
    return user
}
