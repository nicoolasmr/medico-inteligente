'use client'

import Link from 'next/link'
import { getDashboardData } from './actions'
import { useEffect, useState } from 'react'
import {
    Users,
    CalendarCheck,
    TrendingUp,
    Target,
    CircleDollarSign,
    ChevronRight,
    Lightbulb,
    Bell
} from 'lucide-react'
import { cn, formatCurrency } from '../../../lib/utils'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        getDashboardData()
            .then(res => {
                if (!mounted) return
                setData(res)
                setError(null)
            })
            .catch(() => {
                if (!mounted) return
                setError('Não foi possível carregar as métricas do dashboard.')
            })
            .finally(() => {
                if (!mounted) return
                setLoading(false)
            })

        return () => {
            mounted = false
        }
    }, [])

    if (loading) return <div className="h-full flex items-center justify-center">Carregando métricas...</div>
    if (error || !data) return <div className="h-full flex items-center justify-center text-brand-danger">{error ?? 'Erro inesperado'}</div>

    const kpis = [
        { label: 'Novos Pacientes', value: data.kpis.newPatients.value, trend: data.kpis.newPatients.trend, icon: Users, color: 'text-brand-primary', href: '/patients' },
        { label: 'Consultas Realizadas', value: data.kpis.completedAppointments.value, trend: data.kpis.completedAppointments.trend, icon: CalendarCheck, color: 'text-blue-400', href: '/agenda' },
        { label: 'Tratamentos Indicados', value: data.kpis.indicatedTreatments.value, trend: data.kpis.indicatedTreatments.trend, icon: Target, color: 'text-orange-400', href: '/pipeline' },
        { label: 'Faturamento Mensal', value: formatCurrency(data.kpis.monthlyRevenue.value), trend: data.kpis.monthlyRevenue.trend, icon: CircleDollarSign, color: 'text-emerald-400', href: '/financeiro' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-display text-text-primary tracking-tight">Bom dia, {data.userName}</h1>
                <p className="text-text-secondary text-sm">Aqui está o que aconteceu na sua clínica hoje.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <Link key={idx} href={kpi.href} className="card p-5 group hover:glow-border transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn('p-2 rounded-sm bg-bg-elevated', kpi.color)}>
                                <kpi.icon size={20} />
                            </div>
                            <div className={cn(
                                'text-xs font-semibold flex items-center gap-1',
                                (kpi.trend ?? 0) >= 0 ? 'text-brand-success' : 'text-brand-danger'
                            )}>
                                {(kpi.trend ?? 0) >= 0 ? '+' : ''}{kpi.trend}%
                                <TrendingUp size={12} className={(kpi.trend ?? 0) < 0 ? 'rotate-180' : ''} />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{kpi.label}</p>
                        <h3 className="text-2xl font-display text-text-primary">{kpi.value}</h3>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-elevated p-6">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Bell size={16} className="text-brand-primary" />
                            Alertas Inteligentes
                        </h3>
                        <div className="space-y-3">
                            {data.alerts.map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-4 rounded-sm bg-bg-surface border border-bg-border hover:bg-bg-hover transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-1 h-10 rounded-full',
                                            alert.type === 'warning' ? 'bg-brand-warning' :
                                                alert.type === 'opportunity' ? 'bg-brand-primary' : 'bg-text-muted'
                                        )} />
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                                            <p className="text-xs text-text-secondary">{alert.count} registros identificados</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={alert.type === 'warning' ? '/patients' : alert.type === 'opportunity' ? '/pipeline' : '#'}
                                        className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline"
                                    >
                                        {alert.action}
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-6 h-[300px] flex items-center justify-center border-dashed text-text-muted">
                        Gráfico de Atração vs Retenção (Em Breve)
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-6 bg-gradient-to-br from-bg-surface to-bg-elevated border-brand-primary/20">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-sm bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <Lightbulb size={24} />
                            </div>
                            <span className="badge bg-brand-primary/20 text-brand-primary">AI Insight</span>
                        </div>
                        <h4 className="text-lg font-display text-text-primary mb-2">Oportunidade detectada</h4>
                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                            Você tem oportunidades em aberto no pipeline. Revisar pendências pode aumentar conversão e faturamento.
                        </p>
                        <Link href="/pipeline" className="block w-full py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all text-sm text-center">
                            Revisar Pipeline
                        </Link>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Próximos Agendamentos</h3>
                        <div className="space-y-4 text-xs text-text-muted">
                            Esta seção será preenchida automaticamente com os próximos horários.
                        </div>
                        <Link href="/agenda" className="block w-full mt-4 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors py-2 border border-bg-border rounded-sm text-center">
                            Ver agenda completa
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
