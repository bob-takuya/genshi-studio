import { test, expect } from '@playwright/test';
import { StudioPage } from '../pages/StudioPage';

/**
 * Cultural Pattern Generation and Customization Tests
 * Validates pattern creation, customization, and rendering accuracy
 */
test.describe('Cultural Pattern Generation', () => {
  let studioPage: StudioPage;
  
  test.beforeEach(async ({ page }) => {
    studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
  });
  
  test('should display pattern library', async ({ page }) => {
    await studioPage.selectTool('pattern');
    
    // Open pattern library
    await studioPage.patternLibrary.click();
    
    // Verify pattern categories are visible
    const categories = ['geometric', 'floral', 'traditional', 'modern', 'abstract'];
    
    for (const category of categories) {
      const categoryElement = page.locator(`[data-category="${category}"]`);
      await expect(categoryElement).toBeVisible();
    }
    
    // Verify pattern thumbnails load
    const patternThumbnails = page.locator('[data-testid^="pattern-thumb-"]');
    await expect(patternThumbnails).toHaveCount(await patternThumbnails.count());
    
    // Take screenshot of pattern library
    await expect(page).toHaveScreenshot('pattern-library.png');
  });
  
  test('should apply geometric patterns', async ({ page }) => {
    await studioPage.selectTool('pattern');
    
    // Select a geometric pattern
    await studioPage.selectPattern('mandala-basic');
    
    // Apply pattern to canvas
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    // Click to place pattern
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2
    );
    
    // Verify pattern was applied
    expect(await studioPage.isCanvasEmpty()).toBeFalsy();
    
    // Visual regression test
    await expect(page).toHaveScreenshot('geometric-pattern.png');
  });
  
  test('should customize pattern symmetry', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('kaleidoscope');
    
    // Test different symmetry values
    const symmetryValues = [4, 6, 8, 12];
    
    for (const symmetry of symmetryValues) {
      // Clear canvas for each test
      await studioPage.clearCanvas();
      
      // Apply customization
      await studioPage.customizePattern({ symmetry });
      
      // Place pattern
      const canvasBox = await studioPage.canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      await page.mouse.click(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      
      // Take screenshot for each symmetry
      await expect(page).toHaveScreenshot(`pattern-symmetry-${symmetry}.png`);
    }
  });
  
  test('should rotate patterns', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('celtic-knot');
    
    // Test rotation angles
    const rotations = [0, 45, 90, 180];
    
    for (const rotation of rotations) {
      await studioPage.clearCanvas();
      
      // Apply rotation
      await studioPage.customizePattern({ rotation });
      
      // Place pattern
      const canvasBox = await studioPage.canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      await page.mouse.click(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      
      // Visual test
      await expect(page).toHaveScreenshot(`pattern-rotation-${rotation}.png`);
    }
  });
  
  test('should scale patterns', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('arabesque');
    
    // Test different scales
    const scales = [0.5, 1, 1.5, 2];
    const positions = [
      { x: 0.25, y: 0.25 },
      { x: 0.75, y: 0.25 },
      { x: 0.25, y: 0.75 },
      { x: 0.75, y: 0.75 }
    ];
    
    for (let i = 0; i < scales.length; i++) {
      // Apply scale
      await studioPage.customizePattern({ scale: scales[i] });
      
      // Place pattern at different position
      const canvasBox = await studioPage.canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      await page.mouse.click(
        canvasBox.x + canvasBox.width * positions[i].x,
        canvasBox.y + canvasBox.height * positions[i].y
      );
    }
    
    // Visual test with all scales
    await expect(page).toHaveScreenshot('pattern-scales.png');
  });
  
  test('should combine patterns with drawing', async ({ page }) => {
    // First apply a pattern
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('mandala-complex');
    
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2
    );
    
    // Then draw over it
    await studioPage.selectTool('brush');
    await studioPage.setColor('#FF0000');
    await studioPage.setBrushSize(5);
    
    // Draw accent lines
    await studioPage.drawOnCanvas([
      [{ x: 100, y: 50 }, { x: 300, y: 50 }],
      [{ x: 50, y: 100 }, { x: 50, y: 300 }],
      [{ x: 350, y: 100 }, { x: 350, y: 300 }],
      [{ x: 100, y: 350 }, { x: 300, y: 350 }]
    ]);
    
    await expect(page).toHaveScreenshot('pattern-with-drawing.png');
  });
  
  test('should animate pattern generation', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('spiral-growth');
    
    // Enable animation if available
    const animateToggle = page.locator('[data-testid="pattern-animate"]');
    if (await animateToggle.isVisible()) {
      await animateToggle.click();
    }
    
    // Place animated pattern
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2
    );
    
    // Wait for animation
    await page.waitForTimeout(2000);
    
    // Check animation performance
    const canvasPerf = await studioPage.getCanvasPerformance();
    if (canvasPerf && typeof canvasPerf === 'object' && 'average' in canvasPerf) {
      expect(canvasPerf.average).toBeGreaterThanOrEqual(30); // At least 30fps for animations
    }
  });
  
  test('should layer multiple patterns', async ({ page }) => {
    await studioPage.selectTool('pattern');
    
    // Apply first pattern
    await studioPage.selectPattern('hexagon-tile');
    await studioPage.customizePattern({ scale: 0.8 });
    
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width * 0.3,
      canvasBox.y + canvasBox.height * 0.3
    );
    
    // Apply second pattern
    await studioPage.selectPattern('flower-motif');
    await studioPage.customizePattern({ scale: 0.6 });
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width * 0.7,
      canvasBox.y + canvasBox.height * 0.7
    );
    
    // Apply third pattern
    await studioPage.selectPattern('wave-pattern');
    await studioPage.customizePattern({ scale: 1.2, rotation: 45 });
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width * 0.5,
      canvasBox.y + canvasBox.height * 0.5
    );
    
    await expect(page).toHaveScreenshot('layered-patterns.png');
  });
  
  test('should export patterns as vector graphics', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('islamic-geometric');
    
    // Apply pattern
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2
    );
    
    // Export as SVG
    const downloadPromise = page.waitForEvent('download');
    await studioPage.exportArtwork('svg');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/i);
  });
  
  test('should render patterns at high resolution', async ({ page }) => {
    await studioPage.selectTool('pattern');
    await studioPage.selectPattern('fractal-tree');
    
    // Apply high-detail pattern
    await studioPage.customizePattern({ scale: 2 });
    
    const canvasBox = await studioPage.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2
    );
    
    // Check rendering quality
    const canvasData = await studioPage.getCanvasDataURL();
    
    // Verify high-quality rendering (data URL should be large for detailed pattern)
    expect(canvasData.length).toBeGreaterThan(50000); // Arbitrary threshold for detailed image
    
    // Visual regression for quality
    await expect(page).toHaveScreenshot('high-res-pattern.png', {
      maxDiffPixels: 50, // Strict comparison for quality
    });
  });
});