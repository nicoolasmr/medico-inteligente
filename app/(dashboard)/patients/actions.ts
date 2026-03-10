'use server'

import { prisma } from '@/lib/prisma'
import { getClinicId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createPatientSchema, type CreatePatientInput, updatePatientSchema, type UpdatePatientInput } from '@/lib/validations/patient'
import type { Patient, ActionResult } from '@/types'

/**
 * Get all patients for the clinic
 */
export async function getPatients(): Promise<Patient[]> {
    const clinicId = await getClinicId()
    const patients = await prisma.patient.findMany({
        where: { clinicId },
        orderBy: { name: 'asc' },
    })
    return patients as unknown as Patient[]
}

/**
 * Search patients by name or phone
 */
export async function searchPatients(query: string): Promise<Patient[]> {
    const clinicId = await getClinicId()
    const patients = await prisma.patient.findMany({
        where: {
            clinicId,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { cpf: { contains: query, mode: 'insensitive' } },
            ],
        },
        orderBy: { name: 'asc' },
        take: 10,
    })
    return patients as unknown as Patient[]
}

/**
 * Get a single patient by ID
 */
export async function getPatient(id: string): Promise<Patient | null> {
    const clinicId = await getClinicId()
    const patient = await prisma.patient.findFirst({
        where: { id, clinicId },
    })
    return patient as unknown as Patient | null
}

/**
 * Create a new patient
 */
export async function createPatient(data: CreatePatientInput): Promise<ActionResult<Patient>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = createPatientSchema.parse(data)

        const patient = await prisma.patient.create({
            data: {
                ...validatedData,
                clinicId,
                birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
            }
        })

        revalidatePath('/patients')
        return { success: true, data: patient as unknown as Patient }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao criar paciente' }
    }
}

/**
 * Update a patient
 */
export async function updatePatient(id: string, data: UpdatePatientInput): Promise<ActionResult<Patient>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = updatePatientSchema.parse(data)

        const patient = await prisma.patient.update({
            where: { id, clinicId },
            data: {
                ...validatedData,
                birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
            }
        })

        revalidatePath('/patients')
        revalidatePath(`/patients/${id}`)
        return { success: true, data: patient as unknown as Patient }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao atualizar paciente' }
    }
}

/**
 * Delete a patient
 */
export async function deletePatient(id: string): Promise<ActionResult<void>> {
    try {
        const clinicId = await getClinicId()
        await prisma.patient.delete({
            where: { id, clinicId },
        })
        revalidatePath('/patients')
        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao excluir paciente' }
    }
}
