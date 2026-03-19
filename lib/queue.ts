import { Queue } from 'bullmq'
import { getRedis } from './redis'

let reminderQueue: Queue | null = null
let noReturnQueue: Queue | null = null
let whatsappQueue: Queue | null = null
let automationQueue: Queue | null = null

/** Queue: appointment reminder jobs (24h before) */
export function getReminderQueue() {
    if (!reminderQueue) {
        reminderQueue = new Queue('appointment-reminders', { connection: getRedis() })
    }

    return reminderQueue
}

/** Queue: patient no-return detection (cron-driven) */
export function getNoReturnQueue() {
    if (!noReturnQueue) {
        noReturnQueue = new Queue('patient-no-return', { connection: getRedis() })
    }

    return noReturnQueue
}

/** Queue: outbound WhatsApp messages */
export function getWhatsAppQueue() {
    if (!whatsappQueue) {
        whatsappQueue = new Queue('whatsapp-messages', { connection: getRedis() })
    }

    return whatsappQueue
}

/** Queue: automation rules */
export function getAutomationQueue() {
    if (!automationQueue) {
        automationQueue = new Queue('automations', { connection: getRedis() })
    }

    return automationQueue
}

export function resetQueuesForTests() {
    reminderQueue = null
    noReturnQueue = null
    whatsappQueue = null
    automationQueue = null
}

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
