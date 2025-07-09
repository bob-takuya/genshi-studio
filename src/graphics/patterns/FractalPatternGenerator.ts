/**
 * Fractal and Recursive Pattern Generator for Genshi Studio
 * Implements Sierpinski triangles, dragon curves, L-systems, and Mandelbrot-style patterns
 */

import { Color, PatternGeneratorOptions, Point } from '../../types/graphics';

export enum FractalPatternType {
  SierpinskiTriangle = 'sierpinski-triangle',
  SierpinskiCarpet = 'sierpinski-carpet',
  DragonCurve = 'dragon-curve',
  KochSnowflake = 'koch-snowflake',
  KochCurve = 'koch-curve',
  LSystemTree = 'l-system-tree',
  LSystemDragon = 'l-system-dragon',
  LSystemFern = 'l-system-fern',
  MandelbrotSet = 'mandelbrot-set',
  JuliaSet = 'julia-set',
  NewtonFractal = 'newton-fractal',
  CanterSet = 'cantor-set',
  HilbertCurve = 'hilbert-curve',
  PeanoCurve = 'peano-curve',
  BarnsleyFern = 'barnsley-fern',
  LevyDragon = 'levy-dragon'
}

export interface FractalPatternOptions extends PatternGeneratorOptions {
  iterations?: number;
  recursionDepth?: number;
  axiom?: string;
  rules?: { [key: string]: string };
  angle?: number;
  branchingFactor?: number;
  colorMode?: 'single' | 'gradient' | 'iteration';
  escapeRadius?: number;
  maxIterations?: number;
  juliaC?: { real: number, imag: number };
  zoom?: number;
  centerX?: number;
  centerY?: number;
}

