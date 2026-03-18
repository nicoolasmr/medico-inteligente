'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

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
        <div className="auth-card">
            <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input"
                        placeholder="seu@email.com"
                        required
                    />
                </div>
                <div className="auth-field">
                    <label className="auth-label">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                </button>

                <div className="auth-links">
                    <Link href="/forgot-password" className="auth-link">Esqueceu a senha?</Link>
                    <Link href="/register" className="auth-link auth-link--primary">Criar nova clínica</Link>
                </div>
            </form>
        </div>
    )
}
