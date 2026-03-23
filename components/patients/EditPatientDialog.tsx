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
import { updatePatientSchema, type UpdatePatientInput } from '../../lib/validations/patient'
import { updatePatient } from '../../app/(dashboard)/patients/actions'
import { toast } from 'sonner'
import { User, Phone, Mail, FileText } from 'lucide-react'
import type { Patient } from '../../types'

interface EditPatientDialogProps {
    patient: Patient | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditPatientDialog({ patient, open, onOpenChange, onSuccess }: EditPatientDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<UpdatePatientInput>({
        resolver: zodResolver(updatePatientSchema),
        defaultValues: {
            name: patient?.name || '',
            email: patient?.email || '',
            phone: patient?.phone || '',
            cpf: patient?.cpf || '',
        }
    })

    // Reset when patient changes
    React.useEffect(() => {
        if (patient) {
            reset({
                name: patient.name,
                email: patient.email || '',
                phone: patient.phone || '',
                cpf: patient.cpf || '',
            })
        }
    }, [patient, reset])

    async function onSubmit(data: UpdatePatientInput) {
        if (!patient) return

        setLoading(true)
        try {
            const res = await updatePatient(patient.id, data)
            if (res.success) {
                toast.success('Paciente atualizado com sucesso!')
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao processar atualização')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Paciente</DialogTitle>
                    <DialogDescription>
                        Atualize as informações cadastrais do paciente.
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
                            {loading ? 'Salvando...' : 'Atualizar Cadastro'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
