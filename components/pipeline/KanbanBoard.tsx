'use client'

import React, { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    type DropAnimation,
} from '@dnd-kit/core'
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TreatmentCard } from './TreatmentCard'
import type { Treatment, TreatmentsByStage } from '../../types'
import { moveTreatment } from '../../app/(dashboard)/pipeline/actions'
import { toast } from 'sonner'

const COLUMNS = [
    { id: 'lead', title: 'N Novos Contatos' },
    { id: 'consulta_realizada', title: 'Consulta Realizada' },
    { id: 'tratamento_indicado', title: 'Tratamento Indicado' },
    { id: 'orcamento_enviado', title: 'Orçamento Enviado' },
    { id: 'aprovado', title: 'Aprovado' },
    { id: 'realizado', title: 'Finalizado' },
]

interface KanbanBoardProps {
    initialData: TreatmentsByStage
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
    const [data, setData] = useState<TreatmentsByStage>(initialData)
    const [activeTreatment, setActiveTreatment] = useState<Treatment | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function findColumn(id: string) {
        if (id in data) return id
        return Object.keys(data).find(key => data[key as keyof TreatmentsByStage].some(t => t.id === (id as any)))
    }

    const handleDragStart = ({ active }: DragStartEvent) => {
        const activeCol = findColumn(active.id as string)
        if (!activeCol) return
        const treatment = data[activeCol as keyof TreatmentsByStage].find(t => t.id === (active.id as any))
        setActiveTreatment(treatment as unknown as Treatment || null)
    }

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        const overId = over?.id
        if (!overId || active.id === (overId as any)) return

        const activeCol = findColumn(active.id as string)
        const overCol = findColumn(overId as string)

        if (!activeCol || !overCol || activeCol === overCol) return

        setData((prev) => {
            const activeItems = prev[activeCol as keyof TreatmentsByStage]
            const overItems = prev[overCol as keyof TreatmentsByStage]

            const activeIndex = activeItems.findIndex((t) => t.id === (active.id as any))
            const overIndex = overItems.findIndex((t) => t.id === (overId as any))

            let newIndex
            if (overCol in prev) {
                newIndex = overItems.length + 1
            } else {
                const isBelowLastItem = over && overIndex === overItems.length - 1
                const modifier = isBelowLastItem ? 1 : 0
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
            }

            const movedItem = activeItems[activeIndex]

            return {
                ...prev,
                [activeCol]: activeItems.filter((t) => t.id !== active.id),
                [overCol]: [
                    ...overItems.slice(0, newIndex),
                    { ...movedItem, stage: overCol },
                    ...overItems.slice(newIndex)
                ]
            }
        })
    }

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        const activeCol = findColumn(active.id as string)
        const overId = over?.id

        if (!activeCol || !overId) {
            setActiveTreatment(null)
            return
        }

        const overCol = findColumn(overId as string)
        if (!overCol) {
            setActiveTreatment(null)
            return
        }

        const activeIndex = data[activeCol as keyof TreatmentsByStage].findIndex(t => t.id === active.id)
        const overIndex = data[overCol as keyof TreatmentsByStage].findIndex(t => t.id === overId)

        if (activeIndex !== overIndex || activeCol !== overCol) {
            // Sync with server
            moveTreatment(active.id as string, overCol, overIndex).then(res => {
                if (!res.success) toast.error('Falha ao sincronizar movimento')
            })
        }

        setActiveTreatment(null)
    }

    return (
        <div className="h-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 overflow-x-auto pb-8 h-full custom-scrollbar">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            treatments={data[col.id as keyof TreatmentsByStage] || []}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTreatment ? <TreatmentCard treatment={activeTreatment} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
