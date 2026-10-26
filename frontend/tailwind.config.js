/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        manager: 'rgb(var(--manager) / <alpha-value>)',
        operations: 'rgb(var(--operations) / <alpha-value>)',
        finance: 'rgb(var(--finance) / <alpha-value>)',
        customer: 'rgb(var(--customer) / <alpha-value>)',
        marketing: 'rgb(var(--marketing) / <alpha-value>)',
      },
      boxShadow: {
        panel: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 12px rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
}

