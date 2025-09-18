/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'iaca-blue': 'rgb(var(--iaca-blue) / <alpha-value>)',
        'iaca-light-blue': 'rgb(var(--iaca-light-blue) / <alpha-value>)',
      },
      backdropBlur: {
        'xl': '24px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}