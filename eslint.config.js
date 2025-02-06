import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist'], // Keep your ignores
  },
  {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended', // Use the recommended TS ruleset
      'plugin:react/recommended', // React recommended rules
      'prettier', // Make sure prettier is last so it disables conflicting rules
    ],
    parserOptions: {
      project: './tsconfig.json', // Path to your tsconfig.json (important!)
    },
    files: ['**/*.{ts,tsx}'], // Target the correct files
    languageOptions: {
      ecmaVersion: 'latest', // Use latest ECMAScript version
      sourceType: 'module', // Important for modules
      globals: {
        ...globals.browser, // Spread the browser globals
        // Add any custom globals if needed
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
    plugins: {
      '@typescript-eslint': true, 
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ...reactHooks.configs.recommended.rules,  // You might not need this as it's included in extends
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Add or override specific rules here.  For example:
      '@typescript-eslint/explicit-function-return-type': 'warn', // Example: Require explicit return types
      'no-unused-vars': 'warn', // Example: Warn about unused variables
      'no-console': 'warn', // Example: Warn about console.log statements
      // 'react/prop-types': 'off', // If you're using TypeScript, you likely don't need prop-types
      // 'react/jsx-no-useless-fragment': 'warn',
      // 'react/self-closing-comp': 'warn',
      // 'react/style-prop-object': 'warn',
    },
  },
);