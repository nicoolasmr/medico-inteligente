import { Queue } from 'bullmq'
import { getRedis, getRedisIfAvailable } from './redis'

let reminderQueue: Queue | null = null
let noReturnQueue: Queue | null = null
let whatsappQueue: Queue | null = null
let automationQueue: Queue | null = null

type QueueOptions = {
    required?: boolean
}

function resolveConnection(required = true) {
    return required ? getRedis() : getRedisIfAvailable()
}

function getOrCreateQueue(currentQueue: Queue | null, name: string, options: QueueOptions = {}): Queue | null {
    if (currentQueue) {
        return currentQueue
    }

    const connection = resolveConnection(options.required ?? true)
    if (!connection) {
        return null
    }

    return new Queue(name, { connection })
}

/** Queue: appointment reminder jobs (24h before) */
export function getReminderQueue(options?: QueueOptions) {
    reminderQueue = getOrCreateQueue(reminderQueue, 'appointment-reminders', options)
    return reminderQueue
}

/** Queue: patient no-return detection (cron-driven) */
export function getNoReturnQueue(options?: QueueOptions) {
    noReturnQueue = getOrCreateQueue(noReturnQueue, 'patient-no-return', options)
    return noReturnQueue
}

/** Queue: outbound WhatsApp messages */
export function getWhatsAppQueue(options?: QueueOptions) {
    whatsappQueue = getOrCreateQueue(whatsappQueue, 'whatsapp-messages', options)
    return whatsappQueue
}

/** Queue: automation rules */
export function getAutomationQueue(options?: QueueOptions) {
    automationQueue = getOrCreateQueue(automationQueue, 'automations', options)
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
