import { render, screen } from '@testing-library/react'
import { Button } from '../components/ui/button'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('Button Component', () => {
    it('should render the button with children text', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should apply the brand-primary background by default', () => {
        render(<Button>Primary</Button>)
        const button = screen.getByRole('button')
        // O shadcn usa bg-brand-primary configurado no tailwind.config
        expect(button).toHaveClass('bg-brand-primary')
    })
})
