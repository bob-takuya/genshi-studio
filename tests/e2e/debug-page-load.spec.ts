import { test } from '@playwright/test';

test('debug page load', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  // Navigate and wait
  await page.goto('https://bob-takuya.github.io/genshi-studio/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for any async errors
  await page.waitForTimeout(5000);

  // Log what we found
  console.log('Page URL:', page.url());
  console.log('Page Title:', await page.title());
  console.log('Errors found:', errors);
  
  // Check if root element has content
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      hasContent: root ? root.innerHTML.length > 0 : false,
      innerHTML: root ? root.innerHTML.substring(0, 200) : null
    };
  });
  
  console.log('Root element:', rootContent);
  
  // Check if React loaded
  const reactLoaded = await page.evaluate(() => {
    return {
      hasReact: !!(window as any).React,
      hasReactDOM: !!(window as any).ReactDOM,
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className
    };
  });
  
  console.log('React status:', reactLoaded);
});