'use client'

import { useState, useEffect } from 'react'
import { getTreatmentsByStage } from './actions'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { CreateTreatmentDialog } from '@/components/pipeline/CreateTreatmentDialog'
import { Plus, Filter, Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import type { TreatmentsByStage } from '@/types'

export default function PipelinePage() {
    const [data, setData] = useState<TreatmentsByStage | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const res = await getTreatmentsByStage()
            setData(res)
        } catch (err) {
            toast.error('Erro ao carregar pipeline')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <CreateTreatmentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={loadData}
            />

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display text-text-primary tracking-tight">Pipeline de Tratamentos</h1>
                    <p className="text-text-secondary text-sm">Acompanhe a evolução dos orçamentos e planos de tratamento.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-bg-border text-text-primary text-sm rounded-sm hover:bg-bg-hover transition-colors shadow-card">
                        <Download size={16} />
                        Relatório
                    </button>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all shadow-glow-sm"
                    >
                        <Plus size={18} />
                        Novo Tratamento
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 py-2 border-y border-bg-border/50">
                <div className="flex-1 max-w-sm relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Filtrar tratamentos..."
                        className="w-full bg-bg-surface border border-bg-border rounded-sm py-1.5 pl-9 pr-4 text-xs text-text-primary outline-none focus:border-brand-primary transition-all shadow-sm"
                    />
                </div>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                    <Filter size={14} />
                    Filtros Avançados
                </button>
            </div>

            {/* Kanban Container */}
            <div className="flex-1 min-h-0 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-text-muted italic">Carregando pipeline...</div>
                ) : data ? (
                    <KanbanBoard initialData={data} />
                ) : null}
            </div>
        </div>
    )
}
