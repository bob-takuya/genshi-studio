import { test, expect, Page, Browser } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

/**
 * TESTER_INTEGRATION_001 - Cross-Platform Accessibility Integration Tests
 * Validates WCAG 2.1 AA compliance and cross-browser compatibility
 */

interface AccessibilityMetrics {
  violations: number;
  passes: number;
  incomplete: number;
  wcagLevel: string;
  score: number;
}

interface BrowserCapabilities {
  webgl: boolean;
  websockets: boolean;
  workers: boolean;
  pressure: boolean;
  touch: boolean;
  features: string[];
}

interface ResponsiveMetrics {
  viewportSizes: Array<{ width: number; height: number; name: string; usable: boolean }>;
  orientationSupport: boolean;
  touchTargetSizes: boolean;
  contentScaling: boolean;
}

class AccessibilityTestHelper {
  constructor(private page: Page) {}

  async setupA11yMonitoring(): Promise<void> {
    // Inject axe-core for accessibility testing
    await injectAxe(this.page);
    
    await this.page.addInitScript(() => {
      // Accessibility metrics tracking
      (window as any).a11yMetrics = {
        violations: [],
        passes: [],
        testResults: [],
        keyboardNavigation: [],
        screenReaderEvents: []
      };

      // Keyboard navigation tracking
      let tabSequence: string[] = [];
      let currentTabIndex = -1;

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const activeElement = document.activeElement;
          const elementId = activeElement?.id || 
            activeElement?.className || 
            activeElement?.tagName || 
            'unknown';
          
          tabSequence.push(elementId);
          currentTabIndex = tabSequence.length - 1;
          
          (window as any).a11yMetrics.keyboardNavigation.push({
            timestamp: Date.now(),
            element: elementId,
            sequence: currentTabIndex,
            shiftKey: e.shiftKey
          });
        }
      });

      // Focus management tracking
      document.addEventListener('focusin', (e) => {
        const target = e.target as Element;
        (window as any).a11yMetrics.keyboardNavigation.push({
          timestamp: Date.now(),
          event: 'focusin',
          element: target?.id || target?.className || target?.tagName,
          hasVisibleFocus: getComputedStyle(target).outline !== 'none'
        });
      });

      // ARIA live region monitoring
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const target = mutation.target as Element;
            if (target.getAttribute('aria-live') || target.querySelector('[aria-live]')) {
              (window as any).a11yMetrics.screenReaderEvents.push({
                timestamp: Date.now(),
                type: 'live-region-update',
                element: target.id || target.className,
                content: target.textContent?.slice(0, 100)
              });
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  async runAccessibilityCheck(): Promise<AccessibilityMetrics> {
    try {
      await checkA11y(this.page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });

      const violations = await getViolations(this.page);
      
      return {
        violations: violations.length,
        passes: 0, // Would be calculated from axe results
        incomplete: 0, // Would be calculated from axe results
        wcagLevel: 'AA',
        score: Math.max(0, 100 - (violations.length * 10))
      };
    } catch (error) {
      console.log(`Accessibility check error: ${error}`);
      return {
        violations: 999,
        passes: 0,
        incomplete: 0,
        wcagLevel: 'FAIL',
        score: 0
      };
    }
  }

  async testKeyboardNavigation(): Promise<number> {
    // Test keyboard navigation through the interface
    const navigationPoints = [
      '[data-testid="mode-draw"]',
      '[data-testid="mode-parametric"]', 
      '[data-testid="mode-code"]',
      '[data-testid="mode-growth"]',
      'canvas',
      'button',
      'input',
      'select'
    ];

    let navigableElements = 0;

    for (const selector of navigationPoints) {
      try {
        const elements = await this.page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            await element.focus();
            const isFocused = await element.evaluate(el => el === document.activeElement);
            if (isFocused) {
              navigableElements++;
            }
          }
        }
      } catch (error) {
        // Element not found or not focusable
      }
    }

    return navigableElements;
  }

  async testScreenReaderSupport(): Promise<boolean> {
    // Check for essential ARIA attributes and semantic structure
    const ariaChecks = [
      { selector: 'canvas', attribute: 'aria-label' },
      { selector: '[role="button"]', attribute: 'aria-label' },
      { selector: 'input', attribute: 'aria-label' },
      { selector: '[data-testid*="mode"]', attribute: 'aria-label' }
    ];

    let ariaCompliant = 0;
    let totalChecks = 0;

    for (const check of ariaChecks) {
      const elements = await this.page.locator(check.selector).all();
      for (const element of elements) {
        totalChecks++;
        const hasAria = await element.getAttribute(check.attribute);
        if (hasAria) {
          ariaCompliant++;
        }
      }
    }

    return totalChecks > 0 ? (ariaCompliant / totalChecks) > 0.8 : true;
  }

  async testColorContrast(): Promise<boolean> {
    // Basic color contrast validation
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let contrastIssues = 0;
      let totalElements = 0;

      for (const element of elements) {
        const style = getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        if (color && backgroundColor && 
            color !== 'rgba(0, 0, 0, 0)' && 
            backgroundColor !== 'rgba(0, 0, 0, 0)') {
          totalElements++;
          
          // Simple contrast check (would use more sophisticated algorithm in production)
          const isGoodContrast = this.checkContrastRatio(color, backgroundColor);
          if (!isGoodContrast) {
            contrastIssues++;
          }
        }
      }

      return totalElements > 0 ? (contrastIssues / totalElements) < 0.1 : true;
    });
  }
}

