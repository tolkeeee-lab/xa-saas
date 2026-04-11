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
        // palette complète pour usage direct
        'pale-sky': {
          '50':  '#eaf5fa',
          '100': '#d5ebf6',
          '200': '#abd7ed',
          '300': '#82c3e3',
          '400': '#58afda',
          '500': '#2e9bd1',
          '600': '#257ca7',
          '700': '#1c5d7d',
          '800': '#123e54',
          '900': '#091f2a',
          '950': '#06161d',
        },
        'bright-amber': {
          '50':  '#fefae6',
          '100': '#fdf5ce',
          '200': '#fcec9c',
          '300': '#fae26b',
          '400': '#f9d939',
          '500': '#f7cf08',
          '600': '#c6a606',
          '700': '#947c05',
          '800': '#635303',
          '900': '#312902',
          '950': '#231d01',
        },
        'tiger-orange': {
          '50':  '#fff4e5',
          '100': '#ffe9cc',
          '200': '#ffd399',
          '300': '#ffbd66',
          '400': '#ffa733',
          '500': '#ff9100',
          '600': '#cc7400',
          '700': '#995700',
          '800': '#663a00',
          '900': '#331d00',
          '950': '#241400',
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
