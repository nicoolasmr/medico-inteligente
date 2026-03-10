'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    MessageCircle,
    StickyNote,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'

// Mock interactions for now (will be replaced by generic Interaction type later)
const MOCK_INTERACTIONS = [
    { id: '1', type: 'note', content: 'Paciente apresenta melhora no quadro de hipertensão após início da nova medicação.', date: new Date(), user: 'Dr. Nicolas' },
    { id: '2', type: 'whatsapp', content: 'Lembrete de consulta enviado automaticamente.', date: new Date(Date.now() - 3600000), user: 'Sistema' },
    { id: '3', type: 'call', content: 'Tentativa de contato para confirmação de cirurgia. Sem sucesso.', date: new Date(Date.now() - 86400000), user: 'Secretaria Ana' },
]

export function PatientHistory({ patientId }: { patientId: string }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Linha do Tempo</h3>
                <button className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1">
                    <StickyNote size={14} />
                    Adicionar Nota
                </button>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-bg-border">
                {MOCK_INTERACTIONS.map((interaction) => (
                    <div key={interaction.id} className="relative flex items-start gap-6 group">
                        <div className={cn(
                            "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-bg-app z-10 transition-transform group-hover:scale-110",
                            interaction.type === 'note' ? "bg-blue-500/20 text-blue-400" :
                                interaction.type === 'whatsapp' ? "bg-brand-primary/20 text-brand-primary" :
                                    "bg-orange-500/20 text-orange-400"
                        )}>
                            {interaction.type === 'note' && <StickyNote size={16} />}
                            {interaction.type === 'whatsapp' && <MessageCircle size={16} />}
                            {interaction.type === 'call' && <AlertCircle size={16} />}
                        </div>

                        <div className="flex-1 pt-0.5 ml-12">
                            <div className="card p-4 hover:border-brand-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-text-primary uppercase tracking-tight">
                                        {interaction.type === 'note' ? 'Anotação Médica' :
                                            interaction.type === 'whatsapp' ? 'Mensagem WhatsApp' : 'Contato Telefônico'}
                                        <span className="text-text-muted font-normal lowercase ml-2">por {interaction.user}</span>
                                    </p>
                                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                                        <Clock size={10} />
                                        {timeAgo(interaction.date)}
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {interaction.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