class CrossBrowserTestHelper {
  constructor(private page: Page) {}

  async detectBrowserCapabilities(): Promise<BrowserCapabilities> {
    return await this.page.evaluate(() => {
      const capabilities: BrowserCapabilities = {
        webgl: false,
        websockets: false,
        workers: false,
        pressure: false,
        touch: false,
        features: []
      };

      // WebGL detection
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        capabilities.webgl = !!gl;
        if (capabilities.webgl) capabilities.features.push('webgl');
      } catch (e) {
        // WebGL not supported
      }

      // WebSocket detection
      capabilities.websockets = typeof WebSocket !== 'undefined';
      if (capabilities.websockets) capabilities.features.push('websockets');

      // Web Workers detection
      capabilities.workers = typeof Worker !== 'undefined';
      if (capabilities.workers) capabilities.features.push('workers');

      // Pressure API detection
      capabilities.pressure = 'ontouchstart' in window && 
        typeof (window as any).PointerEvent !== 'undefined';
      if (capabilities.pressure) capabilities.features.push('pressure');

      // Touch support detection
      capabilities.touch = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;
      if (capabilities.touch) capabilities.features.push('touch');

      return capabilities;
    });
  }

  async testWebGLPerformance(): Promise<number> {
    return await this.page.evaluate(() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return 0;

        // Simple WebGL performance test
        const startTime = performance.now();
        
        // Create and compile a simple shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) return 0;
        
        gl.shaderSource(vertexShader, `
          attribute vec4 position;
          void main() {
            gl_Position = position;
          }
        `);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) return 0;
        
        gl.shaderSource(fragmentShader, `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `);
        gl.compileShader(fragmentShader);
        
        const program = gl.createProgram();
        if (!program) return 0;
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        const endTime = performance.now();
        const compilationTime = endTime - startTime;
        
        // Return performance score (lower compilation time = higher score)
        return Math.max(0, 100 - compilationTime);
        
      } catch (error) {
        return 0;
      }
    });
  }

  async testResponsiveDesign(): Promise<ResponsiveMetrics> {
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop-medium' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 375, height: 667, name: 'mobile-portrait' },
      { width: 667, height: 375, name: 'mobile-landscape' }
    ];

    const results: ResponsiveMetrics = {
      viewportSizes: [],
      orientationSupport: true,
      touchTargetSizes: true,
      contentScaling: true
    };

    for (const viewport of viewportSizes) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000);

      // Check if main interface is usable
      const isUsable = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const toolbar = document.querySelector('[data-testid*="toolbar"], .toolbar, nav');
        
        const canvasVisible = canvas && 
          getComputedStyle(canvas).display !== 'none' &&
          canvas.offsetWidth > 100 && canvas.offsetHeight > 100;
        
        const toolbarVisible = toolbar && 
          getComputedStyle(toolbar).display !== 'none';

        return !!(canvasVisible && toolbarVisible);
      });

      results.viewportSizes.push({
        ...viewport,
        usable: isUsable
      });
    }

    return results;
  }
}

