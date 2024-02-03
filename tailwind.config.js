/** @type {import('tailwindcss').Config} */

const colors = require("tailwindcss/colors");

module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,js,vue}",
    "./.vitepress/theme/**/*.{html,js,vue}",
    "./content/**/*.md",
    "./*.md",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
        mono: ["Fira Code", "monospace"],
        serif: ["Young Serif", "serif"],
      },
      colors: {
        github: "#181717",
        spotify: "#1DB954",
        linkedin: "#0A66C2",
        instagram: "#E4405F",
        x: "#000000",
        youtube: "#FF0000",
        pink: {
          50: "#fcf4ff",
          100: "#f8e7ff",
          200: "#f3cfff",
          300: "#eca8ff",
          400: "#e275fd",
          500: "#d85cf6",
          600: "#b820d9",
          700: "#9c17b4",
          800: "#811593",
          900: "#6d1778",
          950: "#470250",
        },
        purple: {
          50: "#f7f3ff",
          100: "#efe9fe",
          200: "#e2d6fe",
          300: "#cbb5fd",
          400: "#ad8bfa",
          500: "#8b5cf6",
          600: "#713aed",
          700: "#5e28d9",
          800: "#4e21b6",
          900: "#421d95",
          950: "#2a1065",
        },
        blue: {
          50: "#eff2ff",
          100: "#dce2fd",
          200: "#c0ccfd",
          300: "#95abfb",
          400: "#5c7af6",
          500: "#3f56f2",
          600: "#2a35e6",
          700: "#2123d4",
          800: "#2321ac",
          900: "#212187",
          950: "#191853",
        },
        danger: colors.red,
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
