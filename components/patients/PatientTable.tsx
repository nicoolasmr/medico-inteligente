'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    MoreHorizontal,
    Phone,
    Mail,
    Calendar,
    User as UserIcon,
    Trash2,
    Edit2,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import type { Patient } from '../../types'
import { cn, formatDate } from '../../lib/utils'

interface PatientTableProps {
    patients: Patient[]
    onDelete: (id: string) => void
    onEdit: (patient: Patient) => void
}

export function PatientTable({ patients, onDelete, onEdit }: PatientTableProps) {
    if (patients.length === 0) {
        return (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-4 text-text-muted">
                    <UserIcon size={24} />
                </div>
                <h3 className="text-lg font-display text-text-primary mb-1">Nenhum paciente encontrado</h3>
                <p className="text-sm text-text-secondary">Comece adicionando o primeiro paciente à sua clínica.</p>
            </div>
        )
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-elevated border-b border-bg-border">
                            <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contato</th>
                            <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Última Visita</th>
                            <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tags</th>
                            <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                        {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-bg-hover/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <Link href={`/patients/${patient.id}`} className="text-sm font-medium text-text-primary hover:text-brand-primary transition-colors block">
                                                {patient.name}
                                            </Link>
                                            <p className="text-xs text-text-muted">{patient.cpf || 'Cpf não informado'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        {patient.phone && (
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <Phone size={12} className="text-text-muted" />
                                                {patient.phone}
                                            </div>
                                        )}
                                        {patient.email && (
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <Mail size={12} className="text-text-muted" />
                                                {patient.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <Calendar size={12} className="text-text-muted" />
                                        {patient.lastVisitAt ? formatDate(patient.lastVisitAt) : 'Sem registros'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {patient.tags.slice(0, 2).map((tag, i) => (
                                            <span key={i} className="text-[10px] bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded-sm border border-bg-border">
                                                {tag}
                                            </span>
                                        ))}
                                        {patient.tags.length > 2 && (
                                            <span className="text-[10px] text-text-muted">+{patient.tags.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/patients/${patient.id}`} className="p-1.5 hover:bg-bg-elevated rounded-sm text-text-muted hover:text-brand-primary transition-colors" title="Ver Prontuário">
                                            <ExternalLink size={16} />
                                        </Link>
                                        <button
                                            onClick={() => onEdit(patient)}
                                            className="p-1.5 hover:bg-bg-elevated rounded-sm text-text-muted hover:text-text-primary transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Deseja realmente excluir o paciente ${patient.name}?`)) {
                                                    onDelete(patient.id)
                                                }
                                            }}
                                            className="p-1.5 hover:bg-brand-danger/10 rounded-sm text-text-muted hover:text-brand-danger transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
