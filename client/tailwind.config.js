/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        neon: {
          pink: '#ff3366',
          cyan: '#33ffcc',
          yellow: '#ffcc00',
          purple: '#cc33ff',
          blue: '#33ccff',
        },
      },
      boxShadow: {
        neon: '0 0 20px currentColor, 0 0 40px currentColor',
        'neon-sm': '0 0 10px currentColor',
      },
    },
  },
  plugins: [],
};
