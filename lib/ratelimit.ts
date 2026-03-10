import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/** Auth endpoints: 5 attempts per minute per email/IP */
export const authRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: false,
    prefix: 'rl:auth',
})

/** General API / Server Actions: 30 per minute per clinic_id */
export const apiRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: false,
    prefix: 'rl:api',
})

/** AI Insights (OpenAI): 10 per hour per clinic_id */
export const aiRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '1 h'),
    analytics: false,
    prefix: 'rl:ai',
})
