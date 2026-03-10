'use server'

import { prisma } from '@/lib/prisma'
import { getClinicId } from '@/lib/auth'
import type { DashboardKpis, SmartAlert } from '@/types'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function getDashboardData() {
    const clinicId = await getClinicId()
    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // 1. Fetch KPIs (simplified for now)
    const [currentAppts, previousAppts, currentPatients] = await Promise.all([
        prisma.appointment.count({
            where: { clinicId, scheduledAt: { gte: startMonth, lte: endMonth }, status: 'completed' }
        }),
        prisma.appointment.count({
            where: { clinicId, scheduledAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: 'completed' }
        }),
        prisma.patient.count({ where: { clinicId } })
    ])

    const kpis: DashboardKpis = {
        newPatients: { value: currentPatients, trend: 12 }, // Mock trend for now
        completedAppointments: { value: currentAppts, trend: 5 },
        indicatedTreatments: { value: 8, trend: -2 },
        approvedTreatments: { value: 4, trend: 15 },
        monthlyRevenue: { value: 12500.50, trend: 8 },
        avgTicket: { value: 450, trend: 3 },
    }

    // 2. Fetch Smart Alerts
    const alerts: SmartAlert[] = [
        { id: '1', type: 'warning', message: 'Pacientes aguardando retorno há mais de 30 dias', count: 12, action: 'Ver lista' },
        { id: '2', type: 'opportunity', message: 'Orçamentos pendentes de aprovação (valor alto)', count: 4, action: 'Revisar' },
        { id: '3', type: 'info', message: 'Lembretes de WhatsApp enviados hoje', count: 28, action: 'Ver logs' },
    ]

    return { kpis, alerts }
}
