/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          active: 'rgba(34, 197, 94, 0.15)',
        },
        surface: '#f5f7fa',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 2px 4px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.10)',
        modal: '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        card: '16px',
        badge: '8px',
      },
    },
  },
  plugins: [],
};
