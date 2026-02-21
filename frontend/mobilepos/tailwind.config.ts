import type { Config } from 'tailwindcss';
import nativewind from 'nativewind/preset';
import { themeTokens } from '@sofiapos/shared/theme';

const sofia = themeTokens.sofia;

const toPxScale = (scale: Record<string, number>) =>
  Object.fromEntries(Object.entries(scale).map(([key, value]) => [key, `${value}px`]));

const toRemScale = (scale: Record<string, number>) =>
  Object.fromEntries(Object.entries(scale).map(([key, value]) => [key, `${value / 16}rem`]));

const spacing = toPxScale({ ...sofia.spacing.scale, unit: sofia.spacing.unit });
const radii = Object.fromEntries(Object.entries(sofia.radii).map(([key, value]) => [key, `${value}px`]));
const fontSize = toRemScale(sofia.typography.scale);

const colors = {
  brand: sofia.colors.primary,
  text: sofia.colors.text,
  border: sofia.colors.border,
  background: {
    DEFAULT: sofia.colors.background.default,
    paper: sofia.colors.background.paper,
  },
};

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [nativewind],
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius: radii,
      fontSize,
      fontFamily: {
        sans: [sofia.typography.fontFamily, 'sans-serif'],
      },
      boxShadow: sofia.elevation,
    },
  },
  plugins: [],
};

export default config;
