# Portfolio Website Issues & Improvement Tickets

This document contains a comprehensive list of issues, bugs, and improvements identified in the `suichanwa/porfoliooo` repository. Each issue includes priority level, description, and suggested fixes.

## 🔴 HIGH PRIORITY ISSUES

### Security Issues

#### ISSUE-001: Critical Security Vulnerabilities
**Priority:** HIGH  
**Type:** Security  
**Status:** Open  

**Description:** npm audit reveals 7 security vulnerabilities including:
- Astro XSS vulnerability (GHSA-m85w-3h95-hcf9)
- Astro CSRF bypass (GHSA-c4pw-33h3-35xw)
- esbuild development server vulnerability (GHSA-67mh-4wv8-2f99)
- tar-fs path traversal (GHSA-8cj5-5rvv-wf4v)
- cookie out-of-bounds characters (GHSA-pxg6-pf52-xh8x)

**Solution:**
```bash
npm audit fix
npm audit fix --force  # for breaking changes
```

**Files affected:** package.json, package-lock.json

---

#### ISSUE-002: Exposed Firebase API Keys
**Priority:** HIGH  
**Type:** Security  
**Status:** Open  

**Description:** Firebase configuration with API keys is hardcoded in `src/utils/firebaseConfig.ts` and committed to public repository.

**Solution:**
1. Move Firebase config to environment variables
2. Add `.env` file to `.gitignore`
3. Create `.env.example` template
4. Update Firebase config to use environment variables

**Files affected:** 
- `src/utils/firebaseConfig.ts`
- `.env` (new)
- `.env.example` (new)
- `.gitignore`

---

## 🟡 MEDIUM PRIORITY ISSUES

### Code Quality & Configuration

#### ISSUE-003: Broken ESLint Configuration
**Priority:** MEDIUM  
**Type:** Configuration  
**Status:** Open  

**Description:** ESLint configuration is broken due to missing dependencies and syntax errors.

**Errors:**
- Missing `@eslint/js` package
- Missing `globals` package  
- Undefined `react` import in config
- Missing TypeScript ESLint parser dependencies

