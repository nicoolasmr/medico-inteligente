import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatTime } from '../../lib/utils'
import type { Appointment } from '../../types'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { CheckCircle2, XCircle, Clock, Ban, User, MoreHorizontal, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AppointmentSlotProps {
    appt: Appointment
    onUpdateStatus: (id: string, status: string) => void
    onDelete: (id: string) => void
}

function AppointmentSlot({ appt, onUpdateStatus, onDelete }: AppointmentSlotProps) {
    const statusColors: Record<string, string> = {
        scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        confirmed: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cancelled: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
        no_show: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    }

    const patientName = (appt as any).patient?.name || 'Paciente'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn(
                    "p-2 rounded-sm border mb-2 cursor-pointer hover:shadow-glow-sm transition-all group relative",
                    statusColors[appt.status] || 'bg-bg-elevated'
                )}>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-tight">{formatTime(appt.scheduledAt)}</p>
                        <MoreHorizontal size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs font-semibold truncate">{patientName}</p>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase text-text-muted">Ações para {patientName}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2" asChild>
                    <Link href={`/patients/${appt.patientId}`}>
                        <User size={14} />
                        Ver Prontuário
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase text-text-muted">Mudar Status</DropdownMenuLabel>

                <DropdownMenuItem className="gap-2 text-brand-primary" onClick={() => onUpdateStatus(appt.id, 'confirmed')}>
                    <CheckCircle2 size={14} />
                    Confirmar Presença
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2 text-emerald-500" onClick={() => onUpdateStatus(appt.id, 'completed')}>
                    <Clock size={14} />
                    Marcar como Realizado
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2 text-orange-400" onClick={() => onUpdateStatus(appt.id, 'no_show')}>
                    <Ban size={14} />
                    Não Compareceu
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2 text-brand-danger focus:text-brand-danger" onClick={() => onDelete(appt.id)}>
                    <XCircle size={14} />
                    Cancelar Horário
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface DayColumnProps {
    date: Date
    appointments: Appointment[]
    isToday: boolean
    onUpdateStatus: (id: string, status: string) => void
    onDelete: (id: string) => void
}

export function DayColumn({ date, appointments, isToday, onUpdateStatus, onDelete }: DayColumnProps) {
    const dayAppointments = appointments.filter(a => isSameDay(new Date(a.scheduledAt), date))

    return (
        <div className={cn(
            "flex-1 min-w-[200px] border-r border-bg-border last:border-0 p-3 min-h-[600px]",
            isToday ? "bg-brand-primary/5" : "bg-transparent"
        )}>
            <div className="text-center mb-6">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{format(date, 'eee', { locale: ptBR })}</p>
                <p className={cn(
                    "text-xl font-display mt-1",
                    isToday ? "text-brand-primary" : "text-text-primary"
                )}>{format(date, 'dd')}</p>
            </div>

            <div className="space-y-2">
                {dayAppointments.length > 0 ? (
                    dayAppointments.map(appt => (
                        <AppointmentSlot
                            key={appt.id}
                            appt={appt}
                            onUpdateStatus={onUpdateStatus}
                            onDelete={onDelete}
                        />
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center pt-20">
                        <p className="text-[10px] text-text-muted italic">Sem agendamentos</p>
                    </div>
                )}
            </div>
        </div>
    )
}
