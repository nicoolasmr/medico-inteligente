'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Get clinic profile data
 */
export async function getClinicProfile() {
    const clinicId = await getClinicId()
    return prisma.clinic.findFirst({
        where: { id: clinicId }
    })
}

/**
 * Update clinic profile
 */
export async function updateClinicProfile(data: any) {
    try {
        const clinicId = await getClinicId()
        const updated = await prisma.clinic.update({
            where: { id: clinicId },
            data: {
                name: data.name,
                phone: data.phone,
                address: data.address,
                settings: data.settings || {}
            }
        })

        revalidatePath('/configuracoes')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: 'Erro ao salvar configurações' }
    }
}

/**
 * Get team members
 */
export async function getTeamMembers() {
    const clinicId = await getClinicId()
    return prisma.user.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'asc' }
    })
}
