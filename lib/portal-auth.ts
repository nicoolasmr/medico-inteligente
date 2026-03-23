import { getOptionalEnv } from './env'
import { prisma } from './prisma'
import { verifyPatientPortalToken } from './portal-token'

export function isPatientPortalEnabled() {
    return Boolean(getOptionalEnv('PATIENT_PORTAL_SECRET'))
}

export async function getPortalPatientAccess(patientId?: string, token?: string) {
    if (!isPatientPortalEnabled()) {
        return {
            ok: false as const,
            reason: 'Portal do paciente desativado: configure PATIENT_PORTAL_SECRET para liberar links seguros.',
        }
    }

    if (!patientId || !token) {
        return {
            ok: false as const,
            reason: 'Link do portal incompleto. Use o link seguro enviado ao paciente.',
        }
    }

    if (!verifyPatientPortalToken(patientId, token)) {
        return {
            ok: false as const,
            reason: 'Token de acesso inválido ou expirado para este paciente.',
        }
    }

    const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
            id: true,
            clinicId: true,
            name: true,
            email: true,
            phone: true,
            lastVisitAt: true,
        },
    })

    if (!patient) {
        return {
            ok: false as const,
            reason: 'Paciente não encontrado para este link de portal.',
        }
    }

    return {
        ok: true as const,
        patient,
    }
}
