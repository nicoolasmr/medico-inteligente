import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockedQueue = vi.fn()
const mockedGetClinicId = vi.fn()
const mockedFindMany = vi.fn()
const mockedCreate = vi.fn()
const mockedUpdate = vi.fn()
const mockedDelete = vi.fn()
const mockedRevalidatePath = vi.fn()

vi.mock('bullmq', () => ({
    Queue: mockedQueue,
}))

vi.mock('../lib/auth', () => ({
    getClinicId: mockedGetClinicId,
}))

vi.mock('../lib/prisma', () => ({
    prisma: {
        automation: {
            findMany: mockedFindMany,
            create: mockedCreate,
            update: mockedUpdate,
            delete: mockedDelete,
        },
        automationLog: {
            findMany: mockedFindMany,
        },
    },
}))

vi.mock('next/cache', () => ({
    revalidatePath: mockedRevalidatePath,
}))

describe('automation runtime without Redis', () => {
    const originalRedisUrl = process.env.REDIS_URL

    beforeEach(async () => {
        vi.resetModules()
        vi.clearAllMocks()
        delete process.env.REDIS_URL
        mockedGetClinicId.mockResolvedValue('clinic-123')
        mockedFindMany.mockResolvedValue([])
    })

    afterEach(async () => {
        if (originalRedisUrl === undefined) {
            delete process.env.REDIS_URL
        } else {
            process.env.REDIS_URL = originalRedisUrl
        }

        const { resetQueuesForTests } = await import('../lib/queue')
        const { resetRedisForTests } = await import('../lib/redis')
        resetQueuesForTests()
        resetRedisForTests()
    })

    it('throws a runtime error only when Redis is requested', async () => {
        const redisModule = await import('../lib/redis')

        expect(() => redisModule.getRedisUrl()).toThrowError(/REDIS_URL/)
        expect(() => redisModule.getRedis()).toThrowError(/Automações indisponíveis/)
    })

    it('keeps automation page runtime in read-only mode when Redis is missing', async () => {
        const actions = await import('../app/(dashboard)/automacoes/actions')

        await expect(actions.getAutomations()).resolves.toEqual([])
        await expect(actions.getAutomationLogs()).resolves.toEqual([])

        await expect(actions.getAutomationRuntime()).resolves.toEqual({
            available: false,
            mode: 'read-only',
            message: 'Automações estão em modo somente leitura no momento. Configure o REDIS_URL para reativar execuções e agendamentos.',
        })
    })

    it('returns a friendly error for write actions when Redis is unavailable', async () => {
        const actions = await import('../app/(dashboard)/automacoes/actions')

        await expect(actions.createAutomation({
            name: 'Lembrete',
            triggerEvent: 'appointment_created',
            actionType: 'whatsapp',
            delayMinutes: 0,
            config: {},
        })).resolves.toEqual({
            success: false,
            error: 'Automações estão em modo somente leitura no momento. Configure o REDIS_URL para reativar execuções e agendamentos.',
        })

        await expect(actions.toggleAutomation('automation-1', true)).resolves.toEqual({
            success: false,
            error: 'Automações estão em modo somente leitura no momento. Configure o REDIS_URL para reativar execuções e agendamentos.',
        })

        await expect(actions.deleteAutomation('automation-1')).resolves.toEqual({
            success: false,
            error: 'Automações estão em modo somente leitura no momento. Configure o REDIS_URL para reativar execuções e agendamentos.',
        })

        await expect(actions.triggerEvent('appointment_created', {})).resolves.toEqual({
            success: false,
            error: 'Automações estão em modo somente leitura no momento. Configure o REDIS_URL para reativar execuções e agendamentos.',
        })

        expect(mockedCreate).not.toHaveBeenCalled()
        expect(mockedUpdate).not.toHaveBeenCalled()
        expect(mockedDelete).not.toHaveBeenCalled()
        expect(mockedQueue).not.toHaveBeenCalled()
        expect(mockedRevalidatePath).not.toHaveBeenCalled()
    })
})
