import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Comprehensive Playwright Configuration for Genshi Studio
 * Multi-browser testing with visual regression and performance validation
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/results',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }],
    ['list'],
    ['dot'],
  ],
  
  // Global test settings
  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:3001/genshi-studio/',
    
    // Artifact collection
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport and device emulation
    viewport: { width: 1280, height: 720 },
    
    // Action timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Request interception
    bypassCSP: true,
    
    // User agent for better debugging
    userAgent: 'Genshi-Studio-E2E-Tests/1.0',
    
    // Permissions (removed for cross-browser compatibility)
    
    // Browser context options
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    
    // Storage state
    storageState: undefined,
  },
  
  // Test timeout
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      // Visual regression settings
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  
  // Projects for multi-browser testing
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.enabled': false,
            'media.peerconnection.enabled': false,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    
    // Tablet
    {
      name: 'tablet-safari',
      use: { ...devices['iPad Pro'] },
    },
    
    // High performance testing project
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--disable-frame-rate-limit',
          ],
        },
      },
    },
    
    // Accessibility testing project
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force high contrast mode for accessibility testing
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },
  ],
  
  // Local dev server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3001,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
    },
  },
});