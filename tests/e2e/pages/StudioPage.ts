import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Studio Page Object Model
 * Handles interactions with the Genshi Studio drawing/graphics interface
 */
export class StudioPage extends BasePage {
  // Canvas and drawing tools
  readonly canvas: Locator;
  readonly drawingCanvas: Locator;
  readonly threeDCanvas: Locator;
  readonly toolPanel: Locator;
  readonly colorPicker: Locator;
  readonly brushSizeSlider: Locator;
  readonly patternSelector: Locator;
  
  // Tools
  readonly penTool: Locator;
  readonly brushTool: Locator;
  readonly eraserTool: Locator;
  readonly shapesTool: Locator;
  readonly patternTool: Locator;
  readonly textTool: Locator;
  readonly selectToolButton: Locator;
  
  // Controls
  readonly undoButton: Locator;
  readonly redoButton: Locator;
  readonly clearButton: Locator;
  readonly saveButton: Locator;
  readonly exportButton: Locator;
  readonly layersPanel: Locator;
  readonly zoomControls: Locator;
  
  // Pattern controls
  readonly patternLibrary: Locator;
  readonly patternCustomizer: Locator;
  readonly patternSymmetry: Locator;
  readonly patternRotation: Locator;
  readonly patternScale: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Canvas elements
    this.canvas = page.locator('[data-testid="main-canvas"]');
    this.drawingCanvas = page.locator('canvas#drawing-canvas');
    this.threeDCanvas = page.locator('canvas#three-canvas');
    this.toolPanel = page.locator('[data-testid="tool-panel"]');
    this.colorPicker = page.locator('[data-testid="color-picker"]');
    this.brushSizeSlider = page.locator('[data-testid="brush-size"]');
    this.patternSelector = page.locator('[data-testid="pattern-selector"]');
    
    // Tool buttons
    this.penTool = page.locator('[data-testid="tool-pen"]');
    this.brushTool = page.locator('[data-testid="tool-brush"]');
    this.eraserTool = page.locator('[data-testid="tool-eraser"]');
    this.shapesTool = page.locator('[data-testid="tool-shapes"]');
    this.patternTool = page.locator('[data-testid="tool-pattern"]');
    this.textTool = page.locator('[data-testid="tool-text"]');
    this.selectToolButton = page.locator('[data-testid="tool-select"]');
    
    // Control buttons
    this.undoButton = page.locator('[data-testid="undo-button"]');
    this.redoButton = page.locator('[data-testid="redo-button"]');
    this.clearButton = page.locator('[data-testid="clear-button"]');
    this.saveButton = page.locator('[data-testid="save-button"]');
    this.exportButton = page.locator('[data-testid="export-button"]');
    this.layersPanel = page.locator('[data-testid="layers-panel"]');
    this.zoomControls = page.locator('[data-testid="zoom-controls"]');
    
