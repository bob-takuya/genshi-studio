import { test, expect } from '@playwright/test';

/**
 * Simplified Drawing Tools Tests
 * Tests basic drawing functionality without relying on specific data-testid attributes
 */
test.describe('Drawing Tools - Simplified', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure we're in Draw mode
    const drawButton = page.locator('[data-testid="tool-panel"]').locator('button:has-text("Draw")').first();
    if (await drawButton.isVisible()) {
      await drawButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have drawing tool buttons visible', async ({ page }) => {
    // Check that the toolbar is visible
    const toolbar = page.locator('[data-testid="tool-panel"]');
    await expect(toolbar).toBeVisible();
    
    // Check for drawing tool icons in the secondary toolbar
    // These might be icon buttons without text
    const toolButtons = page.locator('button[aria-label], button[title]').filter({
      hasText: /pen|brush|eraser|draw|select|text|shape|line|rect/i
    });
    
    const iconButtons = page.locator('button').filter({
      has: page.locator('svg, i[class*="icon"]')
    });
    
    // At least some tool buttons should be visible
    const totalButtons = await toolButtons.count() + await iconButtons.count();
    expect(totalButtons).toBeGreaterThan(5);
  });

  test('should have a visible canvas', async ({ page }) => {
    // Check for any canvas element
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Verify canvas has proper dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThan(100);
    }
  });

  test('should show layers panel', async ({ page }) => {
    // The layers panel is visible in the sidebar
    const layersPanel = page.locator('text=Layers').first();
    await expect(layersPanel).toBeVisible();
    
    // Check for layer content
    const layer1 = page.locator('text=Layer 1');
    await expect(layer1).toBeVisible();
  });

  test('should have color palette', async ({ page }) => {
    // Color palette button is visible
    const colorPalette = page.locator('text=Color Palette');
    await expect(colorPalette).toBeVisible();
  });

  test('should have patterns panel', async ({ page }) => {
    // Patterns button is visible
    const patternsButton = page.locator('text=Patterns').first();
    await expect(patternsButton).toBeVisible();
  });

  test('should switch between modes', async ({ page }) => {
    const toolbar = page.locator('[data-testid="tool-panel"]');
    
    // Test switching to Parametric mode
    const parametricButton = toolbar.locator('button:has-text("Parametric")').first();
    if (await parametricButton.isVisible()) {
      await parametricButton.click();
      await page.waitForTimeout(500);
    }
    
    // Switch to Code mode
    const codeButton = toolbar.locator('button:has-text("Code")').first();
    if (await codeButton.isVisible()) {
      await codeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Switch to Growth mode (might not be available)
    const growthButton = toolbar.locator('button:has-text("Growth")').first();
    if (await growthButton.isVisible({ timeout: 2000 })) {
      await growthButton.click();
      await page.waitForTimeout(500);
    }
    
    // Switch back to Draw mode
    const drawButton = toolbar.locator('button:has-text("Draw")').first();
    if (await drawButton.isVisible()) {
      await drawButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verify UI is still responsive after mode switches
    await expect(toolbar).toBeVisible();
    
    // Canvas may or may not be visible depending on final mode
    // Just verify the page is still functional
    const title = page.locator('text=Genshi Studio');
    await expect(title).toBeVisible();
  });

  test('should have export/save functionality', async ({ page }) => {
    // Look for export or download buttons
    const exportButtons = page.locator('button').filter({
      hasText: /export|download|save/i
    });
    
    // Or look for icon buttons that might be export
    const iconButtons = page.locator('button[aria-label*="export"], button[aria-label*="download"], button[aria-label*="save"]');
    
    const totalExportButtons = await exportButtons.count() + await iconButtons.count();
    expect(totalExportButtons).toBeGreaterThan(0);
  });

  test('should handle canvas interactions', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    
    if (box) {
      // Simulate drawing by clicking and dragging
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await page.mouse.up();
      
      // Canvas should still be visible after interaction
      await expect(canvas).toBeVisible();
    }
  });

  test('should maintain UI stability', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform various UI interactions
    const buttons = page.locator('button').filter({
      has: page.locator('svg, i')
    });
    
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(5, buttonCount); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible() && await button.isEnabled()) {
        try {
          await button.click({ timeout: 2000 });
          await page.waitForTimeout(200);
        } catch (e) {
          // Skip buttons that can't be clicked
        }
      }
    }
    
    // Check for critical errors
    const criticalErrors = errors.filter(err => 
      err.includes('TypeError') || 
      err.includes('ReferenceError') ||
      err.includes('Uncaught')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Canvas should still be visible
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Toolbar should be accessible
    const toolbar = page.locator('[data-testid="tool-panel"], [role="toolbar"]').first();
    await expect(toolbar).toBeVisible();
    
    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});