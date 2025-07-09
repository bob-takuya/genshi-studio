import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { StudioPage } from '../pages/StudioPage';

/**
 * Visual Regression Testing Suite
 * Validates visual consistency across browsers and updates
 */
test.describe('Visual Regression Testing', () => {
  
  test.describe('Home Page Visual Tests', () => {
    test('should match home page visual snapshot', async ({ page, browserName }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForPageReady();
      
      // Wait for animations to complete
      await homePage.waitForAnimations();
      
      // Full page screenshot
      await expect(page).toHaveScreenshot(`home-page-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('[data-testid="dynamic-content"]')], // Mask dynamic content
      });
    });
    
    test('should match hero section visual', async ({ page, browserName }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      await expect(homePage.heroSection).toHaveScreenshot(
        `hero-section-${browserName}.png`,
        {
          animations: 'disabled',
          threshold: 0.1, // 10% threshold for minor variations
        }
      );
    });
    
    test('should match dark theme visual', async ({ page, browserName }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      
      // Toggle to dark theme
      await homePage.toggleTheme();
      await page.waitForTimeout(500); // Wait for theme transition
      
      await expect(page).toHaveScreenshot(`home-dark-theme-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
  
  test.describe('Studio Visual Tests', () => {
    test('should match empty canvas visual', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      await expect(studioPage.canvas).toHaveScreenshot(
        `studio-empty-canvas-${browserName}.png`
      );
    });
    
    test('should match tool panel visual', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      
      await expect(studioPage.toolPanel).toHaveScreenshot(
        `studio-tool-panel-${browserName}.png`,
        {
          animations: 'disabled',
        }
      );
    });
    
    test('should match drawing visual consistency', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      // Create consistent drawing
      await studioPage.selectTool('pen');
      await studioPage.setColor('#000000');
      
      // Draw a specific pattern
      await studioPage.drawOnCanvas([
        // Square
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 },
          { x: 100, y: 100 }
        ],
        // Circle approximation
        Array.from({ length: 32 }, (_, i) => {
          const angle = (i / 32) * Math.PI * 2;
          return {
            x: 300 + Math.cos(angle) * 50,
            y: 150 + Math.sin(angle) * 50
          };
        })
      ]);
      
      await expect(studioPage.canvas).toHaveScreenshot(
        `studio-drawing-consistency-${browserName}.png`,
        {
          maxDiffPixels: 100, // Allow small anti-aliasing differences
        }
      );
    });
  });
  
  test.describe('Pattern Visual Tests', () => {
    test('should match pattern rendering', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      // Apply specific pattern
      await studioPage.selectTool('pattern');
      await studioPage.selectPattern('mandala-basic');
      
      const canvasBox = await studioPage.canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2
        );
      }
      
      await page.waitForTimeout(1000); // Wait for pattern rendering
      
      await expect(studioPage.canvas).toHaveScreenshot(
        `pattern-mandala-${browserName}.png`,
        {
          threshold: 0.05, // 5% threshold for pattern complexity
        }
      );
    });
    
    test('should match pattern customization visual', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      await studioPage.selectTool('pattern');
      await studioPage.selectPattern('geometric-tile');
      
      // Apply specific customization
      await studioPage.customizePattern({
        symmetry: 6,
        rotation: 30,
        scale: 1.5
      });
      
      const canvasBox = await studioPage.canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2
        );
      }
      
      await page.waitForTimeout(1000);
      
      await expect(studioPage.canvas).toHaveScreenshot(
        `pattern-customized-${browserName}.png`
      );
    });
  });
  
  test.describe('Responsive Design Visual Tests', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];
    
    for (const viewport of viewports) {
      test(`should match ${viewport.name} layout`, async ({ page }) => {
        await page.setViewportSize(viewport);
        
        const homePage = new HomePage(page);
        await homePage.goto();
        await homePage.waitForPageReady();
        
        await expect(page).toHaveScreenshot(
          `responsive-${viewport.name}.png`,
          {
            fullPage: true,
            animations: 'disabled',
          }
        );
      });
    }
  });
  
  test.describe('Component State Visual Tests', () => {
    test('should match button states', async ({ page, browserName }) => {
      await page.goto('/');
      
      const button = page.locator('button').first();
      
      // Normal state
      await expect(button).toHaveScreenshot(
        `button-normal-${browserName}.png`
      );
      
      // Hover state
      await button.hover();
      await expect(button).toHaveScreenshot(
        `button-hover-${browserName}.png`
      );
      
      // Focus state
      await button.focus();
      await expect(button).toHaveScreenshot(
        `button-focus-${browserName}.png`
      );
      
      // Active state
      await page.mouse.move(await button.boundingBox().then(b => b!.x + 10), 
                           await button.boundingBox().then(b => b!.y + 10));
      await page.mouse.down();
      await expect(button).toHaveScreenshot(
        `button-active-${browserName}.png`
      );
      await page.mouse.up();
    });
    
    test('should match form input states', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      
      const colorPicker = studioPage.colorPicker;
      
      // Normal state
      await expect(colorPicker).toHaveScreenshot(
        `input-normal-${browserName}.png`
      );
      
      // Focus state
      await colorPicker.focus();
      await expect(colorPicker).toHaveScreenshot(
        `input-focus-${browserName}.png`
      );
    });
  });
  
  test.describe('Cross-Browser Visual Consistency', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      // Create a complex scene
      await studioPage.selectTool('pattern');
      await studioPage.selectPattern('mandala-complex');
      
      const canvasBox = await studioPage.canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2
        );
      }
      
      await studioPage.selectTool('brush');
      await studioPage.setColor('#FF6B6B');
      await studioPage.setBrushSize(15);
      
      // Add brush strokes
      await studioPage.drawOnCanvas([
        Array.from({ length: 50 }, (_, i) => ({
          x: 100 + i * 4,
          y: 100 + Math.sin(i * 0.2) * 30
        }))
      ]);
      
      await expect(studioPage.canvas).toHaveScreenshot(
        `cross-browser-consistency-${browserName}.png`,
        {
          threshold: 0.15, // Allow 15% difference for browser rendering variations
          maxDiffPixelRatio: 0.1, // Max 10% of pixels can differ
        }
      );
    });
  });
  
  test.describe('Animation Visual Tests', () => {
    test('should capture loading animation', async ({ page, browserName }) => {
      // Slow down network to see loading state
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      await page.goto('/');
      
      // Capture loading state
      await expect(page).toHaveScreenshot(
        `loading-animation-${browserName}.png`,
        {
          animations: 'allow', // Allow animations for this test
          maxDiffPixels: 500, // Higher threshold for animated content
        }
      );
    });
    
    test('should capture pattern generation animation', async ({ page, browserName }) => {
      const studioPage = new StudioPage(page);
      await studioPage.goto();
      await studioPage.waitForPageReady();
      
      await studioPage.selectTool('pattern');
      await studioPage.selectPattern('spiral-growth');
      
      // Enable animation
      const animateToggle = page.locator('[data-testid="pattern-animate"]');
      if (await animateToggle.isVisible()) {
        await animateToggle.click();
      }
      
      const canvasBox = await studioPage.canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2
        );
      }
      
      // Capture at different animation stages
      for (let i = 0; i < 3; i++) {
        await page.waitForTimeout(500);
        await expect(studioPage.canvas).toHaveScreenshot(
          `pattern-animation-frame-${i}-${browserName}.png`,
          {
            animations: 'allow',
          }
        );
      }
    });
  });
});