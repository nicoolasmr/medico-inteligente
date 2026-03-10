'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Search, Filter, Download, Users as UsersIcon } from 'lucide-react'
import { PatientTable } from '@/components/patients/PatientTable'
import { AddPatientDialog } from '@/components/patients/AddPatientDialog'
import { EditPatientDialog } from '@/components/patients/EditPatientDialog'
import { PatientTableSkeleton } from '@/components/patients/PatientTableSkeleton'
import { getPatients, deletePatient } from './actions'
import type { Patient } from '@/types'
import { toast } from 'sonner'

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

    const loadPatients = useCallback(async () => {
        try {
            const data = await getPatients()
            setPatients(data)
        } catch (err) {
            toast.error('Erro ao carregar pacientes')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPatients()
    }, [loadPatients])

    async function handleDelete(id: string) {
        try {
            const res = await deletePatient(id)
            if (res.success) {
                toast.success('Paciente removido')
                loadPatients()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Erro ao excluir paciente')
        }
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search) ||
        p.cpf?.includes(search)
    )

    return (
        <div className="space-y-8">
            <AddPatientDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={loadPatients}
            />
            <EditPatientDialog
                patient={editingPatient}
                open={!!editingPatient}
                onOpenChange={(open) => !open && setEditingPatient(null)}
                onSuccess={loadPatients}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display text-text-primary tracking-tight">Pacientes</h1>
                    <p className="text-text-secondary text-sm">Gerenciamento de prontuários e contatos.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-bg-border text-text-primary text-sm rounded-sm hover:bg-bg-hover transition-colors shadow-card">
                        <Download size={16} />
                        Exportar Base
                    </button>
                    <button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-bg-app font-semibold rounded-sm hover:bg-brand-accent transition-all shadow-glow-sm"
                    >
                        <UserPlus size={18} />
                        Novo Paciente
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou CPF..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-bg-surface border border-bg-border rounded-sm py-2 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-primary transition-all shadow-card"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bg-border text-text-secondary text-sm rounded-sm hover:text-text-primary transition-colors shadow-card">
                        <Filter size={16} />
                        Filtros
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-bg-border text-text-secondary text-sm rounded-sm hover:text-text-primary transition-colors shadow-card">
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Table Section */}
            {loading ? (
                <PatientTableSkeleton />
            ) : filteredPatients.length > 0 ? (
                <div className="lg:col-span-3 animate-in fade-in duration-500">
                    <PatientTable
                        patients={filteredPatients}
                        onDelete={handleDelete}
                        onEdit={setEditingPatient}
                    />
                </div>
            ) : (
                <div className="h-64 card border-dashed flex flex-col items-center justify-center text-center p-8">
                    <UsersIcon size={48} className="text-text-muted mb-4 opacity-20" />
                    <h3 className="text-text-primary font-bold mb-1">Nenhum paciente encontrado</h3>
                    <p className="text-text-secondary text-sm max-w-xs">
                        Tente ajustar sua busca ou adicione um novo paciente à base da clínica.
                    </p>
                    <button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="mt-6 text-brand-primary text-sm font-bold uppercase tracking-widest hover:underline"
                    >
                        + Cadastrar agora
                    </button>
                </div>
            )}
        </div>
    )
}
