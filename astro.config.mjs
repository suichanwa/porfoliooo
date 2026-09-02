import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const isDev = import.meta.env.DEV;

export default defineConfig({
  site: 'https://suichanwa.github.io',
  base: isDev ? '/' : '/',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [react()],
});