import OpenAI from 'openai'
import { requireEnv } from '@/lib/env'

const globalForOpenAI = globalThis as unknown as {
    openai: OpenAI | undefined
}

export const openai =
    globalForOpenAI.openai ??
    new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') })

if (process.env.NODE_ENV !== 'production') globalForOpenAI.openai = openai

export default openai
