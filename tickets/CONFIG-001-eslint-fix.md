# Fix Broken ESLint Configuration

## Issue Description
The ESLint configuration is currently broken and prevents code linting. Multiple missing dependencies and configuration errors need to be resolved.

## Current Errors
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from /home/runner/work/porfoliooo/porfoliooo/eslint.config.js
```

Additional issues:
- Missing `globals` package
- Undefined `react` import in config
- Missing TypeScript ESLint dependencies
- Syntax errors in configuration

## Impact
- No code linting during development
- Potential code quality issues go undetected
- No automated style enforcement
- Inconsistent code formatting

## Solution

### Step 1: Install Missing Dependencies
```bash
npm install --save-dev \
  @eslint/js \
  globals \
  eslint-plugin-react \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-jsx-a11y \
  eslint-plugin-import
```

### Step 2: Fix ESLint Configuration
Update `eslint.config.js`:
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', '.astro'],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  }
);
```

### Step 3: Add npm Scripts
Update `package.json` to add linting scripts:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "add-sample-books": "node src/scripts/addSampleBooks.js",
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 4: Add ESLint Ignore File
Create `.eslintignore`:
```
node_modules/
dist/
.astro/
public/
*.astro
```

### Step 5: VS Code Integration
Create `.vscode/settings.json`:
```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Testing the Fix
```bash
# Test ESLint configuration
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check TypeScript compilation
npm run type-check
```

## Files to Modify
- `eslint.config.js` - Fix configuration
- `package.json` - Add dependencies and scripts
- `.eslintignore` - Create ignore file
- `.vscode/settings.json` - VS Code integration

## Expected Warnings/Errors After Fix
The linter will likely find several issues that need to be addressed:
- Unused variables
- Console statements
- Type issues
- React-specific issues

These should be addressed in separate tickets.

## Priority: MEDIUM
This blocks proper development workflow and code quality enforcement.

## Benefits After Fix
- Automated code quality checks
- Consistent code style
- Early detection of potential bugs
- Better TypeScript integration
- IDE integration for real-time feedback