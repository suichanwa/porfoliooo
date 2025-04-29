import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(), // Enables .jsx/.tsx support
    tailwind(), // Enables Tailwind support
  ],
});