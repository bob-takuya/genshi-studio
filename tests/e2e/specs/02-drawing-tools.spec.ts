import { test, expect } from '@playwright/test';
import { StudioPage } from '../pages/StudioPage';

/**
 * Drawing Tools and Graphics Functionality Tests
 * Validates all drawing tools work correctly with proper performance
 */
test.describe('Drawing Tools and Graphics', () => {
  let studioPage: StudioPage;
  
  test.beforeEach(async ({ page }) => {
    studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
  });
  
  test('should select and activate drawing tools', async ({ page }) => {
    // Test each tool selection
    const tools = ['pen', 'brush', 'eraser', 'shapes', 'pattern', 'text', 'select'] as const;
    
    for (const tool of tools) {
      await studioPage.selectTool(tool);
      
      // Verify tool is active
      const activeToolElement = page.locator(`[data-testid="tool-${tool}"]`);
      await expect(activeToolElement).toHaveClass(/active/);
      
      // Verify cursor changes appropriately
      const cursorStyle = await studioPage.canvas.evaluate((el) => 
        window.getComputedStyle(el).cursor
      );
      expect(cursorStyle).not.toBe('default');
    }
  });
  
  test('should draw with pen tool', async ({ page }) => {
    await studioPage.selectTool('pen');
    
    // Verify canvas is initially empty
    expect(await studioPage.isCanvasEmpty()).toBeTruthy();
    
    // Draw a simple line
    await studioPage.drawOnCanvas([
      [{ x: 100, y: 100 }, { x: 200, y: 200 }]
    ]);
    
    // Verify canvas is no longer empty
    expect(await studioPage.isCanvasEmpty()).toBeFalsy();
    
    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('pen-drawing.png');
  });
  
  test('should draw smooth curves with brush tool', async ({ page }) => {
    await studioPage.selectTool('brush');
    await studioPage.setBrushSize(10);
    
    // Draw a curve
    const curve = [];
    for (let i = 0; i <= 100; i++) {
      const x = 100 + i * 2;
      const y = 200 + Math.sin(i * 0.1) * 50;
      curve.push({ x, y });
    }
    
    await studioPage.drawOnCanvas([curve]);
    
    // Verify smooth rendering
    expect(await studioPage.isCanvasEmpty()).toBeFalsy();
    await expect(page).toHaveScreenshot('brush-curve.png');
  });
  
  test('should change colors', async ({ page }) => {
    await studioPage.selectTool('pen');
    
    // Test multiple colors
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFD700'];
    
    for (let i = 0; i < colors.length; i++) {
      await studioPage.setColor(colors[i]);
      
      // Draw with each color
      await studioPage.drawOnCanvas([
        [{ x: 50 + i * 100, y: 100 }, { x: 50 + i * 100, y: 200 }]
      ]);
    }
    
    await expect(page).toHaveScreenshot('color-test.png');
  });
  
  test('should erase drawings', async ({ page }) => {
    // First draw something
    await studioPage.selectTool('brush');
    await studioPage.drawOnCanvas([
      [{ x: 100, y: 100 }, { x: 300, y: 300 }]
    ]);
    
    // Switch to eraser
    await studioPage.selectTool('eraser');
    
    // Erase part of the drawing
    await studioPage.drawOnCanvas([
      [{ x: 150, y: 150 }, { x: 250, y: 250 }]
    ]);
    
    // Verify partial erasure
    expect(await studioPage.isCanvasEmpty()).toBeFalsy();
    await expect(page).toHaveScreenshot('eraser-test.png');
  });
  
  test('should undo and redo actions', async ({ page }) => {
    await studioPage.selectTool('pen');
    
    // Draw three separate lines
    for (let i = 0; i < 3; i++) {
      await studioPage.drawOnCanvas([
        [{ x: 50 + i * 100, y: 100 }, { x: 50 + i * 100, y: 200 }]
      ]);
    }
    
    // Take initial screenshot
    const initialCanvas = await studioPage.getCanvasDataURL();
    
    // Undo twice
    await studioPage.undoButton.click();
    await studioPage.undoButton.click();
    
    // Verify undo worked
    const afterUndoCanvas = await studioPage.getCanvasDataURL();
    expect(afterUndoCanvas).not.toBe(initialCanvas);
    
    // Redo once
    await studioPage.redoButton.click();
    
    // Verify redo worked
    const afterRedoCanvas = await studioPage.getCanvasDataURL();
    expect(afterRedoCanvas).not.toBe(afterUndoCanvas);
  });
  
  test('should clear canvas', async ({ page }) => {
    // Draw something
    await studioPage.selectTool('brush');
    await studioPage.drawOnCanvas([
      [{ x: 50, y: 50 }, { x: 350, y: 350 }]
    ]);
    
    // Clear canvas
    await studioPage.clearCanvas();
    
    // Verify canvas is empty
    expect(await studioPage.isCanvasEmpty()).toBeTruthy();
  });
  
  test('should handle brush size changes', async ({ page }) => {
    await studioPage.selectTool('brush');
    
    // Draw with different brush sizes
    const sizes = [1, 5, 10, 20, 50];
    
    for (let i = 0; i < sizes.length; i++) {
      await studioPage.setBrushSize(sizes[i]);
      
      // Draw horizontal line
      await studioPage.drawOnCanvas([
        [{ x: 50, y: 50 + i * 60 }, { x: 350, y: 50 + i * 60 }]
      ]);
    }
    
    await expect(page).toHaveScreenshot('brush-sizes.png');
  });
  
  test('should maintain 60fps while drawing', async ({ page }) => {
    await studioPage.selectTool('brush');
    
    // Start performance measurement
    const perfPromise = studioPage.measureDrawingPerformance();
    
    // Draw continuous strokes
    const strokes = [];
    for (let stroke = 0; stroke < 5; stroke++) {
      const points = [];
      for (let i = 0; i < 50; i++) {
        points.push({
          x: 50 + i * 6 + stroke * 10,
          y: 100 + Math.sin(i * 0.2) * 30 + stroke * 20
        });
      }
      strokes.push(points);
    }
    
    // Draw while measuring
    await studioPage.drawOnCanvas(strokes);
    
    // Get performance results
    const performance = await perfPromise as any;
    
    // Verify 60fps performance
    expect(performance.fps).toBeGreaterThanOrEqual(55); // Allow small margin
  });
  
  test('should export canvas as image', async ({ page }) => {
    // Draw something
    await studioPage.selectTool('pen');
    await studioPage.drawOnCanvas([
      [{ x: 100, y: 100 }, { x: 300, y: 300 }],
      [{ x: 300, y: 100 }, { x: 100, y: 300 }]
    ]);
    
    // Set up download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Export as PNG
    await studioPage.exportArtwork('png');
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(png|PNG)$/);
  });
  
  test('should save artwork', async ({ page }) => {
    // Draw something
    await studioPage.selectTool('brush');
    await studioPage.drawOnCanvas([
      [{ x: 150, y: 150 }, { x: 250, y: 250 }]
    ]);
    
    // Save artwork
    await studioPage.saveArtwork('Test Artwork');
    
    // Verify save confirmation
    const saveConfirmation = page.locator('[data-testid="save-confirmation"]');
    await expect(saveConfirmation).toBeVisible({ timeout: 5000 });
  });
});