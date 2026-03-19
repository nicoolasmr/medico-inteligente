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
}
const getClinicId = vi.fn()
const revalidatePath = vi.fn()
const queueAdd = vi.fn()
const queueCtor = vi.fn()
const sendWhatsApp = vi.fn()

vi.mock('../lib/prisma', () => ({ prisma }))
vi.mock('../lib/auth', () => ({ getClinicId }))
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('../lib/redis', () => ({ redis: { status: 'mocked' } }))
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
        const queueModule = await import('bullmq')
        ;(queueModule.Queue as any).mockImplementationOnce(function () { throw new Error('redis offline') })
        prisma.automation.findMany.mockResolvedValue([{ id: 'auto-1', name: 'Rule', config: {}, actionType: 'whatsapp', triggerEvent: 'appointment_created', delayMinutes: 0 }])

        const { triggerEvent } = await import('../app/(dashboard)/automacoes/actions')

        await expect(triggerEvent('appointment_created', { patient: { id: 'patient-1' } })).resolves.toBeUndefined()
        expect(queueAdd).not.toHaveBeenCalled()
    })

    it('should enqueue automation jobs when queue is available', async () => {
        prisma.automation.findMany.mockResolvedValue([{ id: 'auto-1', name: 'Rule', config: { message: 'Olá' }, actionType: 'whatsapp', triggerEvent: 'appointment_created', delayMinutes: 2 }])

        const { triggerEvent } = await import('../app/(dashboard)/automacoes/actions')
        await triggerEvent('appointment_created', { patient: { id: 'patient-1', phone: '11999999999' } })

        expect(queueCtor).toHaveBeenCalled()
        expect(queueAdd).toHaveBeenCalledWith('Rule', expect.objectContaining({ automationId: 'auto-1', clinicId: 'clinic-123' }), expect.objectContaining({ delay: 120000 }))
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
