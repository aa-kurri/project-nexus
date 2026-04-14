/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        surface: "#14171f",
        border: "#242834",
        fg: "#f1f3f7",
        muted: "#8c93a3",
        accent: "#a855f7",
      },
    },
  },
};
