/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { 0:'#0d1117', 1:'#161b22', 2:'#1c2333', 3:'#21262d', border:'#30363d' },
        rise:  { DEFAULT:'#e03131', light:'#ff6b6b', bg:'rgba(224,49,49,0.10)' },
        fall:  { DEFAULT:'#1971c2', light:'#74c0fc', bg:'rgba(25,113,194,0.10)' },
        flat:  '#6e7681',
        accent:'#58a6ff',
        gold:  '#f0a500',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
