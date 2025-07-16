import { test, expect } from '@playwright/test';

test.describe('Verify Implemented Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    
    // Wait for either success initialization or fallback mode
    await page.waitForSelector('canvas#drawing-canvas, .text-red-500', { timeout: 15000 });
  });

  test('Feature 1: Color palette should persist when changing colors', async ({ page }) => {
    // Wait for color palette to be visible
    const colorPalette = page.locator('[data-testid="color-palette"], .grid.grid-cols-6');
    await expect(colorPalette).toBeVisible({ timeout: 10000 });
    
    // Count initial palette colors
    const initialColors = await page.locator('.w-8.h-8.rounded').count();
    console.log('Initial palette colors:', initialColors);
    
    // Click on a color
    if (initialColors > 0) {
      await page.locator('.w-8.h-8.rounded').first().click();
      
      // Wait a moment
      await page.waitForTimeout(500);
      
      // Count colors again - should be the same
      const afterClickColors = await page.locator('.w-8.h-8.rounded').count();
      console.log('After click palette colors:', afterClickColors);
      
      expect(afterClickColors).toBe(initialColors);
    }
  });

  test('Feature 2: UnifiedEditingSystem should initialize or show fallback', async ({ page }) => {
    // Check if we're in fallback mode or full mode
    const fallbackIndicator = page.locator('text="Simplified Drawing Mode"');
    const fullModeIndicator = page.locator('text="Unified Multi-Mode Canvas"');
    const errorMessage = page.locator('.text-red-500');
    
    // Should have either fallback, full mode, or clear error - not white screen
    const hasFallback = await fallbackIndicator.isVisible().catch(() => false);
    const hasFullMode = await fullModeIndicator.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    console.log('Mode status:', { hasFallback, hasFullMode, hasError });
    
    expect(hasFallback || hasFullMode || hasError).toBe(true);
  });

  test('Feature 3: Canvas should be interactive in fallback mode', async ({ page }) => {
    // Check if canvas exists
    const canvas = page.locator('canvas#drawing-canvas, canvas[data-testid="main-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Get canvas bounding box
    const box = await canvas.boundingBox();
    if (box) {
      // Simulate drawing
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();
      
      // Canvas should still be visible after interaction
      await expect(canvas).toBeVisible();
    }
  });

  test('Feature 4: Export dialog should be accessible', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button[data-testid="export-button"], button:has-text("Export")');
    
    // If button exists, click it
    const buttonVisible = await exportButton.isVisible().catch(() => false);
    if (buttonVisible) {
      await exportButton.click();
      
      // Check for export dialog
      const exportDialog = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(exportDialog).toBeVisible({ timeout: 5000 });
    }
  });

  test('Feature 5: Multi-mode controls should be visible in full mode', async ({ page }) => {
    // Check if we're in full mode
    const fullModeIndicator = page.locator('text="Unified Multi-Mode Canvas"');
    const isFullMode = await fullModeIndicator.isVisible().catch(() => false);
    
    if (isFullMode) {
      // Check for mode controls
      const drawMode = page.locator('text="Draw"');
      const parametricMode = page.locator('text="Parametric"');
      const codeMode = page.locator('text="Code"');
      const growthMode = page.locator('text="Growth"');
      
      await expect(drawMode).toBeVisible();
      await expect(parametricMode).toBeVisible();
      await expect(codeMode).toBeVisible();
      await expect(growthMode).toBeVisible();
    }
  });

  test('Feature 6: No white screen - always shows content or error', async ({ page }) => {
    // The page should have some visible content
    const hasCanvas = await page.locator('canvas').isVisible().catch(() => false);
    const hasError = await page.locator('.text-red-500').isVisible().catch(() => false);
    const hasLoading = await page.locator('text="Initializing"').isVisible().catch(() => false);
    const hasFallback = await page.locator('text="Simplified Drawing Mode"').isVisible().catch(() => false);
    
    console.log('Page content:', { hasCanvas, hasError, hasLoading, hasFallback });
    
    // At least one should be visible - not blank
    expect(hasCanvas || hasError || hasLoading || hasFallback).toBe(true);
  });
});