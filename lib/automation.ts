export type AutomationPayload = {
    patient?: {
        id?: string
        name?: string
        phone?: string | null
    }
    time?: string
    [key: string]: unknown
}

export type AutomationJobData = {
    automationId: string
    clinicId: string
    event: string
    payload?: AutomationPayload
}

function normalizePart(value: string | null | undefined, fallback: string) {
    if (!value) return fallback
    return value.trim().replace(/[^a-zA-Z0-9:_-]+/g, '_') || fallback
}

export function buildAutomationIdempotencyKey(data: AutomationJobData) {
    return [
        'automation',
        normalizePart(data.automationId, 'unknown-automation'),
        normalizePart(data.event, 'unknown-event'),
        normalizePart(data.payload?.patient?.id, 'unknown-patient'),
        normalizePart(data.payload?.time, 'no-time'),
    ].join(':')
}

export function buildAutomationJobName(data: AutomationJobData) {
    return [
        normalizePart(data.event, 'event'),
        normalizePart(data.automationId, 'automation'),
        normalizePart(data.payload?.patient?.id, 'patient'),
        normalizePart(data.payload?.time, 'no-time'),
    ].join(':')
}

export function buildAutomationRedisProcessedKey(idempotencyKey: string) {
    return `automation:processed:${idempotencyKey}`
}
