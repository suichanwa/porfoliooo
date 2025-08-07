# Firebase API Keys Security Issue

## Issue Description
Firebase configuration with sensitive API keys and configuration details is hardcoded in the source code and committed to the public repository. This poses a security risk as the credentials are exposed publicly.

## Security Risk
- **File:** `src/utils/firebaseConfig.ts`
- **Exposed data:**
  - API Key: `AIzaSyBw67UWqoH-tQVyEqPDUlAjZWASJFHc5DA`
  - Auth Domain: `porfoliooo.firebaseapp.com`
  - Project ID: `porfoliooo`
  - Storage Bucket: `porfoliooo.appspot.com`
  - Messaging Sender ID: `627269340192`
  - App ID: `1:627269340192:web:566592916d2be3e0090045`
  - Measurement ID: `G-QSTD7G1DWC`

## Impact
- Unauthorized access to Firebase services
- Potential data breaches
- Service abuse and cost implications
- Privacy violations

## Solution

### Step 1: Environment Variables Setup
Create `.env` file (NOT committed to git):
```env
VITE_FIREBASE_API_KEY=AIzaSyBw67UWqoH-tQVyEqPDUlAjZWASJFHc5DA
VITE_FIREBASE_AUTH_DOMAIN=porfoliooo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=porfoliooo
VITE_FIREBASE_STORAGE_BUCKET=porfoliooo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=627269340192
VITE_FIREBASE_APP_ID=1:627269340192:web:566592916d2be3e0090045
VITE_FIREBASE_MEASUREMENT_ID=G-QSTD7G1DWC
```

### Step 2: Update Firebase Config
Modify `src/utils/firebaseConfig.ts`:
```typescript
// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Step 3: Update .gitignore
Add to `.gitignore`:
```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Step 4: Create .env.example
Create `.env.example` template:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 5: Update Documentation
Add to README.md:
```markdown
## Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration values
3. Never commit `.env` files to version control
```

## Files to Modify
- `src/utils/firebaseConfig.ts` - Use environment variables
- `.env` - Create with actual values (NOT committed)
- `.env.example` - Create template (committed)
- `.gitignore` - Add .env files
- `README.md` - Add setup instructions

## Additional Security Measures
1. **Firebase Security Rules:** Review and tighten Firestore security rules
2. **API Key Restrictions:** Configure API key restrictions in Firebase Console
3. **Domain Restrictions:** Limit API key usage to specific domains
4. **Monitoring:** Enable Firebase security monitoring

## Priority: HIGH
This exposes sensitive credentials and should be fixed immediately.

## Testing
- Verify application works with environment variables
- Test in both development and production modes
- Ensure no hardcoded credentials remain in codebase