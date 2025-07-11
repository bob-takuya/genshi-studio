import { test, expect } from '@playwright/test';

test.describe('Debug App Loading', () => {
  test('check app loading issues', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      consoleMessages.push(`ERROR: ${error.message}`);
    });
    
    // Go to page
    await page.goto('/');
    
    // Wait a bit
    await page.waitForTimeout(5000);
    
    // Get page content
    const rootContent = await page.locator('#root').innerHTML();
    console.log('Root content length:', rootContent.length);
    console.log('Has content:', rootContent.length > 100 ? 'YES' : 'NO');
    
    // Print console messages
    console.log('\nConsole messages:');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Check if React DevTools are available
    const hasReactDevTools = await page.evaluate(() => {
      return !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    });
    console.log('\nReact DevTools available:', hasReactDevTools);
    
    // Check if the app store is available
    const hasAppStore = await page.evaluate(() => {
      return !!(window as any).zustand;
    });
    console.log('Zustand store available:', hasAppStore);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-app-loading.png', fullPage: true });
    
    // Basic check
    expect(rootContent.length).toBeGreaterThan(100);
  });
});