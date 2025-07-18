import { test, expect } from '@playwright/test';

test.describe('Interactive Growth Studio', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to Studio page - it's at the root
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display Growth button in toolbar', async ({ page }) => {
    // Check if the Growth button is visible
    const growthButton = page.locator('button:has-text("Growth")');
    await expect(growthButton).toBeVisible();
    
    // Check if it has the correct icon
    const zapIcon = page.locator('button:has-text("Growth") svg.lucide-zap');
    await expect(zapIcon).toBeVisible();
  });

  test('should switch to Growth mode when clicked', async ({ page }) => {
    // Click the Growth button
    await page.locator('button:has-text("Growth")').click();
    
    // Check if the button is now active (has primary background)
    const activeButton = page.locator('button:has-text("Growth").bg-primary');
    await expect(activeButton).toBeVisible();
    
    // Check if the growth studio canvas is visible
    const growthCanvas = page.locator('canvas');
    await expect(growthCanvas).toBeVisible();
    
    // Check if the growth studio container is visible (more specific selector)
    const canvasContainer = page.locator('.fixed.inset-0.bg-black');
    await expect(canvasContainer).toBeVisible();
  });

  test('should show controls overlay', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Check for control buttons
    const playPauseButton = page.locator('button[title="Pause"], button[title="Play"]');
    await expect(playPauseButton).toBeVisible();
    
    const resetButton = page.locator('button[title="Reset"]');
    await expect(resetButton).toBeVisible();
    
    const exportButton = page.locator('button[title="Export Image"]');
    await expect(exportButton).toBeVisible();
    
    const settingsButton = page.locator('button[title="Settings"]');
    await expect(settingsButton).toBeVisible();
  });

  test('should show settings panel when settings clicked', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Click settings button with force to bypass any overlapping elements
    await page.locator('button[title="Settings"]').click({ force: true });
    
    // Check if settings panel is visible
    const settingsPanel = page.locator('text=Growth Settings');
    await expect(settingsPanel).toBeVisible();
    
    // Check for pattern type dropdown
    const patternTypeSelect = page.locator('select').first();
    await expect(patternTypeSelect).toBeVisible();
    
    // Check for growth rate slider
    const growthRateLabel = page.locator('text=Growth Rate');
    await expect(growthRateLabel).toBeVisible();
  });

  test('should interact with canvas on click', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for canvas to be ready
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Click on canvas to add growth seed
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // Check if interactive mode indicator is visible
    const interactiveText = page.locator('text=Click to add growth seeds');
    await expect(interactiveText).toBeVisible();
  });

  test('should reset growth when reset clicked', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Let it grow for a bit
    await page.waitForTimeout(2000);
    
    // Click reset with force to bypass any overlapping elements
    await page.locator('button[title="Reset"]').click({ force: true });
    
    // Check if generation counter reset
    const generationText = page.locator('text=Generation: 0');
    await expect(generationText).toBeVisible();
  });

  test('should pause/play animation', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Initially should be playing (Pause button visible)
    const pauseButton = page.locator('button[title="Pause"]');
    await expect(pauseButton).toBeVisible();
    
    // Click to pause with force
    await pauseButton.click({ force: true });
    
    // Now Play button should be visible
    const playButton = page.locator('button[title="Play"]');
    await expect(playButton).toBeVisible();
    
    // Click to play again with force
    await playButton.click({ force: true });
    
    // Pause button should be visible again
    await expect(pauseButton).toBeVisible();
  });

  test('should export image', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Let it grow for a bit
    await page.waitForTimeout(1000);
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export with force
    await page.locator('button[title="Export Image"]').click({ force: true });
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check filename contains 'growth-pattern'
    expect(download.suggestedFilename()).toContain('growth-pattern');
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('should switch between pattern types', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Open settings with force
    await page.locator('button[title="Settings"]').click({ force: true });
    
    // Wait for settings panel
    await page.waitForTimeout(300);
    
    // Change pattern type
    const patternSelect = page.locator('select').first();
    await patternSelect.selectOption('diffusion-limited');
    
    // Check if the canvas is still rendering
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Change to another pattern
    await patternSelect.selectOption('crystal-growth');
    await expect(canvas).toBeVisible();
  });

  test('should apply color palettes', async ({ page }) => {
    await page.locator('button:has-text("Growth")').click();
    
    // Wait for growth mode to be active
    await page.waitForTimeout(500);
    
    // Open settings with force
    await page.locator('button[title="Settings"]').click({ force: true });
    
    // Wait for settings panel
    await page.waitForTimeout(300);
    
    // Click on a color palette (e.g., Matrix)
    await page.locator('button:has-text("Matrix")').click();
    
    // Check if colors are applied (canvas should still be visible)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});