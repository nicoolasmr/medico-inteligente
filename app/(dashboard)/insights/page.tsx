'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAiInsights, generateGrowthInsights } from './actions'
import { InsightGrid } from '@/components/insights/InsightGrid'
import {
    Sparkles,
    BrainCircuit,
    TrendingUp,
    BarChart4,
    Zap,
    RefreshCcw
} from 'lucide-react'
import { toast } from 'sonner'
import type { AiInsight } from '@/types'

export default function InsightsPage() {
    const [insights, setInsights] = useState<AiInsight[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadInsights()
    }, [])

    async function loadInsights() {
        setLoading(true)
        try {
            const data = await getAiInsights()
            setInsights(data)
        } catch (err) {
            toast.error('Erro ao carregar insights')
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate() {
        setGenerating(true)
        try {
            const res = await generateGrowthInsights()
            if (res.success) {
                toast.success('Análise gerada com sucesso!')
                loadInsights()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro de conexão com o motor de IA')
        } finally {
            setGenerating(false)
        }
    }

    // Extract real insights from latest report if available
    const latestReport = insights.find(i => i.type === 'growth_report')
    const activeInsights = (latestReport?.data as any)?.insights || []

    return (
        <div className="space-y-8 h-full flex flex-col">
            {/* Premium AI Header */}
            <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-bg-surface to-bg-app border border-bg-border p-8 mb-4 shadow-glow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <BrainCircuit size={200} />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 text-brand-primary mb-4">
                        <Sparkles size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Crescimento Impulsionado por IA</span>
                    </div>
                    <h1 className="text-4xl font-display text-text-primary tracking-tighter mb-4">
                        Sua Clínica em <span className="text-brand-primary italic">Alta Performance.</span>
                    </h1>
                    <p className="text-text-secondary text-sm leading-relaxed mb-8">
                        Utilizamos modelos avançados para analisar cada ponto de contato da sua jornada do paciente.
                        Detectamos gargalos financeiros e oportunidades de conversão em tempo real.
                    </p>

                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-bg-app font-bold rounded-sm hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow group"
                    >
                        {generating ? <RefreshCcw size={18} className="animate-spin" /> : <Zap size={18} className="group-hover:animate-pulse" />}
                        {generating ? 'Analisando dados...' : 'Gerar Nova Análise'}
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-brand-primary" />
                        Insights Estratégicos
                    </h3>
                    {insights.length > 0 && insights[0] && (
                        <span className="text-[10px] text-text-muted italic">Última atualização: {new Date(insights[0].generatedAt).toLocaleString('pt-BR')}</span>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-sm bg-bg-surface/50 animate-pulse border border-bg-border" />)}
                    </div>
                ) : activeInsights.length > 0 ? (
                    <InsightGrid insights={activeInsights} />
                ) : (
                    <div className="card p-12 text-center border-dashed border-2">
                        <p className="text-text-muted italic">Nenhuma análise disponível. Clique em &quot;Gerar Nova Análise&quot; para começar.</p>
                    </div>
                )}
            </div>

            {/* Secondary Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 pb-8">
                <div className="card p-8 bg-bg-surface/40 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <BarChart4 size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-display text-text-primary">Análise de Conversão</h4>
                            <p className="text-xs text-text-secondary">Eficiência do seu funil de tratamentos.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-sm bg-bg-elevated border border-bg-border flex items-center justify-between">
                            <span className="text-xs text-text-secondary italic">Taxa de Aprovação</span>
                            <span className="text-brand-primary font-display font-semibold">68.4%</span>
                        </div>
                        <div className="p-4 rounded-sm bg-bg-elevated border border-bg-border flex items-center justify-between">
                            <span className="text-xs text-text-secondary italic">Tempo Médio de Fechamento</span>
                            <span className="text-text-primary font-display font-semibold">4.2 dias</span>
                        </div>
                    </div>
                </div>

                <div className="card p-8 border-brand-primary/10">
                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6">Recomendações Próximos Passos</h4>
                    <ul className="space-y-4">
                        {[
                            { label: 'Aumentar investimento em anúncios para especialidade "Implantes"', href: '/pipeline' },
                            { label: 'Realizar novo treinamento de recepção para conversão de leads', href: '/dashboard' },
                            { label: 'Ativar sequência de e-mails para orçamentos pendentes > 7 dias', href: '/automacoes' }
                        ].map((rec, i) => (
                            <li key={i}>
                                <Link href={rec.href} className="flex items-start gap-3 text-xs text-text-primary group cursor-pointer hover:text-brand-primary transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 group-hover:scale-125 transition-transform" />
                                    {rec.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
