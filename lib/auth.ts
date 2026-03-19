import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Session } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'
import { prisma } from './prisma'
import type { User } from '../types'

type UserMetadata = {
    clinic_id?: string
    name?: string
    role?: string
}

type PortalTokenPayload = {
    clinicId: string
    patientId: string
    exp: number
    type: 'patient-access' | 'patient-session'
}

export type PatientPortalSession = {
    clinicId: string
    patientId: string
    token: string
    expiresAt: Date
}

const PATIENT_PORTAL_SESSION_COOKIE = 'portal_session'
const PATIENT_PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const PATIENT_PORTAL_ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 30

function getPortalSecret() {
    return process.env.PORTAL_TOKEN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-portal-secret'
}

function encodePortalToken(payload: PortalTokenPayload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = createHmac('sha256', getPortalSecret()).update(body).digest('base64url')
    return `${body}.${signature}`
}

function decodePortalToken(token: string): PortalTokenPayload | null {
    const [body, signature] = token.split('.')

    if (!body || !signature) return null

    const expectedSignature = createHmac('sha256', getPortalSecret()).update(body).digest('base64url')
    const expectedBuffer = Buffer.from(expectedSignature)
    const providedBuffer = Buffer.from(signature)

    if (expectedBuffer.length !== providedBuffer.length) return null
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) return null

    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PortalTokenPayload

        if (!payload.clinicId || !payload.patientId || !payload.exp || !payload.type) {
            return null
        }

        if (payload.exp <= Math.floor(Date.now() / 1000)) {
            return null
        }

        return payload
    } catch {
        return null
    }
}

export function createPortalAccessToken(clinicId: string, patientId: string) {
    return encodePortalToken({
        clinicId,
        patientId,
        exp: Math.floor(Date.now() / 1000) + PATIENT_PORTAL_ACCESS_TOKEN_MAX_AGE_SECONDS,
        type: 'patient-access',
    })
}

function createPatientPortalSessionToken(clinicId: string, patientId: string) {
    return encodePortalToken({
        clinicId,
        patientId,
        exp: Math.floor(Date.now() / 1000) + PATIENT_PORTAL_SESSION_MAX_AGE_SECONDS,
        type: 'patient-session',
    })
}

export async function establishPatientPortalSession(accessToken: string): Promise<boolean> {
    const payload = decodePortalToken(accessToken)

    if (!payload || payload.type !== 'patient-access') {
        return false
    }

    const patient = await prisma.patient.findUnique({
        where: { id: payload.patientId },
        select: { id: true, clinicId: true },
    })

    if (!patient || patient.clinicId !== payload.clinicId) {
        return false
    }

    const cookieStore = await cookies()
    const sessionToken = createPatientPortalSessionToken(patient.clinicId, patient.id)

    cookieStore.set(PATIENT_PORTAL_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: PATIENT_PORTAL_SESSION_MAX_AGE_SECONDS,
    })

    return true
}

export async function getAuthenticatedPatientPortalSession(): Promise<PatientPortalSession | null> {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(PATIENT_PORTAL_SESSION_COOKIE)?.value

    if (!sessionToken) return null

    const payload = decodePortalToken(sessionToken)
    if (!payload || payload.type !== 'patient-session') return null

    return {
        clinicId: payload.clinicId,
        patientId: payload.patientId,
        token: sessionToken,
        expiresAt: new Date(payload.exp * 1000),
    }
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
