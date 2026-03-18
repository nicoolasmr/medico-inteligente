'use server'

import { prisma } from '../../../lib/prisma'
import { getClinicId } from '../../../lib/auth'
import { revalidatePath } from 'next/cache'
import { openai } from '../../../lib/openai'
import type { AiInsight, ActionResult } from '../../../types'

/**
 * Get existing AI insights for the clinic
 */
export async function getAiInsights(): Promise<AiInsight[]> {
    const clinicId = await getClinicId()
    return prisma.aiInsight.findMany({
        where: { clinicId },
        orderBy: { generatedAt: 'desc' }
    }) as unknown as AiInsight[]
}

/**
 * Generate a new growth analysis using OpenAI
 */
export async function generateGrowthInsights(): Promise<ActionResult<AiInsight>> {
    try {
        const clinicId = await getClinicId()

        // Fetch clinic data for context
        const [patientCount, apptCount, totalRevenue, pendingRevenue] = await Promise.all([
            prisma.patient.count({ where: { clinicId } }),
            prisma.appointment.count({ where: { clinicId } }),
            prisma.payment.aggregate({ where: { clinicId, status: 'paid' }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { clinicId, status: 'pending' }, _sum: { amount: true } })
        ])

        const revenue = totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0
        const pending = pendingRevenue._sum.amount ? Number(pendingRevenue._sum.amount) : 0

        // Prompt engineering for Medical Growth
        const prompt = `
      Você é um consultor de crescimento especializado em clínicas médicas e odontológicas.
      Analise os seguintes KPIs de uma clínica e gere insights estratégicos:
      
      - Total de Pacientes: ${patientCount}
      - Total de Consultas: ${apptCount}
      - Faturamento Total: R$ ${revenue}
      
      Gere 3 insights no seguinte formato JSON:
      {
        "insights": [
          { "type": "opportunity", "title": "...", "content": "..." },
          { "type": "risk",        "title": "...", "content": "..." },
          { "type": "strategy",    "title": "...", "content": "..." }
        ]
      }
      
      Os insights devem ser curtos, acionáveis e profissionais.
    `

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('Falha ao gerar análise pela IA')

        const result = JSON.parse(content)

        // Pick the main one or save all (we save the first for now as a summary)
        const insight = await prisma.aiInsight.create({
            data: {
                clinicId,
                type: 'growth_report',
                title: result.insights[0]?.title || 'Análise de Crescimento',
                body: result.insights[0]?.content || 'Análise gerada com sucesso.',
                data: result
            }
        })

        revalidatePath('/insights')
        return { success: true, data: insight as unknown as AiInsight }
    } catch (error: any) {
        console.error('[AI] Generation failed:', error)
        return { success: false, error: 'Erro ao gerar análise. Verifique sua chave de API.' }
    }
}
