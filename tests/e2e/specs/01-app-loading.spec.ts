import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

/**
 * Application Loading and Initialization Tests
 * Validates that Genshi Studio loads correctly across all browsers
 */
test.describe('Application Loading and Initialization', () => {
  
  test('should load home page successfully', async ({ page }) => {
    const homePage = new HomePage(page);
    
    // Navigate to home page
    await homePage.goto();
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Genshi Studio/i);
    await expect(page).toHaveURL('/');
    
    // Check critical elements are visible
    await expect(homePage.heroSection).toBeVisible();
    await expect(homePage.navigationMenu).toBeVisible();
    await expect(homePage.getStartedButton).toBeVisible();
    
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
    const homePage = new HomePage(page);
    
    // Start performance measurement
    await page.goto('/', { waitUntil: 'commit' });
    
    // Get performance metrics
    const metrics = await homePage.getPerformanceMetrics();
    
    // Verify load time is under 3 seconds
    expect(metrics.totalTime).toBeLessThan(3000);
    
    // Verify DOM content loaded quickly
    expect(metrics.domContentLoaded).toBeLessThan(1500);
    
    // Verify TTFB is reasonable
    expect(metrics.ttfb).toBeLessThan(500);
  });
  
  test('should handle progressive enhancement', async ({ page }) => {
    const homePage = new HomePage(page);
    
    // Disable JavaScript
    await page.route('**/*.js', (route) => route.abort());
    
    // Navigate to home page
    await page.goto('/');
    
    // Core content should still be visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Re-enable JavaScript
    await page.unroute('**/*.js');
    await page.reload();
    
    // Interactive elements should now work
    await expect(homePage.getStartedButton).toBeVisible();
    await expect(homePage.getStartedButton).toBeEnabled();
  });
  
  test('should maintain state on page reload', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Toggle theme
    await homePage.toggleTheme();
    
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
    const homePage = new HomePage(page);
    
    // Navigate to home page first
    await homePage.goto();
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate to another page
    await page.locator('[href="/studio"]').click();
    
    // Should show offline indicator or cached content
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    const cachedContent = page.locator('[data-testid="cached-content"]');
    
    const hasOfflineHandling = 
      await offlineIndicator.isVisible({ timeout: 5000 }).catch(() => false) ||
      await cachedContent.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasOfflineHandling).toBeTruthy();
    
    // Re-enable network
    await page.context().setOffline(false);
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
    expect(description).toContain('cultural design patterns');
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    
    // Check viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
  
  test('should initialize service worker for PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    });
    
    // For PWA, service worker should be registered
    expect(hasServiceWorker).toBeTruthy();
    
    // Check manifest
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBeTruthy();
  });
});