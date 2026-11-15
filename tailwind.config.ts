import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        surface: "#ffffff",
        canvas: "#f8f7ff",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 16px 0 rgb(124 58 237 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.08)",
        glow: "0 0 0 3px rgb(139 92 246 / 0.25)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
        "gradient-canvas": "linear-gradient(160deg, #f8f7ff 0%, #fdf4ff 50%, #fff7ed 100%)",
        "gradient-score": "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in": { from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        pulse: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.05)" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};
export default config;
