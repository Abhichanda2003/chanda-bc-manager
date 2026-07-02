/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        mist: '#f5f7f8',
        leaf: '#28715f',
        clay: '#b8563d',
        gold: '#c28a28',
      },
      boxShadow: {
        soft: '0 16px 48px rgba(23, 32, 38, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
