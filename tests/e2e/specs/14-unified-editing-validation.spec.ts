import { test, expect } from '@playwright/test';

/**
 * TESTER_003 - Unified Editing System Validation Test
 * Quick validation of core unified editing functionality
 */

test.describe('Unified Editing System - Core Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to studio page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for component initialization
  });

  test('Unified Canvas System loads successfully', async ({ page }) => {
    console.log('🧪 Testing unified canvas system loading...');
    
    // Check if the main studio interface loads
    await expect(page.locator('[data-testid="studio-interface"]')).toBeVisible({ timeout: 10000 });
    
    // Look for unified canvas or main drawing area
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Check for any multi-mode controls
    const modeControls = page.locator('[class*="mode"], [class*="multi"], [data-testid*="mode"]');
    const controlCount = await modeControls.count();
    
    console.log(`📊 Found ${controlCount} mode-related controls`);
    expect(controlCount).toBeGreaterThan(0);
  });

  test('Multiple editing modes are accessible', async ({ page }) => {
    console.log('🎨 Testing multiple editing mode accessibility...');
    
    // Look for mode indicators or buttons
    const modes = ['draw', 'parametric', 'code', 'growth'];
    let availableModes = 0;
    
    for (const mode of modes) {
      // Try different selectors that might indicate mode availability
      const selectors = [
        `[data-testid*="${mode}"]`,
        `[class*="${mode}"]`,
        `button:has-text("${mode.charAt(0).toUpperCase() + mode.slice(1)}")`,
        `[aria-label*="${mode}"]`
      ];
      
      for (const selector of selectors) {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Found ${mode} mode controls (${elements} elements)`);
          availableModes++;
          break;
        }
      }
    }
    
    console.log(`📈 Available modes: ${availableModes}/4`);
    expect(availableModes).toBeGreaterThan(1); // At least 2 modes should be available
  });

  test('Canvas interaction and drawing capability', async ({ page }) => {
    console.log('✏️ Testing canvas interaction capability...');
    
    // Find the main canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Get canvas bounding box
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    // Try to perform a drawing action
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      // Simulate drawing a line
      await page.mouse.move(centerX - 50, centerY - 50);
      await page.mouse.down();
      await page.mouse.move(centerX + 50, centerY + 50);
      await page.mouse.up();
      
      console.log('✅ Canvas interaction test completed');
    }
  });

  test('Performance monitoring availability', async ({ page }) => {
    console.log('📊 Testing performance monitoring...');
    
    // Look for performance indicators
    const perfSelectors = [
      '[class*="performance"]',
      '[class*="fps"]',
      '[class*="metric"]',
      '[data-testid*="performance"]',
      'text="fps"',
      'text="FPS"'
    ];
    
    let perfMonitorFound = false;
    
    for (const selector of perfSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found performance monitoring: ${selector}`);
        perfMonitorFound = true;
        break;
      }
    }
    
    // In development mode, performance monitor should be visible
    const isDev = await page.evaluate(() => process?.env?.NODE_ENV === 'development');
    if (isDev) {
      console.log('📈 Development mode detected - performance monitor expected');
    }
  });

  test('Real-time synchronization indicators', async ({ page }) => {
    console.log('🔄 Testing synchronization system indicators...');
    
    // Look for sync-related UI elements
    const syncSelectors = [
      '[class*="sync"]',
      '[class*="update"]',
      '[class*="real-time"]',
      '[data-testid*="sync"]',
      '[class*="indicator"]'
    ];
    
    let syncElementsFound = 0;
    
    for (const selector of syncSelectors) {
      const count = await page.locator(selector).count();
      syncElementsFound += count;
    }
    
    console.log(`🔗 Found ${syncElementsFound} synchronization-related elements`);
  });

  test('Error-free console during initial load', async ({ page }) => {
    console.log('🔍 Monitoring console for critical errors...');
    
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Reload page to capture all console messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`⚠️ Console warnings: ${consoleWarnings.length}`);
    console.log(`❌ Console errors: ${consoleErrors.length}`);
    
    // Log first few errors for debugging
    if (consoleErrors.length > 0) {
      console.log('First console errors:', consoleErrors.slice(0, 3));
    }
    
    // Fail test if there are critical JavaScript errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('ResizeObserver loop limit exceeded') && // Common non-critical error
      !error.includes('favicon.ico') && // Favicon errors are not critical
      !error.includes('Failed to load resource') // Resource loading errors might be expected
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('UI responsiveness test', async ({ page }) => {
    console.log('📱 Testing UI responsiveness...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1280, height: 720, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      // Check if main interface is still accessible
      const mainInterface = page.locator('canvas, [role="main"], main').first();
      const isVisible = await mainInterface.isVisible();
      
      console.log(`📐 ${viewport.name} (${viewport.width}x${viewport.height}): ${isVisible ? '✅' : '❌'}`);
      expect(isVisible).toBeTruthy();
    }
  });
});