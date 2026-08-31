import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function preloadIslandsPlugin() {
  return {
    name: 'preload-islands-plugin',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = fileURLToPath(dir);
        
        function processDir(currentDir) {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
              processDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
              let html = fs.readFileSync(fullPath, 'utf-8');
              const matches = html.matchAll(/(?:component-url|renderer-url)="([^"]+)"/g);
              const urls = new Set();
              for (const match of matches) {
                urls.add(match[1]);
              }
              if (urls.size > 0) {
                const preloads = Array.from(urls)
                  .map((url) => `<link rel="modulepreload" href="${url}" />`)
                  .join('\n    ');
                html = html.replace('</head>', `    ${preloads}\n  </head>`);
                fs.writeFileSync(fullPath, html, 'utf-8');
              }
            }
          }
        }
        
        processDir(distPath);
      }
    }
  };
}

const isDev = import.meta.env.DEV;

export default defineConfig({
  site: 'https://suichanwa.github.io',
  base: isDev ? '/' : '/',
  integrations: [react(), tailwind(), preloadIslandsPlugin()],
});