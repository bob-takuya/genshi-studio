/**
 * Celtic and Knot Pattern Generator for Genshi Studio
 * Implements interlaced knots, Celtic borders, spiral patterns, and trinity knots
 */

import { Color, PatternGeneratorOptions, Point } from '../../types/graphics';

export enum CelticPatternType {
  InterlacedKnot = 'interlaced-knot',
  CelticBorder = 'celtic-border',
  SpiralPattern = 'spiral-pattern',
  TrinityKnot = 'trinity-knot',
  CelticCross = 'celtic-cross',
  CloverKnot = 'clover-knot',
  EternalKnot = 'eternal-knot',
  CelticChain = 'celtic-chain',
  MazePattern = 'maze-pattern',
  CelticTree = 'celtic-tree',
  DragonKnot = 'dragon-knot',
  KnotBraid = 'knot-braid'
}

export interface CelticPatternOptions extends PatternGeneratorOptions {
  knotWidth?: number;
  interlacing?: boolean;
  strandCount?: number;
  spiralTurns?: number;
  borderWidth?: number;
  centerSymbol?: boolean;
  shadowEffect?: boolean;
  strokeWidth?: number;
}

export class CelticKnotGenerator {
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
    type: CelticPatternType,
    width: number,
    height: number,
    options: CelticPatternOptions
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
      case CelticPatternType.InterlacedKnot:
        this.generateInterlacedKnot(width, height, options);
        break;
      case CelticPatternType.CelticBorder:
        this.generateCelticBorder(width, height, options);
        break;
      case CelticPatternType.SpiralPattern:
        this.generateSpiralPattern(width, height, options);
        break;
      case CelticPatternType.TrinityKnot:
        this.generateTrinityKnot(width, height, options);
        break;
      case CelticPatternType.CelticCross:
        this.generateCelticCross(width, height, options);
        break;
      case CelticPatternType.CloverKnot:
        this.generateCloverKnot(width, height, options);
        break;
      case CelticPatternType.EternalKnot:
        this.generateEternalKnot(width, height, options);
        break;
      case CelticPatternType.CelticChain:
        this.generateCelticChain(width, height, options);
        break;
      case CelticPatternType.MazePattern:
        this.generateMazePattern(width, height, options);
        break;
      case CelticPatternType.CelticTree:
        this.generateCelticTree(width, height, options);
        break;
      case CelticPatternType.DragonKnot:
        this.generateDragonKnot(width, height, options);
        break;
      case CelticPatternType.KnotBraid:
        this.generateKnotBraid(width, height, options);
        break;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);
    return imageData;
  }

  private generateInterlacedKnot(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 20, interlacing = true } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    // Create interlaced knot pattern
    this.drawInterlacedKnot(centerX, centerY, radius, strandWidth, interlacing);
    
    this.ctx.restore();
  }

  private drawInterlacedKnot(centerX: number, centerY: number, radius: number, strandWidth: number, interlacing: boolean): void {
    const points = 8;
    const angleStep = (2 * Math.PI) / points;
    
    // Draw multiple interlaced loops
    for (let loop = 0; loop < 3; loop++) {
      const loopRadius = radius * (0.8 + loop * 0.2);
      const loopOffset = loop * Math.PI / 6;
      
      this.ctx.beginPath();
      
      for (let i = 0; i <= points; i++) {
        const angle = i * angleStep + loopOffset;
        const x = centerX + Math.cos(angle) * loopRadius;
        const y = centerY + Math.sin(angle) * loopRadius;
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.stroke();
      
      if (interlacing) {
        // Add interlacing effect
        this.drawInterlacingEffect(centerX, centerY, loopRadius, angleStep, loopOffset, strandWidth);
      }
    }
  }

  private drawInterlacingEffect(centerX: number, centerY: number, radius: number, angleStep: number, offset: number, strandWidth: number): void {
    const points = 8;
    
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep + offset;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Draw over/under effect
      if (i % 2 === 0) {
        this.ctx.save();
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = strandWidth;
        this.ctx.lineCap = 'butt';
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, strandWidth / 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
      }
    }
  }

  private generateCelticBorder(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, borderWidth = 40 } = options;
    const bWidth = borderWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 3 * scale;
    this.ctx.lineCap = 'round';
    
    // Draw border on all four sides
    this.drawCelticBorderSide(0, 0, width, bWidth, 'horizontal');
    this.drawCelticBorderSide(0, height - bWidth, width, bWidth, 'horizontal');
    this.drawCelticBorderSide(0, 0, bWidth, height, 'vertical');
    this.drawCelticBorderSide(width - bWidth, 0, bWidth, height, 'vertical');
    
    this.ctx.restore();
  }

  private drawCelticBorderSide(x: number, y: number, w: number, h: number, orientation: 'horizontal' | 'vertical'): void {
    const unitSize = orientation === 'horizontal' ? h : w;
    const length = orientation === 'horizontal' ? w : h;
    const units = Math.floor(length / unitSize);
    
    for (let i = 0; i < units; i++) {
      const unitX = orientation === 'horizontal' ? x + i * unitSize : x;
      const unitY = orientation === 'horizontal' ? y : y + i * unitSize;
      
      this.drawCelticBorderUnit(unitX, unitY, unitSize, i % 2 === 0);
    }
  }

  private drawCelticBorderUnit(x: number, y: number, size: number, variant: boolean): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 3;
    
    this.ctx.beginPath();
    
    if (variant) {
      // Draw S-curve
      this.ctx.moveTo(x, centerY);
      this.ctx.bezierCurveTo(
        x + size / 4, y,
        x + size * 3/4, y + size,
        x + size, centerY
      );
    } else {
      // Draw reversed S-curve
      this.ctx.moveTo(x, centerY);
      this.ctx.bezierCurveTo(
        x + size / 4, y + size,
        x + size * 3/4, y,
        x + size, centerY
      );
    }
    
    this.ctx.stroke();
    
    // Add circular elements
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private generateSpiralPattern(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, spiralTurns = 3 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 4 * scale;
    this.ctx.lineCap = 'round';
    
    // Draw triple spiral (triskele)
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 3;
    
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const spiralCenterX = centerX + Math.cos(angle) * maxRadius / 2;
      const spiralCenterY = centerY + Math.sin(angle) * maxRadius / 2;
      
      this.drawSpiral(spiralCenterX, spiralCenterY, maxRadius / 2, spiralTurns, angle);
    }
    
    this.ctx.restore();
  }

  private drawSpiral(centerX: number, centerY: number, maxRadius: number, turns: number, startAngle: number): void {
    const steps = turns * 20;
    const angleStep = (turns * 2 * Math.PI) / steps;
    const radiusStep = maxRadius / steps;
    
    this.ctx.beginPath();
    
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i * radiusStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
  }

  private generateTrinityKnot(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 15 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    this.drawTrinityKnot(centerX, centerY, radius);
    
    this.ctx.restore();
  }

  private drawTrinityKnot(centerX: number, centerY: number, radius: number): void {
    // Draw three interlocking loops
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const loopCenterX = centerX + Math.cos(angle) * radius / 2;
      const loopCenterY = centerY + Math.sin(angle) * radius / 2;
      
      this.ctx.save();
      this.ctx.translate(loopCenterX, loopCenterY);
      this.ctx.rotate(angle);
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // Add interlacing effect
    this.drawTrinityInterlacing(centerX, centerY, radius);
  }

  private drawTrinityInterlacing(centerX: number, centerY: number, radius: number): void {
    // Draw over/under crossings
    const crossings = [
      { x: centerX + radius/4, y: centerY - radius/4 },
      { x: centerX - radius/4, y: centerY - radius/4 },
      { x: centerX, y: centerY + radius/2 }
    ];
    
    crossings.forEach(crossing => {
      this.ctx.save();
      this.ctx.fillStyle = this.ctx.strokeStyle;
      this.ctx.beginPath();
      this.ctx.arc(crossing.x, crossing.y, radius/8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  private generateCelticCross(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 20 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const crossSize = Math.min(width, height) / 3;
    
    this.drawCelticCross(centerX, centerY, crossSize);
    
    this.ctx.restore();
  }

  private drawCelticCross(centerX: number, centerY: number, size: number): void {
    // Draw cross arms
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - size, centerY);
    this.ctx.lineTo(centerX + size, centerY);
    this.ctx.moveTo(centerX, centerY - size);
    this.ctx.lineTo(centerX, centerY + size);
    this.ctx.stroke();
    
    // Draw circle around center
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Add Celtic knot decorations on arms
    this.drawCrossArmDecoration(centerX + size/2, centerY, size/4);
    this.drawCrossArmDecoration(centerX - size/2, centerY, size/4);
    this.drawCrossArmDecoration(centerX, centerY + size/2, size/4);
    this.drawCrossArmDecoration(centerX, centerY - size/2, size/4);
  }

  private drawCrossArmDecoration(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Add inner pattern
    this.ctx.beginPath();
    this.ctx.moveTo(x - size/2, y);
    this.ctx.lineTo(x + size/2, y);
    this.ctx.moveTo(x, y - size/2);
    this.ctx.lineTo(x, y + size/2);
    this.ctx.stroke();
  }

  private generateCloverKnot(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 15 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    this.drawCloverKnot(centerX, centerY, radius);
    
    this.ctx.restore();
  }

  private drawCloverKnot(centerX: number, centerY: number, radius: number): void {
    // Draw four-leaf clover pattern
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const leafCenterX = centerX + Math.cos(angle) * radius / 2;
      const leafCenterY = centerY + Math.sin(angle) * radius / 2;
      
      this.ctx.beginPath();
      this.ctx.arc(leafCenterX, leafCenterY, radius / 2, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Draw center circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius / 4, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private generateEternalKnot(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 12 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) / 3;
    
    this.drawEternalKnot(centerX, centerY, size);
    
    this.ctx.restore();
  }

  private drawEternalKnot(centerX: number, centerY: number, size: number): void {
    // Draw endless knot pattern
    this.ctx.beginPath();
    
    // Create figure-8 infinity pattern
    this.ctx.moveTo(centerX - size, centerY);
    this.ctx.bezierCurveTo(
      centerX - size, centerY - size,
      centerX, centerY - size,
      centerX, centerY
    );
    this.ctx.bezierCurveTo(
      centerX, centerY + size,
      centerX + size, centerY + size,
      centerX + size, centerY
    );
    this.ctx.bezierCurveTo(
      centerX + size, centerY - size,
      centerX, centerY - size,
      centerX, centerY
    );
    this.ctx.bezierCurveTo(
      centerX, centerY + size,
      centerX - size, centerY + size,
      centerX - size, centerY
    );
    
    this.ctx.stroke();
  }

  private generateCelticChain(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 20 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const linkSize = 40 * scale;
    const cols = Math.ceil(width / linkSize) + 1;
    const rows = Math.ceil(height / linkSize) + 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * linkSize;
        const y = row * linkSize;
        
        this.drawChainLink(x, y, linkSize, (row + col) % 2 === 0);
      }
    }
    
    this.ctx.restore();
  }

  private drawChainLink(x: number, y: number, size: number, horizontal: boolean): void {
    this.ctx.beginPath();
    
    if (horizontal) {
      // Horizontal link
      this.ctx.moveTo(x, y + size/2);
      this.ctx.bezierCurveTo(
        x, y,
        x + size, y,
        x + size, y + size/2
      );
      this.ctx.bezierCurveTo(
        x + size, y + size,
        x, y + size,
        x, y + size/2
      );
    } else {
      // Vertical link
      this.ctx.moveTo(x + size/2, y);
      this.ctx.bezierCurveTo(
        x, y,
        x, y + size,
        x + size/2, y + size
      );
      this.ctx.bezierCurveTo(
        x + size, y + size,
        x + size, y,
        x + size/2, y
      );
    }
    
    this.ctx.stroke();
  }

  private generateMazePattern(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 4 } = options;
    const pathWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = pathWidth;
    this.ctx.lineCap = 'round';
    
    const cellSize = 20 * scale;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    
    // Generate maze pattern
    const maze = this.generateMaze(cols, rows);
    
    // Draw maze
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        
        if (maze[row][col]) {
          this.drawMazeCell(x, y, cellSize);
        }
      }
    }
    
    this.ctx.restore();
  }

  private generateMaze(cols: number, rows: number): boolean[][] {
    const maze: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    
    // Simple maze generation algorithm
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Create path pattern
        if (row % 2 === 0 || col % 2 === 0) {
          if (Math.random() > 0.3) {
            maze[row][col] = true;
          }
        }
      }
    }
    
    return maze;
  }

  private drawMazeCell(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.rect(x, y, size, size);
    this.ctx.stroke();
  }

  private generateCelticTree(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 6 } = options;
    const branchWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = branchWidth;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const treeHeight = Math.min(width, height) / 2;
    
    this.drawCelticTree(centerX, centerY, treeHeight);
    
    this.ctx.restore();
  }

  private drawCelticTree(centerX: number, centerY: number, height: number): void {
    // Draw trunk
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY + height/2);
    this.ctx.lineTo(centerX, centerY - height/4);
    this.ctx.stroke();
    
    // Draw branches with Celtic knot endings
    this.drawTreeBranch(centerX, centerY - height/4, height/3, -Math.PI/4);
    this.drawTreeBranch(centerX, centerY - height/4, height/3, Math.PI/4);
    this.drawTreeBranch(centerX, centerY - height/6, height/4, -Math.PI/3);
    this.drawTreeBranch(centerX, centerY - height/6, height/4, Math.PI/3);
    
    // Draw root system
    this.drawTreeBranch(centerX, centerY + height/2, height/4, Math.PI + Math.PI/6);
    this.drawTreeBranch(centerX, centerY + height/2, height/4, Math.PI - Math.PI/6);
  }

  private drawTreeBranch(startX: number, startY: number, length: number, angle: number): void {
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Add Celtic knot at end
    this.ctx.beginPath();
    this.ctx.arc(endX, endY, length/8, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private generateDragonKnot(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, knotWidth = 8 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) / 3;
    
    this.drawDragonKnot(centerX, centerY, size);
    
    this.ctx.restore();
  }

  private drawDragonKnot(centerX: number, centerY: number, size: number): void {
    // Draw dragon-like serpentine pattern
    this.ctx.beginPath();
    
    const points = 20;
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * Math.PI * 4;
      const radius = size * (1 - t * 0.5);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
    
    // Add dragon head
    this.ctx.beginPath();
    this.ctx.arc(centerX + size, centerY, size/4, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Add dragon tail
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX - size/4, centerY - size/4);
    this.ctx.lineTo(centerX - size/4, centerY + size/4);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generateKnotBraid(width: number, height: number, options: CelticPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, strandCount = 3, knotWidth = 10 } = options;
    const strandWidth = knotWidth * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = strandWidth;
    this.ctx.lineCap = 'round';
    
    const braidWidth = width * 0.8;
    const braidHeight = height * 0.8;
    const startX = (width - braidWidth) / 2;
    const startY = (height - braidHeight) / 2;
    
    this.drawKnotBraid(startX, startY, braidWidth, braidHeight, strandCount);
    
    this.ctx.restore();
  }

  private drawKnotBraid(startX: number, startY: number, braidWidth: number, braidHeight: number, strandCount: number): void {
    const strandSpacing = braidWidth / (strandCount - 1);
    const waveHeight = braidHeight / 8;
    const waveLength = braidHeight / 4;
    
    for (let strand = 0; strand < strandCount; strand++) {
      this.ctx.beginPath();
      
      const x = startX + strand * strandSpacing;
      const phaseOffset = (strand * Math.PI * 2) / strandCount;
      
      for (let y = 0; y <= braidHeight; y += 2) {
        const wave = Math.sin((y / waveLength) * Math.PI * 2 + phaseOffset) * waveHeight;
        const currentX = x + wave;
        const currentY = startY + y;
        
        if (y === 0) this.ctx.moveTo(currentX, currentY);
        else this.ctx.lineTo(currentX, currentY);
      }
      
      this.ctx.stroke();
    }
  }

  private applyTransform(width: number, height: number, rotation: number): void {
    if (rotation !== 0) {
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotation);
      this.ctx.translate(-width / 2, -height / 2);
    }
  }

  // Traditional Celtic color palettes
  static getTraditionalPalettes(): { [key: string]: { color1: Color, color2: Color } } {
    return {
      EmeraldGreen: {
        color1: { r: 0.9, g: 0.95, b: 0.9, a: 1 },
        color2: { r: 0.2, g: 0.6, b: 0.3, a: 1 }
      },
      CelticBlue: {
        color1: { r: 0.85, g: 0.9, b: 0.95, a: 1 },
        color2: { r: 0.1, g: 0.3, b: 0.7, a: 1 }
      },
      GoldenIrish: {
        color1: { r: 0.95, g: 0.9, b: 0.8, a: 1 },
        color2: { r: 0.8, g: 0.6, b: 0.2, a: 1 }
      },
      MysticPurple: {
        color1: { r: 0.92, g: 0.88, b: 0.95, a: 1 },
        color2: { r: 0.4, g: 0.2, b: 0.6, a: 1 }
      },
      StoneGrey: {
        color1: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
        color2: { r: 0.3, g: 0.3, b: 0.3, a: 1 }
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