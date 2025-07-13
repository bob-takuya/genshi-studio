import { test, expect } from '@playwright/test';

test('check drawing tools', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3001/genshi-studio/');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="tool-panel"]', { timeout: 10000 });
  
  // Check if tool buttons exist
  const tools = ['pen', 'brush', 'eraser', 'shapes', 'pattern', 'text', 'select'];
  
  for (const tool of tools) {
    const selector = `[data-testid="tool-${tool}"]`;
    const exists = await page.$(selector);
    console.log(`Tool ${tool}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (exists) {
      // Check if it's visible
      const isVisible = await page.isVisible(selector);
      console.log(`  - Visible: ${isVisible}`);
      
      // Get the class to check if active
      const className = await page.getAttribute(selector, 'class');
      console.log(`  - Classes: ${className}`);
    }
  }
  
  // Take a screenshot of the toolbar
  const toolbar = await page.locator('[data-testid="tool-panel"]');
  await toolbar.screenshot({ path: 'temp/toolbar-test.png' });
  
  // Check the HTML structure
  const toolbarHtml = await toolbar.innerHTML();
  console.log('\nToolbar HTML (first 500 chars):');
  console.log(toolbarHtml.substring(0, 500) + '...');
});