/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd4ff',
          300: '#8eb8ff',
          400: '#5991ff',
          500: '#3366ff',
          600: '#1e3a5f',
          700: '#1a3352',
          800: '#152a44',
          900: '#0f1f33',
        },
        accent: {
          50: '#fef9e7',
          100: '#fdf0c3',
          200: '#fce48a',
          300: '#f9d146',
          400: '#f5c518',
          500: '#d4a80c',
          600: '#a38208',
          700: '#7a610a',
          800: '#664e10',
          900: '#574013',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
