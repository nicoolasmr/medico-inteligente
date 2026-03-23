'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId, getCurrentUser } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'
import { getPatientPortalAbsoluteUrl, getPatientPortalPath } from '../../../lib/portal-token'
import { sendWhatsApp } from '../../../lib/whatsapp'
import { createPatientSchema, type CreatePatientInput, updatePatientSchema, type UpdatePatientInput } from '../../../lib/validations/patient'
import type { Patient, ActionResult, PatientInteraction } from '../../../types'

async function recordPatientInteraction(input: {
    clinicId: string
    patientId: string
    type: 'note' | 'whatsapp'
    content: string
}) {
    try {
        const user = await getCurrentUser()

        await prisma.patientInteraction.create({
            data: {
                clinicId: input.clinicId,
                patientId: input.patientId,
                userId: user.id,
                type: input.type,
                content: input.content,
            },
        })
    } catch (error) {
        console.warn('[patients] Failed to record patient interaction', error)
    }
}

export async function createPatientNote(id: string, content: string): Promise<ActionResult<void>> {
    try {
        const trimmedContent = content.trim()
        if (!trimmedContent) {
            return { success: false, error: 'Digite um conteúdo para registrar a nota do paciente.' }
        }

        const clinicId = await getClinicId()
        const patient = await prisma.patient.findFirst({
            where: { id, clinicId },
            select: { id: true },
        })

        if (!patient) {
            return { success: false, error: 'Paciente não encontrado para registrar nota.' }
        }

        await recordPatientInteraction({
            clinicId,
            patientId: patient.id,
            type: 'note',
            content: trimmedContent,
        })

        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao registrar nota do paciente' }
    }
}

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

/**
 * Generate a secure patient portal path for a clinic-owned patient.
 */
export async function generatePatientPortalLink(id: string): Promise<ActionResult<string>> {
    try {
        const clinicId = await getClinicId()
        const patient = await prisma.patient.findFirst({
            where: { id, clinicId },
            select: { id: true },
        })

        if (!patient) {
            return { success: false, error: 'Paciente não encontrado para gerar o link do portal.' }
        }

        return { success: true, data: getPatientPortalPath(patient.id) }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao gerar link do portal' }
    }
}

/**
 * Send the secure patient portal link directly to the patient's WhatsApp.
 */
export async function sendPatientPortalLink(id: string): Promise<ActionResult<void>> {
    try {
        const clinicId = await getClinicId()
        const patient = await prisma.patient.findFirst({
            where: { id, clinicId },
            select: { id: true, name: true, phone: true },
        })

        if (!patient) {
            return { success: false, error: 'Paciente não encontrado para envio do link do portal.' }
        }

        if (!patient.phone) {
            return { success: false, error: 'Cadastre um telefone do paciente antes de enviar o portal por WhatsApp.' }
        }

        const portalUrl = getPatientPortalAbsoluteUrl(patient.id)
        const firstName = patient.name.split(' ')[0] ?? 'Paciente'

        await sendWhatsApp({
            to: patient.phone,
            message: `Olá, ${firstName}! Aqui está seu link seguro do portal do paciente: ${portalUrl}`,
        })

        await recordPatientInteraction({
            clinicId,
            patientId: patient.id,
            type: 'whatsapp',
            content: `Link seguro do portal enviado para ${patient.phone}.`,
        })

        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao enviar o link do portal por WhatsApp' }
    }
}

export async function recordPatientPortalCopy(id: string): Promise<ActionResult<void>> {
    try {
        const clinicId = await getClinicId()
        const patient = await prisma.patient.findFirst({
            where: { id, clinicId },
            select: { id: true },
        })

        if (!patient) {
            return { success: false, error: 'Paciente não encontrado para registrar cópia do link do portal.' }
        }

        await recordPatientInteraction({
            clinicId,
            patientId: patient.id,
            type: 'note',
            content: 'Link seguro do portal copiado manualmente pela equipe da clínica.',
        })

        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao registrar cópia do link do portal' }
    }
}

export async function getPatientInteractions(id: string): Promise<PatientInteraction[]> {
    const clinicId = await getClinicId()

    const interactions = await prisma.patientInteraction.findMany({
        where: { clinicId, patientId: id },
        include: {
            user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })

    return interactions as unknown as PatientInteraction[]
}
