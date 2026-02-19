/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111827",
        accent: "#2563EB",
        success: "#16A34A",
        warning: "#EA580C",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
