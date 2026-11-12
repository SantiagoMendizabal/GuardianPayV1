/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yape: {
          50: '#fbf5fd',
          100: '#f5ebfb',
          200: '#edd6f6',
          300: '#dfb5ee',
          400: '#cb86e1',
          500: '#b257d0',
          600: '#9537b5',
          700: '#742284', // Principal Yape
          800: '#611f6d',
          900: '#521d5b',
          950: '#320b3a',
        },
        mint: {
          DEFAULT: '#00D69E',
          light: '#25efb9',
          dark: '#00b585',
          glow: '#5effcf',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'radar': 'radar 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
        'bounce-soft': 'bounceSoft 1s ease infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        radar: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
