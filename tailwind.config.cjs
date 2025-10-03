/**** @type {import('tailwindcss').Config} ****/
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,jsx,js}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff',
          100: '#e6efff',
          200: '#c2d9ff',
          300: '#99c0ff',
          400: '#66a2ff',
          500: '#337dff',
          600: '#1a5be6',
          700: '#1345b4',
          800: '#0d2f80',
          900: '#091f52'
        }
      }
    }
  },
  plugins: []
};
