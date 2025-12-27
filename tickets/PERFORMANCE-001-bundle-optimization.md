# Large Bundle Size Optimization

## Issue Description
Several JavaScript bundles are extremely large, impacting page load performance and user experience.

## Current Bundle Sizes
From build output:
- **GameCanvas.js**: 1,521.18 kB (1.5MB) - CRITICAL
- **firebaseConfig.js**: 466.97 kB (467kB) - HIGH  
- **StarryBackground.js**: 157.59 kB (158kB) - MEDIUM
- **proxy.js**: 111.00 kB (111kB) - MEDIUM

## Performance Impact
- Slow initial page load
- Poor mobile experience
- High bandwidth usage
- Reduced SEO score
- Poor Core Web Vitals

## Solutions

### 1. GameCanvas Bundle (1.5MB) - Priority: HIGH
**Root Cause:** Heavy game libraries (Phaser, Pixi.js) loaded upfront

**Solution:**
```typescript
// Lazy load game components
const GameCanvas = lazy(() => import('./GameCanvas'));

// In component usage:
<Suspense fallback={<div>Loading game...</div>}>
  <GameCanvas />
</Suspense>
```

**Dynamic imports for game assets:**
```typescript
// Instead of importing everything upfront
const loadGameAssets = async () => {
  const { Scene } = await import('phaser');
  const { Application } = await import('pixi.js');
  return { Scene, Application };
};
```

### 2. Firebase Bundle (467kB) - Priority: HIGH
**Root Cause:** Entire Firebase SDK imported even when not needed

**Solution:**
```typescript
// Use tree-shaking friendly imports
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite'; // Lite version
import { getAuth } from 'firebase/auth';

// Lazy load Firebase only when needed
const loadFirebase = async () => {
  const { initializeApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  return { initializeApp, getFirestore };
};
```

### 3. StarryBackground Bundle (158kB) - Priority: MEDIUM
**Root Cause:** Heavy particle effects and animation libraries

**Solution:**
```typescript
// Conditional loading based on device capabilities
const StarryBackground = lazy(() => {
  return import('./StarryBackground').then(module => ({
    default: module.default
  }));
});

// Performance-aware rendering
const shouldLoadParticles = () => {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
         navigator.hardwareConcurrency > 2;
};
```

### 4. Bundle Splitting Configuration
Update `astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            'game-engine': ['phaser', 'pixi.js'],
            'animations': ['framer-motion', 'gsap'],
            'particles': ['@tsparticles/react', '@tsparticles/slim']
          }
        }
      }
    }
  }
});
```

## Implementation Steps

### Phase 1: Immediate Wins
1. **Lazy load GameCanvas component**
2. **Use Firebase/firestore/lite for read-only operations**
3. **Add bundle analyzer to monitor progress**

### Phase 2: Advanced Optimization
1. **Implement route-based code splitting**
2. **Add service worker for caching**
3. **Optimize particle effects**

### Phase 3: Performance Monitoring
1. **Add performance monitoring**
2. **Set up bundle size alerts**
3. **Regular performance audits**

## Bundle Analysis Setup
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to astro.config.mjs
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  vite: {
    plugins: [
      visualizer({
        filename: 'dist/stats.html',
        open: true
      })
    ]
  }
});
```

## Target Bundle Sizes
- GameCanvas: < 300kB (split into chunks)
- Firebase: < 150kB (tree-shaken)
- StarryBackground: < 50kB (optimized)
- Total initial bundle: < 500kB

## Testing
```bash
# Build and analyze
npm run build
# Check dist/stats.html for bundle analysis

# Test performance
npm run lighthouse # (if configured)
```

## Files to Modify
- `src/components/GameCanvas.tsx` - Add lazy loading
- `src/utils/firebaseConfig.ts` - Optimize imports
- `src/components/StarryBackground.tsx` - Performance optimization
- `astro.config.mjs` - Bundle splitting configuration
- `package.json` - Add analyzer dependency

## Success Metrics
- **Page load time**: < 3 seconds on 3G
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Bundle size reduction**: > 60%

## Priority: HIGH
Large bundles significantly impact user experience and should be optimized immediately.