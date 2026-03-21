import { Queue } from 'bullmq'
import { getRedis, isRedisConfigured } from './redis'

let automationQueue: Queue | null = null

export function isAutomationQueueAvailable() {
    return isRedisConfigured()
}

export function getAutomationQueue() {
    if (!isAutomationQueueAvailable()) {
        throw new Error('Redis não configurado. As automações assíncronas estão temporariamente indisponíveis.')
    }

    if (automationQueue) return automationQueue

    automationQueue = new Queue('automations', {
        connection: getRedis(),
    })

    return automationQueue
}
