import { test, expect } from '@playwright/test';

test.describe('Debug Console Errors', () => {
  test('check for console errors and app loading', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });
    
    // Go to the page
    await page.goto('/');
    
    // Wait for either app to load or timeout
    try {
      await page.waitForSelector('#root > *', { timeout: 5000 });
      console.log('App root has children');
    } catch {
      console.log('App root is empty after 5 seconds');
    }
    
    // Check if React is loaded
    const hasReact = await page.evaluate(() => {
      return typeof (window as any).React !== 'undefined';
    });
    console.log('React loaded:', hasReact);
    
    // Check for Vite
    const hasVite = await page.evaluate(() => {
      return typeof (window as any).__vite_plugin_react_preamble_installed__ !== 'undefined';
    });
    console.log('Vite detected:', hasVite);
    
    // Print all console messages
    console.log('\nAll console messages:');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Print errors
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach(err => console.log(err));
    } else {
      console.log('\nNo errors found');
    }
    
    // Get the actual URL
    const url = page.url();
    console.log('\nCurrent URL:', url);
    
    // Check network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Wait a bit more
    await page.waitForTimeout(3000);
    
    if (failedRequests.length > 0) {
      console.log('\nFailed network requests:');
      failedRequests.forEach(req => console.log(req));
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-console.png' });
    
    // Check the HTML content after waiting
    const bodyContent = await page.locator('#root').innerHTML();
    console.log('\nRoot element content:', bodyContent || '<empty>');
    
    // Basic assertion
    expect(errors.length).toBe(0);
  });
});