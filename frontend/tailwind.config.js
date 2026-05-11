/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "oklch(0.979 0.008 95)",
        surface: "oklch(0.995 0.004 95)",
        surfaceMuted: "oklch(0.962 0.008 95)",
        border: "oklch(0.89 0.012 85)",
        ink: "oklch(0.23 0.02 255)",
        inkSoft: "oklch(0.48 0.016 250)",
        brand: {
          50: "oklch(0.976 0.014 221)",
          100: "oklch(0.948 0.03 224)",
          200: "oklch(0.899 0.055 225)",
          300: "oklch(0.84 0.091 223)",
          400: "oklch(0.756 0.128 220)",
          500: "oklch(0.673 0.149 216)",
          600: "oklch(0.587 0.133 216)",
          700: "oklch(0.495 0.11 217)",
          800: "oklch(0.425 0.091 220)",
          900: "oklch(0.367 0.073 223)",
        },
        success: {
          50: "oklch(0.982 0.018 155)",
          500: "oklch(0.67 0.17 154)",
          700: "oklch(0.53 0.138 156)",
        },
        warning: {
          50: "oklch(0.987 0.022 92)",
          500: "oklch(0.77 0.162 80)",
          700: "oklch(0.61 0.133 69)",
        },
        danger: {
          50: "oklch(0.975 0.018 20)",
          500: "oklch(0.647 0.206 24)",
          700: "oklch(0.53 0.176 25)",
        },
      },
      boxShadow: {
        panel:
          "0 1px 0 oklch(0.92 0.01 80), 0 24px 50px -28px oklch(0.29 0.04 240 / 0.22)",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", '"Times New Roman"', "serif"],
        body: ['"Avenir Next"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top left, oklch(0.95 0.045 223 / 0.8), transparent 40%), radial-gradient(circle at top right, oklch(0.97 0.03 155 / 0.75), transparent 32%)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
