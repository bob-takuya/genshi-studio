/**
 * Islamic Geometric Pattern Generator for Genshi Studio
 * Implements traditional Islamic geometric patterns including 8-fold and 12-fold stars, Girih tiling
 */

import { Color, PatternGeneratorOptions, Point } from '../../types/graphics';

export enum IslamicPatternType {
  EightFoldStar = 'eight-fold-star',
  TwelveFoldStar = 'twelve-fold-star',
  GirihTiling = 'girih-tiling',
  Safavid = 'safavid',
  Mamluk = 'mamluk',
  Muqarnas = 'muqarnas',
  Geometric = 'geometric',
  Kufic = 'kufic'
}

export interface IslamicPatternOptions extends PatternGeneratorOptions {
  symmetry?: number;
  innerRadius?: number;
  outerRadius?: number;
  strokeWidth?: number;
  fillPattern?: boolean;
  interlacing?: boolean;
  complexity?: number;
}

export class IslamicPatternGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private patternCache: Map<string, ImageData> = new Map();

  constructor() {
    this.canvas = new OffscreenCanvas(1024, 1024);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;
  }

  generatePattern(
    type: IslamicPatternType,
    width: number,
    height: number,
    options: IslamicPatternOptions
  ): ImageData {
    const cacheKey = `${type}_${width}_${height}_${JSON.stringify(options)}`;
    const cached = this.patternCache.get(cacheKey);
    if (cached) return cached;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.ctx.clearRect(0, 0, width, height);

    switch (type) {
      case IslamicPatternType.EightFoldStar:
        this.generateEightFoldStar(width, height, options);
        break;
      case IslamicPatternType.TwelveFoldStar:
        this.generateTwelveFoldStar(width, height, options);
        break;
      case IslamicPatternType.GirihTiling:
        this.generateGirihTiling(width, height, options);
        break;
      case IslamicPatternType.Safavid:
        this.generateSafavidPattern(width, height, options);
        break;
      case IslamicPatternType.Mamluk:
        this.generateMamlukPattern(width, height, options);
        break;
      case IslamicPatternType.Muqarnas:
        this.generateMuqarnasPattern(width, height, options);
        break;
      case IslamicPatternType.Geometric:
        this.generateGeometricPattern(width, height, options);
        break;
      case IslamicPatternType.Kufic:
        this.generateKuficPattern(width, height, options);
        break;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);
    return imageData;
  }

  private generateEightFoldStar(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    const centerRadius = 50 * scale;
    const outerRadius = centerRadius * 1.5;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    // Traditional Islamic colors
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const tileSize = outerRadius * 2;
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = Math.ceil(height / tileSize) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        
        this.drawEightFoldStar(x + tileSize/2, y + tileSize/2, centerRadius, outerRadius);
      }
    }
    
    this.ctx.restore();
  }

  private drawEightFoldStar(centerX: number, centerY: number, innerRadius: number, outerRadius: number): void {
    const points = 8;
    const angleStep = (2 * Math.PI) / points;
    
    // Draw outer star
    this.ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep;
      const nextAngle = (i + 1) * angleStep;
      
      const x1 = centerX + Math.cos(angle) * outerRadius;
      const y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(nextAngle) * outerRadius;
      const y2 = centerY + Math.sin(nextAngle) * outerRadius;
      
      // Inner points
      const innerAngle = angle + angleStep / 2;
      const ix = centerX + Math.cos(innerAngle) * innerRadius;
      const iy = centerY + Math.sin(innerAngle) * innerRadius;
      
      if (i === 0) this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(ix, iy);
      this.ctx.lineTo(x2, y2);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Draw inner octagon
    this.ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep + angleStep / 2;
      const x = centerX + Math.cos(angle) * innerRadius * 0.7;
      const y = centerY + Math.sin(angle) * innerRadius * 0.7;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateTwelveFoldStar(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    const centerRadius = 40 * scale;
    const outerRadius = centerRadius * 1.8;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const tileSize = outerRadius * 2;
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = Math.ceil(height / tileSize) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        
        this.drawTwelveFoldStar(x + tileSize/2, y + tileSize/2, centerRadius, outerRadius);
      }
    }
    
    this.ctx.restore();
  }

  private drawTwelveFoldStar(centerX: number, centerY: number, innerRadius: number, outerRadius: number): void {
    const points = 12;
    const angleStep = (2 * Math.PI) / points;
    
    // Draw twelve-pointed star
    this.ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep;
      const nextAngle = (i + 1) * angleStep;
      
      const x1 = centerX + Math.cos(angle) * outerRadius;
      const y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(nextAngle) * outerRadius;
      const y2 = centerY + Math.sin(nextAngle) * outerRadius;
      
      const innerAngle = angle + angleStep / 2;
      const ix = centerX + Math.cos(innerAngle) * innerRadius;
      const iy = centerY + Math.sin(innerAngle) * innerRadius;
      
      if (i === 0) this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(ix, iy);
      this.ctx.lineTo(x2, y2);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Draw inner dodecagon
    this.ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep;
      const x = centerX + Math.cos(angle) * innerRadius * 0.6;
      const y = centerY + Math.sin(angle) * innerRadius * 0.6;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateGirihTiling(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    const tileSize = 60 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = Math.ceil(height / tileSize) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        
        // Girih tiling uses specific tile shapes
        this.drawGirihTile(x, y, tileSize, row, col);
      }
    }
    
    this.ctx.restore();
  }

  private drawGirihTile(x: number, y: number, size: number, row: number, col: number): void {
    const tileType = (row + col) % 5;
    
    switch (tileType) {
      case 0:
        this.drawRegularDecagon(x + size/2, y + size/2, size/3);
        break;
      case 1:
        this.drawElongatedHexagon(x + size/2, y + size/2, size/3);
        break;
      case 2:
        this.drawBowTie(x + size/2, y + size/2, size/3);
        break;
      case 3:
        this.drawRhombus(x + size/2, y + size/2, size/3);
        break;
      case 4:
        this.drawRegularDecagon(x + size/2, y + size/2, size/4);
        break;
    }
  }

  private drawRegularDecagon(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawElongatedHexagon(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    const vertices = [
      { x: centerX - radius, y: centerY },
      { x: centerX - radius/2, y: centerY - radius * Math.sqrt(3)/2 },
      { x: centerX + radius/2, y: centerY - radius * Math.sqrt(3)/2 },
      { x: centerX + radius, y: centerY },
      { x: centerX + radius/2, y: centerY + radius * Math.sqrt(3)/2 },
      { x: centerX - radius/2, y: centerY + radius * Math.sqrt(3)/2 }
    ];
    
    vertices.forEach((vertex, index) => {
      if (index === 0) this.ctx.moveTo(vertex.x, vertex.y);
      else this.ctx.lineTo(vertex.x, vertex.y);
    });
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawBowTie(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius, centerY - radius/2);
    this.ctx.lineTo(centerX, centerY);
    this.ctx.lineTo(centerX - radius, centerY + radius/2);
    this.ctx.lineTo(centerX + radius, centerY + radius/2);
    this.ctx.lineTo(centerX, centerY);
    this.ctx.lineTo(centerX + radius, centerY - radius/2);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawRhombus(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.lineTo(centerX + radius * 0.8, centerY);
    this.ctx.lineTo(centerX, centerY + radius);
    this.ctx.lineTo(centerX - radius * 0.8, centerY);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateSafavidPattern(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    // Typical Safavid colors
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    // Draw interlacing pattern
    const step = 40 * scale;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        this.drawSafavidMotif(x, y, step);
      }
    }
    
    this.ctx.restore();
  }

  private drawSafavidMotif(x: number, y: number, size: number): void {
    // Draw interlacing arabesque pattern
    this.ctx.beginPath();
    this.ctx.arc(x, y, size/4, 0, Math.PI);
    this.ctx.arc(x + size/2, y, size/4, Math.PI, 2 * Math.PI);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(x + size/4, y + size/2, size/4, 0, Math.PI);
    this.ctx.arc(x + size*3/4, y + size/2, size/4, Math.PI, 2 * Math.PI);
    this.ctx.stroke();
  }

  private generateMamlukPattern(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const step = 60 * scale;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        this.drawMamlukMotif(x, y, step);
      }
    }
    
    this.ctx.restore();
  }

  private drawMamlukMotif(x: number, y: number, size: number): void {
    // Draw characteristic Mamluk blazon pattern
    this.ctx.beginPath();
    this.ctx.arc(x + size/2, y + size/2, size/3, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Inner pattern
    this.ctx.beginPath();
    this.ctx.moveTo(x + size/2, y + size/6);
    this.ctx.lineTo(x + size/2, y + size*5/6);
    this.ctx.moveTo(x + size/6, y + size/2);
    this.ctx.lineTo(x + size*5/6, y + size/2);
    this.ctx.stroke();
  }

  private generateMuqarnasPattern(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const step = 50 * scale;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        this.drawMuqarnasCell(x, y, step);
      }
    }
    
    this.ctx.restore();
  }

  private drawMuqarnasCell(x: number, y: number, size: number): void {
    // Draw honeycomb muqarnas pattern
    this.ctx.beginPath();
    this.ctx.moveTo(x + size/2, y);
    this.ctx.lineTo(x + size, y + size/4);
    this.ctx.lineTo(x + size, y + size*3/4);
    this.ctx.lineTo(x + size/2, y + size);
    this.ctx.lineTo(x, y + size*3/4);
    this.ctx.lineTo(x, y + size/4);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Inner detail
    this.ctx.beginPath();
    this.ctx.arc(x + size/2, y + size/2, size/6, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private generateGeometricPattern(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const step = 40 * scale;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        this.drawGeometricUnit(x, y, step);
      }
    }
    
    this.ctx.restore();
  }

  private drawGeometricUnit(x: number, y: number, size: number): void {
    // Draw complex geometric interlacing
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + size, y + size);
    this.ctx.moveTo(x + size, y);
    this.ctx.lineTo(x, y + size);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(x + size/2, y + size/2, size/4, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private generateKuficPattern(width: number, height: number, options: IslamicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strokeWidth = 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strokeWidth * scale;
    
    const step = 30 * scale;
    const cols = Math.ceil(width / step) + 2;
    const rows = Math.ceil(height / step) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        this.drawKuficUnit(x, y, step);
      }
    }
    
    this.ctx.restore();
  }

  private drawKuficUnit(x: number, y: number, size: number): void {
    // Draw angular Kufic-style pattern
    this.ctx.beginPath();
    this.ctx.rect(x, y, size, size/3);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.rect(x, y + size*2/3, size/3, size/3);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.rect(x + size*2/3, y + size/3, size/3, size*2/3);
    this.ctx.stroke();
  }

  private applyTransform(width: number, height: number, rotation: number): void {
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }
  }

  // Traditional Islamic color palettes
  static getTraditionalPalettes(): { [key: string]: { color1: Color, color2: Color } } {
    return {
      Andalusian: {
        color1: { r: 0.9, g: 0.8, b: 0.7, a: 1 },
        color2: { r: 0.2, g: 0.3, b: 0.6, a: 1 }
      },
      Mamluk: {
        color1: { r: 0.95, g: 0.9, b: 0.8, a: 1 },
        color2: { r: 0.6, g: 0.3, b: 0.2, a: 1 }
      },
      Ottoman: {
        color1: { r: 0.8, g: 0.9, b: 0.95, a: 1 },
        color2: { r: 0.1, g: 0.2, b: 0.4, a: 1 }
      },
      Safavid: {
        color1: { r: 0.9, g: 0.95, b: 0.9, a: 1 },
        color2: { r: 0.3, g: 0.5, b: 0.3, a: 1 }
      },
      Moorish: {
        color1: { r: 0.95, g: 0.9, b: 0.85, a: 1 },
        color2: { r: 0.4, g: 0.2, b: 0.1, a: 1 }
      }
    };
  }

  clearCache(): void {
    this.patternCache.clear();
  }

  destroy(): void {
    this.clearCache();
  }
}