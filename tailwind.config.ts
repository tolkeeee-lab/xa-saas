import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        xa: {
          primary: '#1A56DB',
          accent: '#F59E0B',
          bg: '#F9FAFB',
        },
      },
    },
  },
  plugins: [],
};

export default config;
