# Accessibility Improvements

## Issue Description
The website has several accessibility issues that prevent users with disabilities from properly using the site. Missing alt text, ARIA labels, and keyboard navigation support need to be addressed.

## Current Accessibility Issues

### 1. Missing Alt Text for Images
**Files affected:**
- `src/components/Navigation.tsx` - Profile image (line 104)
- `src/components/Avatar.tsx` - Avatar image
- Various background and decorative images

**Current code:**
```tsx
<img 
  src="/images/pfp.jpg" 
  alt="Avatar" 
  className="w-10 h-10 rounded-full border-2 border-primary-accent shadow-lg" 
/>
```

**Issue:** Generic "Avatar" alt text doesn't provide meaningful description.

### 2. Insufficient ARIA Labels
**Missing ARIA labels for:**
- Navigation menus
- Interactive buttons
- Modal dialogs
- Game controls
- Form elements

### 3. Keyboard Navigation Issues
- Focus indicators not always visible
- Tab order not logical
- Some interactive elements not keyboard accessible

### 4. Color Contrast Issues
- Need to verify all text meets WCAG AA standards
- Some UI elements may have insufficient contrast

## Solutions

### 1. Improve Alt Text
Update `src/components/Navigation.tsx`:
```tsx
<img 
  src="/images/pfp.jpg" 
  alt="Suichanwa's profile photo - a developer headshot" 
  className="w-10 h-10 rounded-full border-2 border-primary-accent shadow-lg" 
/>
```

### 2. Add ARIA Labels
Update navigation component:
```tsx
<nav
  className="..."
  role="navigation"
  aria-label="Main navigation"
>
  <button
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    className="btn btn-ghost btn-circle"
    aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isMenuOpen}
    aria-controls="mobile-menu"
  >
    {/* ... */}
  </button>

  <div 
    id="mobile-menu"
    className="..."
    role="menu"
    aria-hidden={!isMenuOpen}
  >
    {navItems.map((item) => (
      <a
        key={item.path}
        href={item.path}
        role="menuitem"
        aria-label={`Navigate to ${item.name} page`}
        className="..."
      >
        {/* ... */}
      </a>
    ))}
  </div>
</nav>
```

### 3. Improve Keyboard Navigation
Add focus management:
```tsx
// Add to Navigation component
const menuRef = useRef<HTMLDivElement>(null);
const menuButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMenuOpen) {
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  };

  if (isMenuOpen) {
    document.addEventListener('keydown', handleKeyDown);
    // Focus first menu item
    const firstMenuItem = menuRef.current?.querySelector('a');
    firstMenuItem?.focus();
  }

  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isMenuOpen]);
```

### 4. Add Skip Links
Add to main layout:
```tsx
// In BaseLayout.astro
<a 
  href="#main-content" 
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white p-2 rounded"
>
  Skip to main content
</a>

<main id="main-content" tabindex="-1">
  {/* Page content */}
</main>
```

### 5. Screen Reader Support
Add screen reader announcements:
```tsx
// Live region for dynamic content
<div 
  id="announcements" 
  aria-live="polite" 
  aria-atomic="true" 
  className="sr-only"
>
  {/* Dynamic announcements */}
</div>
```

### 6. Form Accessibility
For contact forms:
```tsx
<form aria-labelledby="contact-form-title">
  <h2 id="contact-form-title">Contact Form</h2>
  
  <label htmlFor="name">
    Name <span aria-label="required">*</span>
  </label>
  <input 
    id="name"
    type="text"
    required
    aria-describedby="name-error"
    aria-invalid={nameError ? 'true' : 'false'}
  />
  <div id="name-error" role="alert" aria-live="assertive">
    {nameError}
  </div>
</form>
```

## CSS Improvements

### 1. Focus Indicators
Add to global CSS:
```css
/* Focus indicators */
:focus {
  outline: 2px solid var(--primary-accent);
  outline-offset: 2px;
}

/* Skip link styles */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 2. High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  :root {
    --text-color: #000000;
    --background-color: #ffffff;
    --link-color: #0000ee;
  }
}
```

### 3. Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Checklist

### Automated Testing
- [ ] Run axe-core accessibility tests
- [ ] Use lighthouse accessibility audit
- [ ] Test with NVDA/JAWS screen readers

### Manual Testing
- [ ] Navigate entire site using only keyboard
- [ ] Test with screen reader
- [ ] Verify color contrast ratios
- [ ] Test with high contrast mode
- [ ] Test with reduced motion settings

## Implementation Priority

### Phase 1 (High Priority)
1. Add meaningful alt text to all images
2. Add ARIA labels to interactive elements
3. Implement keyboard navigation
4. Add skip links

### Phase 2 (Medium Priority)
1. Color contrast verification and fixes
2. Form accessibility improvements
3. Screen reader optimization
4. Focus management

### Phase 3 (Low Priority)
1. Advanced ARIA patterns
2. Accessibility testing automation
3. User testing with disabled users

## Files to Modify
- `src/components/Navigation.tsx` - Navigation accessibility
- `src/components/Avatar.tsx` - Image alt text
- `src/layouts/BaseLayout.astro` - Skip links and structure
- `src/styles/global.css` - Focus indicators and accessibility styles
- All components with images - Alt text improvements
- All interactive components - ARIA labels

## Success Criteria
- WCAG 2.1 AA compliance
- 100% keyboard navigable
- Screen reader compatible
- Lighthouse accessibility score > 95
- Color contrast ratio > 4.5:1 for normal text

## Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Priority: MEDIUM
Accessibility is crucial for inclusive design and legal compliance.