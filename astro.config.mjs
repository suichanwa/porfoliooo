import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://suichanwa.github.io',
  base: '/porfoliooo',
  integrations: [
    react({
      include: ['**/react/*', '**/Physics/*'],
    }),
    tailwind()
  ],
  vite: {
    esbuild: {
      jsx: 'automatic',
    },
  },
});