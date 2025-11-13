/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e27',
          surface: '#141b3d',
          border: '#1e2a5e',
          primary: '#00ff41',
          secondary: '#00d4ff',
          accent: '#ff00ff',
          danger: '#ff0055',
          warning: '#ffaa00',
          success: '#00ff41',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 40px rgba(0, 255, 65, 0.8)',
          },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
