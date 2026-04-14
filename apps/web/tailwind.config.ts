import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        bg:      "hsl(220 15% 6%)",
        surface: "hsl(220 13% 9%)",
        border:  "hsl(220 10% 18%)",
        fg:      "hsl(220 10% 96%)",
        muted:   "hsl(220 8% 60%)",
        accent:  "hsl(265 90% 65%)",
      },
      fontFamily: {
        sans: ["Inter var", "ui-sans-serif", "system-ui"],
        display: ["Cal Sans", "Inter var", "ui-sans-serif"],
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.375rem" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
