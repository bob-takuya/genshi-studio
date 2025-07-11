/**
 * Organic and Natural Pattern Generator for Genshi Studio
 * Implements Voronoi diagrams, Delaunay triangulations, reaction-diffusion, and cellular automata
 */

import { PatternGeneratorOptions, Point } from '../../types/graphics';

export enum OrganicPatternType {
  VoronoiDiagram = 'voronoi-diagram',
  DelaunayTriangulation = 'delaunay-triangulation',
  ReactionDiffusion = 'reaction-diffusion',
  CellularAutomata = 'cellular-automata',
  PerlinNoise = 'perlin-noise',
  FlowField = 'flow-field',
  BioMorphs = 'bio-morphs',
  LindenmayerPlant = 'lindenmayer-plant',
  WaveInterference = 'wave-interference',
  DiffusionLimited = 'diffusion-limited',
  GrowthPattern = 'growth-pattern',
  NeuralNetwork = 'neural-network',
  FlockingPattern = 'flocking-pattern',
  CrystalGrowth = 'crystal-growth',
  OrganicTexture = 'organic-texture',
  BioFilm = 'bio-film'
}

export interface OrganicPatternOptions extends PatternGeneratorOptions {
  seedCount?: number;
  density?: number;
  diffusionRate?: number;
  feedRate?: number;
  killRate?: number;
  generations?: number;
  threshold?: number;
  frequency?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  flowStrength?: number;
  particleCount?: number;
  growthRate?: number;
  branchingAngle?: number;
  subdivisions?: number;
  randomness?: number;
  smoothing?: number;
  cellSize?: number;
  ruleSet?: string;
  colorMode?: 'single' | 'gradient' | 'cellular';
}

