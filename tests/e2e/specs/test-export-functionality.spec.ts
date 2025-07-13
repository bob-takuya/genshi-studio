import { test, expect } from '@playwright/test';

test.describe('Export Functionality Test', () => {
  test('should load Genshi Studio and access export dialog', async ({ page }) => {
    // Navigate to the studio page
    await page.goto('/');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Look for the main canvas area
    const mainCanvas = page.locator('[data-testid="main-canvas"]');
    await expect(mainCanvas).toBeVisible({ timeout: 10000 });

    console.log('✅ Main canvas is visible');

    // Look for the export button - it should be in the toolbar or as a quick action
    const exportButton = page.locator('button').filter({ hasText: 'Export' });
    await expect(exportButton).toBeVisible({ timeout: 5000 });

    console.log('✅ Export button found');

    // Click the export button
    await exportButton.click();

    // Wait for the export dialog to appear
    const exportDialog = page.locator('text=Export Pattern').or(page.locator('[data-testid="export-dialog"]'));
    await expect(exportDialog).toBeVisible({ timeout: 5000 });

    console.log('✅ Export dialog opened');

    // Check that PNG format is selected by default
    const pngButton = page.locator('button').filter({ hasText: 'PNG' });
    await expect(pngButton).toHaveClass(/border-primary|bg-primary/);

    console.log('✅ PNG format is selected by default');

    // Check that SVG and JSON options are available
    const svgButton = page.locator('button').filter({ hasText: 'SVG' });
    const jsonButton = page.locator('button').filter({ hasText: 'JSON' });
    
    await expect(svgButton).toBeVisible();
    await expect(jsonButton).toBeVisible();

    console.log('✅ All export formats are available');

    // Test clicking SVG format
    await svgButton.click();
    await expect(svgButton).toHaveClass(/border-primary|bg-primary/);

    console.log('✅ SVG format selection works');

    // Test clicking JSON format
    await jsonButton.click();
    await expect(jsonButton).toHaveClass(/border-primary|bg-primary/);

    console.log('✅ JSON format selection works');

    // Switch back to PNG
    await pngButton.click();
    await expect(pngButton).toHaveClass(/border-primary|bg-primary/);

    console.log('✅ Format switching works correctly');

    // Look for the actual Export button in the dialog
    const exportActionButton = page.locator('button').filter({ hasText: 'Export' }).last();
    await expect(exportActionButton).toBeVisible();

    console.log('✅ Export action button is available');

    // Note: We won't actually click export as it would download a file
    // but we can verify the dialog is fully functional

    // Close the dialog
    const cancelButton = page.locator('button').filter({ hasText: 'Cancel' });
    await cancelButton.click();

    // Verify dialog closes
    await expect(exportDialog).not.toBeVisible({ timeout: 2000 });

    console.log('✅ Export dialog closes correctly');

    console.log('🎉 All export functionality tests passed!');
  });

  test('should show quality and resolution options for PNG', async ({ page }) => {
    // Navigate to the studio page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for main canvas
    const mainCanvas = page.locator('[data-testid="main-canvas"]');
    await expect(mainCanvas).toBeVisible({ timeout: 10000 });

    // Open export dialog
    const exportButton = page.locator('button').filter({ hasText: 'Export' });
    await exportButton.click();

    // Wait for dialog
    const exportDialog = page.locator('text=Export Pattern');
    await expect(exportDialog).toBeVisible({ timeout: 5000 });

    // Ensure PNG is selected
    const pngButton = page.locator('button').filter({ hasText: 'PNG' });
    await pngButton.click();

    // Check for quality slider
    const qualitySlider = page.locator('input[type="range"]');
    await expect(qualitySlider).toBeVisible();

    console.log('✅ Quality slider is visible for PNG');

    // Check for resolution dropdown
    const resolutionSelect = page.locator('select').filter({ hasText: 'Web' });
    await expect(resolutionSelect.or(page.locator('option[value="web"]').locator('..'))).toBeVisible();

    console.log('✅ Resolution options are available');

    // Test custom resolution
    const resolutionDropdown = page.locator('select').first();
    await resolutionDropdown.selectOption('custom');

    // Check for custom width/height inputs
    const widthInput = page.locator('input[type="number"]').first();
    const heightInput = page.locator('input[type="number"]').last();
    
    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();

    console.log('✅ Custom dimension inputs appear when custom resolution is selected');

    console.log('🎉 PNG options test passed!');
  });
});