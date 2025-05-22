module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'primary-accent': 'var(--primary-accent)', 
        'secondary-accent': 'var(--secondary-accent)'
      }
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography')
  ],
  daisyui: {
    themes: ['light', 'dark'],
  },
};