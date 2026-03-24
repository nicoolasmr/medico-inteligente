'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    User,
    CircleDollarSign,
    Clock,
    MoreHorizontal,
    GripVertical
} from 'lucide-react'
import type { Treatment } from '../../types'
import { cn, formatCurrency, timeAgo } from '../../lib/utils'

interface TreatmentCardProps {
    treatment: {
        id: string
        patientName?: string // added support for either
        name: string
        value: number | null
        probability: number
        patientId: string
        updatedAt?: string // added for UI
        patient?: { name: string }
    }
}

export function TreatmentCard({ treatment }: TreatmentCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: treatment.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "card p-4 hover:border-brand-primary/40 transition-colors group cursor-default shadow-card mb-3 relative",
                isDragging && "scale-105 z-50 shadow-glow border-brand-primary/60"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <Link href={`/patients/${treatment.patientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-text-muted">
                        {((treatment as any).patient?.name || 'P').charAt(0)}
                    </div>
                    <p className="text-xs font-semibold text-text-primary truncate max-w-[150px]">
                        {(treatment as any).patient?.name || 'Sem nome'}
                    </p>
                </Link>
                <button {...attributes} {...listeners} className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} />
                </button>
            </div>

            <h4 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
                {treatment.name}
            </h4>

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-brand-primary font-display font-semibold text-sm">
                    <CircleDollarSign size={14} />
                    {formatCurrency(Number(treatment.value) || 0)}
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock size={10} />
                    {treatment.updatedAt ? timeAgo(treatment.updatedAt) : 'Sem data'}
                </div>
            </div>

            {treatment.probability && (
                <div className="mt-3 h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            treatment.probability > 70 ? "bg-brand-success" :
                                treatment.probability > 40 ? "bg-brand-warning" : "bg-brand-danger"
                        )}
                        style={{ width: `${treatment.probability}%` }}
                    />
                </div>
            )}
        </div>
    )
}
