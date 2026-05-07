/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18202f',
        muted: '#647084',
        line: '#d9dee8',
        canvas: '#f7f8fb',
        panel: '#ffffff',
        accent: '#0f766e',
        navy: '#23304a'
      },
      boxShadow: {
        soft: '0 14px 36px rgba(24, 32, 47, 0.08)'
      }
    },
  },
  plugins: [],
};
