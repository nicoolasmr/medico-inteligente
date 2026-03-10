export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] animate-fade-in-scale">
                <div className="flex flex-col items-center mb-8 gap-2">
                    <div className="w-12 h-12 rounded-sm bg-brand-primary flex items-center justify-center shadow-glow">
                        <span className="text-bg-app font-display font-bold text-2xl">M</span>
                    </div>
                    <h1 className="text-2xl font-display text-text-primary tracking-tight">Médico Inteligente</h1>
                    <p className="text-text-secondary text-sm">Growth Operating System para Clínicas</p>
                </div>
                {children}
            </div>
        </div>
    )
}
