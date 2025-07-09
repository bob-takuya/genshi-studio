import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E testing
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for all images to load
 */
export async function waitForImagesLoaded(page: Page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every((img) => img.complete && img.naturalHeight !== 0);
  });
}

/**
 * Measure and assert performance metrics
 */
export async function assertPerformanceMetrics(
  page: Page,
  thresholds: {
    fps?: number;
    memoryMB?: number;
    loadTimeMs?: number;
  }
) {
  const metrics = await page.evaluate(() => ({
    memory: 'memory' in performance ? 
      (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0,
    timing: performance.timing,
  }));

  if (thresholds.memoryMB) {
    expect(metrics.memory).toBeLessThan(thresholds.memoryMB);
  }

  if (thresholds.loadTimeMs && metrics.timing) {
    const loadTime = metrics.timing.loadEventEnd - metrics.timing.navigationStart;
    expect(loadTime).toBeLessThan(thresholds.loadTimeMs);
  }
}

/**
 * Take screenshot with consistent settings
 */
export async function takeConsistentScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }
) {
  // Wait for animations
  await page.waitForTimeout(500);
  
  // Disable animations
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  return await page.screenshot({
    path: `tests/screenshots/${name}.png`,
    fullPage: options?.fullPage,
    clip: options?.clip,
    animations: 'disabled',
  });
}

/**
 * Simulate complex user interaction
 */
export async function simulateDrawing(
  page: Page,
  canvas: { x: number; y: number; width: number; height: number },
  pattern: 'circle' | 'square' | 'star' | 'random'
) {
  const points: Array<{ x: number; y: number }> = [];
  
  switch (pattern) {
    case 'circle':
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        points.push({
          x: canvas.x + canvas.width / 2 + Math.cos(angle) * canvas.width * 0.3,
          y: canvas.y + canvas.height / 2 + Math.sin(angle) * canvas.height * 0.3,
        });
      }
      break;
      
    case 'square':
      const size = Math.min(canvas.width, canvas.height) * 0.6;
      const startX = canvas.x + (canvas.width - size) / 2;
      const startY = canvas.y + (canvas.height - size) / 2;
      
      points.push(
        { x: startX, y: startY },
        { x: startX + size, y: startY },
        { x: startX + size, y: startY + size },
        { x: startX, y: startY + size },
        { x: startX, y: startY }
      );
      break;
      
    case 'star':
      const outerRadius = Math.min(canvas.width, canvas.height) * 0.4;
      const innerRadius = outerRadius * 0.4;
      const centerX = canvas.x + canvas.width / 2;
      const centerY = canvas.y + canvas.height / 2;
      
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
      points.push(points[0]); // Close the star
      break;
      
    case 'random':
      for (let i = 0; i < 20; i++) {
        points.push({
          x: canvas.x + Math.random() * canvas.width,
          y: canvas.y + Math.random() * canvas.height,
        });
      }
      break;
  }
  
  // Draw the pattern
  if (points.length > 0) {
    await page.mouse.move(points[0].x, points[0].y);
    await page.mouse.down();
    
    for (let i = 1; i < points.length; i++) {
      await page.mouse.move(points[i].x, points[i].y, { steps: 5 });
    }
    
    await page.mouse.up();
  }
}

/**
 * Check if element is within viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * Get computed styles for element
 */
export async function getComputedStyles(
  page: Page,
  selector: string,
  properties: string[]
): Promise<Record<string, string>> {
  return await page.evaluate(
    ({ sel, props }) => {
      const element = document.querySelector(sel);
      if (!element) return {};
      
      const styles = window.getComputedStyle(element);
      const result: Record<string, string> = {};
      
      props.forEach((prop) => {
        result[prop] = styles.getPropertyValue(prop);
      });
      
      return result;
    },
    { sel: selector, props: properties }
  );
}

/**
 * Mock API responses
 */
export async function mockAPIResponses(page: Page, mocks: Record<string, any>) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    
    for (const [pattern, response] of Object.entries(mocks)) {
      if (url.includes(pattern)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      }
    }
    
    route.continue();
  });
}

/**
 * Wait for and dismiss any modals/dialogs
 */
export async function dismissModals(page: Page) {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
  
  // Also check for custom modals
  const closeButtons = page.locator('[aria-label*="close"], [aria-label*="Close"], .modal-close, .close-button');
  const count = await closeButtons.count();
  
  for (let i = 0; i < count; i++) {
    const button = closeButtons.nth(i);
    if (await button.isVisible()) {
      await button.click();
    }
  }
}

/**
 * Generate unique test ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retry flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}