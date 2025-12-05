import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

const isDev = import.meta.env.DEV;

export default defineConfig({
  site: 'https://suichanwa.github.io',
  base: isDev ? '/' : '/',
  integrations: [react(), tailwind()],
});