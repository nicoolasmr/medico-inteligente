import { Job, Worker } from 'bullmq'
import { buildAutomationRedisProcessedKey, type AutomationPayload } from '../lib/automation'
import { prisma } from '../lib/prisma'
import { getRedis } from '../lib/redis'
import { sendWhatsApp } from '../lib/whatsapp'

type WorkerPayload = {
    automationId: string
    clinicId: string
    event: string
    triggerEvent: string
    actionType: string
    idempotencyKey: string
    delayMinutes?: number
    payload?: AutomationPayload
    config?: Record<string, unknown>
}

type AutomationLogStatus = 'success' | 'failed' | 'skipped'

type LogContext = {
    queue: string
    jobId: string
    attempt: number
    idempotencyKey: string
    event: string
    patientId?: string
    automationId: string
    clinicId: string
    actionType: string
    delayMinutes: number
}

const PROCESSED_TTL_SECONDS = 60 * 60 * 24 * 30
const redis = getRedis()

function interpolateTemplate(template: string, payload: WorkerPayload['payload']) {
    return template
        .replace('{patient_name}', payload?.patient?.name || 'Paciente')
        .replace('{time}', payload?.time || '')
}

function getLogContext(job: Job<WorkerPayload>): LogContext {
    return {
        queue: job.queueName,
        jobId: String(job.id),
        attempt: job.attemptsMade + 1,
        idempotencyKey: job.data.idempotencyKey,
        event: job.data.event,
        patientId: job.data.payload?.patient?.id,
        automationId: job.data.automationId,
        clinicId: job.data.clinicId,
        actionType: job.data.actionType,
        delayMinutes: job.data.delayMinutes ?? 0,
    }
}

function logAutomationEvent(
    level: 'info' | 'warn' | 'error',
    message: string,
    context: LogContext,
    extra?: Record<string, unknown>,
) {
    console[level]('[AutomationWorker]', {
        message,
        ...context,
        ...extra,
    })
}

async function persistAutomationLog(
    job: Job<WorkerPayload>,
    data: { status: AutomationLogStatus; response: Record<string, unknown> },
) {
    const { automationId, clinicId, actionType, triggerEvent, payload } = job.data

    await prisma.automationLog.create({
        data: {
            clinicId,
            automationId,
            patientId: payload?.patient?.id,
            actionType,
            triggerEvent,
            status: data.status,
            response: {
                ...getLogContext(job),
                ...data.response,
            },
        },
    })
}

async function hasProcessedAutomation(idempotencyKey: string) {
    const processedKey = buildAutomationRedisProcessedKey(idempotencyKey)
    const processed = await redis.get(processedKey)
    return Boolean(processed)
}

async function markAutomationProcessed(idempotencyKey: string) {
    const processedKey = buildAutomationRedisProcessedKey(idempotencyKey)
    await redis.set(processedKey, '1', 'EX', PROCESSED_TTL_SECONDS)
}

async function finalizeSuccess(job: Job<WorkerPayload>, formattedMessage?: string) {
    const { automationId, actionType, payload } = job.data

    await prisma.$transaction([
        prisma.automation.update({
            where: { id: automationId },
            data: { executions: { increment: 1 } },
        }),
        prisma.automationLog.create({
            data: {
                clinicId: job.data.clinicId,
                automationId,
                patientId: payload?.patient?.id,
                actionType,
                triggerEvent: job.data.triggerEvent,
                status: 'success',
                response: {
                    ...getLogContext(job),
                    action: actionType,
                    destination: payload?.patient?.phone,
                    patientName: payload?.patient?.name ?? 'Paciente',
                    messagePreview: formattedMessage,
                },
            },
        }),
    ])
}

export async function processAutomationJob(job: Job<WorkerPayload>) {
    const { automationId, clinicId, payload, config, actionType, idempotencyKey } = job.data
    const context = getLogContext(job)

    logAutomationEvent('info', 'Executing automation job', context)

    try {
        if (actionType === 'whatsapp') {
            const message = typeof config?.message === 'string' ? config.message : ''
            if (!message) {
                throw new Error('Automation config is missing a WhatsApp message template')
            }

            if (!payload?.patient?.phone) {
                throw new Error('Automation payload is missing patient phone')
            }

            const alreadyProcessed = await hasProcessedAutomation(idempotencyKey)
            if (alreadyProcessed) {
                logAutomationEvent('warn', 'Skipping duplicate automation delivery', context, { reason: 'duplicate-idempotency-key' })
                await persistAutomationLog(job, {
                    status: 'skipped',
                    response: {
                        action: actionType,
                        reason: 'duplicate-idempotency-key',
                        duplicate: true,
                    },
                })
                return
            }

            const formattedMessage = interpolateTemplate(message, payload)
            const delivery = await sendWhatsApp({ to: payload.patient.phone, message: formattedMessage })

            await markAutomationProcessed(idempotencyKey)
            await finalizeSuccess(job, formattedMessage)

            logAutomationEvent('info', 'Automation delivery completed', context, {
                destination: payload.patient.phone,
                providerMessageId: delivery?.messageId,
            })
            return
        }

        await persistAutomationLog(job, {
            status: 'success',
            response: {
                action: actionType,
                detail: 'No-op action executed successfully',
            },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido na automação'

        logAutomationEvent('error', 'Automation job failed', context, {
            error: message,
            alertType: 'automation_execution_failed',
        })

        await persistAutomationLog(job, {
            status: 'failed',
            response: {
                action: actionType,
                error: message,
                alertType: 'automation_execution_failed',
            },
        })

        throw error
    }
}

export const worker = new Worker<WorkerPayload>('automations', processAutomationJob, { connection: redis })

worker.on('completed', job => {
    logAutomationEvent('info', 'Job completed', getLogContext(job))
})

worker.on('failed', (job, err) => {
    if (!job) {
        console.error('[AutomationWorker]', { message: 'Job failed before it was hydrated', error: err.message })
        return
    }

    logAutomationEvent('error', 'Job failed event emitted', getLogContext(job), {
        error: err.message,
        alertType: 'automation_job_failed_event',
    })
})

console.log('--- [Automations Worker] Started and waiting for jobs ---')
