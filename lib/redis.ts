import IORedis from 'ioredis'
import { requireEnv } from './env'

export const redis = new IORedis(requireEnv('REDIS_URL'), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})
