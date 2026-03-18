'use server'

import { endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { getClinicId, getCurrentUser } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import type { DashboardKpis, SmartAlert } from '../../../types'

function getTrend(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0
    }

    return Number((((current - previous) / previous) * 100).toFixed(1))
}

export async function getDashboardData() {
    const [clinicId, user] = await Promise.all([getClinicId(), getCurrentUser()])

    const now = new Date()
    const todayStart = startOfDay(now)
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)
    const lastMonth = subMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

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
        monthlyAutomationLogs,
        upcomingAppointments,
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
                OR: [{ lastVisitAt: null }, { lastVisitAt: { lte: subDays(now, 30) } }],
            },
        }),
        prisma.automationLog.count({
            where: { clinicId, createdAt: { gte: startMonth, lte: endMonth } }
        }),
        prisma.appointment.findMany({
            where: {
                clinicId,
                scheduledAt: { gte: todayStart },
                status: { in: ['scheduled', 'confirmed'] },
            },
            include: {
                patient: { select: { name: true } },
                doctor: { select: { name: true } },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
        }),
    ])

    const currentRevenue = Number(currentPaidPayments._sum.amount ?? 0)
    const previousRevenue = Number(previousPaidPayments._sum.amount ?? 0)
    const paidCount = currentPaidPayments._count._all || 0
    const previousPaidCount = previousPaidPayments._count._all || 0
    const currentAvgTicket = paidCount > 0 ? currentRevenue / paidCount : 0
    const previousAvgTicket = previousPaidCount > 0 ? previousRevenue / previousPaidCount : 0

    const kpis: DashboardKpis = {
        newPatients: { value: currentPatients, trend: getTrend(currentPatients, previousPatients) },
        completedAppointments: { value: currentCompletedAppts, trend: getTrend(currentCompletedAppts, previousCompletedAppts) },
        indicatedTreatments: { value: currentIndicatedTreatments, trend: getTrend(currentIndicatedTreatments, previousIndicatedTreatments) },
        approvedTreatments: { value: currentApprovedTreatments, trend: getTrend(currentApprovedTreatments, previousApprovedTreatments) },
        monthlyRevenue: { value: currentRevenue, trend: getTrend(currentRevenue, previousRevenue) },
        avgTicket: { value: currentAvgTicket, trend: getTrend(currentAvgTicket, previousAvgTicket) },
    }

    const alerts: SmartAlert[] = [
        {
            id: 'stale-patients',
            type: 'warning',
            message: 'Pacientes sem retorno nos últimos 30 dias',
            count: stalePatients,
            action: 'Ver pacientes',
            href: '/patients',
            description: 'Pacientes que exigem follow-up para evitar churn.',
        },
        {
            id: 'pending-treatments',
            type: 'opportunity',
            message: 'Orçamentos pendentes de aprovação (alto valor)',
            count: pendingHighValueTreatments,
            action: 'Revisar pipeline',
            href: '/pipeline',
            description: 'Casos com maior impacto potencial em conversão e receita.',
        },
        {
            id: 'automation-logs',
            type: 'info',
            message: 'Automações processadas no mês',
            count: monthlyAutomationLogs,
            action: 'Ver logs',
            href: '/automacoes',
            description: 'Execuções registradas pelo worker com status rastreável.',
        },
    ]

    const primaryInsight = pendingHighValueTreatments > 0
        ? 'Você tem orçamentos de alto valor aguardando aprovação. Priorizar esse grupo pode acelerar o faturamento do mês.'
        : stalePatients > 0
            ? 'Há pacientes sem retorno recente. Uma campanha de reativação pode melhorar ocupação e retenção.'
            : 'Operação sem gargalos críticos detectados no momento. Continue monitorando agenda, pipeline e automações.'

    return {
        userName: user.name,
        kpis,
        alerts,
        primaryInsight,
        upcomingAppointments: upcomingAppointments.map(appointment => ({
            id: appointment.id,
            scheduledAt: appointment.scheduledAt.toISOString(),
            status: appointment.status,
            type: appointment.type ?? 'Consulta',
            patientName: appointment.patient.name,
            doctorName: appointment.doctor?.name ?? user.name,
        })),
    }
}
