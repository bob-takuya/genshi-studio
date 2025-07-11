import { test, expect } from '@playwright/test';

test.describe('Debug Screenshot', () => {
  test('capture page screenshot and analyze', async ({ page }) => {
    // Go directly to Studio page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait to ensure everything loads
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // List all visible buttons
    const buttons = await page.locator('button:visible').allTextContents();
    console.log('Visible buttons:', buttons);
    
    // List all visible links
    const links = await page.locator('a:visible').allTextContents();
    console.log('Visible links:', links);
    
    // Check if toolbar exists
    const toolbar = await page.locator('[data-testid="tool-panel"]').count();
    console.log('Toolbar found:', toolbar > 0);
    
    // If toolbar exists, list all buttons in it
    if (toolbar > 0) {
      const toolbarButtons = await page.locator('[data-testid="tool-panel"] button').allTextContents();
      console.log('Toolbar buttons:', toolbarButtons);
    }
    
    // Check for any error messages
    const errors = await page.locator('.error, [role="alert"], .text-red-500').allTextContents();
    console.log('Error messages:', errors);
    
    // Get page HTML structure
    const bodyHTML = await page.locator('body').innerHTML();
    if (bodyHTML.length < 1000) {
      console.log('Body HTML:', bodyHTML);
    } else {
      console.log('Body HTML length:', bodyHTML.length);
    }
    
    // Basic assertion to pass the test
    await expect(page).toHaveURL(/\//);
  });
});