import { test, expect } from '@playwright/test'

test('check navigation URL', async ({ page, baseURL }) => {
  console.log('Base URL from config:', baseURL);
  
  // Navigate using relative path
  await page.goto('/');
  console.log('URL after goto("/"):', page.url());
  
  // Wait a bit
  await page.waitForTimeout(2000);
  
  // Get title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take screenshot
  await page.screenshot({ path: 'test-navigation.png' });
});