import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { StudioPage } from '../pages/StudioPage';

/**
 * Accessibility Testing Suite
 * Validates WCAG 2.1 AA compliance and inclusive design
 */
test.describe('Accessibility Testing', () => {
  
  test('should have no accessibility violations on home page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Run accessibility audit
    const violations = await homePage.checkAccessibility();
    
    // Report any violations
    if (Array.isArray(violations) && violations.length > 0) {
      console.log('Accessibility violations found:');
      violations.forEach((violation: any) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }
    
    // Should have no violations
    expect(violations).toHaveLength(0);
  });
  
  test('should support keyboard navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Tab through interactive elements
    const focusableElements = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return elements.length;
    });
    
    expect(focusableElements).toBeGreaterThan(0);
    
    // Test tab navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      // Check if an element has focus
      const hasFocus = await page.evaluate(() => {
        return document.activeElement !== document.body;
      });
      
      expect(hasFocus).toBeTruthy();
    }
    
    // Test reverse tab navigation
    await page.keyboard.press('Shift+Tab');
    
    // Navigate to Studio using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should navigate to studio
    await page.waitForURL('**/studio');
  });
  
  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Check focus styles
    const focusStyles = await page.evaluate(() => {
      const button = document.querySelector('button');
      if (!button) return null;
      
      button.focus();
      const styles = window.getComputedStyle(button);
      const focusedStyles = {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
      
      button.blur();
      const blurredStyles = window.getComputedStyle(button);
      
      return {
        focused: focusedStyles,
        blurred: {
          outline: blurredStyles.outline,
          boxShadow: blurredStyles.boxShadow,
        },
        hasDifference: 
          focusedStyles.outline !== blurredStyles.outline ||
          focusedStyles.boxShadow !== blurredStyles.boxShadow,
      };
    });
    
    expect(focusStyles?.hasDifference).toBeTruthy();
  });
  
  test('should support screen readers', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    
    // Check ARIA labels
    const ariaLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-describedby]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        ariaDescribedBy: el.getAttribute('aria-describedby'),
      }));
    });
    
    expect(ariaLabels.length).toBeGreaterThan(0);
    
    // Check tool buttons have proper labels
    const toolButtons = await page.locator('[data-testid^="tool-"]').all();
    
    for (const button of toolButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/tool|pen|brush|eraser|pattern|text|select/i);
    }
    
    // Check live regions for dynamic updates
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);
  });
  
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check color contrast ratios
    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];
      
      function getLuminance(rgb: string) {
        const matches = rgb.match(/\d+/g);
        if (!matches || matches.length < 3) return 0;
        
        const [r, g, b] = matches.map(Number);
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      function getContrastRatio(color1: string, color2: string) {
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }
      
      const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6');
      
      textElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor) {
          const ratio = getContrastRatio(textColor, bgColor);
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;
          
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
          const requiredRatio = isLargeText ? 3 : 4.5;
          
          if (ratio < requiredRatio) {
            issues.push({
              element: el.tagName,
              text: el.textContent?.substring(0, 50),
              ratio: ratio.toFixed(2),
              required: requiredRatio,
            });
          }
        }
      });
      
      return issues;
    });
    
    // Should have no contrast issues
    if (contrastIssues.length > 0) {
      console.log('Color contrast issues:', contrastIssues);
    }
    expect(contrastIssues).toHaveLength(0);
  });
  
  test('should support high contrast mode', async ({ page }) => {
    // Enable forced colors (high contrast)
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    
    // Take screenshot in high contrast
    await expect(page).toHaveScreenshot('high-contrast-home.png');
    
    // Verify essential elements are still visible
    const essentialElements = [
      'h1',
      'button',
      'a',
      'input',
      '[role="navigation"]',
    ];
    
    for (const selector of essentialElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  });
  
  test('should handle zoom levels', async ({ page }) => {
    await page.goto('/');
    
    // Test different zoom levels
    const zoomLevels = [100, 150, 200, 400];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((z) => {
        document.documentElement.style.zoom = `${z}%`;
      }, zoom);
      
      // Check layout doesn't break
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // At 200% zoom or less, should not require horizontal scrolling
      if (zoom <= 200) {
        expect(hasHorizontalScroll).toBeFalsy();
      }
      
      // Reset zoom
      await page.evaluate(() => {
        document.documentElement.style.zoom = '100%';
      });
    }
  });
  
  test('should provide text alternatives', async ({ page }) => {
    await page.goto('/');
    
    // Check images have alt text
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const isDecorative = await img.getAttribute('role') === 'presentation';
      
      if (!isDecorative) {
        expect(alt).toBeTruthy();
        expect(alt).not.toBe(''); // Alt text should be meaningful
      }
    }
    
    // Check icons have labels
    const icons = await page.locator('[data-icon], .icon, svg:not([aria-hidden="true"])').all();
    
    for (const icon of icons) {
      const ariaLabel = await icon.getAttribute('aria-label');
      const title = await icon.locator('title').textContent().catch(() => null);
      const parentLabel = await icon.evaluate((el) => {
        const parent = el.parentElement;
        return parent?.getAttribute('aria-label') || parent?.textContent?.trim();
      });
      
      const hasLabel = ariaLabel || title || parentLabel;
      expect(hasLabel).toBeTruthy();
    }
  });
  
  test('should support reduced motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check animations are disabled
    const animationDurations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const durations: string[] = [];
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const animationDuration = styles.animationDuration;
        const transitionDuration = styles.transitionDuration;
        
        if (animationDuration !== '0s') {
          durations.push(animationDuration);
        }
        if (transitionDuration !== '0s') {
          durations.push(transitionDuration);
        }
      });
      
      return durations;
    });
    
    // With reduced motion, animations should be minimal or instant
    const nonZeroDurations = animationDurations.filter(d => 
      parseFloat(d) > 0.1 // Allow very short transitions
    );
    
    expect(nonZeroDurations.length).toBe(0);
  });
  
  test('should have accessible forms in studio', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    
    // Check form controls
    const formControls = await page.evaluate(() => {
      const controls = document.querySelectorAll('input, select, textarea');
      return Array.from(controls).map(control => {
        const label = control.labels?.[0]?.textContent || 
                     control.getAttribute('aria-label') ||
                     document.querySelector(`[for="${control.id}"]`)?.textContent;
        
        return {
          type: control.tagName,
          id: control.id,
          hasLabel: !!label,
          label: label,
          required: control.hasAttribute('required'),
          describedBy: control.getAttribute('aria-describedby'),
        };
      });
    });
    
    // All form controls should have labels
    formControls.forEach(control => {
      expect(control.hasLabel).toBeTruthy();
    });
    
    // Required fields should be indicated
    const requiredFields = formControls.filter(c => c.required);
    requiredFields.forEach(field => {
      expect(field.label).toMatch(/required|\*/i);
    });
  });
  
  test('should announce status updates', async ({ page }) => {
    const studioPage = new StudioPage(page);
    await studioPage.goto();
    
    // Monitor live region updates
    const liveUpdates: string[] = [];
    
    await page.evaluateOnNewDocument(() => {
      window.liveRegionUpdates = [];
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          const target = mutation.target as Element;
          if (target.getAttribute('aria-live') || 
              target.closest('[aria-live]')) {
            window.liveRegionUpdates.push(target.textContent || '');
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    
    // Perform action that should announce status
    await studioPage.saveArtwork('Test Artwork');
    
    // Get announced updates
    const updates = await page.evaluate(() => (window as any).liveRegionUpdates);
    
    // Should have announced save status
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.some((u: string) => u.includes('save') || u.includes('success'))).toBeTruthy();
  });
});