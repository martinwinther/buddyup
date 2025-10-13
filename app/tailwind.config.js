/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          lighter: 'rgba(255, 255, 255, 0.05)',
          dark: 'rgba(0, 0, 0, 0.3)',
          border: 'rgba(255, 255, 255, 0.2)',
        },
        accent: {
          teal: '#5eead4',
          'teal-dark': '#2dd4bf',
        },
      },
      backgroundColor: {
        'app-dark': '#0a0a0a',
        'app-card': 'rgba(24, 24, 27, 0.6)',
      },
      fontFamily: {
        system: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'glass': '20px',
        'glass-lg': '24px',
      },
    },
  },
  plugins: [],
};

