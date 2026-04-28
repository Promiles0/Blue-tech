export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo
        secondary: "#1e293b", // Slate
        accent: "#f43f5e", // Rose
        background: "#0f172a", // Deep Navy
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
