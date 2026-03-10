import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Format currency as BRL */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

/** Format date to Brazilian locale */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "dd/MM/yyyy", { locale: ptBR })
}

/** Format datetime to Brazilian locale */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Format time only */
export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "HH:mm")
}

/** Relative time (e.g. "há 2 dias") */
export function timeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
}

/** Generate a URL-safe slug */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** Format phone number to E.164 */
export function toE164(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('55')) return `+${digits}`
    return `+55${digits}`
}

/** Calculate trend percentage between two values */
export function calcTrend(current: number, previous: number): number {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
}

/** Get initials from full name */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0]!.toUpperCase())
        .join('')
}
