import { test, expect } from '@playwright/test';

/**
 * Diagnostic test to understand the production deployment structure
 */
test.describe('Production Deployment Diagnostic', () => {
  
  test('should analyze page structure and content', async ({ page }) => {
    console.log('Starting diagnostic test...');
    
    await page.goto('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Check what HTML elements are available
    const bodyContent = await page.locator('body').innerText();
    console.log('Page contains text:', bodyContent.substring(0, 500));
    
    // Look for canvas elements
    const canvasCount = await page.locator('canvas').count();
    console.log(`Canvas elements found: ${canvasCount}`);
    
    // Look for buttons
    const buttonCount = await page.locator('button').count();
    console.log(`Button elements found: ${buttonCount}`);
    
    // Look for common pattern-related terms
    const patternTerms = ['pattern', 'mandala', 'celtic', 'fractal', 'flow', 'wave', 'growth'];
    for (const term of patternTerms) {
      const termExists = await page.locator(`text=${term}`).count() > 0;
      console.log(`Found term "${term}": ${termExists}`);
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/results/production-diagnostic.png', fullPage: true });
    
    // Get all visible elements
    const allElements = await page.evaluate(() => {
      const elements: string[] = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.offsetParent !== null) { // visible element
          elements.push(`${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`);
        }
      });
      return elements.slice(0, 50); // First 50 visible elements
    });
    
    console.log('Visible elements:', allElements);
    
    // Simple assertions
    expect(title).toBeTruthy();
    expect(url).toContain('genshi-studio');
  });
});