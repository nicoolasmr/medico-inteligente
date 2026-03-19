'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, Zap, ShieldCheck, Activity } from 'lucide-react'
import { getAutomations, getAutomationLogs, getAutomationRuntime, type AutomationRuntimeStatus } from './actions'
import { AutomationList } from '../../../components/automacoes/AutomationList'
import { AutomationLogTable } from '../../../components/automacoes/AutomationLogTable'
import { CreateAutomationDialog } from '../../../components/automacoes/CreateAutomationDialog'
import type { Automation, AutomationLog } from '../../../types'

const DEFAULT_RUNTIME: AutomationRuntimeStatus = {
    available: true,
    mode: 'full',
}

export default function AutomacoesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [automations, setAutomations] = useState<Automation[]>([])
    const [logs, setLogs] = useState<AutomationLog[]>([])
    const [runtime, setRuntime] = useState<AutomationRuntimeStatus>(DEFAULT_RUNTIME)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        Promise.all([getAutomations(), getAutomationLogs(), getAutomationRuntime()]).then(([a, l, status]) => {
            setAutomations(a)
            setLogs(l)
            setRuntime(status)
            setLoading(false)
        })
    }, [])

    return (
        <div className="space-y-8 h-full flex flex-col">
            <CreateAutomationDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                disabled={!runtime.available}
                unavailableMessage={runtime.message}
            />

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display text-text-primary tracking-tight">Automações</h1>
                    <p className="text-text-secondary text-sm">Configure fluxos automáticos de comunicação e alertas.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-bg-border text-text-primary text-sm rounded-sm hover:bg-bg-hover transition-colors shadow-card">
                        <ShieldCheck size={16} />
                        Políticas
                    </button>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={!runtime.available}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-primary"
                    >
                        <Plus size={18} />
                        Criar Fluxo
                    </button>
                </div>
            </div>

            {!runtime.available ? (
                <div className="card p-4 border border-amber-500/30 bg-amber-500/10 text-amber-100 flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <h2 className="text-sm font-semibold">Automações em modo somente leitura</h2>
                        <p className="text-xs text-amber-50/90 mt-1">
                            {runtime.message}
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">

                {/* Main Automation Builder/List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={18} className="text-brand-primary animate-pulse" />
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Seus Fluxos Ativos</h3>
                    </div>
                    <AutomationList automations={automations} disabled={!runtime.available} unavailableMessage={runtime.message} />
                </div>

                {/* Real-time Monitoring Sidebar */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-brand-success" />
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Monitoramento</h3>
                        </div>
                        <AutomationLogTable logs={logs} />
                    </div>

                    <div className="card p-6 border-l-4 border-brand-primary bg-brand-primary/5">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-3">Dica de Crescimento</h4>
                        <p className="text-xs text-text-secondary leading-relaxed mb-4">
                            Sua taxa de confirmação aumentou em <strong>15%</strong> após ativar os lembretes de 24h. Experimente ativar o fluxo de &quot;Pós-consulta&quot; para coletar reviews automáticos.
                        </p>
                        <button className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline">
                            Ativar Pós-consulta
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