**Solution:**
```bash
npm install --save-dev @eslint/js globals eslint-plugin-react @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Files affected:** 
- `eslint.config.js`
- `package.json`

---

#### ISSUE-004: Large Bundle Sizes
**Priority:** MEDIUM  
**Type:** Performance  
**Status:** Open  

**Description:** Several bundles are extremely large:
- `GameCanvas.js`: 1,521.18 kB (1.5MB)
- `firebaseConfig.js`: 466.97 kB
- `StarryBackground.js`: 157.59 kB

**Solution:**
1. Implement code splitting
2. Add lazy loading for game components
3. Use dynamic imports for Firebase
4. Optimize particle effects

**Files affected:**
- `src/components/GameCanvas.tsx`
- `src/components/StarryBackground.tsx`
- `src/utils/firebaseConfig.ts`
- `astro.config.mjs`

---

#### ISSUE-005: Console Statements in Production
**Priority:** MEDIUM  
**Type:** Code Quality  
**Status:** Open  

**Description:** Multiple console.log/error statements found in production code that should be removed or replaced with proper logging.

**Files affected:**
- `src/utils/firebaseConfig.ts` (lines 44, 58, 83, 91, 98, 101, 165)
- `src/components/BookReader.tsx` (line 45)
- Game scene files in `src/game/scenes/`

**Solution:** Replace with proper error handling and remove debug logs.

---

### Accessibility Issues

#### ISSUE-006: Missing Alt Text for Images
**Priority:** MEDIUM  
**Type:** Accessibility  
**Status:** Open  

**Description:** Several images lack proper alt text for screen readers.

**Files affected:**
- Profile images in components
- Background images
- Icon images

**Solution:** Add descriptive alt text to all images.

---

#### ISSUE-007: Insufficient ARIA Labels
**Priority:** MEDIUM  
**Type:** Accessibility  
**Status:** Open  

**Description:** Interactive elements lack proper ARIA labels and descriptions.

**Solution:** Add ARIA labels, roles, and descriptions to:
- Navigation components
- Interactive game elements
- Form controls
- Modal dialogs

---

#### ISSUE-008: Keyboard Navigation Issues
**Priority:** MEDIUM  
**Type:** Accessibility  
**Status:** Open  

**Description:** Some interactive elements are not properly accessible via keyboard navigation.

**Solution:** 
- Add proper tabindex attributes
- Implement keyboard event handlers
- Ensure focus indicators are visible
- Test with screen readers

---

## 🟢 LOW PRIORITY ISSUES

### Documentation & User Experience

#### ISSUE-009: Minimal README
**Priority:** LOW  
**Type:** Documentation  
**Status:** Open  

**Description:** README.md contains only 3 lines and lacks:
- Setup instructions
- Development guidelines
- Deployment instructions
- Project overview
- Technology stack details

**Solution:** Create comprehensive README with all necessary information.

---

#### ISSUE-010: Missing Contributing Guidelines
**Priority:** LOW  
**Type:** Documentation  
**Status:** Open  

**Description:** No CONTRIBUTING.md file exists to guide contributors.

**Solution:** Create CONTRIBUTING.md with:
- Development setup
- Code style guidelines
- Pull request process
- Issue reporting guidelines

---

#### ISSUE-011: Repository Name Typo
**Priority:** LOW  
**Type:** User Experience  
**Status:** Open  

**Description:** Repository name "porfoliooo" appears to be a typo of "portfolio".

**Solution:** Consider renaming repository to "portfolio" (requires GitHub repository settings change).

---

### Testing & Development

#### ISSUE-012: No Testing Infrastructure
**Priority:** LOW  
**Type:** Development  
**Status:** Open  

**Description:** No testing framework or tests exist in the project.

**Solution:** Add testing infrastructure:
- Install Vitest or Jest
- Add unit tests for utilities
- Add component tests for React components
- Add e2e tests for critical paths

---

#### ISSUE-013: Missing Pre-commit Hooks
**Priority:** LOW  
**Type:** Development  
**Status:** Open  

**Description:** No pre-commit hooks to ensure code quality.

**Solution:** Add Husky + lint-staged for:
- ESLint checking
- Prettier formatting
- TypeScript compilation
- Test running

---

### Performance Optimizations

#### ISSUE-014: Unoptimized Images
**Priority:** LOW  
**Type:** Performance  
**Status:** Open  

**Description:** Images are not optimized for web delivery.

**Solution:** 
- Add image optimization pipeline
- Use WebP/AVIF formats where supported
- Implement responsive images
- Add lazy loading for images

---

#### ISSUE-015: Missing Service Worker
**Priority:** LOW  
**Type:** Performance  
**Status:** Open  

**Description:** No service worker for caching and offline functionality.

**Solution:** Add service worker with Workbox for:
- Static asset caching
- API response caching
- Offline fallbacks

---

## Bug Fixes

#### ISSUE-016: Firebase Connection Errors
**Priority:** MEDIUM  
**Type:** Bug  
**Status:** Open  

**Description:** Firebase connection errors during build process due to network restrictions.

**Solution:** Add proper error handling and fallbacks for Firebase operations.

---

#### ISSUE-017: Particle Effects Performance
**Priority:** MEDIUM  
**Type:** Performance  
**Status:** Open  

**Description:** StarryBackground component with complex particle effects may cause performance issues on low-end devices.

**Solution:** 
- Add performance detection
- Reduce particle count on low-end devices
- Add option to disable effects
- Optimize animation loops

---

## Configuration Issues

#### ISSUE-018: Incomplete .gitignore
**Priority:** LOW  
**Type:** Configuration  
**Status:** Open  

**Description:** .gitignore missing entries for common development files.

**Solution:** Add missing entries:
- .env files
- IDE-specific files
- OS-specific files
- Build artifacts

---

#### ISSUE-019: Missing TypeScript Strict Mode
**Priority:** LOW  
**Type:** Configuration  
**Status:** Open  

**Description:** TypeScript configuration could be stricter for better type safety.

**Solution:** Enable strict mode in tsconfig.json and fix resulting type errors.

---

#### ISSUE-020: No Error Boundaries
**Priority:** MEDIUM  
**Type:** Code Quality  
**Status:** Open  

**Description:** React components lack error boundaries for graceful error handling.

**Solution:** Add error boundary components around major component trees.

---

## Summary

**Total Issues:** 20  
**High Priority:** 2  
**Medium Priority:** 10  
**Low Priority:** 8  

**Categories:**
- Security: 2 issues
- Code Quality: 4 issues
- Performance: 4 issues
- Accessibility: 3 issues
- Documentation: 3 issues
- Configuration: 3 issues
- Testing: 1 issue

## Next Steps

1. Address security issues immediately
2. Fix ESLint configuration to enable proper linting
3. Tackle performance issues in order of impact
4. Gradually improve accessibility
5. Enhance documentation for better maintainability