'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
    MessageCircle,
    StickyNote,
    AlertCircle,
    Clock,
    Loader2
} from 'lucide-react'
import { cn, timeAgo } from '../../lib/utils'
import { createPatientNote, getPatientInteractions } from '../../app/(dashboard)/patients/actions'
import type { PatientInteraction } from '../../types'
import { toast } from 'sonner'

type InteractionItem = {
    id: string
    type: string
    content: string
    createdAt: string
    user?: { name: string } | null
}

export function PatientHistory({ patientId }: { patientId: string }) {
    const [interactions, setInteractions] = useState<InteractionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [submittingNote, setSubmittingNote] = useState(false)

    useEffect(() => {
        let mounted = true

        async function loadInteractions() {
            try {
                const data = await getPatientInteractions(patientId)
                if (mounted) setInteractions(data as unknown as InteractionItem[])
            } catch (error) {
                if (mounted) setInteractions([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadInteractions()

        return () => {
            mounted = false
        }
    }, [patientId])

    async function loadInteractions() {
        const data = await getPatientInteractions(patientId)
        setInteractions(data as unknown as InteractionItem[])
    }

    async function handleSubmitNote(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        try {
            setSubmittingNote(true)
            const result = await createPatientNote(patientId, newNote)

            if (!result.success) {
                toast.error(result.error)
                return
            }

            setNewNote('')
            setIsAddingNote(false)
            await loadInteractions()
            toast.success('Nota do paciente registrada com sucesso.')
        } catch (error) {
            toast.error('Não foi possível registrar a nota agora.')
        } finally {
            setSubmittingNote(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Linha do Tempo</h3>
                <button
                    type="button"
                    onClick={() => setIsAddingNote((current) => !current)}
                    className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1"
                >
                    <StickyNote size={14} />
                    {isAddingNote ? 'Cancelar Nota' : 'Adicionar Nota'}
                </button>
            </div>

            {isAddingNote && (
                <form onSubmit={handleSubmitNote} className="card p-4 space-y-3 border-brand-primary/20">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Nova nota interna
                    </label>
                    <textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        className="w-full min-h-28 rounded-sm border border-bg-border bg-bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-brand-primary"
                        placeholder="Registre aqui uma observação importante sobre o paciente..."
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingNote(false)
                                setNewNote('')
                            }}
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary border border-bg-border rounded-sm hover:bg-bg-hover"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submittingNote}
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-bg-app bg-brand-primary rounded-sm hover:bg-brand-accent disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                        >
                            {submittingNote && <Loader2 size={14} className="animate-spin" />}
                            Salvar Nota
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="card p-6 text-sm text-text-muted">Carregando interações do paciente...</div>
            ) : interactions.length === 0 ? (
                <div className="card p-6 text-sm text-text-muted">Nenhuma interação registrada para este paciente ainda.</div>
            ) : (
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-bg-border">
                    {interactions.map((interaction) => (
                    <div key={interaction.id} className="relative flex items-start gap-6 group">
                        <div className={cn(
                            "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-bg-app z-10 transition-transform group-hover:scale-110",
                            interaction.type === 'note' ? "bg-blue-500/20 text-blue-400" :
                                interaction.type === 'whatsapp' ? "bg-brand-primary/20 text-brand-primary" :
                                    "bg-orange-500/20 text-orange-400"
                        )}>
                            {interaction.type === 'note' && <StickyNote size={16} />}
                            {interaction.type === 'whatsapp' && <MessageCircle size={16} />}
                            {interaction.type === 'call' && <AlertCircle size={16} />}
                        </div>

                        <div className="flex-1 pt-0.5 ml-12">
                            <div className="card p-4 hover:border-brand-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-text-primary uppercase tracking-tight">
                                        {interaction.type === 'note' ? 'Anotação Médica' :
                                            interaction.type === 'whatsapp' ? 'Mensagem WhatsApp' : 'Contato Telefônico'}
                                        <span className="text-text-muted font-normal lowercase ml-2">por {interaction.user?.name ?? 'Sistema'}</span>
                                    </p>
                                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                                        <Clock size={10} />
                                        {timeAgo(interaction.createdAt)}
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {interaction.content}
                                </p>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>
    )
}
