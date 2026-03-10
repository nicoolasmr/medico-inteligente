'use client'

import { Patient } from '@/types'
import { User, Phone, Mail, FileText, Calendar, MapPin, Tag } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

interface PatientProfileProps {
    patient: Patient
}

export function PatientProfile({ patient }: PatientProfileProps) {
    return (
        <div className="card-elevated p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar & Initials */}
                <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-display font-bold text-3xl shrink-0 border-2 border-brand-primary/20 shadow-glow-sm">
                    {getInitials(patient.name)}
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-3xl font-display text-text-primary mb-1">{patient.name}</h2>
                        <div className="flex flex-wrap gap-2">
                            {patient.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] bg-brand-primary/5 text-brand-primary px-2 py-0.5 rounded-full border border-brand-primary/10 font-medium">
                                    {tag}
                                </span>
                            ))}
                            <span className="text-[10px] bg-bg-surface text-text-muted px-2 py-0.5 rounded-full border border-bg-border uppercase font-medium">
                                Paciente {patient.gender === 'F' ? 'Feminino' : patient.gender === 'M' ? 'Masculino' : 'Outro'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-8">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-brand-primary" />
                            <span className="text-text-secondary">{patient.phone || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-brand-primary" />
                            <span className="text-text-secondary truncate">{patient.email || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <FileText size={14} className="text-brand-primary" />
                            <span className="text-text-secondary uppercase">CPF: {patient.cpf || '---'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar size={14} className="text-brand-primary" />
                            <span className="text-text-secondary">Nasc: {patient.birthDate ? formatDate(patient.birthDate) : '---'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm col-span-1 sm:col-span-2">
                            <MapPin size={14} className="text-brand-primary" />
                            <span className="text-text-secondary">{patient.origin || 'Origem não informada'}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button className="px-6 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all text-sm">
                        Novo Agendamento
                    </button>
                    <button className="px-6 py-2 bg-bg-surface border border-bg-border text-text-primary rounded-sm hover:bg-bg-hover transition-all text-sm font-medium">
                        Editar Dados
                    </button>
                </div>
            </div>
        </div>
    )
}
