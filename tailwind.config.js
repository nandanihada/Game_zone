/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#3b82f6', // blue-400
          500: '#6366f1', // indigo-500
        },
      },
    },
  },
  plugins: [],
}