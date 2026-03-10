import { z } from 'zod'

export const createAutomationSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    triggerEvent: z.string().min(1, 'Evento de gatilho é obrigatório'),
    actionType: z.enum(['whatsapp', 'sms', 'email', 'task', 'internal_notification']),
    config: z.record(z.any()),
    delayMinutes: z.number().int().default(0),
})

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>
