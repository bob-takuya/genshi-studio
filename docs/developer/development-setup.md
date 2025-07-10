# Genshi Studio Development Setup

*Complete guide to setting up your development environment*

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Installation](#project-installation)
4. [Development Tools](#development-tools)
5. [Testing Setup](#testing-setup)
6. [Common Issues](#common-issues)
7. [Development Workflow](#development-workflow)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- Node.js 18.0+ (LTS recommended)
- npm 9.0+ or pnpm 8.0+
- Git 2.30+
- 8GB RAM
- Modern browser with WebGL 2.0 support

**Recommended:**
- Node.js 20.0+ (latest LTS)
- pnpm 8.0+ (faster package management)
- Git 2.40+
- 16GB+ RAM
- SSD storage
- High-resolution display (for precise visual work)

**Operating System Support:**
- macOS 11+ (Big Sur)
- Windows 10/11 with WSL2
- Ubuntu 20.04+ or equivalent Linux distribution

### Required Software

#### 1. Node.js Installation

**Using Node Version Manager (Recommended):**

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install nvm (Windows)
# Download and install from: https://github.com/coreybutler/nvm-windows

# Install and use Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version  # Should show v20.x.x or later
npm --version   # Should show v9.x.x or later
```

**Direct Installation:**
- Download from [nodejs.org](https://nodejs.org/)
- Choose LTS version for stability

#### 2. Package Manager

**Using pnpm (Recommended for performance):**

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**Using npm (Default):**
```bash
# npm comes with Node.js
npm --version
```

#### 3. Git Configuration

```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up SSH key for GitHub (optional but recommended)
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add the public key to your GitHub account
```

## Environment Setup

### IDE Configuration

#### Visual Studio Code (Recommended)

**Required Extensions:**

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint"
  ]
}
```

**Workspace Settings (.vscode/settings.json):**

```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    "cn\\(([^)]*)\\)"
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

**Launch Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:3001",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### WebStorm/IntelliJ Configuration

**TypeScript Configuration:**
- Enable TypeScript Language Service
- Set TypeScript version to project version
- Enable code completion and error checking

**Prettier Integration:**
- Install Prettier plugin
- Configure to run on save
- Set as default formatter

**Testing Integration:**
- Install Playwright plugin
- Configure test runner for Vitest
- Set up debugging configuration

### Environment Variables

**Create `.env.local` file in project root:**

```bash
# Development configuration
VITE_APP_TITLE="Genshi Studio (Dev)"
VITE_DEBUG_MODE=true
VITE_PERFORMANCE_MONITORING=true

# API Configuration (if using backend)
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_WEBGL=true
VITE_ENABLE_WORKERS=true
VITE_ENABLE_EXPERIMENTAL_FEATURES=false

# Analytics (dev environment)
VITE_ANALYTICS_ENABLED=false
VITE_SENTRY_DSN=""

# Local Storage Keys (to avoid conflicts)
VITE_STORAGE_PREFIX="genshi-dev-"
```

**Environment-specific configurations:**

```bash
# .env.development
VITE_LOG_LEVEL=debug
VITE_HOT_RELOAD=true

# .env.production
VITE_LOG_LEVEL=error
VITE_ANALYTICS_ENABLED=true

# .env.test
VITE_LOG_LEVEL=silent
VITE_MOCK_API=true
```

## Project Installation

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/bob-takuya/genshi-studio.git
cd genshi-studio

# Or use SSH (if configured)
git clone git@github.com:bob-takuya/genshi-studio.git
cd genshi-studio
```

### Install Dependencies

**Using pnpm (Recommended):**

```bash
# Install dependencies
pnpm install

# Install Playwright browsers for E2E testing
pnpm exec playwright install

# Verify installation
pnpm run --help
```

**Using npm:**

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Verify installation
npm run --help
```

### Project Structure Verification

```bash
# Verify project structure
ls -la

# Should see:
# - package.json
# - tsconfig.json
# - vite.config.ts
# - tailwind.config.js
# - playwright.config.ts
# - src/
# - tests/
# - docs/
```

## Development Tools

### Package Scripts

```json
{
  "scripts": {
    "dev": "vite --port 3001 --host",
    "build": "tsc && vite build",
    "preview": "vite preview --port 3002",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}",
    "format:check": "prettier --check src/**/*.{ts,tsx,css,md}"
  }
}
```

### Development Server

**Start development server:**

```bash
# Start with hot reload
pnpm dev

# Or with custom port
pnpm dev --port 3000

# With network access
pnpm dev --host 0.0.0.0
```

**Development server features:**
- Hot Module Replacement (HMR)
- TypeScript compilation
- CSS processing with Tailwind
- Asset optimization
- Source maps for debugging

### Build Process

**Development build:**

```bash
# Type check
pnpm type-check

# Build for development
pnpm build:dev

# Preview built application
pnpm preview
```

**Production build:**

```bash
# Full production build
pnpm build

# Analyze bundle size
pnpm build:analyze

# Build with source maps
pnpm build:debug
```

### Code Quality Tools

#### ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## Testing Setup

### Unit Testing with Vitest

**Configuration (vitest.config.ts):**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  }
})
```

**Test Setup (src/test/setup.ts):**

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Canvas API for pattern testing
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
  if (type === '2d') {
    return {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      arc: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      // Add other canvas methods as needed
    }
  }
  if (type === 'webgl2' || type === 'webgl') {
    return {
      getExtension: vi.fn(),
      getParameter: vi.fn(),
      createShader: vi.fn(),
      // Add WebGL methods as needed
    }
  }
  return null
})

// Mock Web Workers
class MockWorker {
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  
  constructor(url: string) {
    this.url = url
  }
  
  postMessage(data: any) {
    // Mock worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }))
      }
    }, 0)
  }
  
  terminate() {}
}

