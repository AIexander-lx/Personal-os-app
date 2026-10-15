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
          // soft/dim quedan fijos en el tono "Fintech Dark Pro" (menta eléctrico)
          // para usos puntuales que no deben invertirse con el tema.
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: '#10e5a8',
          dim: '#0a8f68',
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
        // Mono para cifras (XP, %, montos, timers): look "data/fintech".
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        // Ring fino + sombra corta en vez de blur difuso: resalta sin "neón".
        glow: '0 0 0 1px rgb(var(--accent) / 0.45), 0 6px 16px -6px rgb(var(--accent) / 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.35)' },
          '100%': { boxShadow: '0 0 0 12px rgb(var(--accent) / 0)' },
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
