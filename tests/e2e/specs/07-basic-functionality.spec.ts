import { test, expect } from '@playwright/test';

/**
 * Basic E2E Tests for Genshi Studio Parametric Pattern Editor
 * Testing the static HTML implementation
 */
test.describe('Basic Genshi Studio Tests', () => {
  test('should load the parametric pattern editor page', async ({ page }) => {
    // Navigate to the parametric pattern editor
    await page.goto('http://localhost:5173/index-parametric.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Genshi Studio/);
    
    // Check if canvas is present
    const canvas = page.locator('canvas#patternCanvas');
    await expect(canvas).toBeVisible();
  });

  test('should have all 8 pattern type buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Pattern types to check
    const patternTypes = [
      'mandala',
      'celtic',
      'islamic',
      'fractal',
      'organic',
      'mathematical',
      'cultural',
      'tiling'
    ];
    
    // Check each pattern button exists and is clickable
    for (const pattern of patternTypes) {
      const button = page.locator(`button[onclick*="${pattern}"], button:has-text("${pattern}")`, { hasText: new RegExp(pattern, 'i') });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }
  });

  test('should have parameter controls', async ({ page }) => {
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Check for parameter sliders
    const parameterContainer = page.locator('#parameters');
    await expect(parameterContainer).toBeVisible();
    
    // Check for at least one slider
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    expect(sliderCount).toBeGreaterThan(0);
  });

  test('should generate patterns when clicking pattern buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Click on mandala pattern button
    const mandalaButton = page.locator('button:has-text("Mandala")').first();
    await mandalaButton.click();
    
    // Wait a moment for pattern generation
    await page.waitForTimeout(1000);
    
    // Verify canvas has been drawn to (check if not empty)
    const canvasDataUrl = await page.locator('canvas#patternCanvas').evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Check if canvas has any non-transparent pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((value, index) => {
        // Check alpha channel (every 4th value)
        return index % 4 === 3 && value > 0;
      });
      
      return hasContent ? canvas.toDataURL() : null;
    });
    
    expect(canvasDataUrl).not.toBeNull();
  });

  test('should have export functionality', async ({ page }) => {
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Check for export button
    const exportButton = page.locator('button:has-text("Export")').first();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Check canvas is still visible
    const canvas = page.locator('canvas#patternCanvas');
    await expect(canvas).toBeVisible();
    
    // Check pattern buttons are accessible
    const patternButtons = page.locator('button').filter({ hasText: /mandala|celtic|islamic|fractal/i });
    const buttonCount = await patternButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should update canvas when changing parameters', async ({ page }) => {
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Generate a pattern first
    const mandalaButton = page.locator('button:has-text("Mandala")').first();
    await mandalaButton.click();
    await page.waitForTimeout(500);
    
    // Get initial canvas state
    const initialCanvasData = await page.locator('canvas#patternCanvas').evaluate((canvas: HTMLCanvasElement) => {
      return canvas.toDataURL();
    });
    
    // Change a parameter slider
    const firstSlider = page.locator('input[type="range"]').first();
    const sliderValue = await firstSlider.evaluate((el: HTMLInputElement) => el.value);
    const newValue = parseInt(sliderValue) + 10;
    await firstSlider.fill(newValue.toString());
    
    // Trigger change event
    await firstSlider.dispatchEvent('input');
    await page.waitForTimeout(500);
    
    // Get updated canvas state
    const updatedCanvasData = await page.locator('canvas#patternCanvas').evaluate((canvas: HTMLCanvasElement) => {
      return canvas.toDataURL();
    });
    
    // Canvas should have changed
    expect(updatedCanvasData).not.toBe(initialCanvasData);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Set up console error listener
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to page
    await page.goto('http://localhost:5173/index-parametric.html');
    await page.waitForLoadState('networkidle');
    
    // Try various pattern types to check for errors
    const patternButtons = page.locator('button').filter({ hasText: /mandala|celtic|islamic|fractal/i });
    const buttonCount = await patternButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 4); i++) {
      await patternButtons.nth(i).click();
      await page.waitForTimeout(500);
    }
    
    // Check no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});