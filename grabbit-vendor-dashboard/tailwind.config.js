/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        grabbit: {
          orange: '#FF6B2C',
          dark: '#1A1A2E',
          card: '#16213E',
          accent: '#0F3460',
          light: '#E94560',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s infinite',
        'fade-in': 'fade-in 0.3s ease forwards',
        'slide-in': 'slide-in 0.35s ease forwards',
      },
    },
  },
  plugins: [],
};
