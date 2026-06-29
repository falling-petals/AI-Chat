/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/streamdown/dist/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            fontSize: '1.0625rem',
            color: '#334155',
            p: { marginTop: '0.75em', marginBottom: '0.75em' },
            'h1, h2, h3, h4': { color: '#0f172a', fontWeight: '600', scrollMarginTop: '2rem' },
            h1: { fontSize: '1.75em', marginTop: '1.2em', marginBottom: '0.4em' },
            h2: { fontSize: '1.4em', marginTop: '1.1em', marginBottom: '0.3em' },
            h3: { fontSize: '1.15em', marginTop: '0.9em', marginBottom: '0.2em' },
            strong: { color: '#0f172a', fontWeight: '600' },
            a: { color: '#2563eb', fontWeight: '500', textDecoration: 'none', '&:hover': { color: '#1d4ed8', textDecoration: 'underline' } },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            'code, kbd, samp': { fontSize: '0.875em' },
            code: { color: '#be123c', fontWeight: '500', backgroundColor: '#fff1f2', padding: '0.15em 0.35em', borderRadius: '0.25rem' },
            'p > code, li > code': { fontSize: '0.875em' },
            'pre code': { fontSize: '0.9375em', backgroundColor: 'transparent', padding: '0', color: 'inherit' },
            blockquote: { color: '#475569', borderLeftColor: '#cbd5e1', borderLeftWidth: '3px', fontStyle: 'normal', fontWeight: '500', paddingLeft: '1em' },
            'ul > li::marker': { color: '#94a3b8' },
            'ol > li::marker': { color: '#94a3b8', fontWeight: '500' },
            hr: { borderColor: '#e2e8f0', marginTop: '2em', marginBottom: '2em' },
            'ul, ol': { paddingLeft: '1.5em' },
            li: { marginTop: '0.3em', marginBottom: '0.3em' },
            'figure figcaption': { color: '#64748b', fontSize: '0.875em' },
            img: { borderRadius: '0.5rem' },
            table: { fontSize: '0.9375em' },
            thead: { color: '#0f172a', borderBottomColor: '#e2e8f0' },
            'tbody tr': { borderBottomColor: '#f1f5f9' },
          },
        },
        dark: {
          css: {
            color: '#cbd5e1',
            'h1, h2, h3, h4': { color: '#f1f5f9' },
            strong: { color: '#f1f5f9' },
            a: { color: '#60a5fa', '&:hover': { color: '#93bbfd' } },
            code: { color: '#fb7185', backgroundColor: '#311b25' },
            blockquote: { color: '#94a3b8', borderLeftColor: '#334155' },
            'ul > li::marker': { color: '#475569' },
            'ol > li::marker': { color: '#475569' },
            hr: { borderColor: '#1e293b' },
            thead: { color: '#f1f5f9', borderBottomColor: '#1e293b' },
            'tbody tr': { borderBottomColor: '#0f172a' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
