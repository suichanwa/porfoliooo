# Remove Console Statements from Production Code

## Issue Description
Multiple console.log, console.error, and console.warn statements are present in the production codebase. These should be removed or replaced with proper logging mechanisms for better performance and security.

## Files with Console Statements

### 1. src/utils/firebaseConfig.ts
**Lines with console statements:**
- Line 44: `console.error("Error getting diary entries:", error);`
- Line 58: `console.error("Error adding diary entry:", error);`
- Line 83: `console.error("Error adding letter:", error);`
- Line 91: `console.log("Fetching letters from Firestore...");`
- Line 98: `console.log("Retrieved letters:", letters.length);`
- Line 101: `console.error("Error getting letters:", error);`
- Line 146: `console.log("Fetching books from Firestore...");`
- Line 165: `console.log("Retrieved books:", books.length);`
- Line 168-170: Multiple console.error statements

### 2. src/components/BookReader.tsx
**Lines with console statements:**
- Line 45: `console.error('Failed to save reading progress:', error);`

### 3. Game Scene Files
Multiple console statements in game-related files for debugging.

## Issues with Console Statements

### 1. Performance Impact
- Console operations are expensive in production
- Can slow down the application
- Unnecessary overhead for users

### 2. Security Concerns
- May expose sensitive information
- Can reveal application structure
- Debug information visible to users

### 3. Log Pollution
- Clutters browser console for end users
- Makes real debugging harder
- Unprofessional appearance

## Solutions

### 1. Environment-Based Logging
Create a logging utility that only logs in development:

**Create `src/utils/logger.ts`:**
```typescript
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};
```

### 2. Proper Error Handling
Replace console.error with proper error handling:

**Before:**
```typescript
} catch (error) {
  console.error("Error getting diary entries:", error);
  return [];
}
```

**After:**
```typescript
} catch (error) {
  // Log error in development only
  logger.error("Error getting diary entries:", error);
  
  // Proper error handling for production
  throw new Error(`Failed to fetch diary entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

### 3. User Feedback Instead of Console Logs
Replace informational console.log with user feedback:

**Before:**
```typescript
console.log("Fetching letters from Firestore...");
```

**After:**
```typescript
// Use loading states or toast notifications
setIsLoading(true);
// Or use a toast library for user notifications
```

## Implementation Plan

### Phase 1: Create Logging Utility
1. Create `src/utils/logger.ts`
2. Export environment-aware logging functions

### Phase 2: Replace Firebase Config Logs
Update `src/utils/firebaseConfig.ts`:
```typescript
import { logger } from './logger';

// Replace all console.log with logger.log
// Replace all console.error with proper error handling

export async function getDiaryEntries() {
  try {
    const q = query(diaryEntriesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DiaryEntry[];
  } catch (error) {
    logger.error("Error getting diary entries:", error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}
```

### Phase 3: Update Component Files
Update `src/components/BookReader.tsx`:
```typescript
import { logger } from '../utils/logger';

// Replace console.error with logger.error and user feedback
try {
  await saveReadingProgress({
    bookId: book.id,
    currentPage,
    totalPages: book.pages
  });
  setLastSaved(new Date());
} catch (error) {
  logger.error('Failed to save reading progress:', error);
  // Show user-friendly error message
  setErrorMessage('Failed to save progress. Please try again.');
}
```

### Phase 4: Game Files
For game files, create a game-specific logger:
```typescript
// src/game/utils/gameLogger.ts
export const gameLogger = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[GAME] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    if (import.meta.env.DEV) {
      console.error(`[GAME] ${message}`, error);
    }
  }
};
```

## ESLint Rule Configuration
Add ESLint rule to prevent future console statements:
```javascript
// In eslint.config.js
rules: {
  'no-console': 'error', // This will catch any new console statements
  // Allow console in development files if needed
  'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
}
```

## Testing Strategy
1. **Development Testing**: Verify logs still appear in development
2. **Production Build**: Confirm no console output in production build
3. **Error Scenarios**: Test error handling works without console output
4. **User Experience**: Ensure error feedback is user-friendly

## Files to Modify
- `src/utils/logger.ts` - New utility file
- `src/utils/firebaseConfig.ts` - Replace all console statements
- `src/components/BookReader.tsx` - Replace console.error
- All game scene files - Replace with gameLogger
- `eslint.config.js` - Add no-console rule

## Verification Commands
```bash
# Search for remaining console statements
grep -r "console\." src/ --exclude-dir=node_modules

# Build and check for console output
npm run build
# No console output should appear

# Test in development
npm run dev
# Logs should appear in development mode
```

## Benefits After Implementation
- **Better Performance**: No console overhead in production
- **Professional Output**: Clean browser console for users
- **Better Error Handling**: Proper error messages for users
- **Debugging**: Structured logging in development
- **Security**: No accidental information exposure

## Exception Cases
Some console statements may be acceptable:
- Critical error reporting that needs immediate attention
- License or attribution information
- Performance monitoring (if intentional)

These should be clearly documented and justified.

## Priority: MEDIUM
This improves code quality and user experience but is not critical for functionality.