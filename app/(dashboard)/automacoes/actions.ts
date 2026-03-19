'use server'

import { revalidatePath } from 'next/cache'
import { getClinicId } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { RedisUnavailableError } from '../../../lib/redis'
import { getAutomationQueue } from '../../../lib/queue'
import { createAutomationSchema, type CreateAutomationInput } from '../../../lib/validations/automation'
import { buildAutomationIdempotencyKey, buildAutomationJobName, type AutomationPayload } from '../../../lib/automation'
import type { ActionResult, Automation, AutomationLog } from '../../../types'

const AUTOMATION_UNAVAILABLE_MESSAGE = 'Automações indisponíveis no momento. Configure o Redis para habilitar filas e workers.'

export type AutomationRuntimeStatus = {
    available: boolean
    mode: 'full' | 'read-only'
    message?: string
}

type TriggerPayload = AutomationPayload

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

function getAutomationRuntimeStatus(): AutomationRuntimeStatus {
    try {
        getAutomationQueue()

        return {
            available: true,
            mode: 'full',
        }
    } catch (error: unknown) {
        if (error instanceof RedisUnavailableError) {
            return {
                available: false,
                mode: 'read-only',
                message: AUTOMATION_UNAVAILABLE_MESSAGE,
            }
        }

        throw error
    }
}

function assertAutomationAvailable() {
    const runtime = getAutomationRuntimeStatus()

    if (!runtime.available) {
        throw new RedisUnavailableError(runtime.message)
    }
}

export async function getAutomations(): Promise<Automation[]> {
    const clinicId = await getClinicId()
    return prisma.automation.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
    }) as unknown as Automation[]
}

export async function getAutomationRuntime(): Promise<AutomationRuntimeStatus> {
    return getAutomationRuntimeStatus()
}

export async function createAutomation(data: CreateAutomationInput): Promise<ActionResult<Automation>> {
    try {
        assertAutomationAvailable()

        const clinicId = await getClinicId()
        const validatedData = createAutomationSchema.parse(data)

        const automation = await prisma.automation.create({
            data: {
                ...validatedData,
                clinicId,
                isActive: true,
            },
        })

        revalidatePath('/automacoes')
        return { success: true, data: automation as unknown as Automation }
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error, 'Erro ao criar automação') }
    }
}

export async function toggleAutomation(id: string, active: boolean): Promise<ActionResult<Automation>> {
    try {
        assertAutomationAvailable()

        const clinicId = await getClinicId()
        const automation = await prisma.automation.update({
            where: { id, clinicId },
            data: { isActive: active },
        })

        revalidatePath('/automacoes')
        return { success: true, data: automation as unknown as Automation }
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error, 'Erro ao alterar status') }
    }
}

export async function triggerEvent(event: string, payload: TriggerPayload): Promise<ActionResult<null>> {
    try {
        const clinicId = await getClinicId()
        const rules = await prisma.automation.findMany({
            where: { clinicId, triggerEvent: event, isActive: true },
        })

        const queue = getAutomationQueue()

        for (const rule of rules) {
            const idempotencyKey = buildAutomationIdempotencyKey({ automationId: rule.id, clinicId, event, payload })

            await queue.add(buildAutomationJobName({ automationId: rule.id, clinicId, event, payload }), {
                automationId: rule.id,
                clinicId,
                event,
                payload,
                config: rule.config,
                actionType: rule.actionType,
                triggerEvent: rule.triggerEvent,
                idempotencyKey,
            }, {
                jobId: idempotencyKey,
                delay: rule.delayMinutes ? Math.max(0, rule.delayMinutes * 60 * 1000) : 0,
                attempts: 3,
                removeOnComplete: 100,
                removeOnFail: 200,
                backoff: { type: 'exponential', delay: 1000 },
            })
        }

        return { success: true, data: null }
    } catch (error: unknown) {
        const message = error instanceof RedisUnavailableError
            ? AUTOMATION_UNAVAILABLE_MESSAGE
            : getErrorMessage(error, AUTOMATION_UNAVAILABLE_MESSAGE)

        return { success: false, error: message }
    }
}

export async function getAutomationLogs(): Promise<AutomationLog[]> {
    const clinicId = await getClinicId()
    return prisma.automationLog.findMany({
        where: { clinicId },
        include: {
            automation: { select: { name: true } },
            patient: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    }) as unknown as AutomationLog[]
}

export async function deleteAutomation(id: string): Promise<ActionResult<void>> {
    try {
        assertAutomationAvailable()

        const clinicId = await getClinicId()
        await prisma.automation.delete({
            where: { id, clinicId },
        })

        revalidatePath('/automacoes')
        return { success: true, data: undefined }
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error, 'Erro ao excluir automação') }
    }
}
