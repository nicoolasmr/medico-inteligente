import { Job, Worker } from 'bullmq'
import { prisma } from '../lib/prisma'
import { getRedis } from '../lib/redis'
import { sendWhatsApp } from '../lib/whatsapp'
import { pathToFileURL } from 'node:url'

type WorkerPayload = {
    automationId: string
    clinicId: string
    triggerEvent: string
    actionType: string
    payload?: {
        patient?: {
            id?: string
            name?: string
            phone?: string | null
        }
        time?: string
        [key: string]: unknown
    }
    config?: Record<string, unknown>
}

function interpolateTemplate(template: string, payload: WorkerPayload['payload']) {
    return template
        .replace('{patient_name}', payload?.patient?.name || 'Paciente')
        .replace('{time}', payload?.time || '')
}

async function persistLog(job: Job<WorkerPayload>, data: { status: 'success' | 'failed'; response: Record<string, unknown> }) {
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
                jobId: job.id,
                queue: job.queueName,
                attemptsMade: job.attemptsMade,
                ...data.response,
            },
        },
    })
}

const worker = new Worker<WorkerPayload>('automations', async job => {
    const { automationId, clinicId, payload, config, actionType } = job.data

type AutomationLogStatus = 'success' | 'failed' | 'skipped'

    try {
        if (actionType === 'whatsapp') {
            const message = typeof config?.message === 'string' ? config.message : ''
            if (!message) {
                throw new Error('Automation config is missing a WhatsApp message template')
            }

            if (!payload?.patient?.phone) {
                throw new Error('Automation payload is missing patient phone')
            }

            const formattedMessage = interpolateTemplate(message, payload)
            await sendWhatsApp({ to: payload.patient.phone, message: formattedMessage })

            await prisma.automation.update({
                where: { id: automationId },
                data: { executions: { increment: 1 } },
            })

            await persistLog(job, {
                status: 'success',
                response: {
                    action: actionType,
                    destination: payload.patient.phone,
                    patientName: payload.patient.name ?? 'Paciente',
                },
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
        console.error(`[Worker] Error in job ${job.id}:`, error)

        await persistLog(job, {
            status: 'failed',
            response: {
                action: actionType,
                error: message,
            },
        })

        throw error
    }
}, { connection: getRedis() })

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
