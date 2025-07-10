import { test, expect } from '@playwright/test';

test.describe('Growth Button Check', () => {
  test('should show Growth button on Studio page', async ({ page }) => {
    // Navigate to the homepage first
    await page.goto('/');
    
    // Click on Studio link in navigation
    await page.getByRole('link', { name: 'Studio', exact: true }).click();
    
    // Wait for navigation
    await page.waitForURL('**/studio');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'studio-page-loaded.png' });
    
    // Log page content
    console.log('Current URL:', page.url());
    
    // Check if toolbar exists
    const toolbar = page.locator('[data-testid="tool-panel"]');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
    
    // List all visible buttons in toolbar
    const toolbarButtons = await toolbar.locator('button').allTextContents();
    console.log('Toolbar buttons:', toolbarButtons);
    
    // Check specifically for Growth button
    const growthButton = toolbar.locator('button:has-text("Growth")');
    const growthButtonCount = await growthButton.count();
    console.log('Growth button count:', growthButtonCount);
    
    // If not found, check with different selectors
    if (growthButtonCount === 0) {
      // Check for any button with Zap icon
      const zapButton = toolbar.locator('button:has(svg.lucide-zap)');
      const zapButtonCount = await zapButton.count();
      console.log('Zap icon button count:', zapButtonCount);
      
      // List all button titles
      const buttonTitles = await toolbar.locator('button[title]').evaluateAll(
        buttons => buttons.map(b => b.getAttribute('title'))
      );
      console.log('Button titles:', buttonTitles);
    }
    
    // Assert Growth button exists
    await expect(growthButton).toBeVisible({ timeout: 5000 });
  });
});