/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/renderer/**/*.{js,jsx,ts,tsx}',
        './src/renderer/index.html'
    ],
    theme: {
        extend: {
            colors: {
                // Semantic System
                bg: {
                    main: 'var(--bg-main)',
                    card: 'var(--bg-card)',
                    panel: 'var(--bg-panel)'
                },
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-muted)',
                    primary: 'var(--primary)'
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    dim: 'var(--primary-dim)',
                    glow: 'var(--primary-glow)'
                },
                accent: {
                    DEFAULT: 'var(--accent)'
                },
                border: 'var(--border-color)'
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace']
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'morph': 'morph 8s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite'
            },
            backdropBlur: {
                xs: '2px',
                DEFAULT: '20px'
            },
            boxShadow: {
                'glow': '0 0 20px var(--primary-glow)',
                'glow-lg': '0 0 40px var(--primary-glow)'
            }
        }
    },
    plugins: []
}
