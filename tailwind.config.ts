import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'xa-primary':       'var(--xa-primary)',
        'xa-primary-light': 'var(--xa-primary-light)',
        'xa-accent':        'var(--xa-accent)',
        'xa-bg':            'var(--xa-bg)',
        'xa-surface':       'var(--xa-surface)',
        'xa-text':          'var(--xa-text)',
        'xa-muted':         'var(--xa-muted)',
        'xa-border':        'var(--xa-border)',
        'xa-danger':        'var(--xa-danger)',
        'mauve': {
          '50':  '#f0eafa',
          '100': '#e2d5f6',
          '200': '#c4abed',
          '300': '#a782e3',
          '400': '#8a58da',
          '500': '#6c2ed1',
          '600': '#5725a7',
          '700': '#411c7d',
          '800': '#2b1254',
          '900': '#16092a',
          '950': '#0f061d',
        },
        'electric-aqua': {
          '50':  '#e8fbfd',
          '100': '#d0f7fb',
          '200': '#a1f0f7',
          '300': '#72e8f3',
          '400': '#43e0ef',
          '500': '#14d9eb',
          '600': '#10adbc',
          '700': '#0c828d',
          '800': '#08575e',
          '900': '#042b2f',
          '950': '#031e21',
        },
        'cotton-rose': {
          '50':  '#ffe5e7',
          '100': '#ffcccf',
          '200': '#ff99a0',
          '300': '#ff6670',
          '400': '#ff3341',
          '500': '#ff0011',
          '600': '#cc000e',
          '700': '#99000a',
          '800': '#660007',
          '900': '#330003',
          '950': '#240002',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
