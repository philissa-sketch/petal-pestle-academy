/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens. Mission Control is a dark cockpit; this is the
        // opposite on purpose — a bright greenhouse. Same token STRUCTURE
        // (surface / accent / ink) so the code reads the same way.
        cream: {
          50: '#FFFCF8', // page background
          100: '#FDF6EF', // panel background
          200: '#F6EADF', // raised surface
          300: '#EBDACB' // hairline / divider
        },
        blush: {
          300: '#F7C6D0',
          500: '#E88AA0', // primary accent
          700: '#C25E77'
        },
        lavender: {
          300: '#D6CCEE',
          500: '#A78BD9', // secondary accent
          700: '#7C5FB0'
        },
        sage: {
          300: '#C3D8C0',
          500: '#7FA87A', // growth / correct
          700: '#4F7A4B'
        },
        gold: {
          300: '#F3DCA4',
          500: '#D9A82F', // rank / reward
          700: '#A87C15'
        },
        clay: {
          500: '#C97B5A' // gentle "not yet" — never red
        },
        ink: {
          900: '#3A3038', // primary text
          700: '#5C4F58', // secondary text
          500: '#8B7D86' // muted / captions
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Quicksand"', '"Segoe UI"', 'sans-serif']
      },
      boxShadow: {
        petal: '0 1px 0 0 rgba(235,218,203,0.9), 0 10px 24px -14px rgba(58,48,56,0.35)',
        lift: '0 14px 30px -16px rgba(124,95,176,0.45)'
      },
      borderRadius: {
        petal: '1.25rem'
      }
    }
  },
  plugins: []
};
