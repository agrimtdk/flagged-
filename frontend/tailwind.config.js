/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        card: "var(--card)",
        surface: "var(--surface)",
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        serif: ['"DM Sans"', "sans-serif"],
        mono: ['"DM Sans"', "sans-serif"],
        solway: ['"DM Sans"', "sans-serif"],
        dmsans: ['"DM Sans"', "sans-serif"],
        quicksand: ['"Quicksand"', "sans-serif"],
      },
      transitionDuration: {
        DEFAULT: "100ms",
      },
    },
  },
  plugins: [],
}
