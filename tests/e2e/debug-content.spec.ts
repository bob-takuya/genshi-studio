import { test, expect } from '@playwright/test'

test('debug page content', async ({ page }) => {
  await page.goto('');
  
  // Wait a bit for React to render
  await page.waitForTimeout(3000);
  
  // Get all h1 elements
  const h1Count = await page.locator('h1').count();
  console.log('H1 elements found:', h1Count);
  
  // Get body content
  const bodyContent = await page.evaluate(() => document.body.innerHTML);
  console.log('Body content (first 500 chars):', bodyContent.substring(0, 500));
  
  // Check for specific elements
  const hasNavigation = await page.locator('nav').count() > 0;
  const hasHeader = await page.locator('header').count() > 0;
  const hasMain = await page.locator('main').count() > 0;
  
  console.log('Has navigation:', hasNavigation);
  console.log('Has header:', hasHeader);
  console.log('Has main:', hasMain);
  
  // Check for any error messages
  const errorElements = await page.locator('text=/error|Error|failed|Failed/i').count();
  console.log('Error elements found:', errorElements);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-content.png', fullPage: true });
});