import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './temp',
  outputDir: './temp/results',
  
  // Test execution settings
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  
  // Reporting
  reporter: [
    ['list'],
  ],
  
  // Global test settings
  use: {
    // No webserver - testing external URL
    baseURL: 'https://bob-takuya.github.io/genshi-studio/',
    
    // Artifact collection
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    
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