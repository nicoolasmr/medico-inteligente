'use client'

import Link from 'next/link'
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreHorizontal,
    FileText,
    CreditCard,
    Banknote,
    Smartphone
} from 'lucide-react'
import type { Payment } from '../../types'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import { markAsPaid } from '../../app/(dashboard)/financeiro/actions'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const STATUS_CONFIG: Record<string, any> = {
    paid: { label: 'Pago', icon: CheckCircle2, className: 'bg-brand-success/10 text-brand-success outline-brand-success/20' },
    pending: { label: 'Pendente', icon: Clock, className: 'bg-brand-warning/10 text-brand-warning outline-brand-warning/20' },
    overdue: { label: 'Vencido', icon: AlertCircle, className: 'bg-brand-danger/10 text-brand-danger outline-brand-danger/20' },
    cancelled: { label: 'Cancelado', icon: AlertCircle, className: 'bg-text-muted/10 text-text-muted outline-text-muted/20' },
}

const METHOD_ICONS: Record<string, any> = {
    credit: CreditCard,
    pix: Smartphone,
    cash: Banknote,
    transfer: FileText,
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
    async function handleMarkAsPaid(id: string) {
        try {
            const res = await markAsPaid(id)
            if (res.success) {
                toast.success('Pagamento confirmado!')
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar pagamento')
        }
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-elevated border-b border-bg-border">
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Paciente</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Descrição</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Vencimento / Pago</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Método</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Valor</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Status</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                        {payments.map((p) => {
                            const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending
                            const MethodIcon = METHOD_ICONS[p.method || 'cash'] || Banknote

                            return (
                                <tr key={p.id} className="hover:bg-bg-hover/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        {p.patientId ? (
                                            <Link href={`/patients/${p.patientId}?tab=financial`} className="text-sm font-medium text-text-primary hover:text-brand-primary transition-colors">
                                                {(p as any).patient?.name || 'Carregando...'}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-medium text-text-primary">Manual</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-text-secondary line-clamp-1">{p.description || 'Consulta/Procedimento'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-text-secondary">
                                            {p.paidAt ? formatDate(p.paidAt) : p.dueDate ? formatDate(p.dueDate) : '---'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-muted">
                                            <MethodIcon size={14} />
                                            <span className="text-[10px] uppercase font-bold tracking-tighter">{p.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(Number(p.amount))}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide outline outline-1",
                                            status.className
                                        )}>
                                            <status.icon size={10} />
                                            {status.label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 text-text-muted hover:text-text-primary transition-opacity opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {p.status !== 'paid' && (
                                                    <DropdownMenuItem
                                                        className="gap-2 text-brand-success focus:text-brand-success"
                                                        onClick={() => handleMarkAsPaid(p.id)}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Marcar como Pago
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="gap-2" asChild>
                                                    <Link href={`/patients/${p.patientId}?tab=financial`}>
                                                        <FileText size={14} />
                                                        Ver Detalhes
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-brand-danger focus:text-brand-danger">
                                                    <AlertCircle size={14} />
                                                    Cancelar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
