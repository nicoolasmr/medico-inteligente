'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerClinic } from './actions'
import { createClient } from '../../../lib/supabase/client'

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

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

        const result = await registerClinic(data)

        if (!result.success) {
            setError(result.error)
            setLoading(false)
            return
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (signInError) {
                router.push(result.redirectTo)
                router.refresh()
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            router.push(result.redirectTo)
            router.refresh()
        }

        router.push(result.redirectTo)
        router.refresh()
    }

    return (
        <div className="auth-card">
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                    <label className="auth-label">Seu Nome</label>
                    <input name="userName" type="text" className="auth-input" placeholder="Ex: Dr. Fulano" required />
                </div>
                <div className="auth-field">
                    <label className="auth-label">Nome da Clínica</label>
                    <input name="clinicName" type="text" className="auth-input" placeholder="Ex: Clínica MedVida" required />
                </div>
                <div className="auth-field">
                    <label className="auth-label">Email Profissional</label>
                    <input name="email" type="email" className="auth-input" placeholder="doutor@clinica.com" required />
                </div>
                <div className="auth-field">
                    <label className="auth-label">Senha de Acesso</label>
                    <input name="password" type="password" className="auth-input" placeholder="••••••••" required />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? 'Criando clínica...' : 'Criar Conta e Clínica'}
                </button>

                <p className="text-center text-xs text-text-muted">
                    O acesso é liberado imediatamente após o cadastro. Não é necessário esperar e-mail de confirmação.
                </p>

                <div className="auth-links auth-links--center">
                    <Link href="/login" className="auth-link">Já possui conta? Entrar</Link>
                </div>
            </form>
        </div>
    )
}
