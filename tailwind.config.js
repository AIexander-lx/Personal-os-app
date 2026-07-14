/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#00d4ff',
          soft: '#22d3ee',
          dim: '#0891b2',
        },
        surface: {
          DEFAULT: '#0f172a', // slate-950-ish
          raised: '#1e293b', // slate-800
          border: '#0f3460', // dark blue
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(0, 212, 255, 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(0,212,255,0.35)' },
          '100%': { boxShadow: '0 0 0 12px rgba(0,212,255,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
