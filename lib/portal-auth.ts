import { redirect } from 'next/navigation'
import { createPortalAccessToken, getAuthenticatedPatientPortalSession } from './auth'

export type PortalIdentity = {
    clinicId: string
    patientId: string
    token: string
}

export async function getPortalIdentity(): Promise<PortalIdentity> {
    const session = await getAuthenticatedPatientPortalSession()

    if (!session) {
        redirect('/login?error=portal_identity_required')
    }

    return {
        clinicId: session.clinicId,
        patientId: session.patientId,
        token: session.token,
    }
}

export { createPortalAccessToken }
