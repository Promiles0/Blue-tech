export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'noir-bg':      '#0a0a0a',
        'noir-surface': '#141414',
        'noir-card':    '#1c1c1c',
        'noir-border':  '#262626',
        'noir-accent':  '#7c5cf0',
        'noir-price':   '#f59e0b',
        'noir-muted':   '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};