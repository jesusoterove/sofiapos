import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { themeTokens } from '@sofiapos/shared/theme'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sofiaColors = themeTokens.sofia.colors

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    join(__dirname, "../sofia-ui/src/**/*.{js,ts,jsx,tsx}"),
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
