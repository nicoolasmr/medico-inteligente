'use client'

import {
    CheckCircle,
    XCircle,
    ExternalLink,
    ChevronRight,
    History
} from 'lucide-react'
import type { AutomationLog } from '../../types'
import { cn, timeAgo, formatDateTime } from '../../lib/utils'

export function AutomationLogTable({ logs }: { logs: AutomationLog[] }) {
    return (
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-bg-border bg-bg-surface flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <History size={14} className="text-brand-primary" />
                    Últimas Execuções
                </h4>
                <button className="text-[10px] font-bold text-brand-primary uppercase hover:underline">Ver Histórico Completo</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-elevated/50 border-b border-bg-border">
                            <th className="px-6 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">Status</th>
                            <th className="px-6 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">Fluxo / Evento</th>
                            <th className="px-6 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">Paciente</th>
                            <th className="px-6 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">Horário</th>
                            <th className="px-6 py-2 text-[9px] font-bold text-text-muted uppercase tracking-widest text-right">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                        {logs.map(log => {
                            const details = getLogDetails(log)

                            return (
                                <tr key={log.id} className="hover:bg-bg-hover/30 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className={cn(
                                            'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight',
                                            log.status === 'success' ? 'text-brand-success' : 'text-brand-danger'
                                        )}>
                                            {log.status === 'success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                            {log.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-[11px] font-medium text-text-primary">{log.automation?.name || 'Evento do Sistema'}</p>
                                        <p className="text-[9px] text-text-muted font-mono">{log.triggerEvent} • {details.action}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-[11px] text-text-primary">{log.patient?.name ?? 'Sem paciente vinculado'}</p>
                                        {details.destination ? <p className="text-[9px] text-text-muted font-mono">{details.destination}</p> : null}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="block text-[10px] text-text-secondary">{timeAgo(log.createdAt)}</span>
                                        <span className="block text-[9px] text-text-muted">{formatDateTime(log.createdAt)}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="inline-flex items-center gap-2 text-[10px] text-text-muted">
                                            {details.error ? <span className="max-w-44 truncate text-brand-danger">{details.error}</span> : <span className="max-w-44 truncate">OK</span>}
                                            <ChevronRight size={14} />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
