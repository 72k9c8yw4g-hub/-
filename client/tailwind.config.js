/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body:    ['Hanken Grotesk', 'Zen Kaku Gothic New', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        ja:      ['Zen Kaku Gothic New', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
