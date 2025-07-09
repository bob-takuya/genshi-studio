/**
 * Advanced Brush Engine with Pressure Sensitivity for Genshi Studio
 */

import { Point, Color, BrushSettings } from '../../types/graphics';
import { Renderer } from '../engine/Renderer';

interface StrokePoint {
  position: Point;
  pressure: number;
  timestamp: number;
}

interface BrushStamp {
  position: Point;
  size: number;
  opacity: number;
  color: Color;
}

export class BrushEngine {
  private renderer: Renderer;
  private settings: BrushSettings;
  private currentStroke: StrokePoint[] = [];
  private isDrawing: boolean = false;
  private lastPoint: StrokePoint | null = null;
  private smoothingBuffer: Point[] = [];
  private stampTexture: WebGLTexture | null = null;
  private gl: WebGL2RenderingContext;

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    this.renderer = renderer;
    this.gl = gl;
    
    this.settings = {
      size: 10,
      hardness: 0.8,
      opacity: 1.0,
      flow: 1.0,
      smoothing: 0.5,
      pressureSensitivity: {
        size: true,
        opacity: true,
        flow: true
      }
    };

    this.createBrushTexture();
  }

  private createBrushTexture(): void {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    // Generate radial gradient for brush
    const center = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.sqrt(dx * dx + dy * dy) / center;
        
        // Apply hardness curve
        let alpha = 1.0 - distance;
        if (alpha > 0) {
          alpha = Math.pow(alpha, 1.0 / this.settings.hardness);
        }
        alpha = Math.max(0, Math.min(1, alpha));
        
        const index = (y * size + x) * 4;
        data[index] = 255;     // R
        data[index + 1] = 255; // G
        data[index + 2] = 255; // B
        data[index + 3] = Math.floor(alpha * 255); // A
      }
    }

    this.stampTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.stampTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 
      0, 
      this.gl.RGBA, 
      size, 
      size, 
      0, 
      this.gl.RGBA, 
      this.gl.UNSIGNED_BYTE, 
      data
    );
    
    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  updateSettings(settings: Partial<BrushSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Recreate brush texture if hardness changed
    if (settings.hardness !== undefined) {
      this.createBrushTexture();
    }
  }

  getSettings(): BrushSettings {
    return { ...this.settings };
  }

  startStroke(point: Point, pressure: number = 1.0): void {
    this.isDrawing = true;
    this.currentStroke = [];
    this.smoothingBuffer = [];
    
    const strokePoint: StrokePoint = {
      position: point,
      pressure,
      timestamp: performance.now()
    };
    
    this.currentStroke.push(strokePoint);
    this.lastPoint = strokePoint;
    
    // Draw initial stamp
    this.drawStamp(point, pressure);
  }

  continueStroke(point: Point, pressure: number = 1.0): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const strokePoint: StrokePoint = {
      position: point,
      pressure,
      timestamp: performance.now()
    };

    // Apply smoothing
    const smoothedPoint = this.applySmoothing(strokePoint.position);
    strokePoint.position = smoothedPoint;

    this.currentStroke.push(strokePoint);

    // Interpolate between points for smooth strokes
    const distance = this.getDistance(this.lastPoint.position, strokePoint.position);
    const spacing = this.settings.size * 0.2; // 20% of brush size

    if (distance > spacing) {
      const steps = Math.floor(distance / spacing);
      
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / (steps + 1);
        const interpolatedPoint = this.interpolatePoints(
          this.lastPoint,
          strokePoint,
          t
        );
        
        this.drawStamp(interpolatedPoint.position, interpolatedPoint.pressure);
      }
    }

    this.drawStamp(strokePoint.position, pressure);
    this.lastPoint = strokePoint;
  }

  endStroke(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.lastPoint = null;
    this.smoothingBuffer = [];

    // Store stroke data for undo/redo functionality
    this.saveStroke();
  }

  private applySmoothing(point: Point): Point {
    if (this.settings.smoothing === 0) return point;

    this.smoothingBuffer.push(point);
    
    // Keep buffer size reasonable
    const maxBufferSize = 5;
    if (this.smoothingBuffer.length > maxBufferSize) {
      this.smoothingBuffer.shift();
    }

    // Calculate weighted average
    let totalWeight = 0;
    let smoothedX = 0;
    let smoothedY = 0;

    this.smoothingBuffer.forEach((p, index) => {
      const weight = (index + 1) / this.smoothingBuffer.length;
      smoothedX += p.x * weight;
      smoothedY += p.y * weight;
      totalWeight += weight;
    });

    return {
      x: smoothedX / totalWeight,
      y: smoothedY / totalWeight
    };
  }

  private interpolatePoints(p1: StrokePoint, p2: StrokePoint, t: number): StrokePoint {
    return {
      position: {
        x: p1.position.x + (p2.position.x - p1.position.x) * t,
        y: p1.position.y + (p2.position.y - p1.position.y) * t
      },
      pressure: p1.pressure + (p2.pressure - p1.pressure) * t,
      timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t
    };
  }

  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private drawStamp(position: Point, pressure: number): void {
    const size = this.calculateSize(pressure);
    const opacity = this.calculateOpacity(pressure);
    const color: Color = { r: 0, g: 0, b: 0, a: opacity }; // Default black

    // Use the brush shader for proper stamp rendering
    const shader = this.renderer['shaderManager'].useShader('brush');
    if (!shader) return;

    // Set up brush rendering
    // This would integrate with the renderer's texture drawing capabilities
    this.renderer.pushTransform();
    this.renderer.translate(position.x - size / 2, position.y - size / 2);
    
    // For now, use a simple circle as placeholder
    // In a full implementation, this would use the brush texture
    this.renderer.drawCircle(size / 2, size / 2, size / 2, color);
    
    this.renderer.popTransform();
  }

  private calculateSize(pressure: number): number {
    if (!this.settings.pressureSensitivity.size) {
      return this.settings.size;
    }
    
    // Apply pressure curve
    const pressureCurve = Math.pow(pressure, 0.5); // Square root for more natural feel
    return this.settings.size * (0.3 + 0.7 * pressureCurve);
  }

  private calculateOpacity(pressure: number): number {
    let opacity = this.settings.opacity * this.settings.flow;
    
    if (this.settings.pressureSensitivity.opacity) {
      opacity *= pressure;
    }
    
    return Math.max(0, Math.min(1, opacity));
  }

  private saveStroke(): void {
    // This would integrate with the undo/redo system
    // For now, just log the stroke data
    console.log(`Stroke completed with ${this.currentStroke.length} points`);
  }

  // Utility methods for special brush effects
  createCustomBrush(textureData: ImageData): void {
    // Allow users to create custom brush textures
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      textureData
    );
    
    // Update texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    // Replace current brush texture
    if (this.stampTexture) {
      this.gl.deleteTexture(this.stampTexture);
    }
    this.stampTexture = texture;
  }

  destroy(): void {
    if (this.stampTexture) {
      this.gl.deleteTexture(this.stampTexture);
      this.stampTexture = null;
    }
  }
}