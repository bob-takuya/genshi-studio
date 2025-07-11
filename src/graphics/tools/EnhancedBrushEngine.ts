/**
 * Enhanced Brush Engine with Professional Pressure Sensitivity
 * Supports advanced dynamics including tilt, rotation, and velocity
 */

import { Point, Color, BrushSettings } from '../../types/graphics';
import { Renderer } from '../engine/Renderer';
import { inputDeviceManager, PressureData } from '../../input/InputDeviceManager';

interface EnhancedBrushSettings extends BrushSettings {
  // Basic settings inherited from BrushSettings
  // Additional professional settings
  minSize: number;
  maxSize: number;
  sizeJitter: number;
  
  minOpacity: number;
  maxOpacity: number;
  opacityJitter: number;
  
  tiltSensitivity: number;
  rotationEffect: number;
  velocitySmoothing: number;
  
  texture?: WebGLTexture;
  textureScale: number;
  textureRotation: boolean;
  
  scatter: number;
  count: number;
  
  // Dynamics controls
  dynamics: {
    sizePressure: number;      // 0-1
    sizeVelocity: number;      // 0-1
    sizeTilt: number;          // 0-1
    
    opacityPressure: number;   // 0-1
    opacityVelocity: number;   // 0-1
    opacityTilt: number;       // 0-1
    
    angleTilt: number;         // 0-1
    angleDirection: number;    // 0-1
    angleRotation: number;     // 0-1
    
    scatterPressure: number;   // 0-1
    scatterVelocity: number;   // 0-1
  };
  
  // Brush tip shape
  tipShape: 'round' | 'flat' | 'custom';
  flatness: number; // 0-1 for flat brushes
  angle: number;    // Base angle in degrees
}

interface StrokePoint {
  position: Point;
  pressure: number;
  tiltX: number;
  tiltY: number;
  rotation: number;
  velocity: number;
  timestamp: number;
}

interface BrushStamp {
  position: Point;
  size: number;
  opacity: number;
  angle: number;
  flatness: number;
  scatter: Point;
  color: Color;
}

export class EnhancedBrushEngine {
  private renderer: Renderer;
  private settings: EnhancedBrushSettings;
  private currentStroke: StrokePoint[] = [];
  private isDrawing: boolean = false;
  private lastPoint: StrokePoint | null = null;
  private smoothingBuffer: StrokePoint[] = [];
  private stampTexture: WebGLTexture | null = null;
  private gl: WebGL2RenderingContext;
  private currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
  private strokeDistance: number = 0;
  private _randomSeed: number = 0;

  // Brush textures cache
  private brushTextures: Map<string, WebGLTexture> = new Map();
  
  // Performance optimization
  private frameRequest: number | null = null;
  private stampQueue: BrushStamp[] = [];

  constructor(renderer: Renderer, gl: WebGL2RenderingContext) {
    this.renderer = renderer;
    this.gl = gl;
    
    this.settings = this.createDefaultSettings();
    this.initializeBrushTextures();
  }

  private createDefaultSettings(): EnhancedBrushSettings {
    return {
      // Basic settings
      size: 20,
      hardness: 0.8,
      opacity: 1.0,
      flow: 1.0,
      smoothing: 0.5,
      pressureSensitivity: {
        size: true,
        opacity: true,
        flow: true
      },
      
      // Enhanced settings
      minSize: 1,
      maxSize: 500,
      sizeJitter: 0,
      
      minOpacity: 0,
      maxOpacity: 1,
      opacityJitter: 0,
      
      tiltSensitivity: 0.5,
      rotationEffect: 0.3,
      velocitySmoothing: 0.7,
      
      textureScale: 1.0,
      textureRotation: true,
      
      scatter: 0,
      count: 1,
      
      dynamics: {
        sizePressure: 1.0,
        sizeVelocity: 0,
        sizeTilt: 0,
        
        opacityPressure: 0.7,
        opacityVelocity: 0,
        opacityTilt: 0,
        
        angleTilt: 0.5,
        angleDirection: 0,
        angleRotation: 1.0,
        
        scatterPressure: 0,
        scatterVelocity: 0.2
      },
      
      tipShape: 'round',
      flatness: 0,
      angle: 0
    };
  }

  private initializeBrushTextures(): void {
    // Create default round brush
    this.createRoundBrush('default', 256);
    
    // Create flat brush
    this.createFlatBrush('flat', 256);
    
    // Create textured brushes
    this.createTexturedBrush('chalk', 256, 'chalk');
    this.createTexturedBrush('watercolor', 256, 'watercolor');
    this.createTexturedBrush('oil', 256, 'oil');
    this.createTexturedBrush('pencil', 256, 'pencil');
    
    // Set default brush
    this.stampTexture = this.brushTextures.get('default')!;
  }

