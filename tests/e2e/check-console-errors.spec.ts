import { test, expect } from '@playwright/test'

test('check console errors during load', async ({ page }) => {
  const consoleMessages: any[] = [];
  
  // Capture all console messages
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture page errors
  page.on('pageerror', (error) => {
    consoleMessages.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack
    });
  });
  
  // Navigate to page
  await page.goto('');
  
  // Wait for potential async errors
  await page.waitForTimeout(5000);
  
  // Log all messages
  console.log('\n=== Console Messages ===');
  for (const msg of consoleMessages) {
    console.log(`[${msg.type}] ${msg.text}`);
    if (msg.location?.url) {
      console.log(`  at ${msg.location.url}:${msg.location.lineNumber}`);
    }
  }
  
  // Filter errors and warnings
  const errors = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  
  console.log(`\nTotal errors: ${errors.length}`);
  console.log(`Total warnings: ${warnings.length}`);
  
  // Check network failures
  const failedRequests: any[] = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  // Reload to capture network failures
  await page.reload();
  await page.waitForTimeout(2000);
  
  if (failedRequests.length > 0) {
    console.log('\n=== Failed Requests ===');
    for (const req of failedRequests) {
      console.log(`Failed: ${req.url}`);
      console.log(`Reason: ${req.failure?.errorText}`);
    }
  }
});