import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useParams: () => ({}),
    usePathname: () => '',
}))

// Mock de server actions (para não bater no banco durante testes unitários)
vi.mock('@/lib/prisma', () => ({
    prisma: {
        patient: { findMany: vi.fn() },
        appointment: { findMany: vi.fn() },
        clinic: { findFirst: vi.fn() },
    },
}))
