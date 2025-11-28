import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`,
    jsx: 'automatic',
  },
  optimizeDeps: {
    include: ['@motion-canvas/core', '@motion-canvas/2d'],
  },
});
