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
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { createPatientSchema, type CreatePatientInput } from '../../lib/validations/patient'
import { createPatient } from '../../app/(dashboard)/patients/actions'
import { toast } from 'sonner'
import { User, Phone, Mail, FileText } from 'lucide-react'

interface AddPatientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddPatientDialog({ open, onOpenChange, onSuccess }: AddPatientDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreatePatientInput>({
        resolver: zodResolver(createPatientSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            cpf: '',
            tags: [],
        }
    })

    async function onSubmit(data: CreatePatientInput) {
        setLoading(true)
        try {
            const res = await createPatient(data)
            if (res.success) {
                toast.success('Paciente cadastrado com sucesso!')
                reset()
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
                    <DialogTitle>Novo Paciente</DialogTitle>
                    <DialogDescription>
                        Preencha os dados básicos para iniciar o prontuário.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <Input
                                {...register('name')}
                                className="pl-10"
                                placeholder="Ex: Maria dos Santos"
                                disabled={loading}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-brand-danger">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    {...register('phone')}
                                    className="pl-10"
                                    placeholder="(11) 99999-9999"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">CPF</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <Input
                                    {...register('cpf')}
                                    className="pl-10"
                                    placeholder="000.000.000-00"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <Input
                                {...register('email')}
                                className="pl-10"
                                placeholder="paciente@email.com"
                                type="email"
                                disabled={loading}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-brand-danger">{errors.email.message}</p>}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Cadastrar Paciente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
