import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display the homepage with correct title', async ({ page }) => {
    await page.goto('') // Use empty string for base URL navigation
    
    // Check page title
    await expect(page).toHaveTitle('Genshi Studio - Digital Art & Cultural Pattern Generator')
    
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
    await expect(page.locator('text=Open Studio').first()).toBeVisible()
    await expect(page.locator('text=View Gallery').first()).toBeVisible()
  })

  test('should navigate to Studio page', async ({ page }) => {
    await page.goto('') // Use empty string for base URL navigation
    
    // Click on Studio link
    await page.click('nav >> text=Studio')
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*\/studio/)
    
    // Wait for canvas to be visible with proper timeout and testid
    const canvas = page.locator('canvas[data-testid="drawing-canvas"]')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    
    // Verify canvas has proper dimensions
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('') // Use empty string for base URL navigation
    
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