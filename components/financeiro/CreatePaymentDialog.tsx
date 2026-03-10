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
import { createPaymentSchema, type CreatePaymentInput } from '@/lib/validations/payment'
import { createPayment } from '@/app/(dashboard)/financeiro/actions'
import { searchPatients } from '@/app/(dashboard)/patients/actions'
import { toast } from 'sonner'
import { Banknote, Search, Calendar, User } from 'lucide-react'
import type { Patient } from '@/types'
import { cn } from '@/lib/utils'

interface CreatePaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreatePaymentDialog({ open, onOpenChange }: CreatePaymentDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [patientSearch, setPatientSearch] = React.useState('')
    const [foundPatients, setFoundPatients] = React.useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<CreatePaymentInput>({
        resolver: zodResolver(createPaymentSchema),
        defaultValues: {
            patientId: '',
            amount: 0,
            description: '',
            method: 'pix',
            status: 'pending',
            dueDate: new Date().toISOString().split('T')[0]
        }
    })

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

    async function onSubmit(data: CreatePaymentInput) {
        if (!selectedPatient) {
            toast.error('Selecione um paciente')
            return
        }

        setLoading(true)
        try {
            const res = await createPayment({
                ...data,
                patientId: selectedPatient.id
            })

            if (res.success) {
                toast.success('Cobrança gerada com sucesso!')
                reset()
                setSelectedPatient(null)
                setPatientSearch('')
                onOpenChange(false)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar cobrança')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Banknote size={20} className="text-brand-primary" />
                        Gerar Nova Cobrança
                    </DialogTitle>
                    <DialogDescription>
                        Crie uma fatura manual para um paciente ou procedimento.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 font-sans">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Paciente</label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 rounded-sm bg-bg-elevated border border-bg-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <User size={14} />
                                    </div>
                                    <p className="text-sm font-medium text-text-primary">{selectedPatient.name}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedPatient(null)} className="text-[10px] font-bold text-brand-danger uppercase hover:underline">Trocar</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input placeholder="Buscar paciente..." className="pl-10" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
                                {foundPatients.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-bg-border rounded-sm shadow-glow z-50 max-h-40 overflow-y-auto">
                                        {foundPatients.map(p => (
                                            <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setValue('patientId', p.id); setFoundPatients([]) }} className="w-full text-left px-4 py-2 text-sm hover:bg-bg-elevated border-b border-bg-border last:border-0">{p.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Valor (R$)</label>
                            <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Vencimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                <Input type="date" className="pl-10" {...register('dueDate')} disabled={loading} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Descrição</label>
                        <Input {...register('description')} placeholder="Ex: Avaliação Inicial / Implante" disabled={loading} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Método de Pagamento</label>
                        <select {...register('method')} className="w-full bg-bg-elevated border border-bg-border rounded-sm p-2 text-sm text-text-primary outline-none focus:border-brand-primary h-10">
                            <option value="pix">PIX</option>
                            <option value="credit">Cartão de Crédito</option>
                            <option value="cash">Dinheiro</option>
                            <option value="transfer">Transferência</option>
                        </select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Gerar Cobrança'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
