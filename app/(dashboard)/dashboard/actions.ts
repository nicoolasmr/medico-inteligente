'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId, getCurrentUser } from '../../../lib/auth'
import type { DashboardKpis, SmartAlert } from '../../../types'
import { startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'

function getTrend(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0
    }

    return Number((((current - previous) / previous) * 100).toFixed(1))
}

export async function getDashboardData() {
    const [clinicId, user] = await Promise.all([getClinicId(), getCurrentUser()])

    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const [
        currentPatients,
        previousPatients,
        currentCompletedAppts,
        previousCompletedAppts,
        currentIndicatedTreatments,
        previousIndicatedTreatments,
        currentApprovedTreatments,
        previousApprovedTreatments,
        currentPaidPayments,
        previousPaidPayments,
        pendingHighValueTreatments,
        stalePatients,
        todaysAutomationLogs,
    ] = await Promise.all([
        prisma.patient.count({ where: { clinicId, createdAt: { gte: startMonth, lte: endMonth } } }),
        prisma.patient.count({ where: { clinicId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        prisma.appointment.count({
            where: { clinicId, scheduledAt: { gte: startMonth, lte: endMonth }, status: 'completed' }
        }),
        prisma.appointment.count({
            where: { clinicId, scheduledAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: 'completed' }
        }),
        prisma.treatment.count({
            where: { clinicId, createdAt: { gte: startMonth, lte: endMonth }, stage: 'tratamento_indicado' }
        }),
        prisma.treatment.count({
            where: { clinicId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, stage: 'tratamento_indicado' }
        }),
        prisma.treatment.count({
            where: { clinicId, createdAt: { gte: startMonth, lte: endMonth }, stage: 'aprovado' }
        }),
        prisma.treatment.count({
            where: { clinicId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, stage: 'aprovado' }
        }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            _count: { _all: true },
            where: { clinicId, status: 'paid', paidAt: { gte: startMonth, lte: endMonth } }
        }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            _count: { _all: true },
            where: { clinicId, status: 'paid', paidAt: { gte: lastMonthStart, lte: lastMonthEnd } }
        }),
        prisma.treatment.count({
            where: { clinicId, stage: 'orcamento_enviado', value: { gte: 1000 } }
        }),
        prisma.patient.count({
            where: {
                clinicId,
                OR: [
                    { lastVisitAt: null },
                    { lastVisitAt: { lte: subDays(now, 30) } }
                ]
            }
        }),
        prisma.automationLog.count({
            where: { clinicId, createdAt: { gte: startOfMonth(now), lte: endMonth } }
        }),
    ])

    const currentRevenue = Number(currentPaidPayments._sum.amount ?? 0)
    const previousRevenue = Number(previousPaidPayments._sum.amount ?? 0)
    const paidCount = currentPaidPayments._count._all || 0

    const kpis: DashboardKpis = {
        newPatients: { value: currentPatients, trend: getTrend(currentPatients, previousPatients) },
        completedAppointments: { value: currentCompletedAppts, trend: getTrend(currentCompletedAppts, previousCompletedAppts) },
        indicatedTreatments: { value: currentIndicatedTreatments, trend: getTrend(currentIndicatedTreatments, previousIndicatedTreatments) },
        approvedTreatments: { value: currentApprovedTreatments, trend: getTrend(currentApprovedTreatments, previousApprovedTreatments) },
        monthlyRevenue: { value: currentRevenue, trend: getTrend(currentRevenue, previousRevenue) },
        avgTicket: { value: paidCount > 0 ? currentRevenue / paidCount : 0, trend: 0 },
    }

    const alerts: SmartAlert[] = [
        { id: '1', type: 'warning', message: 'Pacientes sem retorno nos últimos 30 dias', count: stalePatients, action: 'Ver lista' },
        { id: '2', type: 'opportunity', message: 'Orçamentos pendentes de aprovação (alto valor)', count: pendingHighValueTreatments, action: 'Revisar' },
        { id: '3', type: 'info', message: 'Lembretes e automações enviados no mês', count: todaysAutomationLogs, action: 'Ver logs' },
    ]

    return {
        userName: user.name,
        kpis,
        alerts,
    }
}
