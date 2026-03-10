import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-bg-app flex">
            <Sidebar />
            <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                <Header />
                <main className="flex-1 p-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    )
}
