import { test, expect } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display mobile toolbar on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Mobile toolbar should be visible
    const mobileToolbar = page.locator('.fixed.bottom-0.left-0.right-0')
    await expect(mobileToolbar).toBeVisible()
    
    // Desktop toolbar should be hidden
    const desktopToolbar = page.locator('[data-testid="tool-panel"]')
    await expect(desktopToolbar).toBeHidden()
  })

  test('should display desktop toolbar on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Desktop toolbar should be visible
    const desktopToolbar = page.locator('[data-testid="tool-panel"]')
    await expect(desktopToolbar).toBeVisible()
  })

  test('should have touch-friendly button sizes on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Check button sizes in mobile toolbar
    const buttons = page.locator('.fixed.bottom-0 button')
    const firstButton = buttons.first()
    
    const boundingBox = await firstButton.boundingBox()
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target size
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
  })

  test('should toggle mobile sidebar overlay', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Open sidebar
    const menuButton = page.locator('button[aria-label="Open sidebar"]')
    await menuButton.click()
    
    // Sidebar overlay should be visible
    const overlay = page.locator('.sidebar-overlay')
    await expect(overlay).toBeVisible()
    
    // Close sidebar by clicking overlay
    await overlay.click()
    await expect(overlay).not.toBeVisible()
  })

  test('should have proper zoom controls on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Expand mobile toolbar
    const expandButton = page.locator('button[aria-label*="Expand"]')
    await expandButton.click()
    
    // Check for zoom display in more actions
    const moreButton = page.locator('button[aria-label="More actions"]')
    await moreButton.click()
    
    // Zoom display should be visible
    const zoomDisplay = page.locator('text=/Zoom/')
    await expect(zoomDisplay).toBeVisible()
  })

  test('should handle canvas touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Canvas should have touch-action: none
    const canvas = page.locator('[data-testid="drawing-canvas"]')
    const touchAction = await canvas.evaluate(el => getComputedStyle(el).touchAction)
    expect(touchAction).toBe('none')
    
    // Canvas should have the canvas-touch class
    await expect(canvas).toHaveClass(/canvas-touch/)
  })

  test('should hide desktop-only elements on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to homepage first
    await page.goto('/')
    
    // Settings and user menu should be hidden in header
    const settingsButton = page.locator('button[aria-label="Settings"]')
    const userButton = page.locator('button[aria-label="User menu"]')
    
    await expect(settingsButton).toBeHidden()
    await expect(userButton).toBeHidden()
    
    // Theme toggle should still be visible
    const themeButton = page.locator('[data-testid="theme-toggle"]')
    await expect(themeButton).toBeVisible()
  })

  test('should adapt sidebar width for mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to studio
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Open sidebar
    const menuButton = page.locator('button[aria-label="Open sidebar"]')
    await menuButton.click()
    
    // Check sidebar is wider on mobile (w-72 = 288px vs w-64 = 256px on desktop)
    const sidebar = page.locator('aside')
    const boundingBox = await sidebar.boundingBox()
    expect(boundingBox?.width).toBe(288) // w-72 = 18rem = 288px
  })

  test('should maintain functionality across breakpoints', async ({ page }) => {
    // Start with mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.click('[data-testid="app-logo"]')
    await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 })
    
    // Theme toggle should work on mobile
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await themeToggle.click()
    
    // Switch to tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Theme toggle should still work
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    
    // Switch to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Desktop toolbar should now be visible
    const desktopToolbar = page.locator('[data-testid="tool-panel"]')
    await expect(desktopToolbar).toBeVisible()
    
    // Theme toggle should still work
    await themeToggle.click()
  })
})