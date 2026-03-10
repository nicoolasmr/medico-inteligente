import { z } from 'zod'

export const createPatientSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    birthDate: z.string().optional(),
    gender: z.enum(['M', 'F', 'other']).optional(),
    cpf: z.string().optional(),
    origin: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).default([]),
})

export const updatePatientSchema = createPatientSchema.partial()

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