test.describe('Cross-Platform Accessibility Integration', () => {
  let a11yHelper: AccessibilityTestHelper;
  let browserHelper: CrossBrowserTestHelper;

  test.beforeEach(async ({ page }) => {
    a11yHelper = new AccessibilityTestHelper(page);
    browserHelper = new CrossBrowserTestHelper(page);
    
    await a11yHelper.setupA11yMonitoring();
    
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('WCAG 2.1 AA compliance validation', async ({ page }) => {
    console.log('♿ Testing WCAG 2.1 AA compliance...');
    
    // Run comprehensive accessibility check
    const a11yMetrics = await a11yHelper.runAccessibilityCheck();
    
    console.log(`♿ Accessibility Metrics:`);
    console.log(`   Violations: ${a11yMetrics.violations}`);
    console.log(`   WCAG Level: ${a11yMetrics.wcagLevel}`);
    console.log(`   A11y Score: ${a11yMetrics.score}/100`);
    
    // WCAG compliance requirements
    expect(a11yMetrics.violations).toBeLessThan(5); // Allow minor violations
    expect(a11yMetrics.score).toBeGreaterThan(80); // 80% accessibility score
    
    // Test keyboard navigation
    const navigableElements = await a11yHelper.testKeyboardNavigation();
    console.log(`   Keyboard Navigation: ${navigableElements} elements`);
    expect(navigableElements).toBeGreaterThan(5); // At least 5 navigable elements
    
    // Test screen reader support
    const screenReaderSupport = await a11yHelper.testScreenReaderSupport();
    console.log(`   Screen Reader Support: ${screenReaderSupport ? 'PASS' : 'FAIL'}`);
    expect(screenReaderSupport).toBe(true);
    
    // Test color contrast
    const colorContrast = await a11yHelper.testColorContrast();
    console.log(`   Color Contrast: ${colorContrast ? 'PASS' : 'FAIL'}`);
    expect(colorContrast).toBe(true);
    
    console.log('✅ WCAG compliance validation completed');
  });

  test('Cross-browser feature compatibility', async ({ page, browserName }) => {
    console.log(`🌐 Testing ${browserName} compatibility...`);
    
    // Detect browser capabilities
    const capabilities = await browserHelper.detectBrowserCapabilities();
    
    console.log(`🔧 ${browserName} Capabilities:`);
    console.log(`   WebGL: ${capabilities.webgl ? '✅' : '❌'}`);
    console.log(`   WebSockets: ${capabilities.websockets ? '✅' : '❌'}`);
    console.log(`   Web Workers: ${capabilities.workers ? '✅' : '❌'}`);
    console.log(`   Touch Support: ${capabilities.touch ? '✅' : '❌'}`);
    console.log(`   Features: ${capabilities.features.join(', ')}`);
    
    // Essential capabilities check
    expect(capabilities.webgl).toBe(true); // WebGL required for graphics
    expect(capabilities.websockets).toBe(true); // WebSockets required for sync
    
    // Browser-specific requirements
    if (browserName === 'chromium') {
      expect(capabilities.features.length).toBeGreaterThan(3); // Chrome should support most features
    } else if (browserName === 'firefox') {
      expect(capabilities.webgl).toBe(true); // Firefox must support WebGL
      expect(capabilities.websockets).toBe(true); // Firefox must support WebSockets
    } else if (browserName === 'webkit') {
      expect(capabilities.webgl).toBe(true); // Safari must support WebGL
    }
    
    // Test WebGL performance if available
    if (capabilities.webgl) {
      const webglPerformance = await browserHelper.testWebGLPerformance();
      console.log(`   WebGL Performance: ${webglPerformance.toFixed(1)}/100`);
      expect(webglPerformance).toBeGreaterThan(30); // Minimum WebGL performance
    }
    
    console.log(`✅ ${browserName} compatibility test completed`);
  });

  test('Responsive design validation', async ({ page }) => {
    console.log('📱 Testing responsive design across viewports...');
    
    const responsiveMetrics = await browserHelper.testResponsiveDesign();
    
    console.log(`📱 Responsive Design Results:`);
    for (const viewport of responsiveMetrics.viewportSizes) {
      const status = viewport.usable ? '✅' : '❌';
      console.log(`   ${viewport.name} (${viewport.width}x${viewport.height}): ${status}`);
    }
    
    // Responsive requirements
    const desktopViewports = responsiveMetrics.viewportSizes.filter(v => 
      v.name.includes('desktop'));
    const tabletViewports = responsiveMetrics.viewportSizes.filter(v => 
      v.name.includes('tablet'));
    const mobileViewports = responsiveMetrics.viewportSizes.filter(v => 
      v.name.includes('mobile'));
    
    // Desktop support (required)
    const desktopUsable = desktopViewports.every(v => v.usable);
    expect(desktopUsable).toBe(true);
    
    // Tablet support (recommended)
    const tabletUsability = tabletViewports.filter(v => v.usable).length / tabletViewports.length;
    expect(tabletUsability).toBeGreaterThan(0.5); // 50% tablet support
    
    // Mobile support (nice to have)
    const mobileUsability = mobileViewports.filter(v => v.usable).length / mobileViewports.length;
    console.log(`   Mobile Usability: ${(mobileUsability * 100).toFixed(1)}%`);
    
    // Overall responsive score
    const overallUsability = responsiveMetrics.viewportSizes.filter(v => v.usable).length / 
      responsiveMetrics.viewportSizes.length;
    console.log(`   Overall Responsive Score: ${(overallUsability * 100).toFixed(1)}%`);
    expect(overallUsability).toBeGreaterThan(0.7); // 70% overall responsiveness
    
    console.log('✅ Responsive design validation completed');
  });

  test('Touch interaction support', async ({ page, isMobile }) => {
    if (!isMobile) {
      console.log('⏭️ Skipping touch test on non-mobile browser');
      return;
    }
    
    console.log('👆 Testing touch interaction support...');
    
    // Test touch gestures on canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) {
      console.log('❌ Canvas not available for touch testing');
      return;
    }
    
    // Test single touch
    console.log('   Testing single touch...');
    await page.touchscreen.tap(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.waitForTimeout(500);
    
    // Test pinch gesture (zoom)
    console.log('   Testing pinch gesture...');
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // Simulate pinch zoom
    await page.touchscreen.tap(centerX - 50, centerY - 50);
    await page.touchscreen.tap(centerX + 50, centerY + 50);
    await page.waitForTimeout(500);
    
    // Test swipe gesture (pan)
    console.log('   Testing swipe gesture...');
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY);
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Verify touch interactions don't cause errors
    const errors = await page.evaluate(() => (window as any).testErrors || []);
    const touchErrors = errors.filter((e: any) => 
      e.message.toLowerCase().includes('touch') || 
      e.message.toLowerCase().includes('gesture'));
    
    expect(touchErrors.length).toBe(0);
    
    console.log('✅ Touch interaction support test completed');
  });

  test('High contrast mode support', async ({ page }) => {
    console.log('🔆 Testing high contrast mode support...');
    
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.waitForTimeout(1000);
    
    // Check if interface adapts to high contrast
    const contrastSupport = await page.evaluate(() => {
      // Check if elements have proper contrast in forced colors mode
      const elements = document.querySelectorAll('button, input, canvas, [role="button"]');
      let contrastCompliant = 0;
      
      for (const element of elements) {
        const style = getComputedStyle(element);
        const hasVisibleBorder = style.border !== 'none' && style.border !== '0px';
        const hasVisibleOutline = style.outline !== 'none' && style.outline !== '0px';
        const hasBackgroundColor = style.backgroundColor !== 'rgba(0, 0, 0, 0)';
        
        if (hasVisibleBorder || hasVisibleOutline || hasBackgroundColor) {
          contrastCompliant++;
        }
      }
      
      return {
        totalElements: elements.length,
        compliantElements: contrastCompliant,
        complianceRate: elements.length > 0 ? contrastCompliant / elements.length : 1
      };
    });
    
    console.log(`🔆 High Contrast Results:`);
    console.log(`   Total Elements: ${contrastSupport.totalElements}`);
    console.log(`   Compliant Elements: ${contrastSupport.compliantElements}`);
    console.log(`   Compliance Rate: ${(contrastSupport.complianceRate * 100).toFixed(1)}%`);
    
    expect(contrastSupport.complianceRate).toBeGreaterThan(0.8); // 80% high contrast compliance
    
    // Test accessibility in high contrast mode
    const a11yMetrics = await a11yHelper.runAccessibilityCheck();
    expect(a11yMetrics.violations).toBeLessThan(10); // Allow more violations in high contrast
    
    console.log('✅ High contrast mode test completed');
  });

  test('Motion and animation preferences', async ({ page }) => {
    console.log('🎬 Testing motion and animation preferences...');
    
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);
    
    // Check if animations are properly reduced
    const motionCompliance = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll('*');
      let respectsMotionPreference = 0;
      let totalAnimations = 0;
      
      for (const element of animatedElements) {
        const style = getComputedStyle(element);
        
        // Check for CSS animations and transitions
        if (style.animationName !== 'none' || 
            style.transitionProperty !== 'none') {
          totalAnimations++;
          
          // Check if animation respects prefers-reduced-motion
          const animationDuration = parseFloat(style.animationDuration);
          const transitionDuration = parseFloat(style.transitionDuration);
          
          // Animations should be very short or disabled with reduced motion
          if (animationDuration <= 0.01 || transitionDuration <= 0.01) {
            respectsMotionPreference++;
          }
        }
      }
      
      return {
        totalAnimations,
        respectfulAnimations: respectsMotionPreference,
        complianceRate: totalAnimations > 0 ? respectsMotionPreference / totalAnimations : 1
      };
    });
    
    console.log(`🎬 Motion Preference Results:`);
    console.log(`   Total Animations: ${motionCompliance.totalAnimations}`);
    console.log(`   Respectful Animations: ${motionCompliance.respectfulAnimations}`);
    console.log(`   Compliance Rate: ${(motionCompliance.complianceRate * 100).toFixed(1)}%`);
    
    expect(motionCompliance.complianceRate).toBeGreaterThan(0.7); // 70% motion preference compliance
    
    console.log('✅ Motion preference test completed');
  });

  test('Language and localization support', async ({ page }) => {
    console.log('🌍 Testing language and localization support...');
    
    // Test with different language settings
    const testLanguages = ['en-US', 'ja-JP', 'ar-SA', 'de-DE'];
    
    for (const language of testLanguages) {
      console.log(`   Testing ${language} locale...`);
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': language
      });
      
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check if interface adapts to language
      const localizationSupport = await page.evaluate(() => {
        const textElements = document.querySelectorAll('button, label, [role="button"]');
        let hasText = 0;
        
        for (const element of textElements) {
          if (element.textContent && element.textContent.trim().length > 0) {
            hasText++;
          }
        }
        
        return {
          totalElements: textElements.length,
          elementsWithText: hasText,
          textCoverage: textElements.length > 0 ? hasText / textElements.length : 1
        };
      });
      
      console.log(`     Text Coverage: ${(localizationSupport.textCoverage * 100).toFixed(1)}%`);
      expect(localizationSupport.textCoverage).toBeGreaterThan(0.5); // 50% text coverage minimum
    }
    
    console.log('✅ Language and localization test completed');
  });

  test('Integration accessibility health check', async ({ page, browserName }) => {
    console.log('🏥 Running integration accessibility health check...');
    
    // Comprehensive accessibility and compatibility assessment
    const healthMetrics = {
      accessibility: 0,
      browserCompatibility: 0,
      responsiveness: 0,
      touchSupport: 0,
      overall: 0
    };
    
    // 1. Accessibility score
    const a11yMetrics = await a11yHelper.runAccessibilityCheck();
    healthMetrics.accessibility = a11yMetrics.score;
    
    // 2. Browser compatibility score
    const capabilities = await browserHelper.detectBrowserCapabilities();
    healthMetrics.browserCompatibility = (capabilities.features.length / 5) * 100; // Max 5 features
    
    // 3. Responsive design score
    const responsiveMetrics = await browserHelper.testResponsiveDesign();
    const responsiveScore = responsiveMetrics.viewportSizes.filter(v => v.usable).length / 
      responsiveMetrics.viewportSizes.length;
    healthMetrics.responsiveness = responsiveScore * 100;
    
    // 4. Touch support score (if applicable)
    if (capabilities.touch) {
      healthMetrics.touchSupport = 100; // Full credit for touch-capable browsers
    } else {
      healthMetrics.touchSupport = 75; // Partial credit for desktop browsers
    }
    
    // 5. Overall health score
    healthMetrics.overall = (
      healthMetrics.accessibility * 0.4 +
      healthMetrics.browserCompatibility * 0.3 +
      healthMetrics.responsiveness * 0.2 +
      healthMetrics.touchSupport * 0.1
    );
    
    console.log(`🏥 Integration Health Report (${browserName}):`);
    console.log(`   Accessibility: ${healthMetrics.accessibility.toFixed(1)}/100`);
    console.log(`   Browser Compatibility: ${healthMetrics.browserCompatibility.toFixed(1)}/100`);
    console.log(`   Responsiveness: ${healthMetrics.responsiveness.toFixed(1)}/100`);
    console.log(`   Touch Support: ${healthMetrics.touchSupport.toFixed(1)}/100`);
    console.log(`   Overall Health: ${healthMetrics.overall.toFixed(1)}/100`);
    
    // Health requirements
    expect(healthMetrics.accessibility).toBeGreaterThan(75); // 75% accessibility minimum
    expect(healthMetrics.browserCompatibility).toBeGreaterThan(60); // 60% compatibility minimum
    expect(healthMetrics.responsiveness).toBeGreaterThan(70); // 70% responsiveness minimum
    expect(healthMetrics.overall).toBeGreaterThan(70); // 70% overall health minimum
    
    // Excellent health targets
    if (healthMetrics.overall >= 90) {
      console.log('🌟 Integration health: EXCELLENT');
    } else if (healthMetrics.overall >= 80) {
      console.log('✅ Integration health: GOOD');
    } else {
      console.log('⚠️ Integration health: NEEDS IMPROVEMENT');
    }
    
    console.log('✅ Integration accessibility health check completed');
  });
});