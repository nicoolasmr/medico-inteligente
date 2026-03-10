'use server'

import { prisma } from '@/lib/prisma'
import { getClinicId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createPaymentSchema, type CreatePaymentInput } from '@/lib/validations/payment'
import type { Payment, RevenueSummary, ActionResult } from '@/types'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Get revenue summary for the dashboard and financial page
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
    const clinicId = await getClinicId()
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const [totalPaid, pending, payments] = await Promise.all([
        prisma.payment.aggregate({
            where: { clinicId, status: 'paid', paidAt: { gte: start, lte: end } },
            _sum: { amount: true }
        }),
        prisma.payment.aggregate({
            where: { clinicId, status: 'pending' },
            _sum: { amount: true }
        }),
        prisma.payment.findMany({
            where: { clinicId, status: 'paid' },
            orderBy: { paidAt: 'desc' },
            take: 100
        })
    ])

    // Mocked for now (in production would use real time-series group by)
    const byMonth = [
        { month: 'Jan', value: 8500 },
        { month: 'Fev', value: 10200 },
        { month: 'Mar', value: totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0 }
    ]

    const total = totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0
    const count = payments.length

    return {
        total,
        pending: pending._sum.amount ? Number(pending._sum.amount) : 0,
        avgTicket: count > 0 ? total / count : 0,
        byProcedure: [
            { name: 'Consulta', value: 4500 },
            { name: 'Cirurgia', value: 8000 },
            { name: 'Exame', value: 1200 }
        ],
        byMonth
    }
}

/**
 * Get payments with optional filters
 */
export async function getPayments(): Promise<Payment[]> {
    const clinicId = await getClinicId()
    const payments = await prisma.payment.findMany({
        where: { clinicId },
        include: {
            patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    })
    return payments as unknown as Payment[]
}

/**
 * Register a new payment
 */
export async function createPayment(data: CreatePaymentInput): Promise<ActionResult<Payment>> {
    try {
        const clinicId = await getClinicId()
        const validatedData = createPaymentSchema.parse(data)

        const payment = await prisma.payment.create({
            data: {
                ...validatedData,
                clinicId,
                amount: Number(validatedData.amount),
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
            }
        })

        revalidatePath('/financeiro')
        return { success: true, data: payment as unknown as Payment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao registrar pagamento' }
    }
}

/**
 * Mark payment as paid
 */
export async function markAsPaid(id: string): Promise<ActionResult<Payment>> {
    try {
        const clinicId = await getClinicId()
        const payment = await prisma.payment.update({
            where: { id, clinicId },
            data: {
                status: 'paid',
                paidAt: new Date()
            }
        })

        revalidatePath('/financeiro')
        return { success: true, data: payment as unknown as Payment }
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao confirmar pagamento' }
    }
}
