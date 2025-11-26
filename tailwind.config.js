/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Habilita dark mode via classe
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'espirito': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'caos': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      keyframes: {
        'slide-in': {
          from: {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-up': {
          from: {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        'fadeIn': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
