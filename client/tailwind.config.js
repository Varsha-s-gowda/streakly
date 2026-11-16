/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFAF4',
          100: '#F8F4EA',
          200: '#F1EBDD',
          300: '#E7DFCE',
          400: '#D8CEB9',
        },
        sage: {
          50: '#F3F6F0',
          100: '#E6EDE1',
          200: '#D1DDCA',
          300: '#B2C6A8',
          400: '#90A984',
          500: '#728D67',
          600: '#5A7353',
          700: '#485D44',
          800: '#394A37',
          900: '#2B382A',
        },
        forest: {
          DEFAULT: '#24382C',
          50: '#EEF3EF',
          100: '#D8E3DA',
          200: '#B0C5B5',
          300: '#86A38C',
          400: '#5C7E65',
          500: '#3D5B47',
          600: '#2F4738',
          700: '#24382C',
          800: '#1B2A21',
          900: '#131E17',
        },
        ink: {
          DEFAULT: '#26312A',
          soft: '#4C5A50',
          muted: '#7A867C',
        },
        sand: '#E6DDCB',
        clay: '#B8775C',
        gold: '#BFA36A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(36, 56, 44, 0.04), 0 12px 32px -18px rgba(36, 56, 44, 0.22)',
        lift: '0 2px 4px rgba(36, 56, 44, 0.04), 0 20px 50px -24px rgba(36, 56, 44, 0.28)',
        inset: 'inset 0 1px 2px rgba(36, 56, 44, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
