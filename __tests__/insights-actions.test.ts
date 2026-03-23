import { beforeEach, describe, expect, it, vi } from 'vitest'

const limitMock = vi.fn()
const getClinicIdMock = vi.fn()
const countMock = vi.fn()
const aggregateMock = vi.fn()
const createInsightMock = vi.fn()
const openAiCreateMock = vi.fn()

vi.mock('../lib/auth', () => ({
    getClinicId: getClinicIdMock,
}))

vi.mock('../lib/ratelimit', () => ({
    aiRatelimit: {
        limit: limitMock,
    },
}))

vi.mock('../lib/prisma', () => ({
    prisma: {
        patient: { count: countMock },
        appointment: { count: countMock },
        payment: { aggregate: aggregateMock },
        aiInsight: { create: createInsightMock },
    },
}))

vi.mock('../lib/openai', () => ({
    openai: {
        chat: {
            completions: {
                create: openAiCreateMock,
            },
        },
    },
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('generateGrowthInsights', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getClinicIdMock.mockResolvedValue('clinic-1')
    })

    it('blocks insight generation when the AI rate limit is exceeded', async () => {
        const { generateGrowthInsights } = await import('../app/(dashboard)/insights/actions')
        limitMock.mockResolvedValue({ success: false })

        const result = await generateGrowthInsights()

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain('Limite de análises por IA')
        }
        expect(openAiCreateMock).not.toHaveBeenCalled()
    })

    it('generates and persists an insight when rate-limited access is available', async () => {
        const { generateGrowthInsights } = await import('../app/(dashboard)/insights/actions')
        limitMock.mockResolvedValue({ success: true })
        countMock.mockResolvedValue(10)
        aggregateMock
            .mockResolvedValueOnce({ _sum: { amount: 5000 } })
            .mockResolvedValueOnce({ _sum: { amount: 1200 } })
        openAiCreateMock.mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({ insights: [{ title: 'Receita', content: 'Acompanhar agenda.' }] }) } }],
        })
        createInsightMock.mockResolvedValue({ id: 'insight-1', title: 'Receita' })

        const result = await generateGrowthInsights()

        expect(result.success).toBe(true)
        expect(limitMock).toHaveBeenCalledWith('insights:clinic-1')
        expect(openAiCreateMock).toHaveBeenCalledTimes(1)
        expect(createInsightMock).toHaveBeenCalledTimes(1)
    })
})
