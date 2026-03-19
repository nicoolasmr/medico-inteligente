export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="auth-shell">
            <div className="auth-panel">
                <div className="auth-brand">
                    <div className="auth-logo">M</div>
                    <h1 className="auth-title">Médico Inteligente</h1>
                    <p className="auth-subtitle">Growth Operating System para Clínicas</p>
                </div>
                {children}
            </div>
        </div>
    )
}
