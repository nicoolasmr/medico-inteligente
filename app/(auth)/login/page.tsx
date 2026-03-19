'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const notice = useMemo(() => {
        if (searchParams.get('registered') === 'true') {
            return 'Conta criada com sucesso. Faça login para acessar a plataforma.'
        }

        if (searchParams.get('error') === 'profile_not_found') {
            return 'Seu acesso foi autenticado, mas o perfil interno da clínica precisou ser reprocessado. Tente entrar novamente.'
        }

        return null
    }, [searchParams])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Não foi possível autenticar agora.'
            setError(message)
            setLoading(false)
        }
    }

    return (
        <div className="auth-card">
            <form onSubmit={handleLogin} className="auth-form">
                {notice && <p className="rounded-sm border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">{notice}</p>}

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

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="auth-card"><div className="auth-form text-sm text-text-secondary">Carregando login...</div></div>}>
            <LoginForm />
        </Suspense>
    )
}
