/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        danger: 'var(--color-danger)',
        focus: 'var(--color-focus)',
        'easy-bg': 'var(--color-easy-bg)',
        'easy-text': 'var(--color-easy-text)',
        'medium-bg': 'var(--color-medium-bg)',
        'medium-text': 'var(--color-medium-text)',
        'hard-bg': 'var(--color-hard-bg)',
        'hard-text': 'var(--color-hard-text)',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
