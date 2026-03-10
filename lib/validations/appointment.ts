import { z } from 'zod'

export const createAppointmentSchema = z.object({
    patientId: z.string().uuid('Paciente inválido'),
    doctorId: z.string().uuid().optional(),
    scheduledAt: z.string().datetime('Data inválida'),
    durationMin: z.number().int().min(15).max(240).default(30),
    type: z.string().optional(),
    notes: z.string().optional(),
})

export const updateAppointmentSchema = z.object({
    scheduledAt: z.string().datetime().optional(),
    durationMin: z.number().int().min(15).max(240).optional(),
    type: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
