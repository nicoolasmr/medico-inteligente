'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAutomationSchema, type CreateAutomationInput } from '@/lib/validations/automation'
import { createAutomation } from '@/app/(dashboard)/automacoes/actions'
import { toast } from 'sonner'
import { Zap, MessageSquare, Clock, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateAutomationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateAutomationDialog({ open, onOpenChange }: CreateAutomationDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<CreateAutomationInput>({
        resolver: zodResolver(createAutomationSchema),
        defaultValues: {
            name: '',
            triggerEvent: 'appointment_created',
            actionType: 'whatsapp',
            delayMinutes: 0,
            config: { template: 'Lembrete de Consulta' },
        }
    })

    const actionType = watch('actionType')

    async function onSubmit(data: CreateAutomationInput) {
        setLoading(true)
        try {
            const res = await createAutomation(data)
            if (res.success) {
                toast.success('Automação criada com sucesso!')
                reset()
                onOpenChange(false)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao conectar com servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap size={20} className="text-brand-primary" />
                        Criar Novo Fluxo
                    </DialogTitle>
                    <DialogDescription>
                        Configure um gatilho automático para sua clínica.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4 font-sans">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nome do Fluxo</label>
                        <Input
                            {...register('name')}
                            placeholder="Ex: Lembrete de Consulta 24h"
                            disabled={loading}
                        />
                        {errors.name && <p className="text-[10px] text-brand-danger font-bold uppercase">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Gatilho</label>
                            <select
                                {...register('triggerEvent')}
                                className="w-full bg-bg-elevated border border-bg-border rounded-sm p-2 text-sm text-text-primary outline-none focus:border-brand-primary transition-colors h-10"
                                disabled={loading}
                            >
                                <option value="appointment_created">Consulta Criada</option>
                                <option value="treatment_approved">Tratamento Aprovado</option>
                                <option value="payment_overdue">Cobrança Vencida</option>
                                <option value="patient_birthday">Aniversário do Paciente</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Ação</label>
                            <div className="flex bg-bg-elevated border border-bg-border rounded-sm p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setValue('actionType', 'whatsapp')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-xs",
                                        actionType === 'whatsapp' ? "bg-brand-primary text-bg-app" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <MessageSquare size={12} />
                                    WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('actionType', 'email')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-xs",
                                        actionType === 'email' ? "bg-brand-primary text-bg-app" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <Shield size={12} />
                                    Email
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} />
                            Atraso após o gatilho (minutos)
                        </label>
                        <Input
                            type="number"
                            {...register('delayMinutes', { valueAsNumber: true })}
                            placeholder="0 = instantâneo"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Criando...' : 'Ativar Automação'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
