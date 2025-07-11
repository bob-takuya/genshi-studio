/**
 * Graphics Bridge for Code Execution
 * Bridges code execution commands to the graphics engine
 */

import { GraphicsEngine } from '../../graphics/engine/GraphicsEngine';
import { Color } from '../../types/graphics';

export class GraphicsBridge {
  private graphicsEngine: GraphicsEngine;
  private executionLayerId: string | null = null;
  
  // Drawing state
  private fillColor: string = '#000000';
  private strokeColor: string = '#000000';
  private strokeWidth: number = 1;
  private fillEnabled: boolean = true;
  private strokeEnabled: boolean = true;
  
  // Canvas state
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private backgroundColor: string = '#ffffff';
  
  // Pattern state
  private activePatterns: Map<string, any> = new Map();

  constructor(graphicsEngine: GraphicsEngine) {
    this.graphicsEngine = graphicsEngine;
    this.createExecutionLayer();
  }

  /**
   * Create a dedicated layer for code execution
   */
  private createExecutionLayer(): void {
    const layer = this.graphicsEngine.createLayer('Code Execution');
    this.executionLayerId = layer.id;
    this.graphicsEngine.setActiveLayer(this.executionLayerId);
  }

  /**
   * Clear the execution layer
   */
  clearExecutionLayer(): void {
    if (this.executionLayerId) {
      // Clear the layer content
      this.clearCanvas();
    }
  }

  /**
   * Request a redraw of the canvas
   */
  requestRedraw(): void {
    // Trigger graphics engine redraw
    (this.graphicsEngine as any).needsRedraw = true;
  }

  // Canvas commands
  setCanvasBackground(color: string): void {
    this.backgroundColor = color;
    // Apply background to canvas
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.restore();
    }
  }

  clearCanvas(): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  // Drawing state commands
  setFillColor(color: string): void {
    this.fillColor = color;
    this.fillEnabled = true;
    const rgbaColor = this.parseColor(color);
    this.graphicsEngine.setColor(rgbaColor);
  }

  setStrokeColor(color: string): void {
    this.strokeColor = color;
    this.strokeEnabled = true;
  }

  setStrokeWidth(width: number): void {
    this.strokeWidth = Math.max(0.1, width);
  }

  setFillEnabled(enabled: boolean): void {
    this.fillEnabled = enabled;
  }

  setStrokeEnabled(enabled: boolean): void {
    this.strokeEnabled = enabled;
  }

  // Shape drawing commands
  drawRect(x: number, y: number, width: number, height: number): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(x, y, width, height);
    }
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeRect(x, y, width, height);
    }
    
    ctx.restore();
  }

  drawCircle(x: number, y: number, radius: number): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawEllipse(x: number, y: number, width: number, height: number): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawPolygon(points: number[]): void {
    if (points.length < 6) return; // Need at least 3 points (6 coordinates)
    
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    
    for (let i = 0; i < points.length; i += 2) {
      if (i === 0) {
        ctx.moveTo(points[i], points[i + 1]);
      } else {
        ctx.lineTo(points[i], points[i + 1]);
      }
    }
    
    ctx.closePath();
    
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    
    if (this.strokeEnabled) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Pattern drawing commands
  drawPattern(culture: string, pattern: string, args: any[]): void {
    const canvas = (this.graphicsEngine as any).canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get pattern type mapping
    const patternTypeMap: Record<string, any> = {
      'japanese.seigaiha': 'japanese-seigaiha',
      'japanese.asanoha': 'japanese-asanoha',
      'japanese.shippo': 'japanese-shippo',
      'celtic.knot': 'celtic-knots',
      'celtic.spiral': 'celtic-spirals',
      'islamic.geometric': 'islamic-geometric',
      'islamic.arabesque': 'islamic-arabesque'
    };

    const patternType = patternTypeMap[`${culture}.${pattern}`];
    if (!patternType) return;

    // Generate pattern using the graphics engine
    const bounds = {
      x: 0,
      y: 0,
      width: this.canvasWidth,
      height: this.canvasHeight
    };

    const options = {
      scale: args[0] || 1,
      complexity: args[0] || 1,
      sides: args[0] || 8,
      turns: args[0] || 3
    };

    this.graphicsEngine.generatePattern(patternType, bounds, options);
  }

  /**
   * Parse color string to Color object
   */
  private parseColor(color: string): Color {
    // Simple hex color parser
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16) / 255,
          g: parseInt(hex[1] + hex[1], 16) / 255,
          b: parseInt(hex[2] + hex[2], 16) / 255,
          a: 1
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16) / 255,
          g: parseInt(hex.slice(2, 4), 16) / 255,
          b: parseInt(hex.slice(4, 6), 16) / 255,
          a: 1
        };
      }
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Get canvas dimensions
   */
  getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }

  /**
   * Set canvas dimensions
   */
  setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}