  private createRoundBrush(name: string, size: number): void {
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.sqrt(dx * dx + dy * dy) / center;
        
        let alpha = 1.0 - distance;
        if (alpha > 0) {
          // Apply hardness curve
          const hardness = this.settings.hardness;
          if (distance < hardness) {
            alpha = 1.0;
          } else {
            alpha = 1.0 - (distance - hardness) / (1.0 - hardness);
            alpha = Math.pow(alpha, 2.2); // Gamma correction
          }
        }
        alpha = Math.max(0, Math.min(1, alpha));
        
        const index = (y * size + x) * 4;
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = Math.floor(alpha * 255);
      }
    }
    
    const texture = this.createTextureFromData(data, size, size);
    this.brushTextures.set(name, texture);
  }

  private createFlatBrush(name: string, size: number): void {
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - center) / center;
        const dy = (y - center) / center;
        
        // Elliptical shape for flat brush
        const flatness = 0.3; // Make it 30% of height
        const distance = Math.sqrt(dx * dx + (dy / flatness) * (dy / flatness));
        
        let alpha = 1.0 - distance;
        if (alpha > 0) {
          alpha = Math.pow(alpha, 1.5);
        }
        alpha = Math.max(0, Math.min(1, alpha));
        
        const index = (y * size + x) * 4;
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = Math.floor(alpha * 255);
      }
    }
    
    const texture = this.createTextureFromData(data, size, size);
    this.brushTextures.set(name, texture);
  }

  private createTexturedBrush(name: string, size: number, type: string): void {
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.sqrt(dx * dx + dy * dy) / center;
        
        let alpha = 1.0 - distance;
        if (alpha > 0) {
          // Add texture based on type
          let texture = 1.0;
          
          switch (type) {
            case 'chalk':
              // Rough, grainy texture
              texture = 0.5 + 0.5 * this.noise(x * 0.1, y * 0.1);
              alpha *= texture;
              break;
              
            case 'watercolor':
              // Soft edges with variation
              alpha = Math.pow(alpha, 0.5);
              texture = 0.7 + 0.3 * this.noise(x * 0.05, y * 0.05);
              alpha *= texture;
              break;
              
            case 'oil':
              // Thick paint with bristle marks
              const angle = Math.atan2(dy, dx);
              const bristle = Math.sin(angle * 20) * 0.1 + 0.9;
              alpha *= bristle;
              break;
              
            case 'pencil':
              // Fine lines with graphite texture
              texture = 0.6 + 0.4 * this.noise(x * 0.2, y * 0.2);
              alpha = Math.pow(alpha, 3) * texture;
              break;
          }
        }
        alpha = Math.max(0, Math.min(1, alpha));
        
        const index = (y * size + x) * 4;
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = Math.floor(alpha * 255);
      }
    }
    
    const texture = this.createTextureFromData(data, size, size);
    this.brushTextures.set(name, texture);
  }

  private createTextureFromData(data: Uint8Array, width: number, height: number): WebGLTexture {
    const texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    );
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  // Simple noise function for texture generation
  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  updateSettings(settings: Partial<EnhancedBrushSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Update brush texture if shape changed
    if (settings.tipShape || settings.hardness !== undefined) {
      this.selectBrushTexture();
    }
  }

  setColor(color: Color): void {
    this.currentColor = color;
  }

  setBrushPreset(preset: string): void {
    switch (preset) {
      case 'pencil':
        this.settings.minSize = 1;
        this.settings.maxSize = 5;
        this.settings.hardness = 0.9;
        this.settings.dynamics.sizePressure = 0.8;
        this.settings.dynamics.opacityPressure = 1.0;
        this.stampTexture = this.brushTextures.get('pencil')!;
        break;
        
      case 'marker':
        this.settings.minSize = 10;
        this.settings.maxSize = 30;
        this.settings.hardness = 0.95;
        this.settings.tipShape = 'flat';
        this.settings.dynamics.angleTilt = 1.0;
        break;
        
      case 'watercolor':
        this.settings.minSize = 20;
        this.settings.maxSize = 80;
        this.settings.hardness = 0.1;
        this.settings.flow = 0.3;
        this.settings.dynamics.opacityPressure = 0.5;
        this.settings.dynamics.sizeVelocity = 0.3;
        this.stampTexture = this.brushTextures.get('watercolor')!;
        break;
        
      case 'oil':
        this.settings.minSize = 15;
        this.settings.maxSize = 60;
        this.settings.hardness = 0.7;
        this.settings.dynamics.sizePressure = 0.6;
        this.settings.dynamics.angleTilt = 0.8;
        this.stampTexture = this.brushTextures.get('oil')!;
        break;
        
      case 'airbrush':
        this.settings.minSize = 30;
        this.settings.maxSize = 120;
        this.settings.hardness = 0.0;
        this.settings.flow = 0.1;
        this.settings.dynamics.sizePressure = 1.0;
        this.settings.dynamics.opacityPressure = 0.8;
        break;
    }
  }

  private selectBrushTexture(): void {
    if (this.settings.tipShape === 'flat') {
      this.stampTexture = this.brushTextures.get('flat')!;
    } else if (this.settings.texture) {
      this.stampTexture = this.settings.texture;
    } else {
      this.stampTexture = this.brushTextures.get('default')!;
    }
  }

  startStroke(point: Point, pressureData: PressureData, velocity: number = 0): void {
    this.isDrawing = true;
    this.currentStroke = [];
    this.smoothingBuffer = [];
    this.strokeDistance = 0;
    this.randomSeed = Math.random();
    
    const strokePoint: StrokePoint = {
      position: point,
      pressure: pressureData.pressure,
      tiltX: pressureData.tiltX || 0,
      tiltY: pressureData.tiltY || 0,
      rotation: pressureData.twist || 0,
      velocity,
      timestamp: performance.now()
    };
    
    this.currentStroke.push(strokePoint);
    this.lastPoint = strokePoint;
    
    // Draw initial stamp
    this.queueStamp(strokePoint);
    this.processStampQueue();
  }

  continueStroke(point: Point, pressureData: PressureData, velocity: number): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const strokePoint: StrokePoint = {
      position: point,
      pressure: pressureData.pressure,
      tiltX: pressureData.tiltX || 0,
      tiltY: pressureData.tiltY || 0,
      rotation: pressureData.twist || 0,
      velocity,
      timestamp: performance.now()
    };

    // Apply smoothing
    const smoothedPoint = this.applyAdvancedSmoothing(strokePoint);
    
    this.currentStroke.push(smoothedPoint);

    // Calculate dynamic spacing based on velocity and size
    const dynamics = inputDeviceManager.getBrushDynamics(pressureData, velocity);
    const currentSize = this.calculateDynamicSize(smoothedPoint, dynamics.sizeMultiplier);
    const spacing = Math.max(1, currentSize * 0.15); // 15% of brush size

    // Interpolate between points
    const distance = this.getDistance(this.lastPoint.position, smoothedPoint.position);
    this.strokeDistance += distance;

    if (distance > spacing) {
      const steps = Math.floor(distance / spacing);
      
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / (steps + 1);
        const interpolatedPoint = this.interpolateStrokePoints(
          this.lastPoint,
          smoothedPoint,
          t
        );
        
        this.queueStamp(interpolatedPoint);
      }
    }

    this.queueStamp(smoothedPoint);
    this.lastPoint = smoothedPoint;
    
    // Process stamps in batches for performance
    if (!this.frameRequest) {
      this.frameRequest = requestAnimationFrame(() => {
        this.processStampQueue();
        this.frameRequest = null;
      });
    }
  }

  endStroke(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.lastPoint = null;
    this.smoothingBuffer = [];
    
    // Process any remaining stamps
    this.processStampQueue();
    
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }

    // Save stroke for undo/redo
    this.saveStroke();
  }

  private applyAdvancedSmoothing(point: StrokePoint): StrokePoint {
    if (this.settings.smoothing === 0) return point;

    this.smoothingBuffer.push(point);
    
    const maxBufferSize = Math.floor(5 + this.settings.smoothing * 10);
    if (this.smoothingBuffer.length > maxBufferSize) {
      this.smoothingBuffer.shift();
    }

    // Weighted average with exponential decay
    let totalWeight = 0;
    let smoothedPoint: StrokePoint = {
      position: { x: 0, y: 0 },
      pressure: 0,
      tiltX: 0,
      tiltY: 0,
      rotation: 0,
      velocity: 0,
      timestamp: point.timestamp
    };

    this.smoothingBuffer.forEach((p, index) => {
      const weight = Math.pow(this.settings.smoothing, this.smoothingBuffer.length - index - 1);
      
      smoothedPoint.position.x += p.position.x * weight;
      smoothedPoint.position.y += p.position.y * weight;
      smoothedPoint.pressure += p.pressure * weight;
      smoothedPoint.tiltX += p.tiltX * weight;
      smoothedPoint.tiltY += p.tiltY * weight;
      smoothedPoint.rotation += p.rotation * weight;
      smoothedPoint.velocity += p.velocity * weight;
      
      totalWeight += weight;
    });

    // Normalize
    smoothedPoint.position.x /= totalWeight;
    smoothedPoint.position.y /= totalWeight;
    smoothedPoint.pressure /= totalWeight;
    smoothedPoint.tiltX /= totalWeight;
    smoothedPoint.tiltY /= totalWeight;
    smoothedPoint.rotation /= totalWeight;
    smoothedPoint.velocity /= totalWeight;

    return smoothedPoint;
  }

  private interpolateStrokePoints(p1: StrokePoint, p2: StrokePoint, t: number): StrokePoint {
    return {
      position: {
        x: p1.position.x + (p2.position.x - p1.position.x) * t,
        y: p1.position.y + (p2.position.y - p1.position.y) * t
      },
      pressure: p1.pressure + (p2.pressure - p1.pressure) * t,
      tiltX: p1.tiltX + (p2.tiltX - p1.tiltX) * t,
      tiltY: p1.tiltY + (p2.tiltY - p1.tiltY) * t,
      rotation: p1.rotation + (p2.rotation - p1.rotation) * t,
      velocity: p1.velocity + (p2.velocity - p1.velocity) * t,
      timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t
    };
  }

  private queueStamp(point: StrokePoint): void {
    const dynamics = inputDeviceManager.getBrushDynamics(
      {
        pressure: point.pressure,
        tiltX: point.tiltX,
        tiltY: point.tiltY,
        twist: point.rotation
      },
      point.velocity
    );

    const size = this.calculateDynamicSize(point, dynamics.sizeMultiplier);
    const opacity = this.calculateDynamicOpacity(point, dynamics.opacityMultiplier);
    const angle = this.calculateDynamicAngle(point);
    const scatter = this.calculateDynamicScatter(point, dynamics.scatterMultiplier);

    // Queue multiple stamps if count > 1
    const count = Math.max(1, this.settings.count);
    
    for (let i = 0; i < count; i++) {
      const stamp: BrushStamp = {
        position: {
          x: point.position.x + scatter.x * (i / count),
          y: point.position.y + scatter.y * (i / count)
        },
        size,
        opacity: opacity * this.settings.flow,
        angle,
        flatness: this.settings.flatness,
        scatter,
        color: this.currentColor
      };
      
      this.stampQueue.push(stamp);
    }
  }

  private processStampQueue(): void {
    // Process stamps in batches for performance
    const batchSize = 50;
    const stamps = this.stampQueue.splice(0, batchSize);
    
    stamps.forEach(stamp => {
      this.drawStamp(stamp);
    });
    
    // Continue processing if more stamps remain
    if (this.stampQueue.length > 0 && this.isDrawing) {
      this.frameRequest = requestAnimationFrame(() => {
        this.processStampQueue();
        this.frameRequest = null;
      });
    }
  }

  private calculateDynamicSize(point: StrokePoint, baseMultiplier: number): number {
    let size = this.settings.size;
    
    // Apply pressure dynamics
    if (this.settings.dynamics.sizePressure > 0) {
      const pressureEffect = baseMultiplier * this.settings.dynamics.sizePressure;
      size *= (1 - this.settings.dynamics.sizePressure) + pressureEffect;
    }
    
    // Apply velocity dynamics
    if (this.settings.dynamics.sizeVelocity > 0) {
      const velocityEffect = 1 - Math.min(point.velocity / 1000, 1) * this.settings.dynamics.sizeVelocity;
      size *= velocityEffect;
    }
    
    // Apply tilt dynamics
    if (this.settings.dynamics.sizeTilt > 0) {
      const tiltMagnitude = Math.sqrt(point.tiltX * point.tiltX + point.tiltY * point.tiltY) / 90;
      const tiltEffect = 1 - tiltMagnitude * this.settings.dynamics.sizeTilt * 0.5;
      size *= tiltEffect;
    }
    
    // Apply jitter
    if (this.settings.sizeJitter > 0) {
      const jitter = (Math.random() - 0.5) * this.settings.sizeJitter;
      size *= (1 + jitter);
    }
    
    // Clamp to min/max
    return Math.max(this.settings.minSize, Math.min(this.settings.maxSize, size));
  }

  private calculateDynamicOpacity(point: StrokePoint, baseMultiplier: number): number {
    let opacity = this.settings.opacity;
    
    // Apply pressure dynamics
    if (this.settings.dynamics.opacityPressure > 0) {
      const pressureEffect = baseMultiplier * this.settings.dynamics.opacityPressure;
      opacity *= (1 - this.settings.dynamics.opacityPressure) + pressureEffect;
    }
    
    // Apply velocity dynamics
    if (this.settings.dynamics.opacityVelocity > 0) {
      const velocityEffect = Math.min(point.velocity / 500, 1) * this.settings.dynamics.opacityVelocity;
      opacity *= (1 - velocityEffect * 0.5);
    }
    
    // Apply tilt dynamics
    if (this.settings.dynamics.opacityTilt > 0) {
      const tiltMagnitude = Math.sqrt(point.tiltX * point.tiltX + point.tiltY * point.tiltY) / 90;
      opacity *= (1 + tiltMagnitude * this.settings.dynamics.opacityTilt * 0.3);
    }
    
    // Apply jitter
    if (this.settings.opacityJitter > 0) {
      const jitter = (Math.random() - 0.5) * this.settings.opacityJitter;
      opacity *= (1 + jitter);
    }
    
    // Clamp to min/max
    return Math.max(this.settings.minOpacity, Math.min(this.settings.maxOpacity, opacity));
  }

  private calculateDynamicAngle(point: StrokePoint): number {
    let angle = this.settings.angle;
    
    // Apply tilt dynamics
    if (this.settings.dynamics.angleTilt > 0 && (point.tiltX !== 0 || point.tiltY !== 0)) {
      const tiltAngle = Math.atan2(point.tiltY, point.tiltX) * 180 / Math.PI;
      angle += tiltAngle * this.settings.dynamics.angleTilt;
    }
    
    // Apply rotation dynamics
    if (this.settings.dynamics.angleRotation > 0 && point.rotation !== 0) {
      angle += point.rotation * this.settings.dynamics.angleRotation;
    }
    
    // Apply direction dynamics
    if (this.settings.dynamics.angleDirection > 0 && this.lastPoint) {
      const dx = point.position.x - this.lastPoint.position.x;
      const dy = point.position.y - this.lastPoint.position.y;
      const directionAngle = Math.atan2(dy, dx) * 180 / Math.PI;
      angle += directionAngle * this.settings.dynamics.angleDirection;
    }
    
    return angle % 360;
  }

  private calculateDynamicScatter(point: StrokePoint, baseMultiplier: number): Point {
    let scatterAmount = this.settings.scatter;
    
    // Apply pressure dynamics
    if (this.settings.dynamics.scatterPressure > 0) {
      scatterAmount *= (1 - point.pressure * this.settings.dynamics.scatterPressure);
    }
    
    // Apply velocity dynamics
    if (this.settings.dynamics.scatterVelocity > 0) {
      const velocityEffect = Math.min(point.velocity / 500, 1) * this.settings.dynamics.scatterVelocity;
      scatterAmount *= (1 + velocityEffect);
    }
    
    // Generate scatter offset
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * scatterAmount;
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  private drawStamp(stamp: BrushStamp): void {
    const shader = this.renderer['shaderManager'].useShader('brush');
    if (!shader || !this.stampTexture) return;

    // Set up transform for stamp
    this.renderer.pushTransform();
    this.renderer.translate(stamp.position.x, stamp.position.y);
    this.renderer.rotate(stamp.angle * Math.PI / 180);
    
    if (stamp.flatness > 0) {
      this.renderer.scale(1, 1 - stamp.flatness);
    }
    
    // Draw textured quad
    const halfSize = stamp.size / 2;
    
    // For now, use simple circle fallback
    // In production, this would render the texture with proper blending
    const color: Color = {
      r: stamp.color.r,
      g: stamp.color.g,
      b: stamp.color.b,
      a: stamp.color.a * stamp.opacity
    };
    
    this.renderer.drawCircle(0, 0, halfSize, color);
    
    this.renderer.popTransform();
  }

  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private saveStroke(): void {
    // Integration point for undo/redo system
    console.log(`Stroke completed with ${this.currentStroke.length} points`);
    
    // Calculate stroke statistics
    const avgPressure = this.currentStroke.reduce((sum, p) => sum + p.pressure, 0) / this.currentStroke.length;
    const maxVelocity = Math.max(...this.currentStroke.map(p => p.velocity));
    
    console.log(`Average pressure: ${avgPressure.toFixed(2)}, Max velocity: ${maxVelocity.toFixed(0)} px/s`);
  }

  destroy(): void {
    // Clean up textures
    this.brushTextures.forEach(texture => {
      this.gl.deleteTexture(texture);
    });
    this.brushTextures.clear();
    
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
    }
  }
}