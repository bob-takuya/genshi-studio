import { test, expect } from '@playwright/test';

test('app loads without errors', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  const errors: string[] = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  // Navigate to the app
  await page.goto('http://localhost:3001/genshi-studio/', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  });

  // Print console logs
  console.log('\n=== Console Logs ===');
  consoleLogs.forEach(log => console.log(log));

  // Print errors
  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(err => console.log(err));
  }

  // Take a screenshot
  await page.screenshot({ path: 'temp/app-load-test.png' });

  // Wait a bit for React to render
  await page.waitForTimeout(2000);

  // Check if we have any content
  const bodyText = await page.textContent('body');
  console.log('\n=== Body Text ===');
  console.log(bodyText?.substring(0, 200) + '...');

  // Check if React app mounted
  const rootElement = await page.$('#root');
  expect(rootElement).not.toBeNull();
  
  // Pass if no errors
  expect(errors).toHaveLength(0);
});