export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#111111",
        surface2: "#1a1a1a",
        border: "rgba(255,255,255,0.07)",
        primary: "#8472f5",
        accent: "#f0c060",
        muted: "#555555",
        "text-primary": "#eeeeee",
        "text-secondary": "#888888",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.07)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};