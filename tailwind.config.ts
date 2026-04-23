import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0c0e1a',
          50: '#1a1d33',
          100: '#141729',
          200: '#1e2240',
        },
        spirit: {
          DEFAULT: '#c084fc',
          light: '#e9d5ff',
          dark: '#7c3aed',
        },
        ember: {
          DEFAULT: '#fb923c',
          light: '#fed7aa',
          dark: '#ea580c',
        },
        moss: {
          DEFAULT: '#4ade80',
          light: '#bbf7d0',
          dark: '#16a34a',
        },
      },
      animation: {
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'orb-float-2': 'orbFloat 11s ease-in-out infinite reverse',
        'orb-float-3': 'orbFloat 14s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-40px) scale(1.08)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        typing: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
