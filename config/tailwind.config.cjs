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
      },
      keyframes: {
        'avatar-enter': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'avatar-enter': 'avatar-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
