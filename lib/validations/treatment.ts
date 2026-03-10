import { z } from 'zod'

export const createTreatmentSchema = z.object({
    patientId: z.string().uuid('Paciente inválido'),
    name: z.string().min(2, 'Nome do tratamento obrigatório'),
    description: z.string().optional(),
    value: z.number().positive().optional(),
    stage: z.enum(['lead', 'consulta_realizada', 'tratamento_indicado', 'orcamento_enviado', 'aprovado', 'realizado']).default('lead'),
    probability: z.number().int().min(0).max(100).default(50),
    expectedDate: z.string().optional(),
    notes: z.string().optional(),
})

export const updateTreatmentSchema = createTreatmentSchema.partial().omit({ patientId: true })

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>
export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>
