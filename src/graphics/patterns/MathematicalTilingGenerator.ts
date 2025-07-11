/**
 * Mathematical Tiling Systems Generator for Genshi Studio
 * Implements Penrose tilings, Truchet tiles, substitution tilings, and aperiodic patterns
 */

import { PatternGeneratorOptions } from '../../types/graphics';

export enum MathematicalTilingType {
  PenroseP1 = 'penrose-p1',
  PenroseP2 = 'penrose-p2',
  PenroseP3 = 'penrose-p3',
  TruchetTiles = 'truchet-tiles',
  TruchetArcs = 'truchet-arcs',
  TruchetSquares = 'truchet-squares',
  SubstitutionTiling = 'substitution-tiling',
  AmmannA4 = 'ammann-a4',
  AmmannA5 = 'ammann-a5',
  AperiodicTiling = 'aperiodic-tiling',
  WangTiles = 'wang-tiles',
  QuasiCrystal = 'quasi-crystal'
}

export interface MathematicalTilingOptions extends PatternGeneratorOptions {
  generation?: number;
  substitutionRules?: string;
  tileSize?: number;
  goldenRatio?: boolean;
  aperiodicType?: string;
  edgeMatching?: boolean;
  symmetryGroup?: string;
}

export class MathematicalTilingGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private patternCache: Map<string, ImageData> = new Map();
  private _goldenRatio = (1 + Math.sqrt(5)) / 2;

  constructor() {
    this.canvas = new OffscreenCanvas(1024, 1024);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;
  }

  generatePattern(
    type: MathematicalTilingType,
    width: number,
    height: number,
    options: MathematicalTilingOptions
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
      case MathematicalTilingType.PenroseP1:
        this.generatePenroseP1(width, height, options);
        break;
      case MathematicalTilingType.PenroseP2:
        this.generatePenroseP2(width, height, options);
        break;
      case MathematicalTilingType.PenroseP3:
        this.generatePenroseP3(width, height, options);
        break;
      case MathematicalTilingType.TruchetTiles:
        this.generateTruchetTiles(width, height, options);
        break;
      case MathematicalTilingType.TruchetArcs:
        this.generateTruchetArcs(width, height, options);
        break;
      case MathematicalTilingType.TruchetSquares:
        this.generateTruchetSquares(width, height, options);
        break;
      case MathematicalTilingType.SubstitutionTiling:
        this.generateSubstitutionTiling(width, height, options);
        break;
      case MathematicalTilingType.AmmannA4:
        this.generateAmmannA4(width, height, options);
        break;
      case MathematicalTilingType.AmmannA5:
        this.generateAmmannA5(width, height, options);
        break;
      case MathematicalTilingType.AperiodicTiling:
        this.generateAperiodicTiling(width, height, options);
        break;
      case MathematicalTilingType.WangTiles:
        this.generateWangTiles(width, height, options);
        break;
      case MathematicalTilingType.QuasiCrystal:
        this.generateQuasiCrystal(width, height, options);
        break;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);
    return imageData;
  }

  private generatePenroseP1(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, generation = 4 } = options;
    const tileSize = 40 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate Penrose rhombi
    const rhombi = this.generatePenroseRhombi(width, height, tileSize, generation);
    
    rhombi.forEach(rhombus => {
      this.drawPenroseRhombus(rhombus);
    });
    
    this.ctx.restore();
  }

  private generatePenroseRhombi(width: number, height: number, size: number, generation: number): any[] {
    const rhombi: any[] = [];
    
    // Start with a sun pattern
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      rhombi.push({
        type: i % 2 === 0 ? 'thin' : 'thick',
        x: x,
        y: y,
        size: size,
        rotation: angle,
        generation: generation
      });
    }
    
    return rhombi;
  }

  private drawPenroseRhombus(rhombus: any): void {
    const { x, y, size, rotation, type } = rhombus;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    if (type === 'thin') {
      // Thin rhombus (36°)
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(size, 0);
      this.ctx.lineTo(size * Math.cos(Math.PI / 5), size * Math.sin(Math.PI / 5));
      this.ctx.lineTo(size * Math.cos(Math.PI / 5) - size, size * Math.sin(Math.PI / 5));
      this.ctx.closePath();
      this.ctx.stroke();
    } else {
      // Thick rhombus (72°)
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(size, 0);
      this.ctx.lineTo(size * Math.cos(2 * Math.PI / 5), size * Math.sin(2 * Math.PI / 5));
      this.ctx.lineTo(size * Math.cos(2 * Math.PI / 5) - size, size * Math.sin(2 * Math.PI / 5));
      this.ctx.closePath();
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private generatePenroseP2(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, generation = 4 } = options;
    const tileSize = 50 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate kite and dart tiles
    const tiles = this.generateKiteAndDart(width, height, tileSize, generation);
    
    tiles.forEach(tile => {
      this.drawKiteOrDart(tile);
    });
    
    this.ctx.restore();
  }

  private generateKiteAndDart(width: number, height: number, size: number, generation: number): any[] {
    const tiles: any[] = [];
    
    // Start with a pinwheel pattern
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      tiles.push({
        type: i % 2 === 0 ? 'kite' : 'dart',
        x: x,
        y: y,
        size: size,
        rotation: angle,
        generation: generation
      });
    }
    
    return tiles;
  }

  private drawKiteOrDart(tile: any): void {
    const { x, y, size, rotation, type } = tile;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    if (type === 'kite') {
      // Kite shape
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(size, 0);
      this.ctx.lineTo(size/2, size * Math.tan(Math.PI/10));
      this.ctx.lineTo(size/2, -size * Math.tan(Math.PI/10));
      this.ctx.closePath();
      this.ctx.stroke();
    } else {
      // Dart shape
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(size * Math.cos(2*Math.PI/5), size * Math.sin(2*Math.PI/5));
      this.ctx.lineTo(size/2, size * Math.tan(Math.PI/5));
      this.ctx.lineTo(size * Math.cos(2*Math.PI/5), -size * Math.sin(2*Math.PI/5));
      this.ctx.closePath();
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private generatePenroseP3(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2 } = options;
    const tileSize = 30 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate chair and lozenge tiles
    const chairs = this.generateChairTiles(width, height, tileSize);
    const lozenges = this.generateLozengeTiles(width, height, tileSize);
    
    chairs.forEach(chair => this.drawChair(chair));
    lozenges.forEach(lozenge => this.drawLozenge(lozenge));
    
    this.ctx.restore();
  }

  private generateChairTiles(width: number, height: number, size: number): any[] {
    const chairs: any[] = [];
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        if ((row + col) % 3 === 0) {
          chairs.push({
            x: col * size,
            y: row * size,
            size: size,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }
    }
    
    return chairs;
  }

  private generateLozengeTiles(width: number, height: number, size: number): any[] {
    const lozenges: any[] = [];
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        if ((row + col) % 3 === 1) {
          lozenges.push({
            x: col * size,
            y: row * size,
            size: size,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }
    }
    
    return lozenges;
  }

  private drawChair(chair: any): void {
    const { x, y, size, rotation } = chair;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    // Draw chair-like shape
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.lineTo(size, size/2);
    this.ctx.lineTo(size/2, size/2);
    this.ctx.lineTo(size/2, size);
    this.ctx.lineTo(0, size);
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawLozenge(lozenge: any): void {
    const { x, y, size, rotation } = lozenge;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    // Draw lozenge shape
    this.ctx.beginPath();
    this.ctx.moveTo(size/2, 0);
    this.ctx.lineTo(size, size/2);
    this.ctx.lineTo(size/2, size);
    this.ctx.lineTo(0, size/2);
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private generateTruchetTiles(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, tileSize = 40 } = options;
    const size = tileSize * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 3 * scale;
    
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        this.drawTruchetTile(x, y, size, Math.random() < 0.5);
      }
    }
    
    this.ctx.restore();
  }

  private drawTruchetTile(x: number, y: number, size: number, orientation: boolean): void {
    this.ctx.beginPath();
    if (orientation) {
      // Draw diagonal from top-left to bottom-right
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + size, y + size);
    } else {
      // Draw diagonal from top-right to bottom-left
      this.ctx.moveTo(x + size, y);
      this.ctx.lineTo(x, y + size);
    }
    this.ctx.stroke();
  }

  private generateTruchetArcs(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, tileSize = 40 } = options;
    const size = tileSize * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 3 * scale;
    
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        this.drawTruchetArc(x, y, size, Math.floor(Math.random() * 4));
      }
    }
    
    this.ctx.restore();
  }

  private drawTruchetArc(x: number, y: number, size: number, orientation: number): void {
    const radius = size / 2;
    
    this.ctx.beginPath();
    switch (orientation) {
      case 0:
        this.ctx.arc(x, y, radius, 0, Math.PI / 2);
        this.ctx.arc(x + size, y + size, radius, Math.PI, 3 * Math.PI / 2);
        break;
      case 1:
        this.ctx.arc(x + size, y, radius, Math.PI / 2, Math.PI);
        this.ctx.arc(x, y + size, radius, 3 * Math.PI / 2, 2 * Math.PI);
        break;
      case 2:
        this.ctx.arc(x, y + size, radius, 3 * Math.PI / 2, 0);
        this.ctx.arc(x + size, y, radius, Math.PI / 2, Math.PI);
        break;
      case 3:
        this.ctx.arc(x + size, y + size, radius, Math.PI, 3 * Math.PI / 2);
        this.ctx.arc(x, y, radius, 0, Math.PI / 2);
        break;
    }
    this.ctx.stroke();
  }

  private generateTruchetSquares(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, tileSize = 40 } = options;
    const size = tileSize * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        this.drawTruchetSquare(x, y, size, Math.random() < 0.5);
      }
    }
    
    this.ctx.restore();
  }

  private drawTruchetSquare(x: number, y: number, size: number, filled: boolean): void {
    if (filled) {
      this.ctx.fillRect(x, y, size, size);
    } else {
      this.ctx.strokeRect(x, y, size, size);
    }
    
    // Add quarter circles in corners
    this.ctx.beginPath();
    this.ctx.arc(x, y, size/4, 0, Math.PI/2);
    this.ctx.arc(x + size, y, size/4, Math.PI/2, Math.PI);
    this.ctx.arc(x + size, y + size, size/4, Math.PI, 3*Math.PI/2);
    this.ctx.arc(x, y + size, size/4, 3*Math.PI/2, 2*Math.PI);
    this.ctx.stroke();
  }

  private generateSubstitutionTiling(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, generation = 3 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate substitution tiling using L-system
    const tiles = this.generateLSystemTiling(width, height, generation);
    
    tiles.forEach(tile => {
      this.drawSubstitutionTile(tile);
    });
    
    this.ctx.restore();
  }

  private generateLSystemTiling(width: number, height: number, generation: number): any[] {
    const tiles: any[] = [];
    let axiom = 'F';
    let rules: { [key: string]: string } = { 'F': 'F+F-F-F+F' };
    
    // Apply substitution rules
    for (let g = 0; g < generation; g++) {
      let newAxiom = '';
      for (let char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    // Interpret the L-system
    let x = width / 2;
    let y = height / 2;
    let angle = 0;
    const step = 10;
    const angleIncrement = Math.PI / 2;
    
    for (let char of axiom) {
      switch (char) {
        case 'F':
          const newX = x + Math.cos(angle) * step;
          const newY = y + Math.sin(angle) * step;
          tiles.push({
            x1: x,
            y1: y,
            x2: newX,
            y2: newY
          });
          x = newX;
          y = newY;
          break;
        case '+':
          angle += angleIncrement;
          break;
        case '-':
          angle -= angleIncrement;
          break;
      }
    }
    
    return tiles;
  }

  private drawSubstitutionTile(tile: any): void {
    const { x1, y1, x2, y2 } = tile;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private generateAmmannA4(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2 } = options;
    const tileSize = 40 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate Ammann A4 pattern
    const tiles = this.generateAmmannA4Tiles(width, height, tileSize);
    
    tiles.forEach(tile => {
      this.drawAmmannA4Tile(tile);
    });
    
    this.ctx.restore();
  }

  private generateAmmannA4Tiles(width: number, height: number, size: number): any[] {
    const tiles: any[] = [];
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        tiles.push({
          x: x,
          y: y,
          size: size,
          type: (row + col) % 4
        });
      }
    }
    
    return tiles;
  }

  private drawAmmannA4Tile(tile: any): void {
    const { x, y, size, type } = tile;
    
    this.ctx.beginPath();
    switch (type) {
      case 0:
        this.ctx.rect(x, y, size, size);
        break;
      case 1:
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.moveTo(x + size, y);
        this.ctx.lineTo(x, y + size);
        break;
      case 2:
        this.ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
        break;
      case 3:
        this.ctx.moveTo(x + size/2, y);
        this.ctx.lineTo(x, y + size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.closePath();
        break;
    }
    this.ctx.stroke();
  }

  private generateAmmannA5(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2 } = options;
    const tileSize = 30 * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate Ammann A5 pattern with pentagons
    const tiles = this.generateAmmannA5Tiles(width, height, tileSize);
    
    tiles.forEach(tile => {
      this.drawAmmannA5Tile(tile);
    });
    
    this.ctx.restore();
  }

  private generateAmmannA5Tiles(width: number, height: number, size: number): any[] {
    const tiles: any[] = [];
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        tiles.push({
          x: x,
          y: y,
          size: size,
          rotation: (row + col) * Math.PI / 5
        });
      }
    }
    
    return tiles;
  }

  private drawAmmannA5Tile(tile: any): void {
    const { x, y, size, rotation } = tile;
    
    this.ctx.save();
    this.ctx.translate(x + size/2, y + size/2);
    this.ctx.rotate(rotation);
    
    // Draw pentagon
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const px = Math.cos(angle) * size/2;
      const py = Math.sin(angle) * size/2;
      
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private generateAperiodicTiling(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    // Generate simple aperiodic tiling
    const tiles = this.generateAperiodicTiles(width, height, scale);
    
    tiles.forEach(tile => {
      this.drawAperiodicTile(tile);
    });
    
    this.ctx.restore();
  }

  private generateAperiodicTiles(width: number, height: number, scale: number): any[] {
    const tiles: any[] = [];
    const size = 40 * scale;
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        // Create aperiodic pattern based on Fibonacci sequence
        const fibIndex = (row + col) % 8;
        const fibValue = this.fibonacci(fibIndex);
        
        tiles.push({
          x: x,
          y: y,
          size: size,
          fibValue: fibValue,
          type: fibValue % 3
        });
      }
    }
    
    return tiles;
  }

  private fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  private drawAperiodicTile(tile: any): void {
    const { x, y, size, type } = tile;
    
    this.ctx.beginPath();
    switch (type) {
      case 0:
        this.ctx.rect(x, y, size, size);
        break;
      case 1:
        this.ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
        break;
      case 2:
        this.ctx.moveTo(x + size/2, y);
        this.ctx.lineTo(x, y + size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.closePath();
        break;
    }
    this.ctx.stroke();
  }

  private generateWangTiles(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2, tileSize = 40 } = options;
    const size = tileSize * scale;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    
    const cols = Math.ceil(width / size) + 2;
    const rows = Math.ceil(height / size) + 2;
    
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        
        this.drawWangTile(x, y, size, row, col);
      }
    }
    
    this.ctx.restore();
  }

  private drawWangTile(x: number, y: number, size: number, row: number, col: number): void {
    // Draw Wang tile with colored edges
    this.ctx.strokeRect(x, y, size, size);
    
    // Add colored markers on edges
    const colors = ['red', 'blue', 'green', 'yellow'];
    const edgeColors = [
      colors[(row + col) % 4],      // top
      colors[(row + col + 1) % 4],  // right
      colors[(row + col + 2) % 4],  // bottom
      colors[(row + col + 3) % 4]   // left
    ];
    
    this.ctx.fillStyle = edgeColors[0];
    this.ctx.fillRect(x + size/4, y, size/2, size/8);
    
    this.ctx.fillStyle = edgeColors[1];
    this.ctx.fillRect(x + size - size/8, y + size/4, size/8, size/2);
    
    this.ctx.fillStyle = edgeColors[2];
    this.ctx.fillRect(x + size/4, y + size - size/8, size/2, size/8);
    
    this.ctx.fillStyle = edgeColors[3];
    this.ctx.fillRect(x, y + size/4, size/8, size/2);
  }

  private generateQuasiCrystal(width: number, height: number, options: MathematicalTilingOptions): void {
    const { scale = 1, rotation = 0, color1, color2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 1 * scale;
    
    // Generate quasi-crystal pattern
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2;
    
    // Draw radial quasi-crystal pattern
    for (let symmetry = 5; symmetry <= 10; symmetry++) {
      this.drawQuasiCrystalLayer(centerX, centerY, maxRadius, symmetry, scale);
    }
    
    this.ctx.restore();
  }

  private drawQuasiCrystalLayer(centerX: number, centerY: number, maxRadius: number, symmetry: number, scale: number): void {
    const angleStep = (2 * Math.PI) / symmetry;
    const radiusStep = 20 * scale;
    
    for (let radius = radiusStep; radius < maxRadius; radius += radiusStep) {
      this.ctx.beginPath();
      
      for (let i = 0; i < symmetry; i++) {
        const angle = i * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
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

  clearCache(): void {
    this.patternCache.clear();
  }

  destroy(): void {
    this.clearCache();
  }
}