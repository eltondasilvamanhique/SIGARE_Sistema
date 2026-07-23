import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        sigare: {
          blue: {
            50:  '#eff6ff',
            100: '#dbeafe',
            600: '#2563eb',
            700: '#1e4db7',
            800: '#1a3a7a',
            900: '#0f2554',
            950: '#0c1a3d',
          },
          gold: {
            100: '#fef9e7',
            300: '#f5d07a',
            400: '#e9b94e',
            500: '#c9980a',
          },
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgb(15 37 84 / 0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
