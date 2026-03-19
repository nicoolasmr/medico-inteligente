import { beforeEach, describe, expect, it, vi } from 'vitest'

const automationLogCreate = vi.fn()
const automationFindMany = vi.fn()
const automationUpdate = vi.fn()
const transactionMock = vi.fn(async (operations: unknown[]) => operations)
const getClinicId = vi.fn()
const queueAdd = vi.fn()
const redisGet = vi.fn()
const redisSet = vi.fn()
const sendWhatsApp = vi.fn()

vi.mock('bullmq', () => ({
    Queue: class MockQueue {
        add = queueAdd
    },
    Worker: class MockWorker {
        on = vi.fn()
    },
}))

vi.mock('../lib/prisma', () => ({
    prisma: {
        automation: {
            findMany: automationFindMany,
            update: automationUpdate,
        },
        automationLog: {
            create: automationLogCreate,
        },
        $transaction: transactionMock,
    },
}))

vi.mock('../lib/auth', () => ({
    getClinicId,
}))

vi.mock('../lib/redis', () => ({
    getRedis: vi.fn(() => ({ get: redisGet, set: redisSet })),
    redis: {
        get: redisGet,
        set: redisSet,
    },
    RedisUnavailableError: class RedisUnavailableError extends Error {
        code = 'REDIS_UNAVAILABLE'
    },
}))

vi.mock('../lib/whatsapp', () => ({
    sendWhatsApp,
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('automation pipeline hardening', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getClinicId.mockResolvedValue('clinic-1')
        transactionMock.mockImplementation(async (operations: unknown[]) => operations)
        redisGet.mockResolvedValue(null)
        redisSet.mockResolvedValue('OK')
        sendWhatsApp.mockResolvedValue(undefined)
        automationLogCreate.mockResolvedValue({ id: 'log-1' })
        automationUpdate.mockReturnValue({})
    })

    it('names jobs with a deterministic idempotency key', async () => {
        automationFindMany.mockResolvedValue([
            {
                id: 'automation-1',
                name: 'Lembrete',
                triggerEvent: 'appointment.created',
                actionType: 'whatsapp',
                config: { message: 'Olá {patient_name}' },
                delayMinutes: 15,
            },
        ])

        const { triggerEvent } = await import('../app/(dashboard)/automacoes/actions')

        await triggerEvent('appointment.created', {
            patient: { id: 'patient-9', name: 'Maria', phone: '+5511999999999' },
            time: '2026-03-19T10:00:00.000Z',
        })

        expect(queueAdd).toHaveBeenCalledWith(
            'appointment_created:automation-1:patient-9:2026-03-19T10:00:00_000Z',
            expect.objectContaining({
                idempotencyKey: 'automation:automation-1:appointment_created:patient-9:2026-03-19T10:00:00_000Z',
            }),
            expect.objectContaining({
                jobId: 'automation:automation-1:appointment_created:patient-9:2026-03-19T10:00:00_000Z',
                attempts: 3,
            }),
        )
    })

    it('does not resend WhatsApp when the idempotency key was already processed', async () => {
        redisGet.mockResolvedValue('1')
        const { processAutomationJob } = await import('../workers/automation.worker')

        await processAutomationJob({
            id: 'job-1',
            attemptsMade: 0,
            queueName: 'automations',
            data: {
                automationId: 'automation-1',
                clinicId: 'clinic-1',
                event: 'appointment.created',
                triggerEvent: 'appointment.created',
                actionType: 'whatsapp',
                idempotencyKey: 'automation:automation-1:appointment_created:patient-9:2026',
                config: { message: 'Olá {patient_name}' },
                payload: {
                    patient: { id: 'patient-9', name: 'Maria', phone: '+5511999999999' },
                    time: '2026-03-19T10:00:00.000Z',
                },
            },
        } as any)

        expect(sendWhatsApp).not.toHaveBeenCalled()
        expect(automationLogCreate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'skipped',
                response: expect.objectContaining({
                    duplicate: true,
                    idempotencyKey: 'automation:automation-1:appointment_created:patient-9:2026',
                    attempt: 1,
                    event: 'appointment.created',
                    patientId: 'patient-9',
                    jobId: 'job-1',
                }),
            }),
        }))
    })

    it('retries partial failures without sending WhatsApp twice', async () => {
        transactionMock.mockRejectedValueOnce(new Error('database temporarily unavailable'))
        const { processAutomationJob } = await import('../workers/automation.worker')

        const job = {
            id: 'job-2',
            attemptsMade: 0,
            queueName: 'automations',
            data: {
                automationId: 'automation-1',
                clinicId: 'clinic-1',
                event: 'appointment.created',
                triggerEvent: 'appointment.created',
                actionType: 'whatsapp',
                idempotencyKey: 'automation:automation-1:appointment_created:patient-9:retry',
                config: { message: 'Olá {patient_name}' },
                payload: {
                    patient: { id: 'patient-9', name: 'Maria', phone: '+5511999999999' },
                    time: '2026-03-19T10:00:00.000Z',
                },
            },
        } as any

        await expect(processAutomationJob(job)).rejects.toThrow('database temporarily unavailable')

        expect(sendWhatsApp).toHaveBeenCalledTimes(1)
        expect(redisSet).toHaveBeenCalledWith(
            'automation:processed:automation:automation-1:appointment_created:patient-9:retry',
            '1',
            'EX',
            2592000,
        )

        redisGet.mockResolvedValue('1')
        await processAutomationJob({ ...job, attemptsMade: 1 })

        expect(sendWhatsApp).toHaveBeenCalledTimes(1)
        expect(automationLogCreate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'failed',
                response: expect.objectContaining({
                    alertType: 'automation_execution_failed',
                    idempotencyKey: 'automation:automation-1:appointment_created:patient-9:retry',
                }),
            }),
        }))
        expect(automationLogCreate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'skipped',
                response: expect.objectContaining({
                    duplicate: true,
                    attempt: 2,
                }),
            }),
        }))
    })
})
