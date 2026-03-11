'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'
import { createTreatmentSchema, updateTreatmentSchema, type CreateTreatmentInput, type UpdateTreatmentInput } from '../../../lib/validations/treatment'
import type { Treatment, TreatmentsByStage, ActionResult } from '../../../types'

const STAGES = ['lead', 'consulta_realizada', 'tratamento_indicado', 'orcamento_enviado', 'aprovado', 'realizado']

/**
 * Get all treatments grouped by stage for the Kanban board
 */
export async function getTreatmentsByStage(): Promise<TreatmentsByStage> {
    const clinicId = await getClinicId()
    const treatments = await prisma.treatment.findMany({
        where: { clinicId },
        include: {
            patient: {
                select: { name: true, phone: true }
            }
        },
        orderBy: { stageOrder: 'asc' },
    })

    const grouped: TreatmentsByStage = STAGES.reduce((acc, stage) => {
        acc[stage as any] = treatments.filter(t => t.stage === stage) as unknown as Treatment[]
        return acc
    }, {} as any)

    return grouped
}

/**
 * Move a treatment to a new stage and update its order
 */
export async function moveTreatment(id: string, newStage: string, newOrder: number): Promise<ActionResult<Treatment>> {
    try {
        const clinicId = await getClinicId()

        // Simple update for now. In a real app, we'd reorder others in the same stage.
        const treatment = await prisma.treatment.update({
            where: { id, clinicId },
            data: {
                stage: newStage as any,
                stageOrder: newOrder
            }
        })

        revalidatePath('/pipeline')
        return { success: true, data: treatment as unknown as Treatment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao mover tratamento' }
    }
}

/**
 * Create a new treatment lead
 */
export async function createTreatment(data: CreateTreatmentInput): Promise<ActionResult<Treatment>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = createTreatmentSchema.parse(data)

        const treatment = await prisma.treatment.create({
            data: {
                ...validatedData,
                clinicId,
                stage: validatedData.stage || 'lead',
                stageOrder: 0
            }
        })

        revalidatePath('/pipeline')
        return { success: true, data: treatment as unknown as Treatment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao criar tratamento' }
    }
}

/**
 * Update treatment details
 */
export async function updateTreatment(id: string, data: UpdateTreatmentInput): Promise<ActionResult<Treatment>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = updateTreatmentSchema.parse(data)

        const treatment = await prisma.treatment.update({
            where: { id, clinicId },
            data: validatedData
        })

        revalidatePath('/pipeline')
        return { success: true, data: treatment as unknown as Treatment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao atualizar tratamento' }
    }
}
