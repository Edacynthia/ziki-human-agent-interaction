/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ziki: {
          dark: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          accent: '#6366F1'
        }
      }
    },
  },
  plugins: [],
}

