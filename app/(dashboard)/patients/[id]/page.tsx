'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Trash2,
    MoreVertical,
    Edit2,
    FileText,
    Calendar,
    CircleDollarSign,
    Target
} from 'lucide-react'
import { getPatient, deletePatient } from '../actions'
import { PatientProfile } from '../../../../components/patients/PatientProfile'
import { PatientHistory } from '../../../../components/patients/PatientHistory'
import { EditPatientDialog } from '../../../../components/patients/EditPatientDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import type { Patient } from '../../../../types'
import { toast } from 'sonner'

export default function PatientDetailsPage() {
    const { id } = useParams()
    const [patient, setPatient] = useState<Patient | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const router = useRouter()

    const loadPatient = useCallback(async () => {
        if (!id) return
        try {
            const data = await getPatient(id as string)
            if (!data) {
                toast.error('Paciente não encontrado')
                router.push('/patients')
                return
            }
            setPatient(data)
        } catch (err) {
            toast.error('Erro ao carregar prontuário')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        loadPatient()
    }, [loadPatient])

    async function handleDeletePatient() {
        if (!patient) return
        if (!confirm(`Deseja realmente excluir o paciente ${patient.name}?`)) return

        try {
            const res = await deletePatient(patient.id)
            if (res.success) {
                toast.success('Paciente removido')
                router.push('/patients')
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao excluir paciente')
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center text-text-muted">Carregando prontuário...</div>
    if (!patient) return null

    return (
        <div className="space-y-6">
            <EditPatientDialog
                patient={patient}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={loadPatient}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link href="/patients" className="text-text-secondary hover:text-brand-primary flex items-center gap-2 text-sm transition-colors group">
                    <div className="p-1 rounded-sm bg-bg-elevated group-hover:bg-brand-primary/10 transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    Voltar para lista
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDeletePatient}
                        className="p-2 text-text-muted hover:text-brand-danger transition-colors rounded-sm hover:bg-brand-danger/5"
                    >
                        <Trash2 size={18} />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-sm hover:bg-bg-elevated">
                                <MoreVertical size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => setIsEditOpen(true)}>
                                <Edit2 size={14} />
                                Editar Cadastro
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Profile Header */}
            <PatientProfile patient={patient} />

            {/* Tabs Section */}
            <Tabs defaultValue="history" className="w-full">
                <TabsList className="bg-bg-surface border border-bg-border w-full sm:w-auto p-1.5 h-12">
                    <TabsTrigger value="history" className="px-8 font-semibold">Linha do Tempo</TabsTrigger>
                    <TabsTrigger value="treatments" className="px-8 font-semibold">Tratamentos</TabsTrigger>
                    <TabsTrigger value="financial" className="px-8 font-semibold">Financeiro</TabsTrigger>
                    <TabsTrigger value="documents" className="px-8 font-semibold">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <PatientHistory patientId={patient.id} />
                </TabsContent>

                <TabsContent value="treatments">
                    <div className="card p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <p className="text-text-muted mb-4 uppercase text-xs font-bold tracking-widest">Nenhum tratamento em andamento</p>
                        <Link href="/pipeline" className="text-brand-primary font-semibold hover:underline text-sm">+ Iniciar Tratamento no Pipeline</Link>
                    </div>
                </TabsContent>

                <TabsContent value="financial">
                    <div className="card p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <p className="text-text-muted mb-4 uppercase text-xs font-bold tracking-widest">Sem lançamentos financeiros</p>
                        <Link href="/financeiro" className="text-brand-primary font-semibold hover:underline text-sm">+ Registrar Cobrança</Link>
                    </div>
                </TabsContent>

                <TabsContent value="documents">
                    <div className="card p-12 flex flex-col items-center justify-center text-center border-dashed">
                        <p className="text-text-muted mb-4 uppercase text-xs font-bold tracking-widest">Nenhum documento anexado</p>
                        <button className="text-brand-primary font-semibold hover:underline text-sm">+ Anexar Exame ou Recibo</button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
