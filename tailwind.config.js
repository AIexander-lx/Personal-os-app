/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Tokens semánticos: los valores viven en variables CSS (globals.css)
      // y cambian según el tema claro/oscuro.
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: '#22d3ee',
          dim: '#0891b2',
        },
        surface: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          raised: 'rgb(var(--bg-raised) / <alpha-value>)',
          border: 'rgb(var(--line) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          soft: 'rgb(var(--fg-soft) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          2: 'rgb(var(--muted-2) / <alpha-value>)',
        },
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        control: 'rgb(var(--control) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
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
