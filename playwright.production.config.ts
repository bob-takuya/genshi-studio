import { defineConfig, devices } from '@playwright/test';

/**
 * Production Playwright Configuration for Genshi Studio
 * Testing deployed GitHub Pages application
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/results',
  
  // Test execution settings for production
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 3,
  
  // Reporting for production testing
  reporter: [
    ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
    ['json', { outputFile: 'tests/reports/production-results.json' }],
    ['junit', { outputFile: 'tests/reports/production-junit.xml' }],
    ['list'],
  ],
  
  // Global test settings for production
  use: {
    // Production GitHub Pages URL
    baseURL: 'https://homeserver.github.io/genshi-studio/',
    
    // Artifact collection
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport and device emulation
    viewport: { width: 1280, height: 720 },
    
    // Extended timeouts for production environment
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    // Request interception
    bypassCSP: true,
    
    // User agent for production testing
    userAgent: 'Genshi-Studio-Production-E2E-Tests/1.0',
    
    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Browser context options
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  
  // Extended timeout for production testing
  timeout: 90000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      // Visual regression settings for production
      maxDiffPixels: 200,
      threshold: 0.25,
      animations: 'disabled',
    },
  },
  
  // Multi-browser testing projects for production
  projects: [
    // Desktop browsers
    {
      name: 'chromium-production',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },
    {
      name: 'firefox-production',
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
      name: 'webkit-production',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers for production
    {
      name: 'mobile-chrome-production',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari-production',
      use: { ...devices['iPhone 13'] },
    },
    
    // Performance testing for production
    {
      name: 'performance-production',
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
  ],
});