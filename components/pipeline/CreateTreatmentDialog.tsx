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
import { createTreatmentSchema, type CreateTreatmentInput } from '@/lib/validations/treatment'
import { createTreatment } from '@/app/(dashboard)/pipeline/actions'
import { searchPatients } from '@/app/(dashboard)/patients/actions'
import { toast } from 'sonner'
import { User, Activity, DollarSign, Search, Plus } from 'lucide-react'
import type { Patient } from '@/types'

interface CreateTreatmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    initialStage?: string
}

export function CreateTreatmentDialog({ open, onOpenChange, onSuccess, initialStage = 'lead' }: CreateTreatmentDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [searchResults, setSearchResults] = React.useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
    const [isSearching, setIsSearching] = React.useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<CreateTreatmentInput>({
        resolver: zodResolver(createTreatmentSchema),
        defaultValues: {
            name: '',
            value: 0,
            probability: 50,
            stage: initialStage as any,
        }
    })

    // Search patients when searchTerm changes
    React.useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                setIsSearching(true)
                try {
                    const results = await searchPatients(searchTerm)
                    setSearchResults(results)
                } catch (err) {
                    console.error('Search error', err)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [searchTerm])

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient)
        setValue('patientId', patient.id)
        setSearchTerm('')
        setSearchResults([])
    }

    async function onSubmit(data: CreateTreatmentInput) {
        if (!selectedPatient) {
            toast.error('Selecione um paciente')
            return
        }

        setLoading(true)
        try {
            const res = await createTreatment(data)
            if (res.success) {
                toast.success('Tratamento criado com sucesso!')
                reset()
                setSelectedPatient(null)
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar solicitação')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Tratamento</DialogTitle>
                    <DialogDescription>
                        Crie um novo lead ou plano de tratamento para um paciente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Patient Search */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Paciente</label>
                        {!selectedPatient ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    placeholder="Buscar paciente por nome ou CPF..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={loading}
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-bg-surface border border-bg-border rounded-sm shadow-glow max-h-48 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-bg-elevated transition-colors flex flex-col"
                                            >
                                                <span className="font-semibold text-text-primary">{p.name}</span>
                                                <span className="text-xs text-text-muted">{p.cpf || p.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{selectedPatient.name}</p>
                                        <p className="text-xs text-text-muted">{selectedPatient.phone}</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-text-muted hover:text-brand-danger"
                                >
                                    Alterar
                                </Button>
                            </div>
                        )}
                        {errors.patientId && <p className="text-xs text-brand-danger">{errors.patientId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome do Procedimento / Tratamento</label>
                        <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <Input
                                {...register('name')}
                                className="pl-10"
                                placeholder="Ex: Canal no Dente 24, Implante..."
                                disabled={loading}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-brand-danger">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Valor Estimado (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    {...register('value', { valueAsNumber: true })}
                                    type="number"
                                    step="0.01"
                                    className="pl-10"
                                    placeholder="0,00"
                                    disabled={loading}
                                />
                            </div>
                            {errors.value && <p className="text-xs text-brand-danger">{errors.value.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Probabilidade (%)</label>
                            <Input
                                {...register('probability', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="50"
                                disabled={loading}
                            />
                            {errors.probability && <p className="text-xs text-brand-danger">{errors.probability.message}</p>}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Criar Tratamento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
