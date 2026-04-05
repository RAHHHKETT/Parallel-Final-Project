/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        blast: {
          bg:      '#0d0d14',
          surface: '#14141f',
          card:    '#1a1a28',
          border:  '#2a2a40',
          accent:  '#7c5cfc',
          glow:    '#a07cf8',
          hot:     '#ff4d6d',
          warm:    '#ff8c42',
          cool:    '#3dd9eb',
          text:    '#e8e8f0',
          muted:   '#7a7a95',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'bomb-tick': 'bombTick 0.5s ease-in-out infinite alternate',
        'shake': 'shake 0.4s ease-in-out',
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        bombTick: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,92,252,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124,92,252,0.7)' },
        },
      }
    },
  },
  plugins: [],
}