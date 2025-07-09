import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display the homepage with correct title', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle('Genshi Studio')
    
    // Check main heading is visible
    const heading = page.locator('h1')
    await expect(heading).toContainText('Genshi Studio')
    await expect(heading).toBeVisible()
    
    // Check navigation links
    const navLinks = ['Home', 'Studio', 'Gallery', 'About']
    for (const link of navLinks) {
      await expect(page.locator(`nav >> text=${link}`)).toBeVisible()
    }
    
    // Check CTA buttons
    await expect(page.locator('text=Open Studio')).toBeVisible()
    await expect(page.locator('text=Explore Gallery')).toBeVisible()
  })

  test('should navigate to Studio page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Studio link
    await page.click('nav >> text=Studio')
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*\/studio/)
    
    // Verify canvas is present
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('/')
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    })
    
    // Click theme toggle button
    await page.click('button[aria-label="Toggle theme"]')
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    })
    
    expect(newTheme).not.toBe(initialTheme)
  })
})