'use client'

import { useState, useEffect } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    RefreshCcw,
    LayoutGrid,
    List
} from 'lucide-react'
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayColumn } from './DayColumn'
import { CreateAppointmentSheet } from './CreateAppointmentSheet'
import { getAppointments, updateAppointmentStatus, deleteAppointment } from '@/app/(dashboard)/agenda/actions'
import type { Appointment } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function WeekCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startDate, i))

    useEffect(() => {
        loadAppointments()
    }, [currentDate])

    async function loadAppointments() {
        setLoading(true)
        try {
            const from = startDate
            const to = addDays(startDate, 6)
            const data = await getAppointments(from, to)
            setAppointments(data)
        } catch (err) {
            toast.error('Erro ao carregar agenda')
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateStatus(id: string, status: string) {
        try {
            const res = await updateAppointmentStatus(id, status)
            if (res.success) {
                toast.success('Status atualizado')
                loadAppointments()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao atualizar consulta')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente excluir este agendamento?')) return

        try {
            const res = await deleteAppointment(id)
            if (res.success) {
                toast.success('Agendamento excluído')
                loadAppointments()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao excluir agendamento')
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-display text-text-primary capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <div className="flex items-center gap-1 bg-bg-surface border border-bg-border rounded-sm p-1">
                        <button
                            onClick={() => setCurrentDate(subDays(currentDate, 7))}
                            className="p-1 hover:bg-bg-elevated rounded-sm transition-colors text-text-secondary"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-xs font-semibold hover:bg-bg-elevated rounded-sm transition-colors text-text-primary"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, 7))}
                            className="p-1 hover:bg-bg-elevated rounded-sm transition-colors text-text-secondary"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-bg-surface border border-bg-border rounded-sm p-1">
                        <button className="p-1.5 bg-bg-elevated text-brand-primary rounded-sm shadow-sm">
                            <LayoutGrid size={16} />
                        </button>
                        <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                            <List size={16} />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsSheetOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all shadow-glow-sm"
                    >
                        <Plus size={18} />
                        Novo Horário
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="card overflow-hidden h-full">
                <div className="flex overflow-x-auto min-h-[600px]">
                    {weekDays.map((day, i) => (
                        <DayColumn
                            key={i}
                            date={day}
                            appointments={appointments}
                            isToday={isSameDay(day, new Date())}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>

                {loading && (
                    <div className="absolute inset-x-0 bottom-0 top-[100px] bg-bg-app/40 backdrop-blur-[1px] flex items-center justify-center z-50">
                        <RefreshCcw size={24} className="animate-spin text-brand-primary" />
                    </div>
                )}
            </div>
        </div>
    )
}
