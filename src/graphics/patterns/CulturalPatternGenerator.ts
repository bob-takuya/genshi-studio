/**
 * Cultural Pattern Generator for Genshi Studio
 * Implements traditional Japanese patterns including Ichimatsu
 */

import { Color, PatternGeneratorOptions } from '../../types/graphics';

export enum PatternType {
  Ichimatsu = 'ichimatsu',      // Checkerboard pattern
  Seigaiha = 'seigaiha',        // Wave pattern
  Asanoha = 'asanoha',          // Hemp leaf pattern
  Shippo = 'shippo',            // Seven treasures pattern
  Kagome = 'kagome',            // Basket weave pattern
  Kikkoumon = 'kikkoumon',      // Tortoise shell pattern
  Sayagata = 'sayagata',        // Key fret pattern
  Tatewaku = 'tatewaku',        // Rising steam pattern
}

export class CulturalPatternGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private patternCache: Map<string, ImageData> = new Map();

  constructor() {
    this.canvas = new OffscreenCanvas(512, 512);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;
  }

  generatePattern(
    type: PatternType,
    width: number,
    height: number,
    options: PatternGeneratorOptions
  ): ImageData {
    // Check cache first
    const cacheKey = `${type}_${width}_${height}_${JSON.stringify(options)}`;
    const cached = this.patternCache.get(cacheKey);
    if (cached) return cached;

    // Resize canvas if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Generate pattern based on type
    switch (type) {
      case PatternType.Ichimatsu:
        this.generateIchimatsu(width, height, options);
        break;
      case PatternType.Seigaiha:
        this.generateSeigaiha(width, height, options);
        break;
      case PatternType.Asanoha:
        this.generateAsanoha(width, height, options);
        break;
      case PatternType.Shippo:
        this.generateShippo(width, height, options);
        break;
      case PatternType.Kagome:
        this.generateKagome(width, height, options);
        break;
      case PatternType.Kikkoumon:
        this.generateKikkoumon(width, height, options);
        break;
      case PatternType.Sayagata:
        this.generateSayagata(width, height, options);
        break;
      case PatternType.Tatewaku:
        this.generateTatewaku(width, height, options);
        break;
    }

    // Get image data and cache it
    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);

    return imageData;
  }

  private generateIchimatsu(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const tileSize = 32 * scale;

    this.ctx.save();
    
    // Apply rotation
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Draw checkerboard pattern
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = Math.ceil(height / tileSize) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const isEven = (row + col) % 2 === 0;
        const color = isEven ? color1 : color2;
        
        this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
        this.ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }

    this.ctx.restore();
  }

  private generateSeigaiha(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const waveRadius = 30 * scale;
    const overlap = waveRadius * 0.5;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Wave pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;

    const cols = Math.ceil(width / (waveRadius - overlap)) + 2;
    const rows = Math.ceil(height / (waveRadius * 2)) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * (waveRadius - overlap);
        const y = row * (waveRadius * 2);
        const offset = row % 2 === 0 ? 0 : waveRadius - overlap;

        // Draw concentric arcs
        for (let i = 0; i < 3; i++) {
          const r = waveRadius - i * (waveRadius / 3);
          this.ctx.beginPath();
          this.ctx.arc(x + offset, y, r, 0, Math.PI);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.restore();
  }

  private generateAsanoha(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const hexSize = 40 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Hemp leaf pattern based on hexagonal grid
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 1.5 * scale;

    const hexHeight = hexSize * Math.sqrt(3);
    const cols = Math.ceil(width / (hexSize * 1.5)) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);

        this.drawAsanohaUnit(x, y, hexSize);
      }
    }

    this.ctx.restore();
  }

  private drawAsanohaUnit(centerX: number, centerY: number, size: number): void {
    // Draw six-pointed star pattern
    for (let i = 0; i < 6; i++) {
      const angle1 = (i * Math.PI) / 3;
      const angle2 = ((i + 1) * Math.PI) / 3;
      
      const x1 = centerX + Math.cos(angle1) * size;
      const y1 = centerY + Math.sin(angle1) * size;
      const x2 = centerX + Math.cos(angle2) * size;
      const y2 = centerY + Math.sin(angle2) * size;

      // Draw lines from center to vertices
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();

      // Draw lines between vertices
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  private generateShippo(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const circleRadius = 25 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Overlapping circles pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;

    const spacing = circleRadius * Math.sqrt(2);
    const cols = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;
        const offset = row % 2 === 0 ? 0 : spacing / 2;

        this.ctx.beginPath();
        this.ctx.arc(x + offset, y, circleRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  private generateKagome(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const triSize = 30 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Basket weave pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;

    const hexHeight = triSize * Math.sqrt(3);
    const cols = Math.ceil(width / triSize) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * triSize;
        const y = row * hexHeight;
        
        // Draw interlocking triangular lattice
        this.drawKagomeUnit(x, y, triSize);
      }
    }

    this.ctx.restore();
  }

  private drawKagomeUnit(x: number, y: number, size: number): void {
    const h = size * Math.sqrt(3) / 2;
    
    // Draw hexagon made of triangles
    this.ctx.beginPath();
    // Top triangle
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x + size / 2, y + h);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Bottom triangle
    this.ctx.beginPath();
    this.ctx.moveTo(x + size / 2, y + h);
    this.ctx.lineTo(x + size, y + 2 * h);
    this.ctx.lineTo(x, y + 2 * h);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateKikkoumon(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const hexSize = 30 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Hexagonal pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;

    const hexHeight = hexSize * Math.sqrt(3);
    const cols = Math.ceil(width / (hexSize * 1.5)) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);

        this.drawHexagon(x, y, hexSize);
      }
    }

    this.ctx.restore();
  }

  private drawHexagon(centerX: number, centerY: number, size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateSayagata(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2 } = options;
    const unitSize = 40 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Key fret pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'square';

    const cols = Math.ceil(width / unitSize) + 2;
    const rows = Math.ceil(height / unitSize) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * unitSize;
        const y = row * unitSize;
        
        this.drawSayagataUnit(x, y, unitSize);
      }
    }

    this.ctx.restore();
  }

  private drawSayagataUnit(x: number, y: number, size: number): void {
    const step = size / 4;
    
    this.ctx.beginPath();
    // Draw interlocking L-shapes
    this.ctx.moveTo(x, y + step);
    this.ctx.lineTo(x + step, y + step);
    this.ctx.lineTo(x + step, y);
    this.ctx.moveTo(x + step * 2, y);
    this.ctx.lineTo(x + step * 2, y + step);
    this.ctx.lineTo(x + step * 3, y + step);
    this.ctx.lineTo(x + step * 3, y + step * 2);
    this.ctx.lineTo(x + size, y + step * 2);
    this.ctx.moveTo(x + size, y + step * 3);
    this.ctx.lineTo(x + step * 3, y + step * 3);
    this.ctx.lineTo(x + step * 3, y + size);
    this.ctx.moveTo(x + step * 2, y + size);
    this.ctx.lineTo(x + step * 2, y + step * 3);
    this.ctx.lineTo(x + step, y + step * 3);
    this.ctx.lineTo(x + step, y + step * 2);
    this.ctx.lineTo(x, y + step * 2);
    this.ctx.stroke();
  }

  private generateTatewaku(width: number, height: number, options: PatternGeneratorOptions): void {
    const { scale, rotation, color1, color2, complexity = 5 } = options;
    const waveHeight = 30 * scale;
    const waveWidth = 20 * scale;

    this.ctx.save();
    
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Background
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);

    // Rising steam pattern
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;

    const cols = Math.ceil(width / waveWidth) + 2;
    
    for (let col = -1; col < cols; col++) {
      const x = col * waveWidth;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      
      for (let y = 0; y <= height + waveHeight; y += 5) {
        const phase = (col % 2) * Math.PI;
        const offset = Math.sin((y / waveHeight) * Math.PI + phase) * (waveWidth / 2);
        this.ctx.lineTo(x + offset, y);
      }
      
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  clearCache(): void {
    this.patternCache.clear();
  }

  destroy(): void {
    this.clearCache();
    // Canvas will be garbage collected
  }
}