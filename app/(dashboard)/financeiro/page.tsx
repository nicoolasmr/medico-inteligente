'use client'

import { useState } from 'react'
import { getRevenueSummary, getPayments } from './actions'
import { RevenueKpis } from '@/components/financeiro/RevenueKpis'
import { PaymentsTable } from '@/components/financeiro/PaymentsTable'
import { CreatePaymentDialog } from '@/components/financeiro/CreatePaymentDialog'
import { Plus, Filter, Search, Download, FileBarChart } from 'lucide-react'
import type { Payment, RevenueSummary } from '@/types'

export default function FinanceiroPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [summary, setSummary] = useState<RevenueSummary | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    useState(() => {
        Promise.all([getRevenueSummary(), getPayments()]).then(([s, p]) => {
            setSummary(s)
            setPayments(p)
            setLoading(false)
        })
    })

    return (
        <div className="space-y-8 h-full flex flex-col">
            <CreatePaymentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display text-text-primary tracking-tight">Financeiro</h1>
                    <p className="text-text-secondary text-sm">Controladoria e fluxo de caixa da clínica.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-bg-border text-text-primary text-sm rounded-sm hover:bg-bg-hover transition-colors shadow-card">
                        <Download size={16} />
                        Exportar CSV
                    </button>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all shadow-glow-sm"
                    >
                        <Plus size={18} />
                        Nova Cobrança
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            {summary && <RevenueKpis summary={summary} />}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">

                {/* Payments Table - Large Column */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <FileBarChart size={16} className="text-brand-primary" />
                            Lançamentos Recentes
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Filtrar lançamentos..."
                                    className="bg-bg-surface border border-bg-border rounded-sm py-1 pl-8 pr-4 text-xs text-text-primary outline-none focus:border-brand-primary transition-all w-[200px]"
                                />
                            </div>
                            <button className="p-1.5 border border-bg-border rounded-sm text-text-secondary hover:text-text-primary transition-colors">
                                <Filter size={14} />
                            </button>
                        </div>
                    </div>
                    <PaymentsTable payments={payments} />
                </div>

                {/* Sidebar Mini Components */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Receita por Procedimento</h4>
                        <div className="space-y-4">
                            {summary?.byProcedure.map((proc, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-primary font-medium">{proc.name}</span>
                                        <span className="text-text-muted">{summary.total > 0 ? Math.round((proc.value / summary.total) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary opacity-80"
                                            style={{ width: `${summary.total > 0 ? (proc.value / summary.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!summary || summary.byProcedure.length === 0) && (
                                <p className="text-[10px] text-text-muted italic">Nenhum dado de procedimento disponível.</p>
                            )}
                        </div>
                        <button className="w-full mt-6 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline text-center">
                            Ver relatório detalhado
                        </button>
                    </div>

                    <div className="card p-6 bg-gradient-to-br from-bg-surface to-bg-elevated border-brand-warning/20">
                        <h4 className="text-xs font-bold text-brand-warning uppercase tracking-widest mb-3">Lembrete Financeiro</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Você tem <strong>{payments.filter(p => p.status === 'overdue').length} cobranças</strong> vencidas este mês. Deseja enviar um lembrete WhatsApp de cortesia?
                        </p>
                        <button className="w-full mt-4 py-2 bg-brand-warning/10 text-brand-warning border border-brand-warning/20 font-bold rounded-sm hover:bg-brand-warning/20 transition-all text-[10px] uppercase tracking-widest">
                            Enviar Lembretes
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
