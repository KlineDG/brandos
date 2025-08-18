import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "2rem" },
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      colors: {
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        primaryFg: "hsl(var(--primary-fg))",
        accent: "hsl(var(--accent))",
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        "grid": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
        "glow": "radial-gradient(600px 300px at 50% -20%, rgba(120,119,198,0.25), transparent)",
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out forwards",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;


