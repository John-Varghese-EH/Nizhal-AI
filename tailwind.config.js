/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/renderer/**/*.{js,jsx,ts,tsx}',
        './src/renderer/index.html'
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',
                    dark: '#4f46e5',
                    light: '#818cf8'
                },
                accent: {
                    DEFAULT: '#ec4899',
                    dark: '#db2777',
                    light: '#f472b6'
                }
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
                xs: '2px'
            },
            boxShadow: {
                'glow': '0 0 20px rgba(99, 102, 241, 0.4)',
                'glow-lg': '0 0 40px rgba(99, 102, 241, 0.6)'
            }
        }
    },
    plugins: []
}
