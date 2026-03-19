import '../globals.css'
import { LogOut, UserCircle } from 'lucide-react'
import { Toaster } from 'sonner'
import { getAuthenticatedPortalPatient } from '../../lib/auth'

type PortalLayoutProps = {
    children: React.ReactNode
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
    const { patient } = await getAuthenticatedPortalPatient()

    return (
        <div className="font-sans bg-bg-app min-h-screen text-text-primary">
            <header className="h-[var(--header-height)] border-b border-bg-border bg-bg-surface sticky top-0 z-50">
                <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-sm bg-brand-primary flex items-center justify-center">
                            <span className="text-bg-app font-display font-bold text-lg">M</span>
                        </div>
                        <span className="font-display font-semibold text-text-primary tracking-tight hidden sm:block">Portal do Paciente</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-bg-border">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-text-primary leading-none">{patient.name}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{patient.email ?? 'Acesso autenticado'}</p>
                            </div>
                            <UserCircle size={24} className="text-brand-primary" />
                        </div>
                        <button className="p-2 text-text-muted hover:text-brand-danger transition-colors" title="Sair do Portal" type="button">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {children}
            </main>

            <Toaster position="top-center" richColors />
        </div>
    )
}
