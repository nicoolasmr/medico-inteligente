'use client'

import {
    MessageSquare,
    Smartphone,
    Mail,
    Settings2,
    Trash2,
    Play,
    Plus,
    RotateCcw,
    MoreVertical
} from 'lucide-react'
import { useState } from 'react'
import type { Automation } from '@/types'
import { cn, timeAgo } from '@/lib/utils'
import { toggleAutomation, deleteAutomation } from '@/app/(dashboard)/automacoes/actions'
import { toast } from 'sonner'
import * as Switch from '@radix-ui/react-switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AutomationListProps {
    automations: Automation[]
}

export function AutomationList({ automations }: AutomationListProps) {
    const [loading, setLoading] = useState<string | null>(null)

    async function handleToggle(id: string, current: boolean) {
        setLoading(id)
        try {
            const res = await toggleAutomation(id, !current)
            if (res.success) {
                toast.success(`Fluxo ${!current ? 'ativado' : 'desativado'} com sucesso!`)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar solicitação')
        } finally {
            setLoading(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente excluir este fluxo?')) return

        try {
            const res = await deleteAutomation(id)
            if (res.success) {
                toast.success('Fluxo excluído com sucesso!')
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao excluir automação')
        }
    }

    return (
        <div className="space-y-4">
            {automations.map((rule) => {
                const Icon = rule.actionType === 'whatsapp' ? MessageSquare : Smartphone

                return (
                    <div key={rule.id} className="card p-5 group hover:border-brand-primary/30 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-sm bg-bg-elevated flex items-center justify-center text-brand-primary border border-bg-border group-hover:glow-sm transition-all">
                                <Icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-text-primary mb-0.5">{rule.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{rule.triggerEvent}</span>
                                    <span className="text-[10px] text-text-muted">•</span>
                                    <span className="text-[10px] text-text-secondary italic">Atraso: {rule.delayMinutes === 0 ? 'Instantâneo' : `${rule.delayMinutes} min`}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Ativo</span>
                                <button
                                    onClick={() => handleToggle(rule.id, !!rule.isActive)}
                                    disabled={loading === rule.id}
                                    className={cn(
                                        "w-8 h-4 rounded-full transition-colors relative outline-none",
                                        rule.isActive ? "bg-brand-primary" : "bg-bg-elevated",
                                        loading === rule.id && "opacity-50 cursor-wait"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 bg-text-primary rounded-full absolute top-0.5 transition-all shadow-sm",
                                        rule.isActive ? "left-4.5" : "left-0.5"
                                    )} />
                                </button>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 hover:bg-bg-elevated rounded-sm text-text-muted hover:text-text-primary transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="gap-2">
                                            <Settings2 size={14} />
                                            Configurações
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="gap-2 text-brand-danger focus:text-brand-danger"
                                            onClick={() => handleDelete(rule.id)}
                                        >
                                            <Trash2 size={14} />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                )
            })}

            {automations.length === 0 && (
                <div className="h-48 border-2 border-dashed border-bg-border rounded-sm flex flex-col items-center justify-center gap-3 opacity-50">
                    <RotateCcw size={24} className="text-text-muted" />
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">
                        Nenhuma automação configurada.<br />
                        <span className="text-[10px] font-normal lowercase italic mt-1 block">Comece criando um aviso de consulta via WhatsApp</span>
                    </p>
                </div>
            )}
        </div>
    )
}
