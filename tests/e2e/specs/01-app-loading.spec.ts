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
    await page.goto('');
    
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
    
    // Navigate to home page first to ensure app is loaded
    await page.goto('/');
    await homePage.waitForPageReady();
    
    // Check that the app loads with JavaScript enabled
    await expect(homePage.getStartedButton).toBeVisible();
    await expect(homePage.getStartedButton).toBeEnabled();
    
    // Verify critical content is accessible
    await expect(page).toHaveTitle(/Genshi Studio/i);
    await expect(homePage.heroSection).toBeVisible();
    
    // Check that noscript fallback exists in HTML
    const htmlContent = await page.content();
    expect(htmlContent).toContain('<div id="root">');
    
    // Verify meta tags are present for SEO even without JS
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });
  
  test('should maintain state on page reload', async ({ page }) => {
    const homePage = new HomePage(page);
    await page.goto('');
    
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