global.Worker = MockWorker as any
```

### E2E Testing with Playwright

**Configuration (playwright.config.ts):**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3001,
    reuseExistingServer: !process.env.CI
  }
})
```

## Common Issues

### Node.js Version Issues

**Problem:** TypeScript compilation errors or dependency conflicts

**Solution:**
```bash
# Check Node.js version
node --version

# Update to LTS if needed
nvm install --lts
nvm use --lts

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts

**Problem:** Development server won't start due to port being in use

**Solution:**
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:3001)

# Or use a different port
pnpm dev --port 3000
```

### WebGL Issues

**Problem:** WebGL not working in development

**Solution:**
1. **Check browser support:**
   - Visit [webglreport.com](https://webglreport.com/)
   - Ensure WebGL 2.0 is supported

2. **Enable hardware acceleration:**
   - Chrome: chrome://settings/ → Advanced → System
   - Firefox: about:config → webgl.force-enabled

3. **Update graphics drivers:**
   - Download latest drivers for your GPU

### Memory Issues

**Problem:** Out of memory errors during build or development

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Or add to package.json scripts
"build": "cross-env NODE_OPTIONS=\"--max-old-space-size=8192\" vite build"
```

### TypeScript Errors

**Problem:** TypeScript compilation issues

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Restart TypeScript server in VSCode
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Check TypeScript configuration
pnpm type-check
```

## Development Workflow

### Daily Development Process

1. **Start Development Session:**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install any new dependencies
   pnpm install
   
   # Start development server
   pnpm dev
   ```

2. **Feature Development:**
   ```bash
   # Create feature branch
   git checkout -b feature/new-pattern-type
   
   # Make changes...
   
   # Run tests frequently
   pnpm test
   
   # Check types
   pnpm type-check
   ```

3. **Code Quality Checks:**
   ```bash
   # Format code
   pnpm format
   
   # Lint code
   pnpm lint:fix
   
   # Run full test suite
   pnpm test:coverage
   pnpm test:e2e
   ```

4. **Commit Changes:**
   ```bash
   # Stage changes
   git add .
   
   # Commit with descriptive message
   git commit -m "feat: add new Islamic geometric pattern generator
   
   - Implement mathematical tessellation algorithm
   - Add parameter controls for star complexity
   - Include cultural context and history
   - Add comprehensive tests"
   
   # Push to remote
   git push origin feature/new-pattern-type
   ```

### Testing Workflow

**Unit Testing:**
```bash
# Run tests in watch mode
pnpm test

# Run specific test file
pnpm test pattern-generator

# Run with coverage
pnpm test:coverage

# Update snapshots
pnpm test -- -u
```

**E2E Testing:**
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e --grep "pattern creation"

# Run with UI mode for debugging
pnpm test:e2e:ui

# Run in headed mode
pnpm test:e2e --headed
```

### Performance Monitoring

**Built-in Tools:**
```bash
# Analyze bundle size
pnpm run build:analyze

# Check lighthouse scores
pnpm run lighthouse

# Monitor memory usage
pnpm run dev:memory
```

**Browser DevTools:**
- Performance tab for profiling
- Memory tab for leak detection
- Network tab for load analysis
- Application tab for storage inspection

### Debugging Setup

**VS Code Debugging:**
1. Set breakpoints in source code
2. Press F5 to start debugging
3. Choose "Launch Chrome" configuration
4. Debug in browser with source maps

**Browser Debugging:**
```javascript
// Add debug statements
console.log('Pattern generation started', params)
debugger // Pause execution

// Performance timing
console.time('pattern-generation')
// ... pattern generation code
console.timeEnd('pattern-generation')
```

**React DevTools:**
- Install React Developer Tools extension
- Inspect component state and props
- Profile component re-renders
- Analyze performance bottlenecks

---

## Next Steps

After completing the development setup:

1. **Read the [Code Architecture Guide](./code-architecture.md)**
2. **Explore the [Component Library](./component-library.md)**
3. **Follow the [Testing Guide](./testing-guide.md)**
4. **Review the [Contributing Guide](./contributing.md)**

## Support

If you encounter issues during setup:

1. Check the [Common Issues](#common-issues) section above
2. Search [GitHub Issues](https://github.com/bob-takuya/genshi-studio/issues)
3. Join our [Discord community](https://discord.gg/genshi-studio)
4. Create a new issue with detailed information

**Happy coding! 🎨**