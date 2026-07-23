/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Workshop ledger — cool mint paper + forest ink + copper stamp
        void: '#06141F',
        ink: '#102A28',
        chalk: '#EEF3F1',
        paper: '#FFFFFF',
        line: '#D5E0DC',
        mute: '#5A736C',
        teal: '#0D7A6F',
        'teal-bright': '#2BB5A5',
        'teal-soft': '#D5F2ED',
        spark: '#D9773A',
        'spark-soft': '#F8E6D8',
        foam: '#EEF3F1',
        lagoon: '#0D7A6F',
        coral: '#D9773A',
        mist: '#D5E0DC',
      },
      fontFamily: {
        display: ['"Syne"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(16,42,40,0.06), 0 12px 28px rgba(6,20,31,0.08)',
        lift: '0 18px 40px rgba(6,20,31,0.16)',
        ticket: '0 2px 0 #102A28, 0 14px 32px rgba(6,20,31,0.12)',
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
