import { Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { sendWhatsApp } from '../lib/whatsapp'

const worker = new Worker('automations', async job => {
    const { automationId, clinicId, payload, config, actionType } = job.data

    console.log(`[Worker] Executing automation ${automationId} for clinic ${clinicId}`)

    try {
        if (actionType === 'whatsapp') {
            const { message } = config as any
            // Simple template replacement
            const formattedMessage = message
                .replace('{patient_name}', payload?.patient?.name || 'Paciente')
                .replace('{time}', payload?.time || '')

            await sendWhatsApp({ to: payload?.patient?.phone, message: formattedMessage })
        }

        // Log success
        await prisma.automationLog.create({
            data: {
                clinicId,
                automationId,
                actionType,
                triggerEvent: (config as any).triggerEvent || 'system',
                status: 'success',
                response: { jobId: job.id, action: actionType }
            }
        })

    } catch (error: any) {
        console.error(`[Worker] Error in job ${job.id}:`, error)

        await prisma.automationLog.create({
            data: {
                clinicId,
                automationId,
                actionType,
                triggerEvent: (config as any).triggerEvent || 'system',
                status: 'failed',
                response: { error: error.message }
            }
        })
    }
}, { connection: redis })

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err)
})

console.log('--- [Automations Worker] Started and waiting for jobs ---')
