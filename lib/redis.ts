import IORedis from 'ioredis'
import { getOptionalEnv } from './env'

export class RedisUnavailableError extends Error {
    readonly code = 'REDIS_UNAVAILABLE'

    constructor(message = 'Automações indisponíveis: configure REDIS_URL para habilitar BullMQ/Redis.') {
        super(message)
        this.name = 'RedisUnavailableError'
    }
}

let redisInstance: IORedis | null = null

export function getRedisUrl(): string {
    const redisUrl = getOptionalEnv('REDIS_URL')

    if (!redisUrl) {
        throw new RedisUnavailableError()
    }

    return redisUrl
}

export function getRedis(): IORedis {
    if (redisInstance) {
        return redisInstance
    }

    redisInstance = new IORedis(getRedisUrl(), {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })

    return redisInstance
}

export function resetRedisForTests() {
    if (redisInstance) {
        redisInstance.disconnect()
        redisInstance = null
    }
}
