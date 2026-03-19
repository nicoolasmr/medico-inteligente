import Link from 'next/link'

export default function PortalAccessDeniedPage() {
    return (
        <div className="min-h-screen bg-bg-app text-text-primary flex items-center justify-center px-6">
            <div className="max-w-md w-full card p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-danger/10 text-brand-danger flex items-center justify-center text-xl font-bold">
                    !
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-display tracking-tight">Acesso ao portal indisponível</h1>
                    <p className="text-sm text-text-secondary">
                        Seu link do portal é inválido, expirou ou a sessão do paciente não está mais ativa.
                    </p>
                </div>
                <p className="text-xs text-text-muted">
                    Solicite um novo link seguro de acesso diretamente à clínica para continuar.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-sm bg-brand-primary text-bg-app text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
                >
                    Voltar ao início
                </Link>
            </div>
        </div>
    )
}
