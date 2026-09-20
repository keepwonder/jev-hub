/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "frontier" palette — inspired by TypeSafe's brand (purple + electric + ink)
        ink: {
          50:  '#f7f7f8',
          100: '#eeeef1',
          200: '#d8d8df',
          300: '#b3b3bf',
          400: '#85858f',
          500: '#5e5e69',
          600: '#42424c',
          700: '#2e2e36',
          800: '#1c1c22',
          900: '#0f0f14',
        },
        // "Signal" — accent used for CTAs and highlights
        signal: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // "Calibrated" — green for confidence / good signals
        calibrated: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // "Caution" — amber for warnings
        caution: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      typography: () => ({
        DEFAULT: { css: { maxWidth: '72ch' } },
      }),
    },
  },
  plugins: [typography],
};
