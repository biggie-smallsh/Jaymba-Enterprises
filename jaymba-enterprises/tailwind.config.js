/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: "#f5a300", ink: "#1b1f23", paper: "#f7f6f2" },
    },
  },
  plugins: [],
};
