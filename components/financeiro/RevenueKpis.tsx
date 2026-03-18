'use client'

import {
    TrendingUp,
    CircleDollarSign,
    Clock,
    ArrowUpRight,
    TrendingDown
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import type { RevenueSummary } from '../../types'

export function RevenueKpis({ summary }: { summary: RevenueSummary }) {
    const kpis = [
        {
            label: 'Faturamento Mensal',
            value: formatCurrency(summary.total),
            trend: 8.5,
            icon: CircleDollarSign,
            color: 'text-brand-primary',
            border: 'border-brand-primary'
        },
        {
            label: 'Valor Pendente',
            value: formatCurrency(summary.pending),
            trend: -2.1,
            icon: Clock,
            color: 'text-brand-warning',
            border: 'border-brand-warning'
        },
        {
            label: 'Ticket Médio',
            value: formatCurrency(summary.avgTicket),
            trend: 5.4,
            icon: ArrowUpRight,
            color: 'text-blue-400',
            border: 'border-blue-400'
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <div key={idx} className={cn(
                    "card p-6 border-l-4 group hover:glow-border transition-all duration-300",
                    kpi.border
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn("p-2 rounded-sm bg-bg-elevated", kpi.color)}>
                            <kpi.icon size={20} />
                        </div>
                        <div className={cn(
                            "text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated",
                            kpi.trend >= 0 ? "text-brand-success" : "text-brand-danger"
                        )}>
                            {kpi.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(kpi.trend)}%
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-2xl font-display text-text-primary">{kpi.value}</h3>
                </div>
            ))}
        </div>
    )
}
