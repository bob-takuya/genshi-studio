import { test, expect } from '@playwright/test';

test.describe('Studio Page Debug', () => {
  test('should load Studio page', async ({ page }) => {
    // Go directly to studio page
    await page.goto('/studio');
    
    // Wait for any content to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'studio-page-debug.png' });
    
    // Check if page has any content
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText);
    
    // Check for toolbar
    const toolbar = page.locator('[data-testid="tool-panel"]');
    const toolbarExists = await toolbar.count();
    console.log('Toolbar exists:', toolbarExists > 0);
    
    // Check for any buttons
    const buttons = await page.locator('button').count();
    console.log('Number of buttons:', buttons);
    
    // List all button texts
    const buttonTexts = await page.locator('button').allTextContents();
    console.log('Button texts:', buttonTexts);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages
    const errors = await page.locator('.error, [role="alert"]').count();
    console.log('Error elements:', errors);
    
    // Basic assertion to ensure page loads
    await expect(page).toHaveURL(/.*studio/);
  });

  test('should have navigation to Studio', async ({ page }) => {
    // Start from home
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find all links
    const links = await page.locator('a').allTextContents();
    console.log('All links:', links);
    
    // Find Studio links
    const studioLinks = await page.locator('a:has-text("Studio")').count();
    console.log('Studio links count:', studioLinks);
    
    // Try different selectors
    const navLink = page.locator('nav a[href*="studio"]');
    const navLinkCount = await navLink.count();
    console.log('Nav studio links:', navLinkCount);
    
    if (navLinkCount > 0) {
      await navLink.first().click();
      await page.waitForURL('**/studio');
    }
  });
});