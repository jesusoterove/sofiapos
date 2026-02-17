import { themeTokens } from '@sofiapos/shared/theme'

const sofiaColors = themeTokens.sofia.colors

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../sofia-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: sofiaColors.primary,
        background: sofiaColors.background,
        text: sofiaColors.text,
        border: sofiaColors.border,
      },
    },
  },
  plugins: [],
}
