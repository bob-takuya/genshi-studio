import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

/**
 * Application Loading and Initialization Tests
 * Validates that Genshi Studio loads correctly across all browsers
 */
test.describe('Application Loading and Initialization', () => {
  
  test('should load studio page successfully', async ({ page }) => {
    // Navigate to studio (root page)
    await page.goto('/');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Genshi Studio/i);
    await expect(page).toHaveURL(/\/$/); // Ends with /
    
    // Check critical elements are visible - Studio specific
    const toolbar = page.locator('[data-testid="tool-panel"]');
    await expect(toolbar).toBeVisible();
    
    // Use more specific selector to avoid ambiguity
    const drawButton = page.locator('[data-testid="tool-panel"]').locator('button:has-text("Draw")').first();
    await expect(drawButton).toBeVisible();
    
    // Canvas might have different ID, look for any visible canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
  
  test('should load within performance targets', async ({ page }) => {
    // Start performance measurement
    const navigationPromise = page.goto('/', { waitUntil: 'commit' });
    const startTime = Date.now();
    
    await navigationPromise;
    await page.waitForLoadState('domcontentloaded');
    
    const domContentLoadedTime = Date.now() - startTime;
    
    // Wait for network idle
    await page.waitForLoadState('networkidle');
    const totalTime = Date.now() - startTime;
    
    // Verify load time is under 3 seconds
    expect(totalTime).toBeLessThan(3000);
    
    // Verify DOM content loaded quickly
    expect(domContentLoadedTime).toBeLessThan(1500);
  });
  
  test('should handle progressive enhancement', async ({ page }) => {
    // Navigate to studio page
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Check that the app loads with JavaScript enabled
    const toolbar = page.locator('[data-testid="tool-panel"]');
    await expect(toolbar).toBeVisible();
    
    // Verify critical content is accessible
    await expect(page).toHaveTitle(/Genshi Studio/i);
    
    // Check that root element exists in HTML
    const htmlContent = await page.content();
    expect(htmlContent).toContain('<div id="root">');
    
    // Verify meta tags are present for SEO even without JS
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });
  
  test('should maintain state on page reload', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Get current theme
    const themeBeforeReload = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    // Reload page
    await page.reload();
    
    // Theme should persist
    const themeAfterReload = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    expect(themeAfterReload).toBe(themeBeforeReload);
  });
  
  test('should handle network failures gracefully', async ({ page }) => {
    // Navigate to home page first
    await page.goto('');
    await page.waitForLoadState('networkidle');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Wait a moment for offline event to be detected
    await page.waitForTimeout(500);
    
    // Should show offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
    
    // Verify offline indicator shows correct message
    await expect(offlineIndicator).toContainText('You are offline');
    
    // Re-enable network
    await page.context().setOffline(false);
    
    // Wait for online indicator to appear briefly
    await page.waitForTimeout(500);
    
    // The offline indicator should either be hidden or show "Back online"
    const isHidden = await offlineIndicator.isHidden().catch(() => true);
    if (!isHidden) {
      await expect(offlineIndicator).toContainText('Back online');
    }
  });
  
  test('should load all static assets', async ({ page }) => {
    const failedRequests: string[] = [];
    
    // Monitor failed requests
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check no critical assets failed
    const criticalAssetsFailed = failedRequests.filter(url => 
      url.includes('.js') || 
      url.includes('.css') || 
      url.includes('.woff') ||
      url.includes('.ttf')
    );
    
    expect(criticalAssetsFailed).toHaveLength(0);
  });
  
  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    
    // Check viewport meta (this should always be present)
    const viewportMeta = page.locator('meta[name="viewport"]').first();
    const viewport = await viewportMeta.getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
    
    // Check title
    await expect(page).toHaveTitle(/Genshi Studio/i);
  });
  
  test('should initialize service worker for PWA', async ({ page }) => {
    await page.goto('');
    
    // Wait for service worker to be ready
    const serviceWorkerReady = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      
      try {
        // Check if service worker is registered
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      } catch (e) {
        return false;
      }
    });
    
    // For PWA, service worker should be registered and active
    expect(serviceWorkerReady).toBeTruthy();
    
    // Check manifest
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBeTruthy();
    expect(manifest).toContain('manifest.json');
  });
});