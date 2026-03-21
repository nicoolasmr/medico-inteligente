import IORedis from 'ioredis'
import { getOptionalEnv, requireEnv } from './env'

let redis: IORedis | null = null

export function isRedisConfigured() {
    return Boolean(getOptionalEnv('REDIS_URL'))
}

export function getRedis() {
    if (redis) return redis

    redis = new IORedis(requireEnv('REDIS_URL', { context: 'BullMQ / automations' }), {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })

    return redis
}
