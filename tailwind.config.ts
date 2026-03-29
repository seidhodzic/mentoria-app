import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-saira)', 'sans-serif'],
        condensed: ['var(--font-saira-condensed)', 'sans-serif'],
        saira: ['var(--font-saira)', 'sans-serif'],
        'saira-condensed': ['var(--font-saira-condensed)', 'sans-serif'],
      },
      colors: {
        gold: '#F7BC15',
        'gold-dark': '#d9a410',
        teal: '#19353E',
        'teal-mid': '#1e4552',
        'teal-light': '#2a5c6e',
        light: '#EFEFEF',
        muted: '#7a9aa5',
      },
    },
  },
  plugins: [],
};

export default config;
