/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,md}", "./.vitepress/theme/**/*.{ts,vue}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
