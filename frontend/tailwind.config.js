/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./customer.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        lex: {
          950: '#F3F7F4',
          900: '#F7FAF8',
          850: '#FFFFFF',
          800: '#EEF5F0',
          700: '#D7E5DC',
          600: '#B7CBBE',
          500: '#8FAF99',
          gold: '#0F5C3A',
          'gold-light': '#17824F',
          'gold-dark': '#0A3F28',
          'gold-pale': '#E8F5EE',
          ink: '#122018',
          muted: '#4F6558',
          faint: '#7A9084',
          success: '#0E9F6E',
          warning: '#B7791F',
          error: '#D92D20',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 92, 58, 0.04), 0 8px 20px rgba(18, 32, 24, 0.05)',
        'gold-glow': '0 0 0 1px rgba(15, 92, 58, 0.14), 0 8px 18px rgba(15, 92, 58, 0.14)',
        panel: '0 1px 2px rgba(18, 32, 24, 0.04), 0 16px 40px rgba(18, 32, 24, 0.08)',
        soft: '0 2px 10px rgba(18, 32, 24, 0.04)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #17824F 0%, #0F5C3A 55%, #0A3F28 100%)',
        'navy-gradient': 'linear-gradient(155deg, #17824F 0%, #0A3F28 48%, #062417 100%)',
        'surface-sheen': 'radial-gradient(120% 80% at 0% 0%, rgba(15,92,58,0.06), transparent 55%), radial-gradient(90% 70% at 100% 0%, rgba(18,32,24,0.03), transparent 50%)',
      },
    },
  },
  plugins: [],
}
