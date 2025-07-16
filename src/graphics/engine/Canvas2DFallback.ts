/**
 * Canvas2D Fallback Manager for WebGL Failures
 * Provides a robust fallback to Canvas2D when WebGL is unavailable
 */

import { Size } from '../../types/graphics';

export class Canvas2DFallbackManager {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private pixelRatio: number;
  private size: Size;
  private isInitialized: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    this.size = { width: 0, height: 0 };

    try {
      console.log('Initializing Canvas2D fallback...');
      
      const context = this.initializeContext();
      if (!context) {
        throw new Error('Canvas2D context creation failed');
      }
      
      this.context = context;
      this.setupDefaults();
      this.resize();
      
      this.isInitialized = true;
      console.log('Canvas2D fallback initialized successfully');
    } catch (error) {
      console.error('Canvas2D fallback initialization error:', error);
      throw new Error(`Canvas2D fallback failed: ${error.message}`);
    }
  }

  private initializeContext(): CanvasRenderingContext2D | null {
    try {
      const contextOptions: CanvasRenderingContext2DSettings = {
        alpha: true,
        desynchronized: true,
        colorSpace: 'srgb',
        willReadFrequently: false
      };

      const context = this.canvas.getContext('2d', contextOptions);
      
      if (!context) {
        console.error('Failed to get 2D context');
        return null;
      }

      // Test if context is actually usable
      try {
        context.fillStyle = 'red';
        context.fillRect(0, 0, 1, 1);
      } catch (testError) {
        console.error('2D context is not functional:', testError);
        return null;
      }

      return context;
    } catch (error) {
      console.error('Canvas2D context creation error:', error);
      return null;
    }
  }

  private setupDefaults(): void {
    try {
      // Set up default 2D context settings
      this.context.globalAlpha = 1.0;
      this.context.globalCompositeOperation = 'source-over';
      this.context.imageSmoothingEnabled = true;
      this.context.imageSmoothingQuality = 'high';
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';
      this.context.miterLimit = 10;
      this.context.textAlign = 'start';
      this.context.textBaseline = 'alphabetic';
      
      // Set high-quality scaling
      this.context.scale(this.pixelRatio, this.pixelRatio);
      
      console.log('Canvas2D defaults configured');
    } catch (error) {
      console.error('Error setting Canvas2D defaults:', error);
    }
  }

  resize(width?: number, height?: number): void {
    if (width === undefined || height === undefined) {
      width = this.canvas.clientWidth;
      height = this.canvas.clientHeight;
    }

    this.size = { width, height };

    // Apply pixel ratio for high DPI displays
    const realWidth = Math.floor(width * this.pixelRatio);
    const realHeight = Math.floor(height * this.pixelRatio);

    this.canvas.width = realWidth;
    this.canvas.height = realHeight;
    
    // Reset scale after resize
    this.context.scale(this.pixelRatio, this.pixelRatio);
  }

  clear(r = 0, g = 0, b = 0, a = 0): void {
    if (a === 0) {
      // Clear with transparent background
      this.context.clearRect(0, 0, this.size.width, this.size.height);
    } else {
      // Clear with colored background
      this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
      this.context.fillRect(0, 0, this.size.width, this.size.height);
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  isCanvas2D(): boolean {
    return true;
  }

  isReady(): boolean {
    return this.isInitialized && this.context !== null;
  }

  getSize(): Size {
    return { ...this.size };
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  // Performance monitoring for 2D context
  getMemoryInfo(): { estimated: number } {
    // Estimate memory usage based on canvas size
    const pixels = this.canvas.width * this.canvas.height;
    const bytesPerPixel = 4; // RGBA
    const estimatedMemory = pixels * bytesPerPixel;
    
    return {
      estimated: estimatedMemory
    };
  }

  // Optimized drawing methods for Canvas2D
  drawPath(path: Path2D, stroke: boolean = true, fill: boolean = false): void {
    if (fill) {
      this.context.fill(path);
    }
    if (stroke) {
      this.context.stroke(path);
    }
  }

  drawImage(image: CanvasImageSource, dx: number, dy: number, dw?: number, dh?: number): void {
    if (dw !== undefined && dh !== undefined) {
      this.context.drawImage(image, dx, dy, dw, dh);
    } else {
      this.context.drawImage(image, dx, dy);
    }
  }

  // Batch drawing operations for performance
  beginBatch(): void {
    this.context.save();
  }

  endBatch(): void {
    this.context.restore();
  }

  // Optimized text rendering
  drawText(text: string, x: number, y: number, maxWidth?: number): void {
    if (maxWidth !== undefined) {
      this.context.fillText(text, x, y, maxWidth);
    } else {
      this.context.fillText(text, x, y);
    }
  }

  // Gradient support
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return this.context.createLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  // Pattern support
  createPattern(image: CanvasImageSource, repetition: string | null): CanvasPattern | null {
    return this.context.createPattern(image, repetition);
  }

  // Transform methods
  translate(x: number, y: number): void {
    this.context.translate(x, y);
  }

  scale(x: number, y: number): void {
    this.context.scale(x, y);
  }

  rotate(angle: number): void {
    this.context.rotate(angle);
  }

  resetTransform(): void {
    this.context.resetTransform();
    // Reapply pixel ratio scaling
    this.context.scale(this.pixelRatio, this.pixelRatio);
  }

  // State management
  save(): void {
    this.context.save();
  }

  restore(): void {
    this.context.restore();
  }

  // Clipping
  clip(path?: Path2D, fillRule?: CanvasFillRule): void {
    if (path) {
      this.context.clip(path, fillRule);
    } else {
      this.context.clip();
    }
  }

  destroy(): void {
    // Clean up 2D context resources
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.resetTransform();
    
    console.log('Canvas2D fallback destroyed');
  }
}