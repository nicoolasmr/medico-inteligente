'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

            if (resetError) {
                setError(resetError.message)
                setLoading(false)
                return
            }

            setSuccess('Se o e-mail existir, enviaremos as instruções de redefinição em instantes.')
            setLoading(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Não foi possível iniciar a recuperação de senha.'
            setError(message)
            setLoading(false)
        }
    }

    return (
        <div className="auth-card">
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="space-y-2">
                    <h2 className="text-xl font-display text-text-primary">Recuperar acesso</h2>
                    <p className="text-sm text-text-secondary">
                        Informe seu e-mail profissional para receber as instruções de redefinição de senha.
                    </p>
                </div>

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

                {error && <p className="auth-error">{error}</p>}
                {success && <p className="rounded-sm border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">{success}</p>}

                <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? 'Enviando...' : 'Enviar instruções'}
                </button>

                <div className="auth-links auth-links--center">
                    <Link href="/login" className="auth-link">Voltar para login</Link>
                </div>
            </form>
        </div>
    )
}
