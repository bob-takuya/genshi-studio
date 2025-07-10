import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/results',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['list'],
  ],
  
  // Global test settings
  use: {
    // Base URL for testing static build
    baseURL: 'http://localhost:8080',
    
    // Artifact collection
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport and device emulation
    viewport: { width: 1280, height: 720 },
    
    // Action timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Test timeout
  timeout: 60000,
  
  // Projects for multi-browser testing
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});