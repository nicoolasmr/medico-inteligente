// ── Enums ─────────────────────────────────────────────

export type UserRole = 'owner' | 'doctor' | 'secretary' | 'admin'
export type ClinicPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type TreatmentStage = 'lead' | 'consulta_realizada' | 'tratamento_indicado' | 'orcamento_enviado' | 'aprovado' | 'realizado'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'refunded' | 'cancelled'
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'transfer' | 'insurance'
export type AutomationTrigger = 'appointment_created' | 'appointment_completed' | 'appointment_cancelled' | 'treatment_indicated' | 'treatment_approved' | 'payment_received' | 'patient_no_return_30' | 'patient_no_return_60' | 'patient_no_return_90'
export type ActionType = 'whatsapp'
export type InteractionType = 'note' | 'whatsapp' | 'sms' | 'email' | 'call'
export type InsightImpact = 'high' | 'medium' | 'low'
export type Gender = 'M' | 'F' | 'other'
export type AutomationLogStatus = 'pending' | 'success' | 'failed'

// ── Domain Types ──────────────────────────────────────

export type Clinic = {
    id: string
    name: string
    slug: string
    plan: ClinicPlan
    logoUrl: string | null
    phone: string | null
    address: string | null
    isActive: boolean
    settings: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

export type User = {
    id: string
    clinicId: string
    name: string
    email: string
    role: UserRole
    avatarUrl: string | null
    crm: string | null
    specialty: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type Patient = {
    id: string
    clinicId: string
    name: string
    phone: string | null
    email: string | null
    birthDate: string | null
    gender: Gender | null
    cpf: string | null
    origin: string | null
    notes: string | null
    tags: string[]
    lastVisitAt: string | null
    createdAt: string
    updatedAt: string
}

export type Appointment = {
    id: string
    clinicId: string
    patientId: string
    doctorId: string | null
    scheduledAt: string
    durationMin: number
    type: string | null
    status: AppointmentStatus
    notes: string | null
    reminderSent: boolean
    createdAt: string
    updatedAt: string
    patient?: { name: string; phone: string | null }
    doctor?: { name: string } | null
}

export type Treatment = {
    id: string
    clinicId: string
    patientId: string
    name: string
    description: string | null
    value: number | null
    stage: TreatmentStage
    stageOrder: number
    probability: number
    expectedDate: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    patient?: { name: string }
}

export type Payment = {
    id: string
    clinicId: string
    patientId: string
    treatmentId: string | null
    appointmentId: string | null
    description: string | null
    amount: number
    method: PaymentMethod | null
    status: PaymentStatus
    dueDate: string | null
    paidAt: string | null
    receiptUrl: string | null
    createdAt: string
    updatedAt: string
    patient?: { name: string }
}

export type Automation = {
    id: string
    clinicId: string
    name: string
    triggerEvent: AutomationTrigger
    actionType: ActionType
    config: Record<string, unknown>
    delayMinutes: number
    isActive: boolean
    executions: number
    createdAt: string
}

export type AutomationLog = {
    id: string
    clinicId: string
    automationId: string
    patientId: string | null
    triggerEvent: string
    actionType: string
    status: AutomationLogStatus
    response: Record<string, unknown> | null
    createdAt: string
    patient?: { name: string } | null
    automation?: { name: string } | null
}

export type AiInsight = {
    id: string
    clinicId: string
    type: string
    title: string
    body: string
    impact: InsightImpact | null
    data: Record<string, unknown> | null
    isRead: boolean
    generatedAt: string
}

export type PatientInteraction = {
    id: string
    clinicId: string
    patientId: string
    userId: string | null
    type: InteractionType
    content: string
    createdAt: string
    user?: { name: string } | null
}

// ── Dashboard / Summary Types ─────────────────────────

export type KpiMetric = {
    value: number
    trend: number // percentage vs previous period
}

export type DashboardKpis = {
    newPatients: KpiMetric
    completedAppointments: KpiMetric
    indicatedTreatments: KpiMetric
    approvedTreatments: KpiMetric
    monthlyRevenue: KpiMetric
    avgTicket: KpiMetric
}

export type SmartAlert = {
    id: string
    type: 'warning' | 'opportunity' | 'info'
    message: string
    count: number
    action: string
    href: string
    description?: string
}

export type TreatmentsByStage = Record<TreatmentStage, {
    id: string
    patientName: string
    name: string
    value: number | null
    probability: number
    patientId: string
}[]>

export type RevenueSummary = {
    total: number
    byProcedure: { name: string; value: number }[]
    byMonth: { month: string; value: number }[]
    pending: number
    avgTicket: number
}

export type TimeSlot = {
    time: string // "09:00"
    available: boolean
}

// ── Server Action Result Wrapper ──────────────────────

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string }
