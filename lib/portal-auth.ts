import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getClinicId } from './auth'

export type PortalIdentity = {
    clinicId: string
    patientId: string
    token: string
}

function getPortalSecret() {
    return process.env.PORTAL_TOKEN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-portal-secret'
}

export function createPortalAccessToken(clinicId: string, patientId: string) {
    return createHmac('sha256', getPortalSecret()).update(`${clinicId}:${patientId}`).digest('hex')
}

function isValidPortalToken(clinicId: string, patientId: string, token: string) {
    const expected = createPortalAccessToken(clinicId, patientId)
    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(token)

    if (expectedBuffer.length !== providedBuffer.length) return false

    return timingSafeEqual(expectedBuffer, providedBuffer)
}

export async function getPortalIdentity(): Promise<PortalIdentity> {
    const clinicId = await getClinicId()
    const headerStore = await headers()
    const cookieStore = await cookies()

    const patientId = headerStore.get('x-portal-patient-id')
        ?? cookieStore.get('portal_patient_id')?.value
    const token = headerStore.get('x-portal-access-token')
        ?? cookieStore.get('portal_access_token')?.value

    if (!patientId || !token) {
        redirect('/login?error=portal_identity_required')
    }

    if (!isValidPortalToken(clinicId, patientId, token)) {
        redirect('/login?error=portal_access_denied')
    }

    return { clinicId, patientId, token }
}
