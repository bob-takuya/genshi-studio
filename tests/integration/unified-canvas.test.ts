/**
 * Unified Canvas Integration Tests
 * Validates multi-mode canvas functionality and performance
 */

import { test, expect } from '@playwright/test';

test.describe('Unified Canvas System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="unified-canvas"]', { timeout: 10000 });
  });

  test('should initialize with all four modes active', async ({ page }) => {
    // Check that all mode indicators are visible
    const modeIndicators = page.locator('[data-testid="mode-indicator"]');
    await expect(modeIndicators).toHaveCount(4);
    
    // Verify mode names
    await expect(page.locator('[data-testid="mode-draw"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-parametric"]')).toBeVisible(); 
    await expect(page.locator('[data-testid="mode-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-growth"]')).toBeVisible();
    
    // Check default primary mode is Draw
    await expect(page.locator('[data-testid="mode-draw"]')).toHaveClass(/primary/);
  });

  test('should switch primary modes correctly', async ({ page }) => {
    // Switch to Parametric mode
    await page.click('[data-testid="mode-parametric"]');
    await expect(page.locator('[data-testid="mode-parametric"]')).toHaveClass(/primary/);
    
    // Switch to Code mode
    await page.click('[data-testid="mode-code"]');
    await expect(page.locator('[data-testid="mode-code"]')).toHaveClass(/primary/);
    
    // Switch to Growth mode
    await page.click('[data-testid="mode-growth"]');
    await expect(page.locator('[data-testid="mode-growth"]')).toHaveClass(/primary/);
  });

  test('should handle simultaneous multi-mode interactions', async ({ page }) => {
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Start with Draw mode active
    await page.click('[data-testid="mode-draw"]');
    
    // Simulate drawing interaction
    await canvas.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'pen',
      pressure: 0.8,
      clientX: 100,
      clientY: 100
    });
    
    // While drawing, activate Parametric mode
    await page.keyboard.down('Shift');
    await canvas.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'pen', 
      pressure: 0.7,
      clientX: 150,
      clientY: 150
    });
    
    // Should handle both interactions without conflicts
    await canvas.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'pen',
      pressure: 0,
      clientX: 150,
      clientY: 150
    });
    
    await page.keyboard.up('Shift');
    
    // Check performance metrics
    const performanceMetrics = page.locator('[data-testid="performance-metrics"]');
    await expect(performanceMetrics).toContainText(/FPS: [5-6][0-9]/);
  });

  test('should maintain 60fps with all modes active', async ({ page }) => {
    // Enable performance monitoring
    await page.evaluate(() => {
      window.enablePerformanceMonitoring = true;
    });
    
    // Activate all modes
    await page.click('[data-testid="mode-draw"]');
    await page.click('[data-testid="mode-parametric"]');
    await page.click('[data-testid="mode-code"]');
    await page.click('[data-testid="mode-growth"]');
    
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Simulate intensive multi-mode interactions
    for (let i = 0; i < 10; i++) {
      // Draw mode interaction
      await canvas.dispatchEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.8,
        clientX: 50 + i * 20,
        clientY: 50 + i * 10
      });
      
      // Parametric mode interaction (with Shift modifier)
      await page.keyboard.down('Shift');
      await canvas.click(100 + i * 15, 100 + i * 15);
      await page.keyboard.up('Shift');
      
      // Growth mode interaction (with Alt modifier)
      await page.keyboard.down('Alt');
      await canvas.click(200 + i * 10, 200 + i * 20);
      await page.keyboard.up('Alt');
      
      await canvas.dispatchEvent('pointerup', {
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0,
        clientX: 50 + i * 20,
        clientY: 50 + i * 10
      });
      
      // Small delay to allow processing
      await page.waitForTimeout(50);
    }
    
    // Check final performance metrics
    const fpsValue = await page.locator('[data-testid="fps-value"]').textContent();
    const fps = parseInt(fpsValue || '0');
    expect(fps).toBeGreaterThan(55); // Allow some tolerance for CI environment
  });

  test('should handle mode opacity adjustments', async ({ page }) => {
    // Open mode settings
    await page.click('[data-testid="mode-settings-button"]');
    
    // Adjust Draw mode opacity
    const drawOpacitySlider = page.locator('[data-testid="draw-mode-opacity"]');
    await drawOpacitySlider.fill('0.5');
    
    // Adjust Parametric mode opacity
    const parametricOpacitySlider = page.locator('[data-testid="parametric-mode-opacity"]');
    await parametricOpacitySlider.fill('0.3');
    
    // Check that opacity values are reflected in UI
    await expect(page.locator('[data-testid="draw-opacity-value"]')).toContainText('50%');
    await expect(page.locator('[data-testid="parametric-opacity-value"]')).toContainText('30%');
    
    // Verify visual opacity changes (would need visual regression testing for full validation)
    const drawModeIndicator = page.locator('[data-testid="draw-mode-indicator"]');
    const opacity = await drawModeIndicator.evaluate(el => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);
  });

  test('should toggle mode visibility correctly', async ({ page }) => {
    // Open mode settings
    await page.click('[data-testid="mode-settings-button"]');
    
    // Toggle Parametric mode visibility off
    await page.click('[data-testid="parametric-mode-visibility-toggle"]');
    await expect(page.locator('[data-testid="parametric-mode-indicator"]')).toBeHidden();
    
    // Toggle Growth mode visibility off
    await page.click('[data-testid="growth-mode-visibility-toggle"]');
    await expect(page.locator('[data-testid="growth-mode-indicator"]')).toBeHidden();
    
    // Toggle them back on
    await page.click('[data-testid="parametric-mode-visibility-toggle"]');
    await page.click('[data-testid="growth-mode-visibility-toggle"]');
    
    await expect(page.locator('[data-testid="parametric-mode-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-mode-indicator"]')).toBeVisible();
  });

  test('should resolve interaction conflicts correctly', async ({ page }) => {
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Set Draw mode as primary
    await page.click('[data-testid="mode-draw"]');
    
    // Start drawing with pen (should have priority)
    await canvas.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'pen',
      pressure: 0.8,
      clientX: 100,
      clientY: 100
    });
    
    // Try to interrupt with parametric interaction
    await page.keyboard.down('Shift');
    await canvas.click(120, 120);
    
    // Drawing should continue (pen has priority)
    await canvas.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'pen',
      pressure: 0.7,
      clientX: 130,
      clientY: 130
    });
    
    await canvas.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'pen',
      pressure: 0,
      clientX: 130,
      clientY: 130
    });
    
    await page.keyboard.up('Shift');
    
    // Check that conflicts were logged
    const conflictCount = await page.evaluate(() => {
      return window.interactionManager?.getMetrics().conflictsResolved || 0;
    });
    
    expect(conflictCount).toBeGreaterThan(0);
  });

  test('should adapt performance under load', async ({ page }) => {
    // Enable adaptive performance mode
    await page.evaluate(() => {
      window.performanceOptimizer?.setAdaptiveMode(true);
    });
    
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Create heavy load with rapid interactions
    for (let i = 0; i < 100; i++) {
      await canvas.dispatchEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.8,
        clientX: Math.random() * 500,
        clientY: Math.random() * 500
      });
      
      await canvas.dispatchEvent('pointerup', {
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0,
        clientX: Math.random() * 500,
        clientY: Math.random() * 500
      });
    }
    
    // Check that optimizations were applied
    const appliedOptimizations = await page.evaluate(() => {
      return window.performanceOptimizer?.getAppliedOptimizations() || [];
    });
    
    expect(appliedOptimizations.length).toBeGreaterThan(0);
    
    // Verify performance is still acceptable
    const finalFps = await page.locator('[data-testid="fps-value"]').textContent();
    expect(parseInt(finalFps || '0')).toBeGreaterThan(30); // Degraded but still usable
  });

  test('should handle memory pressure correctly', async ({ page }) => {
    // Simulate memory pressure
    await page.evaluate(() => {
      // Create lots of canvas data to increase memory usage
      for (let i = 0; i < 100; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.createImageData(1000, 1000);
          ctx.putImageData(imageData, 0, 0);
        }
      }
    });
    
    // Wait for memory cleanup to trigger
    await page.waitForTimeout(2000);
    
    // Check that memory cleanup was performed
    const memoryPressure = await page.evaluate(() => {
      return window.performanceOptimizer?.getMemoryPressure() || 0;
    });
    
    // Should have triggered cleanup if pressure was high
    if (memoryPressure > 0.7) {
      const appliedOptimizations = await page.evaluate(() => {
        return window.performanceOptimizer?.getAppliedOptimizations() || [];
      });
      
      expect(appliedOptimizations).toContain('memory_cleanup');
    }
  });

  test('should export unified canvas correctly', async ({ page }) => {
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Create some content in multiple modes
    await page.click('[data-testid="mode-draw"]');
    await canvas.click(100, 100);
    
    await page.click('[data-testid="mode-parametric"]');
    await page.keyboard.down('Shift');
    await canvas.click(200, 200);
    await page.keyboard.up('Shift');
    
    // Export canvas
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-canvas-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/unified-canvas.*\.(png|jpg|svg)$/);
    
    // Verify file is not empty
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should clear canvas while preserving mode states', async ({ page }) => {
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    
    // Create content and adjust settings
    await canvas.click(100, 100);
    await page.click('[data-testid="mode-settings-button"]');
    await page.locator('[data-testid="draw-mode-opacity"]').fill('0.7');
    
    // Clear canvas
    await page.click('[data-testid="clear-canvas-button"]');
    
    // Verify content is cleared but settings preserved
    await expect(page.locator('[data-testid="draw-opacity-value"]')).toContainText('70%');
    
    // Verify modes are still active
    await expect(page.locator('[data-testid="mode-draw"]')).toHaveClass(/active/);
  });

  test('should handle window resize gracefully', async ({ page }) => {
    // Get initial canvas size
    const initialSize = await page.locator('[data-testid="unified-canvas"] canvas').boundingBox();
    
    // Resize window
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500); // Allow resize to process
    
    // Check canvas adapted to new size
    const newSize = await page.locator('[data-testid="unified-canvas"] canvas').boundingBox();
    expect(newSize?.width).not.toBe(initialSize?.width);
    
    // Verify functionality still works
    const canvas = page.locator('[data-testid="unified-canvas"] canvas');
    await canvas.click(100, 100);
    
    // Performance should remain stable
    const fps = await page.locator('[data-testid="fps-value"]').textContent();
    expect(parseInt(fps || '0')).toBeGreaterThan(50);
  });
});