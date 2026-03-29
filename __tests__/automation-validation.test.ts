import { describe, expect, it } from 'vitest'
import { createAutomationSchema, supportedAutomationActionTypes } from '../lib/validations/automation'

describe('automation validation', () => {
    it('only allows supported action types', () => {
        expect(supportedAutomationActionTypes).toEqual(['whatsapp'])
        expect(() => createAutomationSchema.parse({
            name: 'Fluxo inválido',
            triggerEvent: 'appointment_created',
            actionType: 'email',
            config: { message: 'Teste' },
            delayMinutes: 0,
        })).toThrow()
    })

    it('requires a WhatsApp message template', () => {
        expect(() => createAutomationSchema.parse({
            name: 'Fluxo sem mensagem',
            triggerEvent: 'appointment_created',
            actionType: 'whatsapp',
            config: { message: '   ' },
            delayMinutes: 0,
        })).toThrow()
    })
})
