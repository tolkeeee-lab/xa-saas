import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        xa: {
          primary: '#1B4332',
          accent:  '#D4A017',
          bg:      '#F8F7F4',
          danger:  '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
export default config;
