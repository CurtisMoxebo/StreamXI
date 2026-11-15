/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        accent: {
          cyan: '#06b6d4',
          red: '#ef4444',
          amber: '#f59e0b',
        },
        surface: {
          900: '#0b0f19',
          850: '#0f172a',
          800: '#131e36',
          750: '#182544',
          700: '#1e293b',
          600: '#334155',
        },
      },
    },
  },
  plugins: [],
};
