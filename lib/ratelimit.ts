import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getOptionalEnv } from './env'

type LimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending: Promise<unknown>
}

type RatelimitLike = {
  limit(identifier: string): Promise<LimitResult>
}

function createDisabledRatelimit(): RatelimitLike {
  return {
    async limit() {
      return {
        success: true,
        limit: Number.POSITIVE_INFINITY,
        remaining: Number.POSITIVE_INFINITY,
        reset: Date.now(),
        pending: Promise.resolve(),
      }
    },
  }
}

function createRatelimit(builder: (redis: Redis) => Ratelimit): RatelimitLike {
  const url = getOptionalEnv('UPSTASH_REDIS_REST_URL')
  const token = getOptionalEnv('UPSTASH_REDIS_REST_TOKEN')

  if (!url || !token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ratelimit] Upstash env not configured; rate limiting disabled.')
    }
    return createDisabledRatelimit()
  }

  const redis = new Redis({ url, token })
  return builder(redis)
}

/** Auth endpoints: 5 attempts per minute per email/IP */
export const authRatelimit = createRatelimit(redis => new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: false,
  prefix: 'rl:auth',
}))

/** General API / Server Actions: 30 per minute per clinic_id */
export const apiRatelimit = createRatelimit(redis => new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: false,
  prefix: 'rl:api',
}))

/** AI Insights (OpenAI): 10 per hour per clinic_id */
export const aiRatelimit = createRatelimit(redis => new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '1 h'),
  analytics: false,
  prefix: 'rl:ai',
}))
