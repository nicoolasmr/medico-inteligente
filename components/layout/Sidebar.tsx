'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Calendar,
    Layers,
    CircleDollarSign,
    Zap,
    LineChart,
    Globe,
    Settings,
    LogOut
} from 'lucide-react'

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Pacientes', href: '/patients' },
    { icon: Calendar, label: 'Agenda', href: '/agenda' },
    { icon: Layers, label: 'Pipeline', href: '/pipeline' },
    { icon: CircleDollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Zap, label: 'Automações', href: '/automacoes' },
    { icon: LineChart, label: 'Insights AI', href: '/insights' },
    { icon: Globe, label: 'Portal Pct', href: '/portal' },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-[var(--sidebar-width)] h-screen border-r border-bg-border bg-bg-surface flex flex-col fixed left-0 top-0 z-50">
            <div className="h-[var(--header-height)] flex items-center px-6 border-b border-bg-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-sm bg-brand-primary flex items-center justify-center shadow-glow-sm">
                        <span className="text-bg-app font-display font-bold text-lg">M</span>
                    </div>
                    <span className="font-display font-semibold text-text-primary tracking-tight">Médico Inteligente</span>
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {MENU_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors duration-200",
                            pathname.startsWith(item.href)
                                ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                        )}
                    >
                        <item.icon size={18} strokeWidth={2} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-3 border-t border-bg-border space-y-1">
                <Link
                    href="/configuracoes"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                        pathname === '/configuracoes' ? "bg-bg-hover text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                    )}
                >
                    <Settings size={18} />
                    Configurações
                </Link>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-brand-danger/80 hover:text-brand-danger hover:bg-brand-danger/5 transition-colors">
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </aside>
    )
}
