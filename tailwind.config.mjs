/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 中性墨 — 不偏冷不偏暖，跟暖橙搭
        ink: {
          50:  '#FAFAF5',  // 暖白底
          100: '#F4F4ED',
          200: '#E5E5DC',
          300: '#C8C8BE',
          400: '#9A9A8E',
          500: '#6B6B5F',
          600: '#48483E',
          700: '#2D2D26',
          800: '#1A1A15',
          900: '#171717',
        },
        // Signal — 暖橙，工具感主色
        signal: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#C2410C',  // PRIMARY 暖橙
          700: '#9A3412',
          800: '#7C2D12',
          900: '#5C1D08',
        },
        // Moss — 置信/安全信号
        calibrated: {
          400: '#84a766',
          500: '#6f8854',
          600: '#566a3f',
        },
        // Rust — 警示
        caution: {
          400: '#d4a058',
          500: '#b8853f',
          600: '#8e6431',
        },
      },
      fontFamily: {
        sans: [
          '"Geist"',
          '"Inter Fallback"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'monospace',
        ],
      },
      fontSize: {
        // 适中大小 — 不需要给 serif 留呼吸
        'display': ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'title':   ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        'card':  '14px',
        'btn':   '8px',
        'pill':  '999px',
      },
      typography: () => ({
        DEFAULT: { css: { maxWidth: '72ch' } },
      }),
    },
  },
  plugins: [typography],
};