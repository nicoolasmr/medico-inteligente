'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAppointmentSchema, type CreateAppointmentInput } from '@/lib/validations/appointment'
import { createAppointment } from '@/app/(dashboard)/agenda/actions'
import { searchPatients } from '@/app/(dashboard)/patients/actions'
import { toast } from 'sonner'
import { Calendar, Clock, User, FileText, Search } from 'lucide-react'
import type { Patient } from '@/types'
import { cn } from '@/lib/utils'

interface CreateAppointmentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateAppointmentSheet({ open, onOpenChange, onSuccess }: CreateAppointmentSheetProps) {
    const [loading, setLoading] = React.useState(false)
    const [patientSearch, setPatientSearch] = React.useState('')
    const [foundPatients, setFoundPatients] = React.useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm<CreateAppointmentInput>({
        resolver: zodResolver(createAppointmentSchema),
        defaultValues: {
            patientId: '',
            scheduledAt: '',
            durationMin: 30,
            notes: '',
        }
    })

    // Debounced patient search
    React.useEffect(() => {
        if (patientSearch.length < 3) {
            setFoundPatients([])
            return
        }
        const timer = setTimeout(async () => {
            const results = await searchPatients(patientSearch)
            setFoundPatients(results)
        }, 300)
        return () => clearTimeout(timer)
    }, [patientSearch])

    async function onSubmit(data: CreateAppointmentInput) {
        if (!selectedPatient) {
            toast.error('Por favor, selecione um paciente')
            return
        }

        setLoading(true)
        try {
            const res = await createAppointment({
                ...data,
                patientId: selectedPatient.id
            })

            if (res.success) {
                toast.success('Consulta agendada com sucesso!')
                reset()
                setSelectedPatient(null)
                setPatientSearch('')
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar agendamento')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectPatient = (p: Patient) => {
        setSelectedPatient(p)
        setValue('patientId', p.id)
        setFoundPatients([])
        setPatientSearch('')
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Agendar Consulta</SheetTitle>
                    <SheetDescription>
                        Escolha o paciente e o horário para o novo agendamento.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6 font-sans">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Paciente</label>

                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 rounded-sm bg-brand-primary/5 border border-brand-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                                        {selectedPatient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{selectedPatient.name}</p>
                                        <p className="text-[10px] text-text-muted">{selectedPatient.phone}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-[10px] font-bold text-brand-danger uppercase hover:underline"
                                >
                                    Trocar
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    placeholder="Buscar paciente por nome..."
                                    className="pl-10"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />

                                {foundPatients.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-bg-border rounded-sm shadow-glow z-50 max-h-48 overflow-y-auto">
                                        {foundPatients.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-elevated transition-colors border-b border-bg-border last:border-0"
                                            >
                                                {p.name} <span className="text-[10px] text-text-muted whitespace-nowrap ml-2">({p.phone})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.patientId && <p className="text-xs text-brand-danger">{errors.patientId.message}</p>}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Data e Hora</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    type="datetime-local"
                                    className="pl-10 invert-calendar-icon" // Custom class if needed for stylizing browser input
                                    {...register('scheduledAt')}
                                    disabled={loading}
                                />
                            </div>
                            {errors.scheduledAt && <p className="text-xs text-brand-danger">{errors.scheduledAt.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Observações</label>
                        <textarea
                            {...register('notes')}
                            className="w-full min-h-[100px] bg-bg-elevated border border-bg-border rounded-sm p-3 text-sm text-text-primary outline-none focus:border-brand-primary transition-colors resize-none"
                            placeholder="Motivo da consulta, sintomas relatados..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}
