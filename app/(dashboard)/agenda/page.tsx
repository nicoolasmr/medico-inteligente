import { WeekCalendar } from '@/components/agenda/WeekCalendar'

export default function AgendaPage() {
    return (
        <div className="h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-display text-text-primary tracking-tight">Agenda</h1>
                <p className="text-text-secondary text-sm">Visualize e gerencie os horários dos seus pacientes.</p>
            </div>

            <WeekCalendar />
        </div>
    )
}
