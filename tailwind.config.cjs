module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'primary-bg': 'var(--primary-bg)',
        'secondary-bg': 'var(--secondary-bg)',
        'text-dark-bg': 'var(--text-dark-bg)',
        'text-light-bg': 'var(--text-light-bg)',
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