export class FractalPatternGenerator {
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
    type: FractalPatternType,
    width: number,
    height: number,
    options: FractalPatternOptions
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
      case FractalPatternType.SierpinskiTriangle:
        this.generateSierpinskiTriangle(width, height, options);
        break;
      case FractalPatternType.SierpinskiCarpet:
        this.generateSierpinskiCarpet(width, height, options);
        break;
      case FractalPatternType.DragonCurve:
        this.generateDragonCurve(width, height, options);
        break;
      case FractalPatternType.KochSnowflake:
        this.generateKochSnowflake(width, height, options);
        break;
      case FractalPatternType.KochCurve:
        this.generateKochCurve(width, height, options);
        break;
      case FractalPatternType.LSystemTree:
        this.generateLSystemTree(width, height, options);
        break;
      case FractalPatternType.LSystemDragon:
        this.generateLSystemDragon(width, height, options);
        break;
      case FractalPatternType.LSystemFern:
        this.generateLSystemFern(width, height, options);
        break;
      case FractalPatternType.MandelbrotSet:
        this.generateMandelbrotSet(width, height, options);
        break;
      case FractalPatternType.JuliaSet:
        this.generateJuliaSet(width, height, options);
        break;
      case FractalPatternType.NewtonFractal:
        this.generateNewtonFractal(width, height, options);
        break;
      case FractalPatternType.CanterSet:
        this.generateCanterSet(width, height, options);
        break;
      case FractalPatternType.HilbertCurve:
        this.generateHilbertCurve(width, height, options);
        break;
      case FractalPatternType.PeanoCurve:
        this.generatePeanoCurve(width, height, options);
        break;
      case FractalPatternType.BarnsleyFern:
        this.generateBarnsleyFern(width, height, options);
        break;
      case FractalPatternType.LevyDragon:
        this.generateLevyDragon(width, height, options);
        break;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);
    return imageData;
  }

  private generateSierpinskiTriangle(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 6 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 1 * scale;
    
    const size = Math.min(width, height) * 0.8;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Initial triangle vertices
    const vertices: Point[] = [
      { x: centerX, y: centerY - size / 2 },
      { x: centerX - size / 2, y: centerY + size / 2 },
      { x: centerX + size / 2, y: centerY + size / 2 }
    ];
    
    this.drawSierpinskiTriangle(vertices, iterations);
    
    this.ctx.restore();
  }

  private drawSierpinskiTriangle(vertices: Point[], iterations: number): void {
    if (iterations === 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(vertices[0].x, vertices[0].y);
      this.ctx.lineTo(vertices[1].x, vertices[1].y);
      this.ctx.lineTo(vertices[2].x, vertices[2].y);
      this.ctx.closePath();
      this.ctx.stroke();
      return;
    }
    
    // Calculate midpoints
    const midpoints: Point[] = [
      { x: (vertices[0].x + vertices[1].x) / 2, y: (vertices[0].y + vertices[1].y) / 2 },
      { x: (vertices[1].x + vertices[2].x) / 2, y: (vertices[1].y + vertices[2].y) / 2 },
      { x: (vertices[2].x + vertices[0].x) / 2, y: (vertices[2].y + vertices[0].y) / 2 }
    ];
    
    // Recursively draw three smaller triangles
    this.drawSierpinskiTriangle([vertices[0], midpoints[0], midpoints[2]], iterations - 1);
    this.drawSierpinskiTriangle([midpoints[0], vertices[1], midpoints[1]], iterations - 1);
    this.drawSierpinskiTriangle([midpoints[2], midpoints[1], vertices[2]], iterations - 1);
  }

  private generateSierpinskiCarpet(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 4 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    
    const size = Math.min(width, height) * 0.8;
    const centerX = width / 2;
    const centerY = height / 2;
    
    this.drawSierpinskiCarpet(centerX - size/2, centerY - size/2, size, iterations);
    
    this.ctx.restore();
  }

  private drawSierpinskiCarpet(x: number, y: number, size: number, iterations: number): void {
    if (iterations === 0) {
      this.ctx.fillRect(x, y, size, size);
      return;
    }
    
    const third = size / 3;
    
    // Draw 8 smaller squares (skipping the center)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) continue; // Skip center
        
        this.drawSierpinskiCarpet(
          x + i * third,
          y + j * third,
          third,
          iterations - 1
        );
      }
    }
  }

  private generateDragonCurve(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 10 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const startX = width / 4;
    const startY = height / 2;
    const length = Math.min(width, height) / 4;
    
    this.drawDragonCurve(startX, startY, length, 0, iterations);
    
    this.ctx.restore();
  }

  private drawDragonCurve(x: number, y: number, length: number, angle: number, iterations: number): void {
    if (iterations === 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      this.ctx.stroke();
      return;
    }
    
    const halfLength = length / Math.sqrt(2);
    const newAngle1 = angle - Math.PI / 4;
    const newAngle2 = angle + Math.PI / 4;
    
    // Calculate midpoint
    const midX = x + Math.cos(newAngle1) * halfLength;
    const midY = y + Math.sin(newAngle1) * halfLength;
    
    // Draw two halves
    this.drawDragonCurve(x, y, halfLength, newAngle1, iterations - 1);
    this.drawDragonCurve(midX, midY, halfLength, newAngle2, iterations - 1);
  }

  private generateKochSnowflake(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 4 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const size = Math.min(width, height) * 0.4;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Initial triangle vertices
    const vertices: Point[] = [
      { x: centerX, y: centerY - size },
      { x: centerX - size * Math.cos(Math.PI / 6), y: centerY + size * Math.sin(Math.PI / 6) },
      { x: centerX + size * Math.cos(Math.PI / 6), y: centerY + size * Math.sin(Math.PI / 6) }
    ];
    
    // Draw three sides of the snowflake
    this.drawKochCurve(vertices[0], vertices[1], iterations);
    this.drawKochCurve(vertices[1], vertices[2], iterations);
    this.drawKochCurve(vertices[2], vertices[0], iterations);
    
    this.ctx.restore();
  }

  private generateKochCurve(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 4 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    
    const start: Point = { x: width * 0.1, y: height / 2 };
    const end: Point = { x: width * 0.9, y: height / 2 };
    
    this.drawKochCurve(start, end, iterations);
    
    this.ctx.restore();
  }

  private drawKochCurve(start: Point, end: Point, iterations: number): void {
    if (iterations === 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
      return;
    }
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Calculate the four points
    const p1: Point = { x: start.x + dx / 3, y: start.y + dy / 3 };
    const p2: Point = { x: start.x + 2 * dx / 3, y: start.y + 2 * dy / 3 };
    
    // Calculate peak point
    const peakX = p1.x + (p2.x - p1.x) / 2 - (p2.y - p1.y) * Math.sqrt(3) / 2;
    const peakY = p1.y + (p2.y - p1.y) / 2 + (p2.x - p1.x) * Math.sqrt(3) / 2;
    const peak: Point = { x: peakX, y: peakY };
    
    // Recursively draw four segments
    this.drawKochCurve(start, p1, iterations - 1);
    this.drawKochCurve(p1, peak, iterations - 1);
    this.drawKochCurve(peak, p2, iterations - 1);
    this.drawKochCurve(p2, end, iterations - 1);
  }

  private generateLSystemTree(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 5, angle = Math.PI / 6 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    
    // L-System rules for tree
    let axiom = 'F';
    const rules = { 'F': 'F[+F]F[-F]F' };
    
    // Apply rules
    for (let i = 0; i < iterations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    // Draw the tree
    this.drawLSystem(axiom, width / 2, height * 0.9, -Math.PI / 2, 5 * scale, angle);
    
    this.ctx.restore();
  }

  private generateLSystemDragon(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 10, angle = Math.PI / 2 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    
    // L-System rules for dragon curve
    let axiom = 'FX';
    const rules = { 'X': 'X+YF+', 'Y': '-FX-Y' };
    
    // Apply rules
    for (let i = 0; i < iterations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    // Draw the dragon
    this.drawLSystem(axiom, width / 3, height / 2, 0, 3 * scale, angle);
    
    this.ctx.restore();
  }

  private generateLSystemFern(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 5, angle = Math.PI / 8 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 1 * scale;
    this.ctx.lineCap = 'round';
    
    // L-System rules for fern
    let axiom = 'X';
    const rules = { 'X': 'F+[[X]-X]-F[-FX]+X', 'F': 'FF' };
    
    // Apply rules
    for (let i = 0; i < iterations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    // Draw the fern
    this.drawLSystem(axiom, width / 2, height * 0.9, -Math.PI / 2, 3 * scale, angle);
    
    this.ctx.restore();
  }

  private drawLSystem(axiom: string, startX: number, startY: number, startAngle: number, stepSize: number, angleIncrement: number): void {
    const stack: { x: number, y: number, angle: number }[] = [];
    let x = startX;
    let y = startY;
    let angle = startAngle;
    
    for (const char of axiom) {
      switch (char) {
        case 'F':
          const newX = x + Math.cos(angle) * stepSize;
          const newY = y + Math.sin(angle) * stepSize;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(newX, newY);
          this.ctx.stroke();
          x = newX;
          y = newY;
          break;
        case '+':
          angle += angleIncrement;
          break;
        case '-':
          angle -= angleIncrement;
          break;
        case '[':
          stack.push({ x, y, angle });
          break;
        case ']':
          const state = stack.pop();
          if (state) {
            x = state.x;
            y = state.y;
            angle = state.angle;
          }
          break;
      }
    }
  }

  private generateMandelbrotSet(width: number, height: number, options: FractalPatternOptions): void {
    const { 
      scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      maxIterations = 100, 
      escapeRadius = 2,
      zoom = 1,
      centerX = -0.5,
      centerY = 0
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    const xMin = centerX - 2 / zoom;
    const xMax = centerX + 2 / zoom;
    const yMin = centerY - 2 / zoom;
    const yMax = centerY + 2 / zoom;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x0 = xMin + (px / width) * (xMax - xMin);
        const y0 = yMin + (py / height) * (yMax - yMin);
        
        let x = 0;
        let y = 0;
        let iteration = 0;
        
        while (x * x + y * y < escapeRadius * escapeRadius && iteration < maxIterations) {
          const xtemp = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xtemp;
          iteration++;
        }
        
        const pixelIndex = (py * width + px) * 4;
        
        if (iteration === maxIterations) {
          // Inside the set - use color1
          data[pixelIndex] = color1.r * 255;
          data[pixelIndex + 1] = color1.g * 255;
          data[pixelIndex + 2] = color1.b * 255;
          data[pixelIndex + 3] = color1.a * 255;
        } else {
          // Outside the set - use color2 with iteration-based intensity
          const intensity = iteration / maxIterations;
          data[pixelIndex] = color2.r * 255 * intensity;
          data[pixelIndex + 1] = color2.g * 255 * intensity;
          data[pixelIndex + 2] = color2.b * 255 * intensity;
          data[pixelIndex + 3] = color2.a * 255;
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateJuliaSet(width: number, height: number, options: FractalPatternOptions): void {
    const { 
      scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      maxIterations = 100,
      escapeRadius = 2,
      zoom = 1,
      centerX = 0,
      centerY = 0,
      juliaC = { real: -0.7, imag: 0.27015 }
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    const xMin = centerX - 2 / zoom;
    const xMax = centerX + 2 / zoom;
    const yMin = centerY - 2 / zoom;
    const yMax = centerY + 2 / zoom;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        let x = xMin + (px / width) * (xMax - xMin);
        let y = yMin + (py / height) * (yMax - yMin);
        
        let iteration = 0;
        
        while (x * x + y * y < escapeRadius * escapeRadius && iteration < maxIterations) {
          const xtemp = x * x - y * y + juliaC.real;
          y = 2 * x * y + juliaC.imag;
          x = xtemp;
          iteration++;
        }
        
        const pixelIndex = (py * width + px) * 4;
        
        if (iteration === maxIterations) {
          data[pixelIndex] = color1.r * 255;
          data[pixelIndex + 1] = color1.g * 255;
          data[pixelIndex + 2] = color1.b * 255;
          data[pixelIndex + 3] = color1.a * 255;
        } else {
          const intensity = iteration / maxIterations;
          data[pixelIndex] = color2.r * 255 * intensity;
          data[pixelIndex + 1] = color2.g * 255 * intensity;
          data[pixelIndex + 2] = color2.b * 255 * intensity;
          data[pixelIndex + 3] = color2.a * 255;
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateNewtonFractal(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, maxIterations = 50, zoom = 1 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    const xMin = -2 / zoom;
    const xMax = 2 / zoom;
    const yMin = -2 / zoom;
    const yMax = 2 / zoom;
    
    // Newton's method for z^3 - 1 = 0
    const roots = [
      { x: 1, y: 0 },
      { x: -0.5, y: Math.sqrt(3) / 2 },
      { x: -0.5, y: -Math.sqrt(3) / 2 }
    ];
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        let x = xMin + (px / width) * (xMax - xMin);
        let y = yMin + (py / height) * (yMax - yMin);
        
        let iteration = 0;
        
        while (iteration < maxIterations) {
          // f(z) = z^3 - 1
          // f'(z) = 3z^2
          const z3Real = x * x * x - 3 * x * y * y - 1;
          const z3Imag = 3 * x * x * y - y * y * y;
          
          const z2Real = x * x - y * y;
          const z2Imag = 2 * x * y;
          
          const denominator = 3 * (z2Real * z2Real + z2Imag * z2Imag);
          
          if (denominator === 0) break;
          
          const newtonReal = x - (z3Real * z2Real + z3Imag * z2Imag) / denominator;
          const newtonImag = y - (z3Imag * z2Real - z3Real * z2Imag) / denominator;
          
          x = newtonReal;
          y = newtonImag;
          iteration++;
        }
        
        const pixelIndex = (py * width + px) * 4;
        
        // Color based on which root we converged to
        let closestRoot = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < roots.length; i++) {
          const distance = Math.sqrt((x - roots[i].x) ** 2 + (y - roots[i].y) ** 2);
          if (distance < minDistance) {
            minDistance = distance;
            closestRoot = i;
          }
        }
        
        const colors = [
          { r: 1, g: 0, b: 0 },
          { r: 0, g: 1, b: 0 },
          { r: 0, g: 0, b: 1 }
        ];
        
        const intensity = 1 - iteration / maxIterations;
        const rootColor = colors[closestRoot];
        
        data[pixelIndex] = rootColor.r * 255 * intensity;
        data[pixelIndex + 1] = rootColor.g * 255 * intensity;
        data[pixelIndex + 2] = rootColor.b * 255 * intensity;
        data[pixelIndex + 3] = 255;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateCanterSet(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 6 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    
    const margin = width * 0.1;
    const lineWidth = (width - 2 * margin);
    const lineHeight = 20 * scale;
    
    for (let level = 0; level < iterations; level++) {
      const y = margin + level * lineHeight * 2;
      this.drawCanterSetLevel(margin, y, lineWidth, lineHeight, level);
    }
    
    this.ctx.restore();
  }

  private drawCanterSetLevel(x: number, y: number, width: number, height: number, level: number): void {
    if (level === 0) {
      this.ctx.fillRect(x, y, width, height);
      return;
    }
    
    const thirdWidth = width / 3;
    
    // Draw left and right thirds
    this.drawCanterSetLevel(x, y, thirdWidth, height, level - 1);
    this.drawCanterSetLevel(x + 2 * thirdWidth, y, thirdWidth, height, level - 1);
  }

  private generateHilbertCurve(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 4 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const size = Math.min(width, height) * 0.8;
    const margin = (Math.min(width, height) - size) / 2;
    
    const points = this.generateHilbertPoints(iterations);
    const maxCoord = Math.pow(2, iterations) - 1;
    
    if (points.length > 0) {
      this.ctx.beginPath();
      
      for (let i = 0; i < points.length; i++) {
        const x = margin + (points[i].x / maxCoord) * size;
        const y = margin + (points[i].y / maxCoord) * size;
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private generateHilbertPoints(order: number): Point[] {
    const points: Point[] = [];
    const n = Math.pow(2, order);
    
    for (let i = 0; i < n * n; i++) {
      const point = this.hilbertIndexToPoint(i, order);
      points.push(point);
    }
    
    return points;
  }

  private hilbertIndexToPoint(index: number, order: number): Point {
    let x = 0;
    let y = 0;
    let t = index;
    
    for (let s = 1; s < Math.pow(2, order); s *= 2) {
      const rx = 1 & (t / 2);
      const ry = 1 & (t ^ rx);
      
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }
      
      x += s * rx;
      y += s * ry;
      t /= 4;
    }
    
    return { x, y };
  }

  private generatePeanoCurve(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 3 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    
    const size = Math.min(width, height) * 0.8;
    const margin = (Math.min(width, height) - size) / 2;
    
    // L-System for Peano curve
    let axiom = 'L';
    const rules = { 
      'L': 'LFRFL-F-RFLFR+F+LFRFL',
      'R': 'RFLFR+F+LFRFL-F-RFLFR'
    };
    
    for (let i = 0; i < iterations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    const stepSize = size / Math.pow(3, iterations);
    this.drawLSystem(axiom, margin, margin, 0, stepSize, Math.PI / 2);
    
    this.ctx.restore();
  }

  private generateBarnsleyFern(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 50000 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    
    let x = 0;
    let y = 0;
    
    const scale_x = width / 12;
    const scale_y = height / 12;
    const offset_x = width / 2;
    const offset_y = height;
    
    for (let i = 0; i < iterations; i++) {
      const rand = Math.random();
      let newX, newY;
      
      if (rand < 0.01) {
        // Stem
        newX = 0;
        newY = 0.16 * y;
      } else if (rand < 0.86) {
        // Leaflet
        newX = 0.85 * x + 0.04 * y;
        newY = -0.04 * x + 0.85 * y + 1.6;
      } else if (rand < 0.93) {
        // Left leaflet
        newX = 0.2 * x - 0.26 * y;
        newY = 0.23 * x + 0.22 * y + 1.6;
      } else {
        // Right leaflet
        newX = -0.15 * x + 0.28 * y;
        newY = 0.26 * x + 0.24 * y + 0.44;
      }
      
      x = newX;
      y = newY;
      
      const screenX = offset_x + x * scale_x;
      const screenY = offset_y - y * scale_y;
      
      if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
        this.ctx.fillRect(screenX, screenY, 1, 1);
      }
    }
    
    this.ctx.restore();
  }

  private generateLevyDragon(width: number, height: number, options: FractalPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, iterations = 12 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * scale;
    this.ctx.lineCap = 'round';
    
    // L-System for Levy dragon
    let axiom = 'F';
    const rules = { 'F': '+F--F+' };
    
    for (let i = 0; i < iterations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    const stepSize = Math.min(width, height) / Math.pow(2, iterations / 2);
    this.drawLSystem(axiom, width / 2, height / 2, 0, stepSize, Math.PI / 4);
    
    this.ctx.restore();
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