import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { StudioPage } from '../pages/StudioPage';

/**
 * Performance Testing Suite
 * Validates application meets performance requirements:
 * - 60fps rendering
 * - <512MB memory usage
 * - <3 seconds load time
 */
test.describe('Performance Testing', () => {
  
  test('should maintain 60fps during canvas operations', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
    
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        frameCount: 0,
        frameTimestamps: [],
        startTime: 0,
      };
      
      let rafId: number;
      
      function measureFrame(timestamp: number) {
        if (!window.performanceMetrics.startTime) {
          window.performanceMetrics.startTime = timestamp;
        }
        
        window.performanceMetrics.frameCount++;
        window.performanceMetrics.frameTimestamps.push(timestamp);
        
        if (timestamp - window.performanceMetrics.startTime < 5000) {
          rafId = requestAnimationFrame(measureFrame);
        }
      }
      
      window.startPerformanceMeasurement = () => {
        window.performanceMetrics = {
          frameCount: 0,
          frameTimestamps: [],
          startTime: 0,
        };
        rafId = requestAnimationFrame(measureFrame);
      };
      
      window.stopPerformanceMeasurement = () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    });
    
    // Start measurement
    await page.evaluate(() => (window as any).startPerformanceMeasurement());
    
    // Perform intensive drawing operations
    await studioPage.selectTool('brush');
    
    // Draw multiple continuous strokes
    const strokes = [];
    for (let i = 0; i < 10; i++) {
      const stroke = [];
      for (let j = 0; j < 100; j++) {
        stroke.push({
          x: 50 + j * 3,
          y: 50 + i * 30 + Math.sin(j * 0.1) * 20
        });
      }
      strokes.push(stroke);
    }
    
    await studioPage.drawOnCanvas(strokes);
    
    // Stop measurement and analyze
    await page.evaluate(() => (window as any).stopPerformanceMeasurement());
    
    const metrics = await page.evaluate(() => {
      const data = (window as any).performanceMetrics;
      const timestamps = data.frameTimestamps;
      
      if (timestamps.length < 2) return { avgFps: 0 };
      
      // Calculate FPS
      const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
      const avgFps = data.frameCount / duration;
      
      // Calculate frame times
      const frameTimes = [];
      for (let i = 1; i < timestamps.length; i++) {
        frameTimes.push(timestamps[i] - timestamps[i - 1]);
      }
      
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      
      return {
        avgFps,
        avgFrameTime,
        maxFrameTime,
        totalFrames: data.frameCount,
      };
    });
    
    // Assert 60fps performance
    expect(metrics.avgFps).toBeGreaterThanOrEqual(55); // Allow 5fps margin
    expect(metrics.maxFrameTime).toBeLessThanOrEqual(33); // No frame should take more than 33ms (30fps min)
  });
  
  test('should keep memory usage under 512MB', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return 0;
    });
    
    // Perform memory-intensive operations
    await studioPage.selectTool('pattern');
    
    // Apply multiple complex patterns
    for (let i = 0; i < 20; i++) {
      await studioPage.selectPattern('mandala-complex');
      await studioPage.customizePattern({ scale: 2, symmetry: 12 });
      
      const canvasBox = await studioPage.canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + (i % 5) * 80 + 40,
          canvasBox.y + Math.floor(i / 5) * 80 + 40
        );
      }
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    // Wait for memory to stabilize
    await page.waitForTimeout(2000);
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return 0;
    });
    
    // Memory should not exceed 512MB
    expect(finalMemory).toBeLessThan(512);
    
    // Memory growth should be reasonable
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(256); // Max 256MB growth
  });
  
  test('should load application in under 3 seconds', async ({ page }) => {
    // Clear cache and cookies
    await page.context().clearCookies();
    
    // Measure cold load
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Verify load time
    expect(loadTime).toBeLessThan(3000);
    
    // Measure specific metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domParsing: perfData.domInteractive - perfData.domLoading,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        onLoad: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart,
      };
    });
    
    // Verify individual metrics
    expect(performanceMetrics.ttfb).toBeLessThan(500);
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);
    expect(performanceMetrics.total).toBeLessThan(3000);
  });
  
  test('should optimize bundle size', async ({ page }) => {
    const resources: Array<{ url: string; size: number }> = [];
    
    // Monitor resource loading
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0');
        resources.push({ url, size });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    const totalSizeMB = totalSize / 1024 / 1024;
    
    // Bundle should be reasonably sized
    expect(totalSizeMB).toBeLessThan(5); // 5MB total bundle limit
    
    // Check for code splitting
    const jsFiles = resources.filter(r => r.url.includes('.js'));
    expect(jsFiles.length).toBeGreaterThan(1); // Should have multiple chunks
    
    // No single chunk should be too large
    const maxChunkSize = Math.max(...jsFiles.map(f => f.size)) / 1024 / 1024;
    expect(maxChunkSize).toBeLessThan(1); // 1MB per chunk limit
  });
  
  test('should handle rapid user interactions', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
    
    // Rapidly switch between tools
    const tools = ['pen', 'brush', 'eraser', 'pattern'] as const;
    const startTime = Date.now();
    
    for (let i = 0; i < 50; i++) {
      await studioPage.selectTool(tools[i % tools.length]);
    }
    
    const rapidSwitchTime = Date.now() - startTime;
    
    // Should handle rapid switching efficiently
    expect(rapidSwitchTime).toBeLessThan(5000); // 50 switches in 5 seconds
    
    // UI should remain responsive
    const isResponsive = await page.evaluate(() => {
      return new Promise((resolve) => {
        let isBlocked = false;
        const startTime = performance.now();
        
        setTimeout(() => {
          const elapsed = performance.now() - startTime;
          // If setTimeout is delayed by more than 100ms, main thread is blocked
          if (elapsed > 150) {
            isBlocked = true;
          }
          resolve(!isBlocked);
        }, 50);
      });
    });
    
    expect(isResponsive).toBeTruthy();
  });
  
  test('should optimize canvas rendering', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    await studioPage.waitForPageReady();
    
    // Check canvas optimization settings
    const canvasOptimizations = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      return {
        imageSmoothingEnabled: ctx.imageSmoothingEnabled,
        willReadFrequently: canvas.getAttribute('willReadFrequently') === 'true',
        desynchronized: canvas.getAttribute('desynchronized') === 'true',
        alpha: ctx.getContextAttributes()?.alpha,
      };
    });
    
    expect(canvasOptimizations).toBeTruthy();
    
    // Measure rendering performance with complex scene
    await studioPage.selectTool('pattern');
    
    const renderingMetrics = await page.evaluate(async () => {
      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        // Trigger re-render
        const event = new CustomEvent('render-frame');
        document.dispatchEvent(event);
        
        // Wait for next frame
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        const frameTime = performance.now() - startTime;
        measurements.push(frameTime);
      }
      
      return {
        avgRenderTime: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        maxRenderTime: Math.max(...measurements),
      };
    });
    
    // Rendering should be fast
    expect(renderingMetrics.avgRenderTime).toBeLessThan(16.67); // 60fps target
    expect(renderingMetrics.maxRenderTime).toBeLessThan(33.33); // No frame slower than 30fps
  });
  
  test('should efficiently handle large datasets', async ({ page }) => {
    await page.goto('/gallery');
    
    // Simulate loading many items
    await page.evaluate(() => {
      // Mock large dataset
      const mockItems = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Artwork ${i}`,
        thumbnail: `data:image/svg+xml,<svg><text>Item ${i}</text></svg>`,
      }));
      
      // Trigger gallery update
      (window as any).__galleryData = mockItems;
      document.dispatchEvent(new CustomEvent('gallery-update'));
    });
    
    // Check if virtualization is used
    await page.waitForTimeout(1000);
    
    const visibleItems = await page.locator('[data-testid^="gallery-item-"]').count();
    const totalItems = 1000;
    
    // Should use virtualization (not render all 1000 items)
    expect(visibleItems).toBeLessThan(100); // Reasonable viewport limit
    
    // Scrolling should remain performant
    const scrollPerf = await page.evaluate(async () => {
      const container = document.querySelector('[data-testid="gallery-container"]');
      if (!container) return null;
      
      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        container.scrollTop = i * 1000;
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const scrollTime = performance.now() - startTime;
        measurements.push(scrollTime);
      }
      
      return {
        avgScrollTime: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      };
    });
    
    if (scrollPerf) {
      expect(scrollPerf.avgScrollTime).toBeLessThan(150); // Smooth scrolling
    }
  });
});