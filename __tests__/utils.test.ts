import { describe, it, expect } from 'vitest'
import { formatCurrency, cn } from '../lib/utils'

describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format numbers to BRL currency string', () => {
            expect(formatCurrency(1500)).toContain('1.500,00')
            expect(formatCurrency(0)).toContain('0,00')
            expect(formatCurrency(10.5)).toContain('10,50')
        })
    })

    describe('cn (Tailwind Merge)', () => {
        it('should merge classes correctly', () => {
            expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
            expect(cn('px-2', 'px-4')).toBe('px-4') // Overwrite px-2
        })

        it('should handle conditional classes', () => {
            expect(cn('px-2', false && 'py-2', true && 'm-2')).toBe('px-2 m-2')
        })
    })
})