export class OrganicPatternGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private patternCache: Map<string, ImageData> = new Map();
  private permutation: number[] = [];

  constructor() {
    this.canvas = new OffscreenCanvas(1024, 1024);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;
    this.initializePerlin();
  }

  generatePattern(
    type: OrganicPatternType,
    width: number,
    height: number,
    options: OrganicPatternOptions
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
      case OrganicPatternType.VoronoiDiagram:
        this.generateVoronoiDiagram(width, height, options);
        break;
      case OrganicPatternType.DelaunayTriangulation:
        this.generateDelaunayTriangulation(width, height, options);
        break;
      case OrganicPatternType.ReactionDiffusion:
        this.generateReactionDiffusion(width, height, options);
        break;
      case OrganicPatternType.CellularAutomata:
        this.generateCellularAutomata(width, height, options);
        break;
      case OrganicPatternType.PerlinNoise:
        this.generatePerlinNoise(width, height, options);
        break;
      case OrganicPatternType.FlowField:
        this.generateFlowField(width, height, options);
        break;
      case OrganicPatternType.BioMorphs:
        this.generateBioMorphs(width, height, options);
        break;
      case OrganicPatternType.LindenmayerPlant:
        this.generateLindenmayerPlant(width, height, options);
        break;
      case OrganicPatternType.WaveInterference:
        this.generateWaveInterference(width, height, options);
        break;
      case OrganicPatternType.DiffusionLimited:
        this.generateDiffusionLimited(width, height, options);
        break;
      case OrganicPatternType.GrowthPattern:
        this.generateGrowthPattern(width, height, options);
        break;
      case OrganicPatternType.NeuralNetwork:
        this.generateNeuralNetwork(width, height, options);
        break;
      case OrganicPatternType.FlockingPattern:
        this.generateFlockingPattern(width, height, options);
        break;
      case OrganicPatternType.CrystalGrowth:
        this.generateCrystalGrowth(width, height, options);
        break;
      case OrganicPatternType.OrganicTexture:
        this.generateOrganicTexture(width, height, options);
        break;
      case OrganicPatternType.BioFilm:
        this.generateBioFilm(width, height, options);
        break;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    this.patternCache.set(cacheKey, imageData);
    return imageData;
  }

  private generateVoronoiDiagram(width: number, height: number, options: OrganicPatternOptions): void {
    const { scale = 1, rotation = 0, color1, color2, seedCount = 50 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    // Generate random seed points
    const seeds: Point[] = [];
    for (let i = 0; i < seedCount; i++) {
      seeds.push({
        x: Math.random() * width,
        y: Math.random() * height
      });
    }
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    // For each pixel, find the closest seed
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let closestSeed = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < seeds.length; i++) {
          const dx = x - seeds[i].x;
          const dy = y - seeds[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestSeed = i;
          }
        }
        
        const pixelIndex = (y * width + x) * 4;
        const t = closestSeed / seedCount;
        
        // Interpolate between colors based on seed
        data[pixelIndex] = (color1.r * (1 - t) + color2.r * t) * 255;
        data[pixelIndex + 1] = (color1.g * (1 - t) + color2.g * t) * 255;
        data[pixelIndex + 2] = (color1.b * (1 - t) + color2.b * t) * 255;
        data[pixelIndex + 3] = 255;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateDelaunayTriangulation(width: number, height: number, options: OrganicPatternOptions): void {
    const { scale: _scale = 1, rotation = 0, color1, color2, seedCount = 30 } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 1 * _scale;
    
    // Generate random points
    const points: Point[] = [];
    for (let i = 0; i < seedCount; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height
      });
    }
    
    // Simple Delaunay triangulation (Bowyer-Watson algorithm simplified)
    const triangles = this.delaunayTriangulation(points);
    
    // Draw triangles
    triangles.forEach(triangle => {
      this.ctx.beginPath();
      this.ctx.moveTo(triangle[0].x, triangle[0].y);
      this.ctx.lineTo(triangle[1].x, triangle[1].y);
      this.ctx.lineTo(triangle[2].x, triangle[2].y);
      this.ctx.closePath();
      this.ctx.stroke();
    });
    
    this.ctx.restore();
  }

  private delaunayTriangulation(points: Point[]): Point[][] {
    // Simplified Delaunay triangulation
    const triangles: Point[][] = [];
    
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 1; j < points.length - 1; j++) {
        for (let k = j + 1; k < points.length; k++) {
          const triangle = [points[i], points[j], points[k]];
          
          // Check if triangle is valid (no other points inside circumcircle)
          if (this.isValidDelaunayTriangle(triangle, points)) {
            triangles.push(triangle);
          }
        }
      }
    }
    
    return triangles;
  }

  private isValidDelaunayTriangle(triangle: Point[], allPoints: Point[]): boolean {
    const circumcenter = this.getCircumcenter(triangle);
    const circumradius = this.distance(circumcenter, triangle[0]);
    
    // Check if any other point is inside the circumcircle
    for (const point of allPoints) {
      if (triangle.includes(point)) continue;
      
      if (this.distance(circumcenter, point) < circumradius) {
        return false;
      }
    }
    
    return true;
  }

  private getCircumcenter(triangle: Point[]): Point {
    const [a, b, c] = triangle;
    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    
    if (Math.abs(d) < 1e-10) {
      return { x: 0, y: 0 };
    }
    
    const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
    const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
    
    return { x: ux, y: uy };
  }

  private distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private generateReactionDiffusion(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      diffusionRate = 0.2097,
      feedRate = 0.062,
      killRate = 0.0609,
      generations = 100
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    // Initialize chemical concentrations
    const w = Math.floor(width / 2);
    const h = Math.floor(height / 2);
    
    let A = Array(h).fill(null).map(() => Array(w).fill(1));
    let B = Array(h).fill(null).map(() => Array(w).fill(0));
    
    // Seed some B chemical in the center
    const centerX = Math.floor(w / 2);
    const centerY = Math.floor(h / 2);
    const radius = Math.min(w, h) / 10;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance < radius) {
          B[y][x] = 1;
        }
      }
    }
    
    // Run reaction-diffusion simulation
    for (let generation = 0; generation < generations; generation++) {
      const newA = A.map(row => [...row]);
      const newB = B.map(row => [...row]);
      
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const a = A[y][x];
          const b = B[y][x];
          
          // Laplacian (diffusion)
          const laplacianA = (A[y-1][x] + A[y+1][x] + A[y][x-1] + A[y][x+1] - 4 * a);
          const laplacianB = (B[y-1][x] + B[y+1][x] + B[y][x-1] + B[y][x+1] - 4 * b);
          
          // Reaction-diffusion equations
          const reaction = a * b * b;
          
          newA[y][x] = a + (1.0 * laplacianA - reaction + feedRate * (1 - a));
          newB[y][x] = b + (diffusionRate * laplacianB + reaction - (killRate + feedRate) * b);
          
          // Clamp values
          newA[y][x] = Math.max(0, Math.min(1, newA[y][x]));
          newB[y][x] = Math.max(0, Math.min(1, newB[y][x]));
        }
      }
      
      A = newA;
      B = newB;
    }
    
    // Render result
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridX = Math.floor(x / 2);
        const gridY = Math.floor(y / 2);
        
        if (gridX < w && gridY < h) {
          const intensity = B[gridY][gridX];
          
          const pixelIndex = (y * width + x) * 4;
          data[pixelIndex] = (color1.r * (1 - intensity) + color2.r * intensity) * 255;
          data[pixelIndex + 1] = (color1.g * (1 - intensity) + color2.g * intensity) * 255;
          data[pixelIndex + 2] = (color1.b * (1 - intensity) + color2.b * intensity) * 255;
          data[pixelIndex + 3] = 255;
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateCellularAutomata(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      generations = 5,
      density = 0.45,
      threshold = 4
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const cellSize = Math.max(1, Math.floor(4 * _scale));
    const gridWidth = Math.floor(width / cellSize);
    const gridHeight = Math.floor(height / cellSize);
    
    // Initialize random grid
    let grid = Array(gridHeight).fill(null).map(() => 
      Array(gridWidth).fill(null).map(() => Math.random() < density ? 1 : 0)
    );
    
    // Run cellular automata generations
    for (let gen = 0; gen < generations; gen++) {
      const newGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
      
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const neighbors = this.countNeighbors(grid, x, y);
          
          // Conway's Game of Life rules (modified)
          if (grid[y][x] === 1) {
            newGrid[y][x] = neighbors >= threshold ? 1 : 0;
          } else {
            newGrid[y][x] = neighbors > threshold ? 1 : 0;
          }
        }
      }
      
      grid = newGrid;
    }
    
    // Render grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cellValue = grid[y][x];
        const color = cellValue === 1 ? color2 : color1;
        
        this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    this.ctx.restore();
  }

  private countNeighbors(grid: number[][], x: number, y: number): number {
    let count = 0;
    const height = grid.length;
    const width = grid[0].length;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          count += grid[ny][nx];
        }
      }
    }
    
    return count;
  }

  private generatePerlinNoise(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      frequency = 0.01,
      octaves = 4,
      persistence = 0.5,
      lacunarity = 2.0
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let noise = 0;
        let amplitude = 1;
        let freq = frequency;
        let maxValue = 0;
        
        // Fractal noise (multiple octaves)
        for (let i = 0; i < octaves; i++) {
          noise += this.perlinNoise(x * freq, y * freq) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          freq *= lacunarity;
        }
        
        noise = noise / maxValue;
        const intensity = (noise + 1) / 2; // Normalize to 0-1
        
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = (color1.r * (1 - intensity) + color2.r * intensity) * 255;
        data[pixelIndex + 1] = (color1.g * (1 - intensity) + color2.g * intensity) * 255;
        data[pixelIndex + 2] = (color1.b * (1 - intensity) + color2.b * intensity) * 255;
        data[pixelIndex + 3] = 255;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private initializePerlin(): void {
    // Initialize Perlin noise permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    
    // Duplicate for overflow
    for (let i = 0; i < 256; i++) {
      this.permutation[256 + i] = this.permutation[i];
    }
  }

  private perlinNoise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A];
    const AB = this.permutation[A + 1];
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B];
    const BB = this.permutation[B + 1];
    
    return this.lerp(v, 
      this.lerp(u, this.grad(this.permutation[AA], x, y), this.grad(this.permutation[BA], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[AB], x, y - 1), this.grad(this.permutation[BB], x - 1, y - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private generateFlowField(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      particleCount = 1000,
      flowStrength = 0.5,
      frequency = 0.01
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a * 0.1})`;
    this.ctx.lineWidth = 1;
    
    // Generate flow field particles
    for (let i = 0; i < particleCount; i++) {
      let x = Math.random() * width;
      let y = Math.random() * height;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      
      // Trace particle path
      for (let step = 0; step < 100; step++) {
        const noise = this.perlinNoise(x * frequency, y * frequency);
        const angle = noise * Math.PI * 2 * flowStrength;
        
        const dx = Math.cos(angle) * 2;
        const dy = Math.sin(angle) * 2;
        
        x += dx;
        y += dy;
        
        if (x < 0 || x >= width || y < 0 || y >= height) break;
        
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  private generateBioMorphs(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      branchingAngle = Math.PI / 4,
      growthRate = 0.8,
      subdivisions = 6
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * _scale;
    this.ctx.lineCap = 'round';
    
    const centerX = width / 2;
    const centerY = height / 2;
    const initialLength = Math.min(width, height) / 6;
    
    // Generate organic branching structure
    this.drawBiomorph(centerX, centerY, initialLength, -Math.PI / 2, subdivisions, branchingAngle, growthRate);
    
    this.ctx.restore();
  }

  private drawBiomorph(x: number, y: number, length: number, angle: number, depth: number, branchAngle: number, growthRate: number): void {
    if (depth <= 0 || length < 2) return;
    
    // Add some randomness to the growth
    const randomness = (Math.random() - 0.5) * 0.3;
    const currentAngle = angle + randomness;
    const currentLength = length * (0.8 + Math.random() * 0.4);
    
    const endX = x + Math.cos(currentAngle) * currentLength;
    const endY = y + Math.sin(currentAngle) * currentLength;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Branch
    if (Math.random() > 0.3) {
      const leftAngle = currentAngle - branchAngle;
      const rightAngle = currentAngle + branchAngle;
      const branchLength = currentLength * growthRate;
      
      this.drawBiomorph(endX, endY, branchLength, leftAngle, depth - 1, branchAngle, growthRate);
      this.drawBiomorph(endX, endY, branchLength, rightAngle, depth - 1, branchAngle, growthRate);
    }
    
    // Continue main branch
    this.drawBiomorph(endX, endY, currentLength * growthRate, currentAngle, depth - 1, branchAngle, growthRate);
  }

  private generateLindenmayerPlant(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      generations = 5,
      branchingAngle = Math.PI / 6
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    this.ctx.lineWidth = 2 * _scale;
    this.ctx.lineCap = 'round';
    
    // L-System for plant growth
    let axiom = 'F';
    const rules: { [key: string]: string } = {
      'F': 'F[+F]F[-F][F]',
      '+': '+',
      '-': '-',
      '[': '[',
      ']': ']'
    };
    
    // Apply rules
    for (let i = 0; i < generations; i++) {
      let newAxiom = '';
      for (const char of axiom) {
        newAxiom += rules[char] || char;
      }
      axiom = newAxiom;
    }
    
    // Draw the plant
    this.drawLindenmayerSystem(axiom, width / 2, height * 0.9, -Math.PI / 2, 8 * _scale, branchingAngle);
    
    this.ctx.restore();
  }

  private drawLindenmayerSystem(axiom: string, startX: number, startY: number, startAngle: number, stepSize: number, angleIncrement: number): void {
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

  private generateWaveInterference(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      frequency = 0.02,
      seedCount = 3
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    // Generate wave sources
    const sources: { x: number, y: number, frequency: number, amplitude: number }[] = [];
    for (let i = 0; i < seedCount; i++) {
      sources.push({
        x: Math.random() * width,
        y: Math.random() * height,
        frequency: frequency * (0.5 + Math.random()),
        amplitude: 0.5 + Math.random() * 0.5
      });
    }
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let wave = 0;
        
        // Sum waves from all sources
        for (const source of sources) {
          const distance = Math.sqrt((x - source.x) ** 2 + (y - source.y) ** 2);
          wave += Math.sin(distance * source.frequency) * source.amplitude;
        }
        
        const intensity = (wave + 1) / 2; // Normalize to 0-1
        
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = (color1.r * (1 - intensity) + color2.r * intensity) * 255;
        data[pixelIndex + 1] = (color1.g * (1 - intensity) + color2.g * intensity) * 255;
        data[pixelIndex + 2] = (color1.b * (1 - intensity) + color2.b * intensity) * 255;
        data[pixelIndex + 3] = 255;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateDiffusionLimited(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      particleCount = 5000,
      generations: _generations = 1000
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    
    // Initialize aggregate with seed in center
    const aggregate = new Set<string>();
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    aggregate.add(`${centerX},${centerY}`);
    
    // Add particles one by one
    for (let i = 0; i < particleCount; i++) {
      this.addDiffusionParticle(width, height, aggregate);
    }
    
    // Render aggregate
    aggregate.forEach(pos => {
      const [x, y] = pos.split(',').map(Number);
      this.ctx.fillRect(x, y, 1, 1);
    });
    
    this.ctx.restore();
  }

  private addDiffusionParticle(width: number, height: number, aggregate: Set<string>): void {
    // Start particle at random position on boundary
    let x = Math.random() < 0.5 ? 0 : width - 1;
    let y = Math.random() < 0.5 ? 0 : height - 1;
    
    // Random walk until particle sticks to aggregate
    for (let step = 0; step < 10000; step++) {
      // Random step
      x += Math.floor(Math.random() * 3) - 1;
      y += Math.floor(Math.random() * 3) - 1;
      
      // Boundary check
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return; // Particle escaped
      }
      
      // Check if adjacent to aggregate
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (aggregate.has(`${nx},${ny}`)) {
            aggregate.add(`${x},${y}`);
            return;
          }
        }
      }
    }
  }

  private generateGrowthPattern(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      growthRate = 0.02,
      generations = 200
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    // Initialize growth from center
    const growing = new Set<string>();
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    growing.add(`${centerX},${centerY}`);
    
    // Growth simulation
    for (let gen = 0; gen < generations; gen++) {
      const newGrowing = new Set(growing);
      
      growing.forEach(pos => {
        const [x, y] = pos.split(',').map(Number);
        
        // Try to grow in all directions
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!growing.has(`${nx},${ny}`) && Math.random() < growthRate) {
                newGrowing.add(`${nx},${ny}`);
              }
            }
          }
        }
      });
      
      growing.clear();
      newGrowing.forEach(pos => growing.add(pos));
    }
    
    // Render growth pattern
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    growing.forEach(pos => {
      const [x, y] = pos.split(',').map(Number);
      this.ctx.fillRect(x, y, 1, 1);
    });
    
    this.ctx.restore();
  }

  private generateNeuralNetwork(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      seedCount = 50,
      density = 0.3
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    // Generate nodes
    const nodes: Point[] = [];
    for (let i = 0; i < seedCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height
      });
    }
    
    // Draw connections
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a * 0.3})`;
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = this.distance(nodes[i], nodes[j]);
        const maxDistance = Math.min(width, height) / 4;
        
        if (distance < maxDistance && Math.random() < density) {
          this.ctx.beginPath();
          this.ctx.moveTo(nodes[i].x, nodes[i].y);
          this.ctx.lineTo(nodes[j].x, nodes[j].y);
          this.ctx.stroke();
        }
      }
    }
    
    // Draw nodes
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    nodes.forEach(node => {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 3 * _scale, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  private generateFlockingPattern(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      particleCount = 100,
      generations = 100
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    // Initialize boids
    const boids: { x: number, y: number, vx: number, vy: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      boids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    
    // Trail rendering
    this.ctx.strokeStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a * 0.1})`;
    this.ctx.lineWidth = 1;
    
    // Simulate flocking
    for (let gen = 0; gen < generations; gen++) {
      // Update boids
      for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        
        // Simple flocking behavior
        let avgX = 0, avgY = 0, avgVx = 0, avgVy = 0;
        let neighbors = 0;
        
        for (let j = 0; j < boids.length; j++) {
          if (i === j) continue;
          
          const other = boids[j];
          const distance = Math.sqrt((boid.x - other.x) ** 2 + (boid.y - other.y) ** 2);
          
          if (distance < 50) {
            avgX += other.x;
            avgY += other.y;
            avgVx += other.vx;
            avgVy += other.vy;
            neighbors++;
          }
        }
        
        if (neighbors > 0) {
          avgX /= neighbors;
          avgY /= neighbors;
          avgVx /= neighbors;
          avgVy /= neighbors;
          
          // Alignment and cohesion
          boid.vx += (avgVx - boid.vx) * 0.1;
          boid.vy += (avgVy - boid.vy) * 0.1;
          boid.vx += (avgX - boid.x) * 0.01;
          boid.vy += (avgY - boid.y) * 0.01;
        }
        
        // Limit speed
        const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
        if (speed > 2) {
          boid.vx = (boid.vx / speed) * 2;
          boid.vy = (boid.vy / speed) * 2;
        }
        
        // Draw trail
        this.ctx.beginPath();
        this.ctx.moveTo(boid.x, boid.y);
        
        // Update position
        boid.x += boid.vx;
        boid.y += boid.vy;
        
        // Wrap around edges
        if (boid.x < 0) boid.x = width;
        if (boid.x > width) boid.x = 0;
        if (boid.y < 0) boid.y = height;
        if (boid.y > height) boid.y = 0;
        
        this.ctx.lineTo(boid.x, boid.y);
        this.ctx.stroke();
      }
    }
    
    this.ctx.restore();
  }

  private generateCrystalGrowth(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      generations = 500,
      growthRate = 0.1
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    this.ctx.fillStyle = `rgba(${color1.r * 255}, ${color1.g * 255}, ${color1.b * 255}, ${color1.a})`;
    this.ctx.fillRect(0, 0, width, height);
    
    // Initialize crystal seed
    const crystal = new Set<string>();
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    crystal.add(`${centerX},${centerY}`);
    
    // Growth simulation
    for (let gen = 0; gen < generations; gen++) {
      const candidates: Point[] = [];
      
      // Find growth candidates
      crystal.forEach(pos => {
        const [x, y] = pos.split(',').map(Number);
        
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!crystal.has(`${nx},${ny}`)) {
                candidates.push({ x: nx, y: ny });
              }
            }
          }
        }
      });
      
      // Grow crystal
      candidates.forEach(candidate => {
        if (Math.random() < growthRate) {
          crystal.add(`${candidate.x},${candidate.y}`);
        }
      });
    }
    
    // Render crystal
    this.ctx.fillStyle = `rgba(${color2.r * 255}, ${color2.g * 255}, ${color2.b * 255}, ${color2.a})`;
    crystal.forEach(pos => {
      const [x, y] = pos.split(',').map(Number);
      this.ctx.fillRect(x, y, 1, 1);
    });
    
    this.ctx.restore();
  }

  private generateOrganicTexture(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      frequency = 0.02,
      octaves: _octaves = 3
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Multi-layered organic texture
        const noise1 = this.perlinNoise(x * frequency, y * frequency);
        const noise2 = this.perlinNoise(x * frequency * 2, y * frequency * 2) * 0.5;
        const noise3 = this.perlinNoise(x * frequency * 4, y * frequency * 4) * 0.25;
        
        let combined = noise1 + noise2 + noise3;
        
        // Add some distortion
        const distortX = x + Math.sin(y * frequency * 10) * 10;
        const distortY = y + Math.cos(x * frequency * 10) * 10;
        const distortNoise = this.perlinNoise(distortX * frequency, distortY * frequency) * 0.3;
        
        combined += distortNoise;
        
        const intensity = Math.max(0, Math.min(1, (combined + 1) / 2));
        
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = (color1.r * (1 - intensity) + color2.r * intensity) * 255;
        data[pixelIndex + 1] = (color1.g * (1 - intensity) + color2.g * intensity) * 255;
        data[pixelIndex + 2] = (color1.b * (1 - intensity) + color2.b * intensity) * 255;
        data[pixelIndex + 3] = 255;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  private generateBioFilm(width: number, height: number, options: OrganicPatternOptions): void {
    const { 
      scale: _scale = 1, 
      rotation = 0, 
      color1, 
      color2, 
      density = 0.3,
      generations = 10
    } = options;
    
    this.ctx.save();
    this.applyTransform(width, height, rotation);
    
    const cellSize = Math.max(1, Math.floor(3 * _scale));
    const gridWidth = Math.floor(width / cellSize);
    const gridHeight = Math.floor(height / cellSize);
    
    // Initialize biofilm
    let biofilm = Array(gridHeight).fill(null).map(() => 
      Array(gridWidth).fill(null).map(() => Math.random() < density ? Math.random() : 0)
    );
    
    // Simulate biofilm growth
    for (let gen = 0; gen < generations; gen++) {
      const newBiofilm = biofilm.map(row => [...row]);
      
      for (let y = 1; y < gridHeight - 1; y++) {
        for (let x = 1; x < gridWidth - 1; x++) {
          const current = biofilm[y][x];
          
          // Calculate nutrient diffusion
          let nutrients = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              nutrients += biofilm[y + dy][x + dx];
            }
          }
          nutrients /= 9;
          
          // Growth based on nutrients
          if (current > 0) {
            newBiofilm[y][x] = Math.min(1, current + nutrients * 0.1);
          } else if (nutrients > 0.5) {
            newBiofilm[y][x] = Math.random() * 0.3;
          }
          
          // Decay
          newBiofilm[y][x] *= 0.99;
        }
      }
      
      biofilm = newBiofilm;
    }
    
    // Render biofilm
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const intensity = biofilm[y][x];
        
        const r = (color1.r * (1 - intensity) + color2.r * intensity) * 255;
        const g = (color1.g * (1 - intensity) + color2.g * intensity) * 255;
        const b = (color1.b * (1 - intensity) + color2.b * intensity) * 255;
        
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 255)`;
        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
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