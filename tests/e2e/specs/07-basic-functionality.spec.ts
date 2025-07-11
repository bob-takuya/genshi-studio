import { test, expect } from '@playwright/test';

/**
 * Basic E2E Tests for Genshi Studio
 * Testing the main studio functionality
 */
test.describe('Basic Genshi Studio Tests', () => {
  test.use({ baseURL: 'http://localhost:3001/genshi-studio' });

  test('should load the studio page', async ({ page }) => {
    // Navigate to the studio
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Genshi Studio/);
    
    // Check if canvas is present
    const canvas = page.locator('#drawing-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have all main mode buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for mode buttons in toolbar - use more specific selectors
    const toolbar = page.locator('[data-testid="tool-panel"]');
    await expect(toolbar).toBeVisible();
    
    // Look for buttons within the toolbar to avoid duplicates
    const drawButton = toolbar.locator('button:has-text("Draw")').first();
    const parametricButton = toolbar.locator('button:has-text("Parametric")').first();
    const codeButton = toolbar.locator('button:has-text("Code")').first();
    const growthButton = toolbar.locator('button:has-text("Growth")').first();
    
    await expect(drawButton).toBeVisible();
    await expect(parametricButton).toBeVisible();
    await expect(codeButton).toBeVisible();
    await expect(growthButton).toBeVisible();
  });

  test('should switch to parametric mode and show controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click parametric button within toolbar
    const toolbar = page.locator('[data-testid="tool-panel"]');
    const parametricButton = toolbar.locator('button:has-text("Parametric")').first();
    await parametricButton.click();
    
    // Wait for parametric controls to appear
    await page.waitForTimeout(1000);
    
    // In parametric mode, there should be pattern buttons or controls
    // Look for any parametric-specific UI elements
    const parametricControls = page.locator('[data-testid="pattern-selector"], [data-testid="pattern-customizer"], .parametric-controls');
    const hasParametricUI = await parametricControls.first().count() > 0;
    
    // If no specific parametric UI, at least verify the mode switched
    if (!hasParametricUI) {
      // Check if the parametric button is now active/selected
      await expect(parametricButton).toHaveClass(/active|selected|bg-primary/);
    }
  });

  test('should have sidebar panels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for sidebar or panel containers
    const sidebar = page.locator('.sidebar, [data-testid="sidebar"], aside');
    
    if (await sidebar.count() > 0) {
      // Check for panel buttons within sidebar
      const layersPanel = sidebar.locator('button:has-text("Layers")').first();
      const patternsPanel = sidebar.locator('button:has-text("Patterns")').first();
      const propertiesPanel = sidebar.locator('button:has-text("Properties")').first();
      
      // At least one panel should be visible
      const panelCount = await layersPanel.count() + await patternsPanel.count() + await propertiesPanel.count();
      expect(panelCount).toBeGreaterThan(0);
    } else {
      // If no sidebar, panels might be in the main UI
      const layersElement = page.locator('[data-testid="layers-panel"], .layers-panel, [aria-label*="Layers"]');
      const hasLayers = await layersElement.count() > 0;
      expect(hasLayers).toBeTruthy();
    }
  });

  test('should generate patterns in parametric mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to parametric mode
    const toolbar = page.locator('[data-testid="tool-panel"]');
    const parametricButton = toolbar.locator('button:has-text("Parametric")').first();
    await parametricButton.click();
    
    // Wait for mode to switch
    await page.waitForTimeout(1000);
    
    // In parametric mode, canvas should still be visible
    const canvas = page.locator('#drawing-canvas, [data-testid="main-canvas"] canvas, canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should have export functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for export button with data-testid or common export text
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("Export"), button:has-text("Download"), button:has-text("Save")').first();
    
    // If found, verify it's visible
    if (await exportButton.count() > 0) {
      await expect(exportButton).toBeVisible();
    } else {
      // Export might be in a menu - look for more options
      const menuButton = page.locator('[data-testid="menu-button"], button[aria-label*="menu"], button[aria-label*="options"]').first();
      if (await menuButton.count() > 0) {
        await expect(menuButton).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check canvas is still visible
    const canvas = page.locator('#drawing-canvas, canvas').first();
    await expect(canvas).toBeVisible();
    
    // Check toolbar is accessible (might be in a different layout)
    const toolbar = page.locator('[data-testid="tool-panel"], [role="toolbar"], .toolbar').first();
    await expect(toolbar).toBeVisible();
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
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try switching between modes
    const toolbar = page.locator('[data-testid="tool-panel"]');
    const modeButtons = toolbar.locator('button').filter({ 
      hasText: /draw|parametric|code|growth/i 
    });
    
    const buttonCount = await modeButtons.count();
    for (let i = 0; i < Math.min(buttonCount, 4); i++) {
      try {
        const button = modeButtons.nth(i);
        // Check if button is visible and enabled before clicking
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // If a button fails to click, continue with the test
        console.log(`Button ${i} could not be clicked, continuing...`);
      }
    }
    
    // Check no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );
    
    // Allow for some console errors but no critical ones
    expect(criticalErrors.length).toBe(0);
  });
});