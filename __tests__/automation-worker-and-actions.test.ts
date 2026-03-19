import { beforeEach, describe, expect, it, vi } from 'vitest'

const prisma = {
    automation: {
        findMany: vi.fn(),
        update: vi.fn(),
    },
    automationLog: {
        create: vi.fn(),
        findMany: vi.fn(),
    },
    $transaction: vi.fn(async (operations: unknown[]) => operations),
}
const getClinicId = vi.fn()
const revalidatePath = vi.fn()
const queueAdd = vi.fn()
const queueCtor = vi.fn()
const getAutomationQueue = vi.fn()
const sendWhatsApp = vi.fn()

vi.mock('../lib/prisma', () => ({ prisma }))
vi.mock('../lib/auth', () => ({ getClinicId }))
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('../lib/queue', () => ({ getAutomationQueue }))
vi.mock('../lib/redis', () => ({
    getRedis: vi.fn(() => ({ get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue('OK') })),
    RedisUnavailableError: class RedisUnavailableError extends Error {},
}))
vi.mock('../lib/whatsapp', () => ({ sendWhatsApp }))
vi.mock('bullmq', () => {
    class MockQueue {
        constructor(...args: unknown[]) {
            queueCtor(...args)
        }

        add = queueAdd
    }

    class MockWorker {
        processor: unknown

        constructor(_name: string, processor: unknown) {
            this.processor = processor
        }

        on = vi.fn()
    }

    return {
        Queue: vi.fn().mockImplementation(function (...args: unknown[]) {
            return new MockQueue(...args)
        }),
        Worker: vi.fn().mockImplementation(function (_name: string, processor: unknown) {
            return new MockWorker(_name, processor)
        }),
        Job: class {},
    }
})

describe('automation worker and actions stability', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        getClinicId.mockResolvedValue('clinic-123')
    })

    it('should skip queue dispatch when queue is unavailable', async () => {
        getAutomationQueue.mockImplementationOnce(() => { throw new Error('redis offline') })
        prisma.automation.findMany.mockResolvedValue([{ id: 'auto-1', name: 'Rule', config: {}, actionType: 'whatsapp', triggerEvent: 'appointment_created', delayMinutes: 0, isActive: true }])

        const { triggerEvent } = await import('../app/(dashboard)/automacoes/actions')

        await expect(triggerEvent('appointment_created', { patient: { id: 'patient-1' } })).resolves.toEqual(expect.objectContaining({ success: false }))
        expect(queueAdd).not.toHaveBeenCalled()
    })

    it('should enqueue automation jobs when queue is available', async () => {
        getAutomationQueue.mockReturnValue({ add: queueAdd })
        prisma.automation.findMany.mockResolvedValue([{ id: 'auto-1', name: 'Rule', config: { message: 'Olá' }, actionType: 'whatsapp', triggerEvent: 'appointment_created', delayMinutes: 2, isActive: true }])

        const { triggerEvent } = await import('../app/(dashboard)/automacoes/actions')
        await triggerEvent('appointment_created', { patient: { id: 'patient-1', phone: '11999999999' } })

        expect(getAutomationQueue).toHaveBeenCalled()
        expect(queueAdd).toHaveBeenCalledWith('appointment_created:auto-1:patient-1:no-time', expect.objectContaining({ automationId: 'auto-1', clinicId: 'clinic-123' }), expect.objectContaining({ delay: 120000 }))
    })

    it('should fail when whatsapp payload misses patient phone and persist failure log', async () => {
        const { processAutomationJob } = await import('../workers/automation.worker')
        const job = {
            id: 'job-1',
            queueName: 'automations',
            attemptsMade: 1,
            data: {
                automationId: 'auto-1',
                clinicId: 'clinic-123',
                triggerEvent: 'appointment_created',
                actionType: 'whatsapp',
                payload: { patient: { id: 'patient-1', name: 'Alice' } },
                config: { message: 'Olá {patient_name}' },
            },
        }

        await expect(processAutomationJob(job as any)).rejects.toThrow('Automation payload is missing patient phone')
        expect(prisma.automation.update).not.toHaveBeenCalled()
        expect(prisma.automationLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                clinicId: 'clinic-123',
                status: 'failed',
                response: expect.objectContaining({ error: 'Automation payload is missing patient phone' }),
            }),
        }))
    })

    it('should fail when whatsapp template is absent and persist failure log', async () => {
        const { processAutomationJob } = await import('../workers/automation.worker')
        const job = {
            id: 'job-2',
            queueName: 'automations',
            attemptsMade: 0,
            data: {
                automationId: 'auto-1',
                clinicId: 'clinic-123',
                triggerEvent: 'appointment_created',
                actionType: 'whatsapp',
                payload: { patient: { id: 'patient-1', name: 'Alice', phone: '11999999999' } },
                config: {},
            },
        }

        await expect(processAutomationJob(job as any)).rejects.toThrow('Automation config is missing a WhatsApp message template')
        expect(prisma.automationLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'failed',
                response: expect.objectContaining({ error: 'Automation config is missing a WhatsApp message template' }),
            }),
        }))
    })

    it('should persist success log when whatsapp automation succeeds', async () => {
        const { processAutomationJob } = await import('../workers/automation.worker')
        const job = {
            id: 'job-3',
            queueName: 'automations',
            attemptsMade: 0,
            data: {
                automationId: 'auto-1',
                clinicId: 'clinic-123',
                triggerEvent: 'appointment_created',
                actionType: 'whatsapp',
                payload: { patient: { id: 'patient-1', name: 'Alice', phone: '11999999999' }, time: '09:30' },
                config: { message: 'Olá {patient_name}, até {time}' },
            },
        }

        await expect(processAutomationJob(job as any)).resolves.toBeUndefined()
        expect(sendWhatsApp).toHaveBeenCalledWith({ to: '11999999999', message: 'Olá Alice, até 09:30' })
        expect(prisma.automation.update).toHaveBeenCalledWith({ where: { id: 'auto-1' }, data: { executions: { increment: 1 } } })
        expect(prisma.automationLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'success', patientId: 'patient-1' }),
        }))
    })
})
