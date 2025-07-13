import { test, expect } from '@playwright/test';

/**
 * Canvas Drawing Verification Test
 * Tests if drawing operations actually produce visible content on canvas
 */
test.describe('Canvas Drawing Verification', () => {
  test('should draw visible content on canvas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure we're in Draw mode
    const drawButton = page.locator('[data-testid="tool-panel"]').locator('button:has-text("Draw")').first();
    if (await drawButton.isVisible()) {
      await drawButton.click();
      await page.waitForTimeout(500);
    }
    
    // Find the canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Get canvas initial state
    const initialCanvasData = await canvas.evaluate((canvasEl: HTMLCanvasElement) => {
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return null;
      
      // Get image data to check if canvas has any non-transparent pixels
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const hasContent = imageData.data.some((value, index) => {
        // Check alpha channel (every 4th value)
        return index % 4 === 3 && value > 0;
      });
      
      return {
        hasContent,
        width: canvasEl.width,
        height: canvasEl.height,
        dataUrl: canvasEl.toDataURL()
      };
    });
    
    console.log('Initial canvas state:', {
      hasContent: initialCanvasData?.hasContent,
      dimensions: `${initialCanvasData?.width}x${initialCanvasData?.height}`
    });
    
    // Get canvas bounding box for drawing
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounding box');
    
    // Try to select a drawing tool if available
    const penButton = page.locator('button[title*="pen" i], button[aria-label*="pen" i]').first();
    if (await penButton.isVisible({ timeout: 2000 })) {
      await penButton.click();
      await page.waitForTimeout(300);
    }
    
    // Perform drawing operations
    console.log('Performing drawing operations...');
    
    // Draw multiple strokes to increase chance of visible content
    const strokes = [
      { start: { x: 100, y: 100 }, end: { x: 200, y: 200 } },
      { start: { x: 200, y: 100 }, end: { x: 100, y: 200 } },
      { start: { x: 150, y: 50 }, end: { x: 150, y: 250 } },
      { start: { x: 50, y: 150 }, end: { x: 250, y: 150 } }
    ];
    
    for (const stroke of strokes) {
      await page.mouse.move(box.x + stroke.start.x, box.y + stroke.start.y);
      await page.mouse.down();
      await page.mouse.move(box.x + stroke.end.x, box.y + stroke.end.y, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(100);
    }
    
    // Wait for any async rendering
    await page.waitForTimeout(500);
    
    // Check canvas after drawing
    const afterDrawingData = await canvas.evaluate((canvasEl: HTMLCanvasElement, initialDataUrl: string) => {
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return null;
      
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      let nonTransparentPixels = 0;
      let totalAlphaValue = 0;
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i];
        if (alpha > 0) {
          nonTransparentPixels++;
          totalAlphaValue += alpha;
        }
      }
      
      return {
        hasContent: nonTransparentPixels > 0,
        nonTransparentPixels,
        totalPixels: imageData.width * imageData.height,
        averageAlpha: nonTransparentPixels > 0 ? totalAlphaValue / nonTransparentPixels : 0,
        dataUrl: canvasEl.toDataURL(),
        changed: canvasEl.toDataURL() !== initialDataUrl
      };
    }, initialCanvasData?.dataUrl || '');
    
    console.log('Canvas state after drawing:', {
      hasContent: afterDrawingData?.hasContent,
      nonTransparentPixels: afterDrawingData?.nonTransparentPixels,
      totalPixels: afterDrawingData?.totalPixels,
      percentageFilled: afterDrawingData ? 
        ((afterDrawingData.nonTransparentPixels / afterDrawingData.totalPixels) * 100).toFixed(2) + '%' : 
        'N/A',
      averageAlpha: afterDrawingData?.averageAlpha,
      dataChanged: afterDrawingData?.changed
    });
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'temp/canvas-drawing-test.png',
      fullPage: false,
      clip: box
    });
    
    // Verify drawing produced visible content
    expect(afterDrawingData).not.toBeNull();
    expect(afterDrawingData?.hasContent).toBeTruthy();
    expect(afterDrawingData?.nonTransparentPixels).toBeGreaterThan(0);
    expect(afterDrawingData?.changed).toBeTruthy();
  });
  
  test('should verify drawing tools are selectable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure we're in Draw mode
    const drawButton = page.locator('[data-testid="tool-panel"]').locator('button:has-text("Draw")').first();
    if (await drawButton.isVisible()) {
      await drawButton.click();
      await page.waitForTimeout(500);
    }
    
    // Look for drawing tool buttons
    const toolSelectors = [
      'button[title*="pen" i], button[aria-label*="pen" i]',
      'button[title*="brush" i], button[aria-label*="brush" i]',
      'button[title*="pencil" i], button[aria-label*="pencil" i]',
      'button[title*="draw" i], button[aria-label*="draw" i]',
      'button svg path[d*="M"], button svg path[stroke]' // SVG icon buttons
    ];
    
    let foundTools = 0;
    for (const selector of toolSelectors) {
      const tools = page.locator(selector);
      const count = await tools.count();
      foundTools += count;
      
      if (count > 0) {
        console.log(`Found ${count} tools matching: ${selector}`);
        
        // Try clicking the first one
        const firstTool = tools.first();
        if (await firstTool.isVisible() && await firstTool.isEnabled()) {
          await firstTool.click();
          await page.waitForTimeout(200);
          console.log('Successfully clicked tool');
        }
      }
    }
    
    console.log(`Total drawing tools found: ${foundTools}`);
    expect(foundTools).toBeGreaterThan(0);
  });
});