'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { registerClinic } from './actions'

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            userName: formData.get('userName') as string,
            clinicName: formData.get('clinicName') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        try {
            await registerClinic(data)
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="card p-8 w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Seu Nome</label>
                    <input
                        name="userName"
                        type="text"
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary"
                        placeholder="Ex: Dr. Fulano"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Nome da Clínica</label>
                    <input
                        name="clinicName"
                        type="text"
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary"
                        placeholder="Ex: Clínica MedVida"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Email Profissional</label>
                    <input
                        name="email"
                        type="email"
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary"
                        placeholder="doutor@clinica.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Senha de Acesso</label>
                    <input
                        name="password"
                        type="password"
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <p className="text-brand-danger text-sm bg-brand-danger/10 p-2 rounded-sm border border-brand-danger/20">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-brand-primary hover:bg-brand-accent text-bg-app font-semibold rounded-sm transition-colors shadow-glow-sm disabled:opacity-50"
                >
                    {loading ? 'Criando clínica...' : 'Criar Conta e Clínica'}
                </button>

                <div className="pt-2 text-center">
                    <Link href="/login" className="text-xs text-text-muted hover:text-brand-primary transition-colors">Já possui conta? Entrar</Link>
                </div>
            </form>
        </div>
    )
}
