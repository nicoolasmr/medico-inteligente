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

export function isRedisConfigured(): boolean {
    return Boolean(getOptionalEnv('REDIS_URL'))
}

export function createRedisClient(redisUrl = getRedisUrl()): IORedis {
    return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    })
}

export function getRedis(): IORedis {
    if (redisInstance) {
        return redisInstance
    }

    redisInstance = createRedisClient()

    return redisInstance
}

export function getRedisIfAvailable(): IORedis | null {
    if (!isRedisConfigured()) {
        return null
    }

    return getRedis()
}

export function resetRedisForTests() {
    if (redisInstance) {
        redisInstance.disconnect()
        redisInstance = null
    }
}
