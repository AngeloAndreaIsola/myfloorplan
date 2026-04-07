/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#6366f1",
          "secondary": "#f43f5e",
          "accent": "#fbbf24",
          "neutral": "#27272a",
          "base-100": "#09090b",
          "base-200": "#18181b",
          "base-300": "#27272a",
          "base-content": "#fafafa",
        },
      },
      "cupcake",
    ],
  },
}
