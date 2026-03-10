import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'Médico Inteligente — Sistema de Crescimento para Consultórios',
        template: '%s | Médico Inteligente',
    },
    description: 'CRM inteligente, agenda, pipeline de tratamentos, financeiro e automações com IA para consultórios médicos.',
    keywords: ['consultório médico', 'CRM médico', 'agenda médica', 'gestão clínica', 'healthtech'],
    authors: [{ name: 'Médico Inteligente' }],
    robots: { index: false, follow: false }, // Private SaaS — not indexed
    icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className="dark" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    )
}
