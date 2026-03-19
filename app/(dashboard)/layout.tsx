import { Sidebar } from '../../components/layout/Sidebar'
import { Header } from '../../components/layout/Header'
import { getCurrentUser } from '../../lib/auth'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    return (
        <div className="min-h-screen bg-bg-app flex">
            <Sidebar />
            <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
                <Header userName={user.name} specialty={user.specialty ?? 'Especialidade não informada'} />
                <main className="flex-1 p-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    )
}
