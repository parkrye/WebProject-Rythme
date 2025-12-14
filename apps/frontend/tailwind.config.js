/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4AF37',
          dark: '#B8960C',
        },
        secondary: '#722F37',
        background: '#1A1A2E',
        surface: '#2D2D44',
        accent: '#B76E79',
        ivory: '#FFFEF2',
        silver: '#C0C0C0',
        success: '#50C878',
        error: '#FF6B6B',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Noto Sans KR', 'sans-serif'],
        mono: ['Montserrat', 'monospace'],
      },
    },
  },
  plugins: [],
};
