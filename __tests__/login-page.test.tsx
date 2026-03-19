import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const refreshMock = vi.fn()
const signInWithPasswordMock = vi.fn()
const searchParamsState = new URLSearchParams()

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => searchParamsState,
}))

vi.mock('../lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: signInWithPasswordMock,
        },
    }),
}))

import LoginPage from '../app/(auth)/login/page'

describe('LoginPage', () => {
    beforeEach(() => {
        pushMock.mockReset()
        refreshMock.mockReset()
        signInWithPasswordMock.mockReset()
        searchParamsState.forEach((_, key) => searchParamsState.delete(key))
    })

    it('shows the registration success notice from the query string', async () => {
        searchParamsState.set('registered', 'true')

        render(<LoginPage />)

        expect(await screen.findByText('Conta criada com sucesso. Faça login para acessar a plataforma.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Esqueceu a senha?' })).toHaveAttribute('href', '/forgot-password')
    })

    it('shows the profile recovery notice from the query string', async () => {
        searchParamsState.set('error', 'profile_not_found')

        render(<LoginPage />)

        expect(
            await screen.findByText('Seu acesso foi autenticado, mas o perfil interno da clínica precisou ser reprocessado. Tente entrar novamente.')
        ).toBeInTheDocument()
    })
})
