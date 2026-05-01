import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F19',
        card: '#111827',
        primary: { DEFAULT: '#4F46E5', soft: '#A5B4FC' },
        secondary: { DEFAULT: '#06B6D4', soft: '#67E8F9' },
        accent: { DEFAULT: '#22C55E', soft: '#4ADE80' },
        text: '#E5E7EB',
        muted: '#9CA3AF',
        border: 'rgba(129,140,248,0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
