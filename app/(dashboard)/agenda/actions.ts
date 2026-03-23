'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'
import { createAppointmentSchema, updateAppointmentSchema, type CreateAppointmentInput, type UpdateAppointmentInput } from '../../../lib/validations/appointment'
import type { Appointment, ActionResult } from '../../../types'
import { startOfDay, endOfDay } from 'date-fns'

/**
 * Get appointments within a date range
 */
export async function getAppointments(from: Date, to: Date): Promise<Appointment[]> {
    const clinicId = await getClinicId()
    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: from, lte: to },
        },
        include: {
            patient: {
                select: { name: true, phone: true }
            }
        },
        orderBy: { scheduledAt: 'asc' },
    })

    return appointments as unknown as Appointment[]
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentInput): Promise<ActionResult<Appointment>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = createAppointmentSchema.parse(data)

        const appointment = await prisma.appointment.create({
            data: {
                ...validatedData,
                clinicId,
                scheduledAt: new Date(validatedData.scheduledAt),
            }
        })

        revalidatePath('/agenda')
        return { success: true, data: appointment as unknown as Appointment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao agendar consulta' }
    }
}

/**
 * Update an appointment status
 */
export async function updateAppointmentStatus(id: string, status: string): Promise<ActionResult<Appointment>> {
    try {
        const clinicId = await getClinicId()
        const appointment = await prisma.appointment.update({
            where: { id, clinicId },
            data: { status: status as any }
        })

        revalidatePath('/agenda')
        return { success: true, data: appointment as unknown as Appointment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao atualizar status' }
    }
}

/**
 * Delete (cancel) an appointment
 */
export async function deleteAppointment(id: string): Promise<ActionResult<void>> {
    try {
        const clinicId = await getClinicId()
        await prisma.appointment.delete({
            where: { id, clinicId }
        })

        revalidatePath('/agenda')
        return { success: true, data: undefined }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao cancelar agendamento' }
    }
}
