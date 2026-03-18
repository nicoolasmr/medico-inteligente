'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'
import { createAutomationSchema, type CreateAutomationInput } from '../../../lib/validations/automation'
import type { Automation, AutomationLog, ActionResult } from '../../../types'
import { Queue } from 'bullmq'
import { redis } from '../../../lib/redis'

const automationQueue = new Queue('automations', { connection: redis })

/**
 * Get all automations for the clinic
 */
export async function getAutomations(): Promise<Automation[]> {
    const clinicId = await getClinicId()
    return prisma.automation.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' }
    }) as unknown as Automation[]
}

/**
 * Create a new automation rule
 */
export async function createAutomation(data: CreateAutomationInput): Promise<ActionResult<Automation>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = createAutomationSchema.parse(data)

        const automation = await prisma.automation.create({
            data: {
                ...validatedData,
                clinicId,
                isActive: true
            }
        })

        revalidatePath('/automacoes')
        return { success: true, data: automation as unknown as Automation }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao criar automação' }
    }
}

/**
 * Toggle automation status
 */
export async function toggleAutomation(id: string, active: boolean): Promise<ActionResult<Automation>> {
    try {
        const clinicId = await getClinicId()
        const automation = await prisma.automation.update({
            where: { id, clinicId },
            data: { isActive: active }
        })

        revalidatePath('/automacoes')
        return { success: true, data: automation as unknown as Automation }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao alterar status' }
    }
}

/**
 * Trigger an automation manually or via event
 */
export async function triggerEvent(event: string, payload: any) {
    const clinicId = await getClinicId()

    const rules = await prisma.automation.findMany({
        where: { clinicId, triggerEvent: event, isActive: true }
    })

    for (const rule of rules) {
        await automationQueue.add(rule.name, {
            automationId: rule.id,
            clinicId,
            event,
            payload,
            config: rule.config,
            actionType: rule.actionType,
            delayMinutes: rule.delayMinutes
        }, {
            delay: rule.delayMinutes ? Math.max(0, rule.delayMinutes * 60 * 1000) : 0
        })
    }
}

/**
 * Get last execution logs
 */
export async function getAutomationLogs(): Promise<AutomationLog[]> {
    const clinicId = await getClinicId()
    return prisma.automationLog.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 50
    }) as unknown as AutomationLog[]
}
/**
 * Delete an automation rule
 */
export async function deleteAutomation(id: string): Promise<ActionResult<void>> {
    try {
        const clinicId = await getClinicId()
        await prisma.automation.delete({
            where: { id, clinicId }
        })

        revalidatePath('/automacoes')
        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao excluir automação' }
    }
}
