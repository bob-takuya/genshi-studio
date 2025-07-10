import { test, expect } from '@playwright/test';

test.describe('Console Error Check', () => {
  test('should check for console errors on Studio page', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // Navigate to homepage
    await page.goto('/');
    
    console.log('Homepage console messages:', consoleMessages);
    console.log('Homepage errors:', pageErrors);
    
    // Navigate to Studio
    await page.getByRole('link', { name: 'Studio', exact: true }).click();
    await page.waitForURL('**/studio', { timeout: 5000 });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    console.log('Studio console messages:', consoleMessages);
    console.log('Studio page errors:', pageErrors);
    
    // Check page content
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Has React root:', pageContent.includes('root'));
    
    // Check if any React components rendered
    const reactElements = await page.locator('[data-reactroot], #root, .App').count();
    console.log('React elements found:', reactElements);
    
    // Check network errors
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Reload to catch any network issues
    await page.reload();
    await page.waitForTimeout(1000);
    
    console.log('Failed requests:', failedRequests);
    
    // Take screenshot
    await page.screenshot({ path: 'studio-error-check.png' });
    
    // Basic assertion
    expect(pageErrors.length).toBe(0);
  });
});