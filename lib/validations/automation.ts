import { z } from 'zod'

export const supportedAutomationActionTypes = ['whatsapp'] as const

export const createAutomationSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    triggerEvent: z.string().min(1, 'Evento de gatilho é obrigatório'),
    actionType: z.enum(supportedAutomationActionTypes),
    config: z.object({
        message: z.string().trim().min(1, 'Mensagem é obrigatória'),
    }),
    delayMinutes: z.number().int().default(0),
})

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>
