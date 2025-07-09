# Critical Fixes Quick Reference - Genshi Studio

## 🚨 TOP PRIORITY FIXES (Do These First!)

### 1. Fix fabric.js Imports
**File**: `src/components/LayersPanel.tsx`, `src/components/PropertiesPanel.tsx`, `src/components/studio/Canvas.tsx`
```typescript
// WRONG:
import { fabric } from 'fabric';

// CORRECT:
import { fabric } from 'fabric/fabric-impl';
// OR
import fabric from 'fabric';
```

### 2. Create vite.config.ts
**Location**: Project root
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
```

### 3. Update package.json Scripts
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "jest",
  "test:e2e": "playwright test",
  "lint": "eslint src --ext .ts,.tsx"
}
```

### 4. Install Missing Dependencies
```bash
npm install --save-dev jest-environment-jsdom
```

### 5. Fix React Imports (Choose One Approach)

**Option A**: Remove unused React imports
```typescript
// Remove this line if React is not used directly
import React from 'react';
```

**Option B**: Configure JSX Transform in tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

## 📊 Error Summary by Category

| Error Type | Count | Priority |
|------------|-------|----------|
| Import errors | 45 | CRITICAL |
| Unused variables | 89 | HIGH |
| Type annotations | 37 | MEDIUM |
| Missing exports | 22 | HIGH |

## 🔧 Common Type Fixes

### Fix Implicit Any
```typescript
// WRONG:
layers.forEach((obj, index) => {

// CORRECT:
layers.forEach((obj: fabric.Object, index: number) => {
```

### Fix Property Access
```typescript
// WRONG:
pattern.setParameters({...})

// CORRECT:
pattern.setParameter('name', value)
// OR check if method exists
```

## ✅ Success Checklist

- [ ] TypeScript compiles with 0 errors
- [ ] `npm run dev` starts Vite server on port 5173
- [ ] `npm test` runs without configuration errors
- [ ] `npm run test:e2e` executes Playwright tests
- [ ] Application loads in browser without console errors

## 🚀 Quick Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Start dev server (after fixes)
npm run dev

# Run E2E tests
npm run test:e2e

# Check for lint issues
npm run lint
```

---
**Remember**: Fix imports and server config FIRST, then tackle other errors!