import { Queue } from 'bullmq'
import { redis as connection } from './redis'

/** Queue: appointment reminder jobs (24h before) */
export const reminderQueue = new Queue('appointment-reminders', { connection })

/** Queue: patient no-return detection (cron-driven) */
export const noReturnQueue = new Queue('patient-no-return', { connection })

/** Queue: outbound WhatsApp messages */
export const whatsappQueue = new Queue('whatsapp-messages', { connection })

export type AppointmentReminderJob = {
    patientPhone: string
    patientName: string
    scheduledAt: string // ISO string
    clinicName: string
    clinicId: string
}

export type NoReturnCheckJob = {
    clinicId: string
}

export type WhatsAppJob = {
    to: string
    message: string
    patientId: string
    clinicId: string
}
