import type { Session } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'
import { getOptionalEnv, requireEnv } from './env'
import { prisma } from './prisma'
import type { User } from '../types'

type UserMetadata = {
    clinic_id?: string
    name?: string
    role?: string
}

type PortalSessionPayload = {
    clinicId: string
    patientId: string
    exp: number
}

type PortalPatientSession = {
    clinicId: string
    expiresAt: Date
    patient: {
        id: string
        clinicId: string
        email: string | null
        name: string
        phone: string | null
    }
}

const PORTAL_SESSION_COOKIE = 'mi_portal_session'
const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 30
const PORTAL_ACCESS_DENIED_PATH = '/portal/acesso-negado'

function getPortalTokenSecret() {
    return getOptionalEnv('PORTAL_TOKEN_SECRET')
        ?? getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY')
        ?? requireEnv('NEXTAUTH_SECRET', { context: 'portal token signing fallback' })
}

function toBase64Url(input: string | Buffer) {
    return Buffer.from(input).toString('base64url')
}

function signPortalPayload(payload: PortalSessionPayload) {
    const encodedPayload = toBase64Url(JSON.stringify(payload))
    const signature = crypto
        .createHmac('sha256', getPortalTokenSecret())
        .update(encodedPayload)
        .digest('base64url')

    return `${encodedPayload}.${signature}`
}

function verifyPortalToken(token: string): PortalSessionPayload | null {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    const expectedSignature = crypto
        .createHmac('sha256', getPortalTokenSecret())
        .update(encodedPayload)
        .digest('base64url')

    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (signatureBuffer.length !== expectedBuffer.length) return null
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null

    let payload: PortalSessionPayload

    try {
        payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as PortalSessionPayload
    } catch {
        return null
    }

    if (!payload.patientId || !payload.clinicId || typeof payload.exp !== 'number') {
        return null
    }

    if (payload.exp <= Date.now()) {
        return null
    }

    return payload
}

async function ensureUserProfile(session: Session) {
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

/**
 * Get the current authenticated user with clinic context.
 * Throws/redirects if not authenticated.
 */
export async function getCurrentUser(): Promise<User> {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) redirect('/login')

    const user = await ensureUserProfile(session)
    if (!user) redirect('/login?error=profile_not_found')

    return user
}

/**
 * Get the clinic_id for the current authenticated user.
 * Fast version — only fetches clinic_id.
 */
export async function getClinicId(): Promise<string> {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')

    const user = await ensureUserProfile(session)
    if (!user) redirect('/login?error=profile_not_found')

    return user.clinicId
}

export function createPatientPortalToken(patientId: string, clinicId: string, expiresAt = new Date(Date.now() + PORTAL_SESSION_MAX_AGE_SECONDS * 1000)) {
    return signPortalPayload({
        patientId,
        clinicId,
        exp: expiresAt.getTime(),
    })
}

export async function establishPatientPortalSession(accessToken: string) {
    const payload = verifyPortalToken(accessToken)
    if (!payload) return false

    const patient = await prisma.patient.findUnique({
        where: { id: payload.patientId },
        select: { id: true, clinicId: true },
    })

    if (!patient || patient.clinicId !== payload.clinicId) {
        return false
    }

    const cookieStore = await cookies()
    cookieStore.set(PORTAL_SESSION_COOKIE, accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(payload.exp),
    })

    return true
}

export async function clearPatientPortalSession() {
    const cookieStore = await cookies()
    cookieStore.delete(PORTAL_SESSION_COOKIE)
}

export async function getAuthenticatedPortalPatient(): Promise<PortalPatientSession> {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value

    if (!accessToken) {
        redirect(PORTAL_ACCESS_DENIED_PATH)
    }

    const payload = verifyPortalToken(accessToken)
    if (!payload) {
        cookieStore.delete(PORTAL_SESSION_COOKIE)
        redirect(PORTAL_ACCESS_DENIED_PATH)
    }

    const patient = await prisma.patient.findFirst({
        where: {
            id: payload.patientId,
            clinicId: payload.clinicId,
        },
        select: {
            id: true,
            clinicId: true,
            name: true,
            email: true,
            phone: true,
        },
    })

    if (!patient) {
        cookieStore.delete(PORTAL_SESSION_COOKIE)
        redirect(PORTAL_ACCESS_DENIED_PATH)
    }

    return {
        clinicId: patient.clinicId,
        expiresAt: new Date(payload.exp),
        patient,
    }
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
