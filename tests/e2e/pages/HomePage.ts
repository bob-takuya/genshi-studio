import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object Model
 * Handles interactions with the Genshi Studio home page
 */
export class HomePage extends BasePage {
  // Locators
  readonly heroSection: Locator;
  readonly getStartedButton: Locator;
  readonly featuresSection: Locator;
  readonly navigationMenu: Locator;
  readonly logo: Locator;
  readonly themeToggle: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.heroSection = page.locator('[data-testid="hero-section"]');
    this.getStartedButton = page.getByRole('button', { name: /get started/i });
    this.featuresSection = page.locator('[data-testid="features-section"]');
    this.navigationMenu = page.locator('nav[aria-label="Main navigation"]');
    this.logo = page.locator('[data-testid="app-logo"]');
    this.themeToggle = page.locator('[data-testid="theme-toggle"]');
  }
  
  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
  }
  
  /**
   * Wait for home page to be ready
   */
  async waitForPageReady() {
    await this.heroSection.waitFor({ state: 'visible' });
    await this.navigationMenu.waitFor({ state: 'visible' });
  }
  
  /**
   * Click Get Started button
   */
  async clickGetStarted() {
    await this.getStartedButton.click();
    await this.page.waitForURL('**/studio');
  }
  
  /**
   * Toggle theme
   */
  async toggleTheme() {
    const currentTheme = await this.page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    await this.themeToggle.click();
    
    // Wait for theme transition
    await this.page.waitForFunction((theme) => {
      const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      return newTheme !== theme;
    }, currentTheme);
  }
  
  /**
   * Navigate to a specific page via navigation menu
   */
  async navigateTo(pageName: 'Studio' | 'Gallery' | 'About') {
    const link = this.navigationMenu.getByRole('link', { name: pageName });
    await link.click();
    await this.page.waitForURL(`**/${pageName.toLowerCase()}`);
  }
  
  /**
   * Check if all features are displayed
   */
  async areAllFeaturesVisible(): Promise<boolean> {
    const features = await this.featuresSection.locator('[data-testid^="feature-"]').all();
    
    for (const feature of features) {
      if (!(await feature.isVisible())) {
        return false;
      }
    }
    
    return features.length > 0;
  }
  
  /**
   * Get hero section animation state
   */
  async getHeroAnimationState() {
    return await this.heroSection.evaluate((el) => {
      const animations = el.getAnimations();
      return {
        hasAnimations: animations.length > 0,
        animationCount: animations.length,
        playStates: animations.map(a => a.playState),
      };
    });
  }
}