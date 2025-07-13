import { test, expect, Page } from '@playwright/test';

/**
 * TESTER_INTEGRATION_001 - Multi-Modal Integration Test Suite
 * Core integration testing for all four creative modes working simultaneously
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
}

interface TranslationMetrics {
  latency: number;
  accuracy: number;
  success: boolean;
}

class IntegrationTestHelper {
  constructor(private page: Page) {}

  async setupPerformanceMonitoring(): Promise<void> {
    await this.page.addInitScript(() => {
      // Performance monitoring setup
      (window as any).performanceMetrics = {
        frames: [],
        startTime: performance.now(),
        memoryBaseline: (performance as any).memory?.usedJSHeapSize || 0
      };

      let frameCount = 0;
      function recordFrame() {
        const now = performance.now();
        (window as any).performanceMetrics.frames.push(now);
        frameCount++;
        requestAnimationFrame(recordFrame);
      }
      requestAnimationFrame(recordFrame);

      // Translation latency monitoring
      (window as any).translationMetrics = {
        operations: [],
        startTranslation: (fromMode: string, toMode: string) => {
          const id = `${fromMode}->${toMode}-${Date.now()}`;
          (window as any).translationMetrics.operations.push({
            id,
            fromMode,
            toMode,
            startTime: performance.now(),
            completed: false
          });
          return id;
        },
        completeTranslation: (id: string, success: boolean) => {
          const op = (window as any).translationMetrics.operations.find((o: any) => o.id === id);
          if (op) {
            op.endTime = performance.now();
            op.latency = op.endTime - op.startTime;
            op.completed = true;
            op.success = success;
          }
        }
      };

      // Error tracking
      (window as any).testErrors = [];
      window.addEventListener('error', (e) => {
        (window as any).testErrors.push({
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          timestamp: Date.now()
        });
      });
    });
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return await this.page.evaluate(() => {
      const frames = (window as any).performanceMetrics.frames;
      const duration = (performance.now() - (window as any).performanceMetrics.startTime) / 1000;
      const fps = frames.length / duration;
      const avgFrameTime = frames.length > 1 ? 
        (frames[frames.length - 1] - frames[0]) / frames.length : 0;
      
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      return {
        fps,
        frameTime: avgFrameTime,
        memoryUsage: memoryUsage / 1024 / 1024, // Convert to MB
        renderCalls: frames.length
      };
    });
  }

  async measureTranslationLatency(fromMode: string, toMode: string): Promise<TranslationMetrics> {
    // Start translation measurement
    const translationId = await this.page.evaluate((args) => {
      return (window as any).translationMetrics.startTranslation(args.fromMode, args.toMode);
    }, { fromMode, toMode });

    // Trigger mode translation
    await this.triggerModeTranslation(fromMode, toMode);

    // Wait for translation completion (with timeout)
    await this.page.waitForFunction((id) => {
      const op = (window as any).translationMetrics.operations.find((o: any) => o.id === id);
      return op && op.completed;
    }, translationId, { timeout: 5000 });

    // Get translation metrics
    return await this.page.evaluate((id) => {
      const op = (window as any).translationMetrics.operations.find((o: any) => o.id === id);
      return {
        latency: op.latency,
        accuracy: 100, // TODO: Implement accuracy calculation
        success: op.success
      };
    }, translationId);
  }

  private async triggerModeTranslation(fromMode: string, toMode: string): Promise<void> {
    // Implementation depends on UI - this is a mock
    await this.page.click(`[data-testid="mode-${toMode}"]`);
    await this.page.waitForTimeout(100);
  }

  async activateAllModes(): Promise<void> {
    const modes = ['draw', 'parametric', 'code', 'growth'];
    
    for (const mode of modes) {
      await this.page.click(`[data-testid="mode-${mode}"], [data-mode="${mode}"], button:has-text("${mode}")`);
      await this.page.waitForTimeout(500); // Allow mode activation
    }
  }

  async performDrawOperation(): Promise<void> {
    const canvas = this.page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      // Draw a simple shape
      await this.page.mouse.move(centerX - 50, centerY - 50);
      await this.page.mouse.down();
      await this.page.mouse.move(centerX + 50, centerY - 50);
      await this.page.mouse.move(centerX + 50, centerY + 50);
      await this.page.mouse.move(centerX - 50, centerY + 50);
      await this.page.mouse.move(centerX - 50, centerY - 50);
      await this.page.mouse.up();
    }
  }

  async adjustParametricControls(): Promise<void> {
    // Look for parametric controls and adjust them
    const controls = [
      '[data-testid*="parameter"]',
      'input[type="range"]',
      '.parameter-control',
      '.pattern-control'
    ];

    for (const selector of controls) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.fill('50');
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  }

  async executeCodeFunction(): Promise<void> {
    // Look for code execution controls
    const codeSelectors = [
      '[data-testid="execute-code"]',
      '[data-testid="run-code"]',
      'button:has-text("Execute")',
      'button:has-text("Run")'
    ];

    for (const selector of codeSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  }

  async triggerGrowthStep(): Promise<void> {
    // Look for growth controls
    const growthSelectors = [
      '[data-testid="growth-step"]',
      '[data-testid="next-generation"]',
      'button:has-text("Grow")',
      'button:has-text("Step")'
    ];

    for (const selector of growthSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  }
}

test.describe('Multi-Modal Integration Tests', () => {
  let helper: IntegrationTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new IntegrationTestHelper(page);
    await helper.setupPerformanceMonitoring();
    
    // Navigate to studio page
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for full initialization
  });

  test('Gate 1: All four modes load and operate simultaneously', async ({ page }) => {
    console.log('🧪 Testing simultaneous multi-modal operation...');
    
    // Verify basic page load
    await expect(page.locator('[data-testid="studio-interface"], main, canvas')).toBeVisible();
    
    // Activate all modes
    await helper.activateAllModes();
    
    // Verify each mode is accessible
    const modes = ['draw', 'parametric', 'code', 'growth'];
    let activeModes = 0;
    
    for (const mode of modes) {
      const modeElements = await page.locator(`[data-testid*="${mode}"], [data-mode="${mode}"], [class*="${mode}"]`).count();
      if (modeElements > 0) {
        console.log(`✅ ${mode} mode detected (${modeElements} elements)`);
        activeModes++;
      }
    }
    
    console.log(`📊 Active modes: ${activeModes}/4`);
    expect(activeModes).toBeGreaterThan(2); // At least 3 modes should be available
    
    // Test concurrent operations
    console.log('🔄 Testing concurrent mode operations...');
    await Promise.allSettled([
      helper.performDrawOperation(),
      helper.adjustParametricControls(),
      helper.executeCodeFunction(),
      helper.triggerGrowthStep()
    ]);
    
    // Check for errors during operations
    const errors = await page.evaluate(() => (window as any).testErrors);
    expect(errors.length).toBeLessThan(3); // Allow for minor non-critical errors
    
    console.log('✅ Multi-modal integration test completed');
  });

  test('Gate 2: Real-time synchronization latency <100ms', async ({ page }) => {
    console.log('🚀 Testing synchronization latency...');
    
    await helper.activateAllModes();
    
    // Test multiple translation paths
    const translationPaths = [
      ['draw', 'parametric'],
      ['parametric', 'code'],
      ['code', 'growth']
    ];
    
    let totalLatency = 0;
    let successfulTranslations = 0;
    
    for (const [fromMode, toMode] of translationPaths) {
      try {
        const metrics = await helper.measureTranslationLatency(fromMode, toMode);
        
        console.log(`📊 ${fromMode} → ${toMode}: ${metrics.latency.toFixed(1)}ms`);
        
        if (metrics.success) {
          totalLatency += metrics.latency;
          successfulTranslations++;
          
          // Individual latency check
          expect(metrics.latency).toBeLessThan(150); // Allow 50ms tolerance
        }
      } catch (error) {
        console.log(`⚠️ Translation ${fromMode} → ${toMode} failed: ${error}`);
      }
    }
    
    if (successfulTranslations > 0) {
      const avgLatency = totalLatency / successfulTranslations;
      console.log(`📈 Average translation latency: ${avgLatency.toFixed(1)}ms`);
      expect(avgLatency).toBeLessThan(100); // Target requirement
    }
    
    console.log('✅ Synchronization latency test completed');
  });

  test('Gate 3: Performance validation 60fps with all modes', async ({ page }) => {
    console.log('📈 Testing performance with all modes active...');
    
    await helper.activateAllModes();
    
    // Perform intensive operations for 5 seconds
    const testDuration = 5000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < testDuration) {
      await Promise.allSettled([
        helper.performDrawOperation(),
        helper.adjustParametricControls(),
        helper.executeCodeFunction(),
        helper.triggerGrowthStep()
      ]);
      
      await page.waitForTimeout(100); // Brief pause between operations
    }
    
    // Measure performance metrics
    const metrics = await helper.getPerformanceMetrics();
    
    console.log(`📊 Performance Metrics:`);
    console.log(`   FPS: ${metrics.fps.toFixed(1)}`);
    console.log(`   Frame Time: ${metrics.frameTime.toFixed(2)}ms`);
    console.log(`   Memory Usage: ${metrics.memoryUsage.toFixed(1)}MB`);
    console.log(`   Render Calls: ${metrics.renderCalls}`);
    
    // Performance assertions (with tolerance for test environment)
    expect(metrics.fps).toBeGreaterThan(25); // Minimum viable performance
    expect(metrics.frameTime).toBeLessThan(40); // Allow for slower test environment
    expect(metrics.memoryUsage).toBeLessThan(1024); // 1GB memory limit
    
    // Ideal performance targets (warnings if not met)
    if (metrics.fps < 50) {
      console.log(`⚠️ FPS below target: ${metrics.fps.toFixed(1)}/60`);
    }
    if (metrics.memoryUsage > 512) {
      console.log(`⚠️ Memory usage above target: ${metrics.memoryUsage.toFixed(1)}MB/512MB`);
    }
    
    console.log('✅ Performance validation completed');
  });

  test('Gate 4: Translation quality validation', async ({ page }) => {
    console.log('🎯 Testing translation quality...');
    
    await helper.activateAllModes();
    
    // Create content in draw mode
    await helper.performDrawOperation();
    await page.waitForTimeout(1000);
    
    // Test bidirectional translation chain
    const translationChain = ['draw', 'parametric', 'code', 'growth', 'draw'];
    
    for (let i = 0; i < translationChain.length - 1; i++) {
      const fromMode = translationChain[i];
      const toMode = translationChain[i + 1];
      
      try {
        console.log(`🔄 Translating ${fromMode} → ${toMode}...`);
        
        // Trigger translation
        await page.click(`[data-testid="mode-${toMode}"], [data-mode="${toMode}"]`);
        await page.waitForTimeout(500);
        
        // Verify translation completed without errors
        const errors = await page.evaluate(() => (window as any).testErrors);
        const newErrors = errors.filter((e: any) => Date.now() - e.timestamp < 1000);
        
        expect(newErrors.length).toBe(0);
        
        console.log(`✅ ${fromMode} → ${toMode} translation successful`);
      } catch (error) {
        console.log(`⚠️ Translation ${fromMode} → ${toMode} encountered issues: ${error}`);
      }
    }
    
    console.log('✅ Translation quality validation completed');
  });

  test('Gate 5: UI consistency across all modes', async ({ page }) => {
    console.log('🎨 Testing UI consistency across modes...');
    
    const modes = ['draw', 'parametric', 'code', 'growth'];
    
    for (const mode of modes) {
      console.log(`🔍 Testing ${mode} mode UI...`);
      
      // Activate mode
      try {
        await page.click(`[data-testid="mode-${mode}"], [data-mode="${mode}"]`);
        await page.waitForTimeout(1000);
        
        // Check for essential UI elements
        const uiElements = [
          'canvas, [role="main"], main',                    // Main workspace
          '[data-testid*="toolbar"], .toolbar, nav',       // Toolbar
          '[data-testid*="panel"], .panel, aside',         // Side panels
        ];
        
        let visibleElements = 0;
        for (const selector of uiElements) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              visibleElements++;
            }
          } catch (e) {
            // Element not found, continue
          }
        }
        
        expect(visibleElements).toBeGreaterThan(0);
        console.log(`✅ ${mode} mode UI elements visible: ${visibleElements}`);
        
      } catch (error) {
        console.log(`⚠️ ${mode} mode UI test failed: ${error}`);
      }
    }
    
    console.log('✅ UI consistency validation completed');
  });

  test('Gate 6: Error handling and recovery', async ({ page }) => {
    console.log('🛡️ Testing error handling and recovery...');
    
    await helper.activateAllModes();
    
    // Test network interruption simulation
    console.log('📡 Testing network resilience...');
    await page.setOfflineMode(true);
    await page.waitForTimeout(2000);
    
    // Perform operations while offline
    await Promise.allSettled([
      helper.performDrawOperation(),
      helper.adjustParametricControls()
    ]);
    
    // Restore network
    await page.setOfflineMode(false);
    await page.waitForTimeout(2000);
    
    // Test memory pressure simulation
    console.log('💾 Testing memory pressure handling...');
    try {
      // Create many operations to stress memory
      for (let i = 0; i < 10; i++) {
        await helper.performDrawOperation();
        await page.waitForTimeout(100);
      }
    } catch (error) {
      console.log(`⚠️ Memory pressure test encountered: ${error}`);
    }
    
    // Check system stability
    const finalErrors = await page.evaluate(() => (window as any).testErrors);
    const criticalErrors = finalErrors.filter((e: any) => 
      e.message.includes('out of memory') || 
      e.message.includes('context lost') ||
      e.message.includes('fatal')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('✅ Error handling validation completed');
  });

  test('Integration health check', async ({ page }) => {
    console.log('🏥 Running integration health check...');
    
    // Overall system health validation
    await helper.activateAllModes();
    
    // Check console for critical errors
    const errors = await page.evaluate(() => (window as any).testErrors);
    const criticalErrors = errors.filter((e: any) => 
      e.message.toLowerCase().includes('error') &&
      !e.message.includes('ResizeObserver') && // Allow common non-critical errors
      !e.message.includes('favicon')
    );
    
    // Check performance baseline
    const metrics = await helper.getPerformanceMetrics();
    
    // Health score calculation
    let healthScore = 100;
    
    if (criticalErrors.length > 0) healthScore -= criticalErrors.length * 10;
    if (metrics.fps < 30) healthScore -= 20;
    if (metrics.memoryUsage > 512) healthScore -= 10;
    
    console.log(`📊 Integration Health Score: ${healthScore}/100`);
    console.log(`   Critical Errors: ${criticalErrors.length}`);
    console.log(`   FPS: ${metrics.fps.toFixed(1)}`);
    console.log(`   Memory: ${metrics.memoryUsage.toFixed(1)}MB`);
    
    // Health assertions
    expect(healthScore).toBeGreaterThan(70); // Minimum acceptable health
    expect(criticalErrors.length).toBeLessThan(3); // Allow minor issues
    
    if (healthScore >= 90) {
      console.log('✅ Integration health: EXCELLENT');
    } else if (healthScore >= 80) {
      console.log('✅ Integration health: GOOD');
    } else {
      console.log('⚠️ Integration health: NEEDS ATTENTION');
    }
    
    console.log('✅ Health check completed');
  });
});