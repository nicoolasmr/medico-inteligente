import { z } from 'zod'

export const createPaymentSchema = z.object({
    patientId: z.string().uuid('Paciente inválido'),
    treatmentId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional(),
    description: z.string().optional(),
    amount: z.number().positive('Valor deve ser positivo'),
    method: z.enum(['cash', 'pix', 'credit', 'debit', 'transfer', 'insurance']).optional(),
    status: z.enum(['pending', 'paid', 'overdue', 'refunded', 'cancelled']).default('pending'),
    dueDate: z.string().optional(),
})

export const updatePaymentSchema = createPaymentSchema.partial().omit({ patientId: true })

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
