import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#00D4AA',
                    secondary: '#00A882',
                    accent: '#00F5C4',
                    danger: '#FF4757',
                    warning: '#FFA502',
                    success: '#2ED573',
                },
                bg: {
                    app: '#0A0D14',
                    surface: '#0F1117',
                    elevated: '#161B27',
                    hover: '#1C2333',
                    border: '#1E2537',
                },
                text: {
                    primary: '#F1F5F9',
                    secondary: '#94A3B8',
                    muted: '#475569',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                sm: '2px',
                DEFAULT: '4px',
                md: '4px',
                lg: '8px',
                xl: '12px',
            },
            spacing: {
                sidebar: '240px',
                header: '56px',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-scale': {
                    from: { opacity: '0', transform: 'scale(0.96)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,212,170,0)' },
                    '50%': { boxShadow: '0 0 20px 4px rgba(0,212,170,0.2)' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(100%)' },
                    to: { transform: 'translateX(0)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease-out',
                'fade-in-scale': 'fade-in-scale 0.2s ease-out',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                shimmer: 'shimmer 1.5s infinite',
            },
            boxShadow: {
                card: '0 1px 3px 0 rgba(0,0,0,0.4)',
                glow: '0 0 20px rgba(0,212,170,0.15)',
                'glow-sm': '0 0 10px rgba(0,212,170,0.1)',
            },
        },
    },
    plugins: [],
}

export default config
