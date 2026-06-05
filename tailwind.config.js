/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#fdf8f0',
          100: '#faefd8',
          200: '#f5ddb0',
          300: '#ecc57e',
          400: '#e0a84a',
          500: '#c8882a',
          600: '#a8691f',
          700: '#87511b',
          800: '#6e421c',
          900: '#59361b',
        },
        leaf: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
        'fade-in': 'fadeIn 1s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      backgroundImage: {
        'gradient-farm': 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
        'gradient-hero': 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,20,0,0.6))',
        'gradient-nature': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      },
      boxShadow: {
        'green': '0 4px 24px rgba(22, 163, 74, 0.3)',
        'earth': '0 4px 24px rgba(168, 105, 31, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
