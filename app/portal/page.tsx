import {
    Calendar,
    FileText,
    Clock,
    Plus,
    ChevronRight,
    ShieldCheck,
    MessageCircle
} from 'lucide-react'
import { cn, formatDate, formatTime } from '@/lib/utils'

export default function PatientPortalPage() {
    const appointments = [
        { id: '1', date: new Date(), time: '14:30', doctor: 'Dr. Ricardo Silva', type: 'Avaliação', status: 'confirmed' },
    ]

    const documents = [
        { id: '1', name: 'Prescrição - 10/03/2026', type: 'Receita', size: '240kb' },
        { id: '2', name: 'Exame de Imagem - Raio-X', type: 'Exame', size: '1.2mb' },
    ]

    return (
        <div className="space-y-10 py-4">
            {/* Welcome Section */}
            <section>
                <h1 className="text-3xl font-display text-text-primary tracking-tight mb-2">Olá!</h1>
                <p className="text-text-secondary text-sm">Bem-vindo ao seu espaço de saúde digital.</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Next Appointment Card */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2 px-1">
                        <Calendar size={14} className="text-brand-primary" />
                        Próxima Consulta
                    </h3>

                    {appointments.length > 0 ? (
                        <div className="card p-6 bg-gradient-to-br from-bg-surface to-bg-elevated border-brand-primary/20">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <p className="text-lg font-display text-text-primary">{formatDate(appointments[0]?.date || new Date())}</p>
                                    <p className="text-2xl font-display text-brand-primary leading-none mt-1">{appointments[0]?.time}</p>
                                </div>
                                <div className="px-3 py-1 rounded-sm bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20">
                                    Confirmado
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-bg-border">
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock size={16} className="text-text-muted" />
                                    <span className="text-text-primary">{appointments[0]?.type}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ShieldCheck size={16} className="text-text-muted" />
                                    <span className="text-text-primary">{appointments[0]?.doctor}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button className="py-2 bg-bg-app border border-bg-border rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-bg-hover transition-colors">
                                    Remarcar
                                </button>
                                <button className="py-2 bg-brand-primary text-bg-app rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors">
                                    Check-in
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-10 flex flex-col items-center justify-center text-center gap-4 opacity-70">
                            <Calendar size={32} className="text-text-muted" />
                            <p className="text-xs text-text-secondary italic">Você não tem agendamentos próximos.</p>
                            <button className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary font-bold rounded-sm text-[10px] uppercase tracking-widest">
                                <Plus size={14} />
                                Novo Agendamento
                            </button>
                        </div>
                    )}
                </section>

                {/* Action Center */}
                <section className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2 px-1">
                            <FileText size={14} className="text-blue-400" />
                            Documentos e Receitas
                        </h3>
                        <div className="space-y-3">
                            {documents.map(doc => (
                                <div key={doc.id} className="card p-4 hover:border-blue-400/30 transition-all flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-bg-elevated flex items-center justify-center text-blue-400">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-text-primary">{doc.name}</p>
                                            <p className="text-[10px] text-text-muted uppercase tracking-tighter">{doc.type} • {doc.size}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-text-muted group-hover:text-blue-400 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-6 bg-brand-primary/5 border-dashed border-brand-primary/30 flex items-center gap-4 cursor-pointer hover:bg-brand-primary/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary uppercase tracking-tight">Suporte via WhatsApp</h4>
                            <p className="text-[10px] text-text-secondary leading-tight mt-1 truncate">Tire dúvidas ou solicite documentos diretamente com nossa equipe.</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}
