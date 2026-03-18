'use client'

import {
    Sparkles,
    Lightbulb,
    AlertTriangle,
    Target,
    ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface Insight {
    type: 'opportunity' | 'risk' | 'strategy'
    title: string
    content: string
}

export function InsightGrid({ insights }: { insights: Insight[] }) {
    const icons = {
        opportunity: { icon: Lightbulb, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
        risk: { icon: AlertTriangle, color: 'text-brand-danger', bg: 'bg-brand-danger/10', border: 'border-brand-danger/20' },
        strategy: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((item, idx) => {
                const config = icons[item.type] || icons.opportunity
                return (
                    <div key={idx} className={cn(
                        "card p-6 flex flex-col h-full group hover:shadow-glow transition-all duration-500 border-t-2",
                        config.border
                    )}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("p-2 rounded-sm", config.bg, config.color)}>
                                <config.icon size={20} />
                            </div>
                            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">
                                {item.type === 'opportunity' ? 'Oportunidade' : item.type === 'risk' ? 'Risco Detectado' : 'Estratégia'}
                            </h4>
                        </div>

                        <h3 className="text-lg font-display text-text-primary mb-3 leading-tight group-hover:text-brand-primary transition-colors">
                            {item.title}
                        </h3>

                        <p className="text-xs text-text-secondary leading-relaxed flex-1">
                            {item.content}
                        </p>

                        <button className="mt-6 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest group-hover:gap-3 transition-all">
                            Saber mais
                            <ChevronRight size={12} />
                        </button>
                    </div>
                )
            })}

            {insights.length === 0 && (
                <div className="col-span-full h-64 border-2 border-dashed border-bg-border rounded-sm flex flex-col items-center justify-center gap-4 opacity-50">
                    <Sparkles size={32} className="text-brand-primary animate-pulse" />
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest text-center italic">
                        Nenhum insight gerado recentemente.<br />
                        <span className="text-[10px] font-normal lowercase block mt-1">Clique em &quot;Gerar Nova Análise&quot; para começar.</span>
                    </p>
                </div>
            )}
        </div>
    )
}
