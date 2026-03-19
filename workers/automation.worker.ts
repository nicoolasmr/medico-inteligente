import { Job, Worker } from 'bullmq'
import { buildAutomationRedisProcessedKey, type AutomationPayload } from '../lib/automation'
import { prisma } from '../lib/prisma'
import { getRedis, RedisUnavailableError } from '../lib/redis'
import { sendWhatsApp } from '../lib/whatsapp'

type WorkerPayload = {
    automationId: string
    clinicId: string
    event: string
    triggerEvent: string
    actionType: string
    idempotencyKey: string
    payload?: AutomationPayload
    config?: Record<string, unknown>
}

type AutomationLogStatus = 'success' | 'failed' | 'skipped'

type LogContext = {
    jobId: string
    attempt: number
    idempotencyKey: string
    event: string
    patientId?: string
}

const PROCESSED_TTL_SECONDS = 60 * 60 * 24 * 30

let redisClient: ReturnType<typeof getRedis> | null = null

function getWorkerRedis() {
    if (redisClient) return redisClient

    redisClient = getRedis()
    return redisClient
}

function interpolateTemplate(template: string, payload: WorkerPayload['payload']) {
    return template
        .replace('{patient_name}', payload?.patient?.name || 'Paciente')
        .replace('{time}', payload?.time || '')
}

function getLogContext(job: Job<WorkerPayload>): LogContext {
    return {
        jobId: String(job.id),
        attempt: job.attemptsMade + 1,
        idempotencyKey: job.data.idempotencyKey,
        event: job.data.event,
        patientId: job.data.payload?.patient?.id,
    }
}

function logAutomationEvent(level: 'info' | 'warn' | 'error', message: string, context: LogContext, extra?: Record<string, unknown>) {
    console[level]('[AutomationWorker]', {
        message,
        ...context,
        ...extra,
    })
}

async function persistLog(job: Job<WorkerPayload>, data: { status: AutomationLogStatus; response: Record<string, unknown> }) {
    const { automationId, clinicId, actionType, triggerEvent, payload } = job.data
    const context = getLogContext(job)

    await prisma.automationLog.create({
        data: {
            clinicId,
            automationId,
            patientId: payload?.patient?.id,
            actionType,
            triggerEvent,
            status: data.status,
            response: {
                queue: job.queueName,
                ...context,
                ...data.response,
            },
        },
    })
}

async function hasProcessedAutomation(idempotencyKey: string) {
    const processedKey = buildAutomationRedisProcessedKey(idempotencyKey)
    const processed = await getWorkerRedis().get(processedKey)
    return Boolean(processed)
}

async function markAutomationProcessed(idempotencyKey: string) {
    const processedKey = buildAutomationRedisProcessedKey(idempotencyKey)
    await getWorkerRedis().set(processedKey, '1', 'EX', PROCESSED_TTL_SECONDS)
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
                    queue: job.queueName,
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

    logAutomationEvent('info', 'Executing automation job', context, { automationId, clinicId, actionType })

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
                logAutomationEvent('warn', 'Skipping duplicate automation delivery', context, { automationId })
                await persistLog(job, {
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
            await sendWhatsApp({ to: payload.patient.phone, message: formattedMessage })
            await markAutomationProcessed(idempotencyKey)
            await finalizeSuccess(job, formattedMessage)

            logAutomationEvent('info', 'Automation delivery completed', context, {
                automationId,
                destination: payload.patient.phone,
            })
            return
        }

        await persistLog(job, {
            status: 'success',
            response: {
                action: actionType,
                detail: 'No-op action executed successfully',
            },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido na automação'

        logAutomationEvent('error', 'Automation job failed', context, {
            automationId,
            clinicId,
            actionType,
            error: message,
            alertType: 'automation_execution_failed',
        })

        await persistLog(job, {
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

export function createAutomationWorker() {
    return new Worker<WorkerPayload>('automations', processAutomationJob, { connection: getWorkerRedis() })
}

export const worker = (() => {
    try {
        const automationWorker = createAutomationWorker()

        automationWorker.on('completed', job => {
            logAutomationEvent('info', 'Job completed', getLogContext(job), {})
        })

        automationWorker.on('failed', (job, err) => {
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
        return automationWorker
    } catch (error) {
        if (error instanceof RedisUnavailableError) {
            console.warn('--- [Automations Worker] Redis unavailable; worker not started ---')
            return null
        }

        throw error
    }
})()
