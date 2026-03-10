import { Bell, Search, User } from 'lucide-react'

type HeaderProps = {
    userName: string
    specialty: string
}

export function Header({ userName, specialty }: HeaderProps) {
    return (
        <header className="h-[var(--header-height)] border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-sm w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar pacientes, agendamentos..."
                        className="w-full bg-bg-elevated border border-bg-border rounded-sm py-1.5 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-sm transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand-danger rounded-full border-2 border-bg-surface" />
                </button>

                <div className="h-8 w-px bg-bg-border mx-2" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-text-primary leading-none">{userName}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">{specialty}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center overflow-hidden">
                        <User size={16} className="text-text-secondary" />
                    </div>
                </div>
            </div>
        </header>
    )
}
