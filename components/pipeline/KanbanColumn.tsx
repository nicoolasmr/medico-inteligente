'use client'

import { useDroppable } from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { TreatmentCard } from './TreatmentCard'
import type { Treatment } from '../../types'
import { cn } from '../../lib/utils'
import { Plus, MoreHorizontal } from 'lucide-react'

interface KanbanColumnProps {
    id: string
    title: string
    treatments: {
        id: string
        patientName: string
        name: string
        value: number | null
        probability: number
        patientId: string
    }[]
}

export function KanbanColumn({ id, title, treatments }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div className="flex flex-col w-[300px] shrink-0 h-full bg-bg-app/40 rounded-sm border border-bg-border/50">
            <div className="p-4 flex items-center justify-between sticky top-0 bg-bg-app/40 backdrop-blur-md z-10 rounded-t-sm border-b border-bg-border/30">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">{title}</h3>
                    <span className="text-[10px] bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded-sm border border-bg-border font-mono">
                        {treatments.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1 text-text-muted hover:text-brand-primary transition-colors">
                        <Plus size={14} />
                    </button>
                    <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 p-3 overflow-y-auto min-h-[500px]"
            >
                <SortableContext
                    items={treatments.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {treatments.map((treatment) => (
                        <TreatmentCard key={treatment.id} treatment={treatment} />
                    ))}

                    {treatments.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-bg-border rounded-sm flex items-center justify-center text-text-muted text-[10px] uppercase font-bold tracking-widest opacity-30">
                            Solte aqui
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    )
}
