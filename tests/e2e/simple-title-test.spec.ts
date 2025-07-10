import { test, expect } from '@playwright/test'

test('simple title test', async ({ page }) => {
  // Go directly to the full URL
  await page.goto('https://bob-takuya.github.io/genshi-studio/', {
    waitUntil: 'networkidle'
  });
  
  // Wait a bit for any dynamic title changes
  await page.waitForTimeout(2000);
  
  // Log what we see
  const title = await page.title();
  console.log('Current title:', title);
  
  // Check title
  await expect(page).toHaveTitle('Genshi Studio - Digital Art & Cultural Pattern Generator');
});