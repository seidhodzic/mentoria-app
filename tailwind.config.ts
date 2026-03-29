import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mentoria: {
          teal: '#19353E',
          'teal-mid': '#1e4552',
          'teal-light': '#2a5c6e',
          /** Primary brand gold — single source for UI, text, and luxury accents */
          gold: '#F7BC15',
          'gold-dark': '#d9a410',
          /** Alias of `gold` for legacy `mentoria-luxury` classes */
          luxury: '#F7BC15',
          navy: '#0d2229',
          light: '#EFEFEF',
          muted: '#7a9aa5',
          footer: '#0d2229',
        },
      },
      fontFamily: {
        /** Body, UI, labels, buttons */
        sans: ["'Saira'", 'sans-serif'],
        /** Headings, titles, large numbers, logo wordmark only */
        condensed: ["'Saira Condensed'", 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            '--tw-prose-body': 'rgba(25, 53, 62, 0.88)',
            '--tw-prose-headings': '#19353E',
            '--tw-prose-links': '#F7BC15',
            '--tw-prose-bold': '#19353E',
            '--tw-prose-quotes': 'rgba(25, 53, 62, 0.75)',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  corePlugins: {
    preflight: false,
  },
};

export default config;
