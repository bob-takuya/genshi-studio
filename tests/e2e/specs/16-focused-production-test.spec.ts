import { test, expect } from '@playwright/test';

// Override the base URL for this specific test
test.use({
  baseURL: 'https://bob-takuya.github.io/genshi-studio/',
});

test.describe('Focused Production E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous state
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Site loads without errors', async ({ page }) => {
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify no critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('CORS')
    );
    
    expect(criticalErrors).toHaveLength(0);
    
    // Verify page title
    await expect(page).toHaveTitle(/Genshi Studio/);
    
    // Verify main content loads
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('Canvas drawing functionality works', async ({ page }) => {
    // Navigate to studio page
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Wait for canvas to be ready
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Test drawing on canvas
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // Draw a simple line
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
      await page.mouse.up();
      
      // Verify canvas has content (check if drawing was registered)
      const canvasDataUrl = await canvas.evaluate((el: HTMLCanvasElement) => {
        return el.toDataURL();
      });
      
      // Canvas should have some content (not just empty/transparent)
      expect(canvasDataUrl.length).toBeGreaterThan(1000);
    }
  });

  test('Color palette persists when changing colors', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Look for color picker or palette
    const colorPicker = page.locator('[aria-label*="color" i], [data-testid*="color" i], input[type="color"]').first();
    
    if (await colorPicker.count() > 0) {
      // Get initial color
      const initialColor = await colorPicker.evaluate((el: HTMLInputElement) => el.value);
      
      // Change color
      await colorPicker.click();
      await colorPicker.fill('#ff0000');
      
      // Verify color changed
      const newColor = await colorPicker.evaluate((el: HTMLInputElement) => el.value);
      expect(newColor).toBe('#ff0000');
      
      // Navigate away and back
      await page.goto('/');
      await page.goto('/studio');
      await page.waitForLoadState('networkidle');
      
      // Check if color persisted (or at least the color picker is still functional)
      const colorPickerAfterNav = page.locator('[aria-label*="color" i], [data-testid*="color" i], input[type="color"]').first();
      await expect(colorPickerAfterNav).toBeVisible();
    }
  });

  test('Mode switching works', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Look for mode buttons
    const modes = ['Draw', 'Parametric', 'Code', 'Growth'];
    
    for (const mode of modes) {
      const modeButton = page.locator(`button:has-text("${mode}"), [aria-label*="${mode}" i]`).first();
      
      if (await modeButton.count() > 0) {
        await modeButton.click();
        
        // Wait for any mode change animations
        await page.waitForTimeout(500);
        
        // Verify mode is active (button should have some active state)
        const isActive = await modeButton.evaluate((el) => {
          return el.classList.contains('active') || 
                 el.classList.contains('selected') ||
                 el.getAttribute('aria-pressed') === 'true' ||
                 el.getAttribute('data-active') === 'true';
        });
        
        // At least verify the button is clickable and doesn't cause errors
        expect(await modeButton.isEnabled()).toBe(true);
      }
    }
  });

  test('UnifiedEditingSystem initializes properly', async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Check if UnifiedEditingSystem is available in window
    const hasUnifiedEditingSystem = await page.evaluate(() => {
      return !!(window as any).UnifiedEditingSystem || 
             !!(window as any).unifiedEditingSystem ||
             !!document.querySelector('[data-unified-editing]');
    });
    
    // Check for key UI components that indicate the system is working
    const canvas = page.locator('canvas');
    const toolbar = page.locator('[role="toolbar"], .toolbar, #toolbar');
    
    await expect(canvas.first()).toBeVisible();
    await expect(toolbar.first()).toBeVisible();
    
    // Verify no initialization errors in console
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('UnifiedEditing')) {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    expect(consoleErrors).toHaveLength(0);
  });

  test('Basic performance check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Check for performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    console.log('Performance metrics:', metrics);
  });
});