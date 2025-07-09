import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model class
 * Provides common functionality for all page objects
 */
export abstract class BasePage {
  protected page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Navigate to a specific path
   */
  async goto(path: string = '') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }
  
  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
  }
  
  /**
   * Take a screenshot for visual regression testing
   */
  async takeScreenshot(name: string) {
    return await this.page.screenshot({
      fullPage: true,
      animations: 'disabled',
      path: `tests/screenshots/${name}.png`,
    });
  }
  
  /**
   * Check if element is visible within viewport
   */
  async isElementInViewport(locator: Locator): Promise<boolean> {
    const box = await locator.boundingBox();
    if (!box) return false;
    
    const viewport = this.page.viewportSize();
    if (!viewport) return false;
    
    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height
    );
  }
  
  /**
   * Measure performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart,
        ttfb: perfData.responseStart - perfData.requestStart,
      };
    });
  }
  
  /**
   * Check accessibility violations using axe-core
   */
  async checkAccessibility(options?: any) {
    await this.page.waitForLoadState('domcontentloaded');
    
    // Inject axe-core if not already present
    await this.page.evaluate(() => {
      if (!(window as any).axe) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js';
        document.head.appendChild(script);
      }
    });
    
    // Wait for axe to load
    await this.page.waitForFunction(() => (window as any).axe);
    
    // Run accessibility checks
    const violations = await this.page.evaluate((opts) => {
      return new Promise((resolve) => {
        (window as any).axe.run(opts || {}, (err: any, results: any) => {
          if (err) throw err;
          resolve(results.violations);
        });
      });
    }, options);
    
    return violations;
  }
  
  /**
   * Wait for animations to complete
   */
  async waitForAnimations() {
    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.querySelectorAll('*')).map((element) => {
          const animations = element.getAnimations();
          return Promise.all(animations.map((animation) => animation.finished));
        })
      );
    });
  }
  
  /**
   * Get canvas performance metrics
   */
  async getCanvasPerformance() {
    return await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      let frameCount = 0;
      let lastTime = performance.now();
      const frameRates: number[] = [];
      
      return new Promise((resolve) => {
        function measureFrame() {
          frameCount++;
          const currentTime = performance.now();
          const deltaTime = currentTime - lastTime;
          
          if (deltaTime >= 1000) {
            const fps = (frameCount / deltaTime) * 1000;
            frameRates.push(fps);
            frameCount = 0;
            lastTime = currentTime;
            
            if (frameRates.length >= 5) {
              const avgFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
              const minFps = Math.min(...frameRates);
              const maxFps = Math.max(...frameRates);
              
              resolve({
                average: avgFps,
                min: minFps,
                max: maxFps,
                samples: frameRates,
              });
              return;
            }
          }
          
          requestAnimationFrame(measureFrame);
        }
        
        requestAnimationFrame(measureFrame);
      });
    });
  }
  
  /**
   * Abstract method to be implemented by child classes
   */
  abstract waitForPageReady(): Promise<void>;
}