import { Calendar, ChevronRight, Clock, FileText, MessageCircle, Plus, ShieldCheck } from 'lucide-react'
import { prisma } from '../../lib/prisma'
import { getPortalPatientAccess } from '../../lib/portal-auth'
import { formatDate, formatDateTime, formatTime } from '../../lib/utils'

type PortalPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getSingleValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

export default async function PatientPortalPage({ searchParams }: PortalPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined
    const patientId = getSingleValue(resolvedSearchParams?.patient)
    const token = getSingleValue(resolvedSearchParams?.token)
    const access = await getPortalPatientAccess(patientId, token)

    if (!access.ok) {
        return (
            <div className="space-y-6 py-8">
                <section className="card p-8 border-brand-danger/30 bg-brand-danger/5 max-w-2xl">
                    <h1 className="text-2xl font-display text-text-primary tracking-tight mb-3">Portal indisponível</h1>
                    <p className="text-sm text-text-secondary leading-6">{access.reason}</p>
                    <p className="text-xs text-text-muted mt-4">
                        Solicite um novo link seguro diretamente com a clínica antes de tentar novamente.
                    </p>
                </section>
            </div>
        )
    }

    const { patient } = access
    const clinicId = patient.clinicId

    const appointments = patient
        ? await prisma.appointment.findMany({
            where: {
                clinicId,
                patientId: patient.id,
                scheduledAt: { gte: new Date() },
            },
            include: { doctor: { select: { name: true } } },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
        })
        : []

    const documents = patient
        ? await prisma.payment.findMany({
            where: {
                clinicId,
                patientId: patient.id,
                OR: [{ receiptUrl: { not: null } }, { description: { not: null } }],
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
        })
        : []

    const nextAppointment = appointments[0] ?? null

    return (
        <div className="space-y-10 py-4">
            <section>
                <h1 className="text-3xl font-display text-text-primary tracking-tight mb-2">Olá, {patient?.name?.split(' ')[0] ?? 'Paciente'}!</h1>
                <p className="text-text-secondary text-sm">Bem-vindo ao seu espaço de saúde digital com dados atualizados da clínica.</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2 px-1">
                        <Calendar size={14} className="text-brand-primary" />
                        Próxima Consulta
                    </h3>

                    {nextAppointment ? (
                        <div className="card p-6 bg-gradient-to-br from-bg-surface to-bg-elevated border-brand-primary/20">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <p className="text-lg font-display text-text-primary">{formatDate(nextAppointment.scheduledAt)}</p>
                                    <p className="text-2xl font-display text-brand-primary leading-none mt-1">{formatTime(nextAppointment.scheduledAt)}</p>
                                </div>
                                <div className="px-3 py-1 rounded-sm bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20">
                                    {nextAppointment.status}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-bg-border">
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock size={16} className="text-text-muted" />
                                    <span className="text-text-primary">{nextAppointment.type ?? 'Consulta'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ShieldCheck size={16} className="text-text-muted" />
                                    <span className="text-text-primary">{nextAppointment.doctor?.name ?? 'Equipe médica'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button className="py-2 bg-bg-app border border-bg-border rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-bg-hover transition-colors" type="button">
                                    Remarcar
                                </button>
                                <button className="py-2 bg-brand-primary text-bg-app rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors" type="button">
                                    Check-in
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-10 flex flex-col items-center justify-center text-center gap-4 opacity-70">
                            <Calendar size={32} className="text-text-muted" />
                            <p className="text-xs text-text-secondary italic">Nenhum agendamento futuro encontrado para este paciente.</p>
                            <button className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary font-bold rounded-sm text-[10px] uppercase tracking-widest" type="button">
                                <Plus size={14} />
                                Novo Agendamento
                            </button>
                        </div>
                    )}
                </section>

                <section className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2 px-1">
                            <FileText size={14} className="text-blue-400" />
                            Documentos e Receitas
                        </h3>
                        <div className="space-y-3">
                            {documents.length > 0 ? documents.map(doc => (
                                <div key={doc.id} className="card p-4 hover:border-blue-400/30 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-bg-elevated flex items-center justify-center text-blue-400">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-text-primary">{doc.description ?? 'Comprovante financeiro'}</p>
                                            <p className="text-[10px] text-text-muted uppercase tracking-tighter">{doc.receiptUrl ? 'Recibo disponível' : 'Lançamento'} • {formatDateTime(doc.createdAt)}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-text-muted group-hover:text-blue-400 transition-colors" />
                                </div>
                            )) : (
                                <div className="card p-6 text-xs text-text-secondary">Nenhum documento ou recibo disponível até o momento.</div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 bg-brand-primary/5 border-dashed border-brand-primary/30 flex items-center gap-4 hover:bg-brand-primary/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary uppercase tracking-tight">Suporte via WhatsApp</h4>
                            <p className="text-[10px] text-text-secondary leading-tight mt-1">{patient?.phone ? `Contato principal registrado: ${patient.phone}` : 'Telefone do paciente ainda não cadastrado.'}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
