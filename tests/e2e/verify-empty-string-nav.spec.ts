import { test, expect } from '@playwright/test'

test('verify empty string navigation', async ({ page, baseURL }) => {
  console.log('Base URL:', baseURL);
  
  await page.goto('');
  console.log('URL after goto(""):', page.url());
  
  const title = await page.title();
  console.log('Title:', title);
});