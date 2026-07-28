/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Workshop ledger — cool mint paper + forest ink + copper stamp
        void: '#1e1b2e',
        ink: '#111827',
        chalk: '#f9fafb',
        paper: '#FFFFFF',
        line: '#e5e7eb',
        mute: '#4b5563',
        teal: '#7c3aed',
        'teal-bright': '#a78bfa',
        'teal-soft': '#ede9fe',
        spark: '#f59e0b',
        'spark-soft': '#fef3c7',
        foam: '#f9fafb',
        lagoon: '#7c3aed',
        coral: '#f59e0b',
        mist: '#e5e7eb',
      },
      fontFamily: {
        // Match the reference mockup — native system sans, no web fonts
        display: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(17, 24, 39,0.06), 0 12px 28px rgba(30, 27, 46,0.08)',
        lift: '0 18px 40px rgba(30, 27, 46,0.16)',
        ticket: '0 2px 0 #111827, 0 14px 32px rgba(30, 27, 46,0.12)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        stamp: {
          from: { opacity: '0', transform: 'scale(1.15) rotate(-6deg)' },
          to: { opacity: '1', transform: 'scale(1) rotate(-3deg)' },
        },
        'course-in': {
          from: { opacity: '0', transform: 'translateY(18px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'hero-settle': {
          from: { opacity: '0', transform: 'scale(1.04)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        rise: 'rise 0.55s cubic-bezier(0.22,1,0.36,1) both',
        stamp: 'stamp 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'course-in': 'course-in 0.55s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'hero-settle': 'hero-settle 0.7s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