    // Pattern controls
    this.patternLibrary = page.locator('[data-testid="pattern-library"]');
    this.patternCustomizer = page.locator('[data-testid="pattern-customizer"]');
    this.patternSymmetry = page.locator('[data-testid="pattern-symmetry"]');
    this.patternRotation = page.locator('[data-testid="pattern-rotation"]');
    this.patternScale = page.locator('[data-testid="pattern-scale"]');
  }
  
  /**
   * Navigate to studio page
   */
  async goto() {
    await super.goto('/');
  }
  
  /**
   * Wait for studio page to be ready
   */
  async waitForPageReady() {
    await this.canvas.waitFor({ state: 'visible' });
    await this.toolPanel.waitFor({ state: 'visible' });
    
    // Wait for canvases to be initialized
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas#drawing-canvas') as HTMLCanvasElement;
      return canvas && canvas.getContext('2d') !== null;
    });
  }
  
  /**
   * Select a drawing tool
   */
  async selectTool(tool: 'pen' | 'brush' | 'eraser' | 'shapes' | 'pattern' | 'text' | 'select') {
    const tools = {
      pen: this.penTool,
      brush: this.brushTool,
      eraser: this.eraserTool,
      shapes: this.shapesTool,
      pattern: this.patternTool,
      text: this.textTool,
      select: this.page.locator('[data-testid="tool-select"]'),
    };
    
    await tools[tool].click();
    await tools[tool].waitFor({ state: 'attached' });
    
    // Verify tool is selected
    await this.page.waitForFunction((selectedTool) => {
      const toolElement = document.querySelector(`[data-testid="tool-${selectedTool}"]`);
      return toolElement?.classList.contains('active') || toolElement?.getAttribute('aria-pressed') === 'true';
    }, tool);
  }
  
  /**
   * Draw on canvas
   */
  async drawOnCanvas(paths: Array<{ x: number; y: number }[]>) {
    const canvasBox = await this.drawingCanvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    for (const path of paths) {
      if (path.length === 0) continue;
      
      // Move to start position
      const startX = canvasBox.x + path[0].x;
      const startY = canvasBox.y + path[0].y;
      await this.page.mouse.move(startX, startY);
      await this.page.mouse.down();
      
      // Draw path
      for (let i = 1; i < path.length; i++) {
        const x = canvasBox.x + path[i].x;
        const y = canvasBox.y + path[i].y;
        await this.page.mouse.move(x, y, { steps: 5 });
      }
      
      await this.page.mouse.up();
    }
  }
  
  /**
   * Set color
   */
  async setColor(color: string) {
    await this.colorPicker.click();
    
    // Handle different color picker implementations
    const colorInput = this.page.locator('input[type="color"]');
    if (await colorInput.isVisible()) {
      await colorInput.fill(color);
    } else {
      // Custom color picker
      await this.page.locator(`[data-color="${color}"]`).click();
    }
  }
  
  /**
   * Set brush size
   */
  async setBrushSize(size: number) {
    await this.brushSizeSlider.fill(size.toString());
  }
  
  /**
   * Select a cultural pattern
   */
  async selectPattern(patternName: string) {
    await this.patternTool.click();
    await this.patternLibrary.click();
    await this.page.locator(`[data-pattern="${patternName}"]`).click();
  }
  
  /**
   * Apply pattern customization
   */
  async customizePattern(options: {
    symmetry?: number;
    rotation?: number;
    scale?: number;
  }) {
    if (options.symmetry !== undefined) {
      await this.patternSymmetry.fill(options.symmetry.toString());
    }
    if (options.rotation !== undefined) {
      await this.patternRotation.fill(options.rotation.toString());
    }
    if (options.scale !== undefined) {
      await this.patternScale.fill(options.scale.toString());
    }
  }
  
  /**
   * Clear canvas
   */
  async clearCanvas() {
    await this.clearButton.click();
    
    // Confirm if dialog appears
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
  }
  
  /**
   * Save artwork
   */
  async saveArtwork(name?: string) {
    await this.saveButton.click();
    
    if (name) {
      const nameInput = this.page.locator('input[placeholder*="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill(name);
      }
    }
    
    const saveConfirm = this.page.getByRole('button', { name: /save|confirm/i });
    await saveConfirm.click();
  }
  
  /**
   * Export artwork
   */
  async exportArtwork(format: 'png' | 'svg' | 'jpg' = 'png') {
    await this.exportButton.click();
    
    const formatSelector = this.page.locator('[data-testid="export-format"]');
    if (await formatSelector.isVisible()) {
      await formatSelector.selectOption(format);
    }
    
    const exportConfirm = this.page.getByRole('button', { name: /export|download/i });
    await exportConfirm.click();
  }
  
  /**
   * Get canvas content as data URL
   */
  async getCanvasDataURL(): Promise<string> {
    return await this.drawingCanvas.evaluate((canvas: HTMLCanvasElement) => {
      return canvas.toDataURL('image/png');
    });
  }
  
  /**
   * Check if canvas is empty
   */
  async isCanvasEmpty(): Promise<boolean> {
    return await this.drawingCanvas.evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return true;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return !imageData.data.some((channel) => channel !== 0);
    });
  }
  
  /**
   * Get current tool state
   */
  async getToolState() {
    const tools = ['pen', 'brush', 'eraser', 'shapes', 'pattern', 'text', 'select'];
    
    for (const tool of tools) {
      const isActive = await this.page.locator(`[data-testid="tool-${tool}"]`).evaluate((el) => 
        el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true'
      );
      
      if (isActive) {
        return tool;
      }
    }
    
    return null;
  }
  
  /**
   * Measure canvas rendering performance
   */
  async measureDrawingPerformance() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const canvas = document.querySelector('canvas#drawing-canvas') as HTMLCanvasElement;
        if (!canvas) {
          resolve({ error: 'Canvas not found' });
          return;
        }
        
        const measurements: number[] = [];
        let frameCount = 0;
        
        function measure(timestamp: number) {
          measurements.push(timestamp);
          frameCount++;
          
          if (frameCount < 60) {
            requestAnimationFrame(measure);
          } else {
            const deltas = [];
            for (let i = 1; i < measurements.length; i++) {
              deltas.push(measurements[i] - measurements[i - 1]);
            }
            
            const avgFrameTime = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            const fps = 1000 / avgFrameTime;
            
            resolve({
              fps: Math.round(fps),
              avgFrameTime: avgFrameTime.toFixed(2),
              totalFrames: frameCount,
            });
          }
        }
        
        requestAnimationFrame(measure);
      });
    });
  }
}