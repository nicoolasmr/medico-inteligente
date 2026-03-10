'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="card p-8 w-full">
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary transition-colors"
                        placeholder="seu@email.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-sm bg-bg-elevated border border-bg-border focus:border-brand-primary outline-none text-text-primary transition-colors"
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
                    className="w-full py-2 bg-brand-primary hover:bg-brand-accent text-bg-app font-semibold rounded-sm transition-colors shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                </button>

                <div className="flex justify-between items-center pt-2">
                    <Link href="/forgot-password" className="text-xs text-text-muted hover:text-brand-primary transition-colors">Esqueceu a senha?</Link>
                    <Link href="/register" className="text-xs text-brand-primary hover:underline">Criar nova clínica</Link>
                </div>
            </form>
        </div>
    )
}
