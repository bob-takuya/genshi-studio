/**
 * Mathematical Pattern Generators for Genshi Studio
 * Implements various mathematical pattern systems including Islamic geometric patterns,
 * Penrose tiling, Truchet tiles, Celtic knots, fractals, and Voronoi diagrams
 */

import { Color, Point, Size } from '../../types/graphics';
import { ParametricPatternEngine, ParameterSet, ParameterType } from './ParametricPatternEngine';

export enum MathematicalPatternType {
  ISLAMIC_GEOMETRIC = 'islamic_geometric',
  PENROSE_TILING = 'penrose_tiling',
  TRUCHET_TILES = 'truchet_tiles',
  CELTIC_KNOT = 'celtic_knot',
  MANDELBROT = 'mandelbrot',
  JULIA_SET = 'julia_set',
  VORONOI = 'voronoi',
  DELAUNAY = 'delaunay',
  LISSAJOUS = 'lissajous',
  SPIROGRAPH = 'spirograph',
  STAR_POLYGON = 'star_polygon',
  GIRIH_TILES = 'girih_tiles'
}

export interface PatternGeometry {
  vertices: Point[];
  edges: [number, number][];
  faces?: number[][];
  colors?: Color[];
  strokeWidths?: number[];
}

export interface TileDefinition {
  id: string;
  geometry: PatternGeometry;
  constraints: {
    edgeTypes: string[];
    matchingRules: Map<string, string[]>;
  };
  symmetries: string[];
}

export class MathematicalPatternGenerators {
  private parameterEngine: ParametricPatternEngine;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private tileDefinitions: Map<string, TileDefinition> = new Map();

  constructor(parameterEngine: ParametricPatternEngine) {
    this.parameterEngine = parameterEngine;
    this.canvas = new OffscreenCanvas(1024, 1024);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D context');
    this.ctx = ctx;
    
    this.initializeTileDefinitions();
    this.registerParameterSets();
  }

  /**
   * Generate Islamic geometric pattern
   */
  generateIslamicGeometric(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const symmetry = parameters.get('symmetry') || 8;
    const complexity = parameters.get('complexity') || 3;
    const scale = parameters.get('scale') || 1.0;
    const rotation = parameters.get('rotation') || 0;
    const primaryColor = parameters.get('primaryColor') || { r: 0.2, g: 0.3, b: 0.8, a: 1.0 };
    const secondaryColor = parameters.get('secondaryColor') || { r: 0.8, g: 0.9, b: 1.0, a: 1.0 };

    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.rotate(rotation * Math.PI / 180);
    this.ctx.scale(scale, scale);

    // Generate star-and-polygon pattern
    this.generateStarPolygonPattern(symmetry, complexity, primaryColor, secondaryColor);

    this.ctx.restore();
    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Generate Penrose tiling pattern
   */
  generatePenroseTiling(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const scale = parameters.get('scale') || 1.0;
    const generations = parameters.get('generations') || 4;
    const showRhombs = parameters.get('showRhombs') || true;
    const showKites = parameters.get('showKites') || true;
    const primaryColor = parameters.get('primaryColor') || { r: 0.9, g: 0.7, b: 0.3, a: 1.0 };
    const secondaryColor = parameters.get('secondaryColor') || { r: 0.3, g: 0.7, b: 0.9, a: 1.0 };

    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const tileSize = 50 * scale;

    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);

    // Generate initial rhombus and kite tiles
    const tiles = this.generatePenroseTiles(generations, tileSize, phi);
    
    for (const tile of tiles) {
      this.drawPenroseTile(tile, primaryColor, secondaryColor, showRhombs, showKites);
    }

    this.ctx.restore();
    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Generate Truchet tiles pattern
   */
  generateTruchetTiles(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const tileSize = parameters.get('tileSize') || 40;
    const curvature = parameters.get('curvature') || 0.5;
    const randomness = parameters.get('randomness') || 0.5;
    const strokeWidth = parameters.get('strokeWidth') || 2;
    const primaryColor = parameters.get('primaryColor') || { r: 0.1, g: 0.1, b: 0.1, a: 1.0 };
    const backgroundColor = parameters.get('backgroundColor') || { r: 0.95, g: 0.95, b: 0.95, a: 1.0 };

    // Fill background
    this.ctx.fillStyle = this.colorToString(backgroundColor);
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = this.colorToString(primaryColor);
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = 'round';

    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        
        // Random tile orientation
        const variant = Math.random() < randomness ? 1 : 0;
        this.drawTruchetTile(x, y, tileSize, curvature, variant);
      }
    }

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Generate Celtic knot pattern
   */
  generateCelticKnot(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const gridSize = parameters.get('gridSize') || 8;
    const strokeWidth = parameters.get('strokeWidth') || 6;
    const knotGap = parameters.get('knotGap') || 2;
    const complexity = parameters.get('complexity') || 0.5;
    const primaryColor = parameters.get('primaryColor') || { r: 0.1, g: 0.4, b: 0.1, a: 1.0 };
    const backgroundColor = parameters.get('backgroundColor') || { r: 0.9, g: 0.9, b: 0.8, a: 1.0 };

    // Fill background
    this.ctx.fillStyle = this.colorToString(backgroundColor);
    this.ctx.fillRect(0, 0, width, height);

    const cellSize = Math.min(width, height) / gridSize;
    const startX = (width - cellSize * gridSize) / 2;
    const startY = (height - cellSize * gridSize) / 2;

    // Generate knot pattern
    const knotGrid = this.generateKnotGrid(gridSize, complexity);
    this.drawCelticKnot(knotGrid, startX, startY, cellSize, strokeWidth, knotGap, primaryColor);

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Generate Mandelbrot set
   */
  generateMandelbrot(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    
    const centerX = parameters.get('centerX') || -0.5;
    const centerY = parameters.get('centerY') || 0.0;
    const zoom = parameters.get('zoom') || 1.0;
    const maxIterations = parameters.get('maxIterations') || 100;
    const colorScheme = parameters.get('colorScheme') || 'rainbow';

    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    const xMin = centerX - (2 / zoom);
    const xMax = centerX + (2 / zoom);
    const yMin = centerY - (2 / zoom);
    const yMax = centerY + (2 / zoom);

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x0 = xMin + (px / width) * (xMax - xMin);
        const y0 = yMin + (py / height) * (yMax - yMin);
        
        const iterations = this.mandelbrotIteration(x0, y0, maxIterations);
        const color = this.mandelbrotColor(iterations, maxIterations, colorScheme);
        
        const index = (py * width + px) * 4;
        data[index] = color.r * 255;
        data[index + 1] = color.g * 255;
        data[index + 2] = color.b * 255;
        data[index + 3] = color.a * 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
    return imageData;
  }

  /**
   * Generate Julia set
   */
  generateJuliaSet(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    
    const cReal = parameters.get('cReal') || -0.7;
    const cImag = parameters.get('cImag') || 0.27015;
    const zoom = parameters.get('zoom') || 1.0;
    const maxIterations = parameters.get('maxIterations') || 100;
    const colorScheme = parameters.get('colorScheme') || 'rainbow';

    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = ((px - width / 2) / (width / 4)) / zoom;
        const y = ((py - height / 2) / (height / 4)) / zoom;
        
        const iterations = this.juliaIteration(x, y, cReal, cImag, maxIterations);
        const color = this.mandelbrotColor(iterations, maxIterations, colorScheme);
        
        const index = (py * width + px) * 4;
        data[index] = color.r * 255;
        data[index + 1] = color.g * 255;
        data[index + 2] = color.b * 255;
        data[index + 3] = color.a * 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
    return imageData;
  }

  /**
   * Generate Voronoi diagram
   */
  generateVoronoi(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const pointCount = parameters.get('pointCount') || 50;
    const showPoints = parameters.get('showPoints') || true;
    const showEdges = parameters.get('showEdges') || true;
    const colorVariation = parameters.get('colorVariation') || 0.3;
    const primaryColor = parameters.get('primaryColor') || { r: 0.6, g: 0.8, b: 0.9, a: 1.0 };

    // Generate random points
    const points: Point[] = [];
    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height
      });
    }

    // Generate Voronoi cells
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        let minDistance = Infinity;
        let closestPoint = 0;

        for (let i = 0; i < points.length; i++) {
          const dx = px - points[i].x;
          const dy = py - points[i].y;
          const distance = dx * dx + dy * dy;

          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = i;
          }
        }

        // Color based on closest point
        const colorVariance = (closestPoint / pointCount) * colorVariation;
        const color = {
          r: Math.max(0, Math.min(1, primaryColor.r + (Math.random() - 0.5) * colorVariance)),
          g: Math.max(0, Math.min(1, primaryColor.g + (Math.random() - 0.5) * colorVariance)),
          b: Math.max(0, Math.min(1, primaryColor.b + (Math.random() - 0.5) * colorVariance)),
          a: 1.0
        };

        const index = (py * width + px) * 4;
        data[index] = color.r * 255;
        data[index + 1] = color.g * 255;
        data[index + 2] = color.b * 255;
        data[index + 3] = color.a * 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Draw points if enabled
    if (showPoints) {
      this.ctx.fillStyle = '#000';
      for (const point of points) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    return imageData;
  }

  /**
   * Generate Girih tiles pattern
   */
  generateGirihTiles(
    width: number,
    height: number,
    parameters: Map<string, any>
  ): ImageData {
    this.resizeCanvas(width, height);
    this.ctx.clearRect(0, 0, width, height);

    const scale = parameters.get('scale') || 1.0;
    const showStrap = parameters.get('showStrap') || true;
    const strapWidth = parameters.get('strapWidth') || 0.1;
    const primaryColor = parameters.get('primaryColor') || { r: 0.8, g: 0.6, b: 0.2, a: 1.0 };
    const secondaryColor = parameters.get('secondaryColor') || { r: 0.2, g: 0.4, b: 0.8, a: 1.0 };

    // Generate the five Girih tiles
    const tiles = this.generateGirihTileSet(scale);
    
    // Arrange tiles in a pattern
    this.arrangeGirihTiles(tiles, width, height, primaryColor, secondaryColor, showStrap, strapWidth);

    return this.ctx.getImageData(0, 0, width, height);
  }

  // Private helper methods

  private resizeCanvas(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  private colorToString(color: Color): string {
    return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
  }

  private generateStarPolygonPattern(
    symmetry: number,
    complexity: number,
    primaryColor: Color,
    secondaryColor: Color
  ): void {
    const radius = 200;
    const innerRadius = radius * 0.6;

    // Draw outer star
    this.ctx.strokeStyle = this.colorToString(primaryColor);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < symmetry; i++) {
      const angle = (i * 2 * Math.PI) / symmetry;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      // Draw inner connections
      for (let j = 1; j <= complexity; j++) {
        const innerAngle = angle + (j * Math.PI) / symmetry;
        const innerX = Math.cos(innerAngle) * innerRadius;
        const innerY = Math.sin(innerAngle) * innerRadius;
        
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(innerX, innerY);
      }
    }

    this.ctx.closePath();
    this.ctx.stroke();

    // Draw inner polygon
    this.ctx.strokeStyle = this.colorToString(secondaryColor);
    this.ctx.beginPath();
    
    for (let i = 0; i < symmetry; i++) {
      const angle = (i * 2 * Math.PI) / symmetry;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private generatePenroseTiles(_generations: number, tileSize: number, _phi: number): any[] {
    // Simplified Penrose tiling generation
    const tiles: any[] = [];
    
    // Start with a few seed tiles
    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10;
      const x = Math.cos(angle) * tileSize;
      const y = Math.sin(angle) * tileSize;
      
      tiles.push({
        type: i % 2 === 0 ? 'kite' : 'dart',
        x: x,
        y: y,
        angle: angle,
        size: tileSize
      });
    }

    return tiles;
  }

  private drawPenroseTile(
    tile: any,
    primaryColor: Color,
    secondaryColor: Color,
    showRhombs: boolean,
    showKites: boolean
  ): void {
    if ((tile.type === 'kite' && !showKites) || (tile.type === 'dart' && !showRhombs)) {
      return;
    }

    const color = tile.type === 'kite' ? primaryColor : secondaryColor;
    this.ctx.fillStyle = this.colorToString(color);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;

    this.ctx.save();
    this.ctx.translate(tile.x, tile.y);
    this.ctx.rotate(tile.angle);

    if (tile.type === 'kite') {
      this.drawKite(tile.size);
    } else {
      this.drawDart(tile.size);
    }

    this.ctx.restore();
  }

  private drawKite(size: number): void {
    const phi = (1 + Math.sqrt(5)) / 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.lineTo(size / phi, size * Math.sin(Math.PI / 5));
    this.ctx.lineTo(0, size * Math.sin(Math.PI / 5) * phi);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawDart(size: number): void {
    const phi = (1 + Math.sqrt(5)) / 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(size / phi, 0);
    this.ctx.lineTo(size / (phi * phi), size * Math.sin(Math.PI / 5));
    this.ctx.lineTo(0, size * Math.sin(Math.PI / 5) / phi);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawTruchetTile(x: number, y: number, size: number, curvature: number, variant: number): void {
    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2);
    
    if (variant === 1) {
      this.ctx.rotate(Math.PI / 2);
    }

    const radius = size * curvature / 2;
    
    this.ctx.beginPath();
    this.ctx.arc(-size / 2, -size / 2, radius, 0, Math.PI / 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(size / 2, size / 2, radius, Math.PI, 3 * Math.PI / 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private generateKnotGrid(gridSize: number, complexity: number): number[][] {
    const grid: number[][] = [];
    
    for (let row = 0; row < gridSize; row++) {
      grid[row] = [];
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = Math.random() < complexity ? 1 : 0;
      }
    }
    
    return grid;
  }

  private drawCelticKnot(
    knotGrid: number[][],
    startX: number,
    startY: number,
    cellSize: number,
    strokeWidth: number,
    knotGap: number,
    primaryColor: Color
  ): void {
    this.ctx.strokeStyle = this.colorToString(primaryColor);
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const gridSize = knotGrid.length;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (knotGrid[row][col] === 1) {
          const x = startX + col * cellSize;
          const y = startY + row * cellSize;
          
          this.drawKnotCell(x, y, cellSize, knotGap);
        }
      }
    }
  }

  private drawKnotCell(x: number, y: number, size: number, gap: number): void {
    const center = size / 2;
    const radius = center - gap;
    
    this.ctx.beginPath();
    this.ctx.arc(x + center, y + center, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private mandelbrotIteration(x0: number, y0: number, maxIterations: number): number {
    let x = 0;
    let y = 0;
    let iteration = 0;
    
    while (x * x + y * y <= 4 && iteration < maxIterations) {
      const temp = x * x - y * y + x0;
      y = 2 * x * y + y0;
      x = temp;
      iteration++;
    }
    
    return iteration;
  }

  private juliaIteration(x: number, y: number, cReal: number, cImag: number, maxIterations: number): number {
    let iteration = 0;
    
    while (x * x + y * y <= 4 && iteration < maxIterations) {
      const temp = x * x - y * y + cReal;
      y = 2 * x * y + cImag;
      x = temp;
      iteration++;
    }
    
    return iteration;
  }

  private mandelbrotColor(iterations: number, maxIterations: number, colorScheme: string): Color {
    if (iterations === maxIterations) {
      return { r: 0, g: 0, b: 0, a: 1 };
    }
    
    const t = iterations / maxIterations;
    
    switch (colorScheme) {
      case 'rainbow':
        return {
          r: Math.sin(t * Math.PI * 2) * 0.5 + 0.5,
          g: Math.sin(t * Math.PI * 2 + Math.PI / 3) * 0.5 + 0.5,
          b: Math.sin(t * Math.PI * 2 + 2 * Math.PI / 3) * 0.5 + 0.5,
          a: 1
        };
      case 'fire':
        return {
          r: Math.min(1, t * 2),
          g: Math.max(0, Math.min(1, t * 2 - 0.5)),
          b: Math.max(0, Math.min(1, t * 2 - 1)),
          a: 1
        };
      default:
        return { r: t, g: t, b: t, a: 1 };
    }
  }

  private generateGirihTileSet(_scale: number): TileDefinition[] {
    // Simplified Girih tile generation
    const tiles: TileDefinition[] = [];
    
    // The five Girih tiles: regular decagon, elongated hexagon, bow tie, rhombus, and kite
    // This is a simplified version - full implementation would require proper geometric calculations
    
    return tiles;
  }

  private arrangeGirihTiles(
    tiles: TileDefinition[],
    width: number,
    height: number,
    primaryColor: Color,
    secondaryColor: Color,
    showStrap: boolean,
    strapWidth: number
  ): void {
    // Simplified arrangement - full implementation would use proper tiling algorithms
    this.ctx.fillStyle = this.colorToString(primaryColor);
    this.ctx.strokeStyle = this.colorToString(secondaryColor);
    this.ctx.lineWidth = 2;
    
    // Draw a simple geometric pattern as placeholder
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  private initializeTileDefinitions(): void {
    // Initialize tile definitions for various patterns
    // This would contain the geometric definitions for Penrose tiles, Girih tiles, etc.
  }

  private registerParameterSets(): void {
    // Register parameter sets for each pattern type
    const islamicGeometricParams: ParameterSet = {
      id: 'islamic_geometric',
      name: 'Islamic Geometric',
      description: 'Parameters for Islamic geometric patterns',
      groups: [
        {
          name: 'Structure',
          description: 'Basic structure parameters',
          order: 1,
          parameters: [
            {
              name: 'symmetry',
              type: ParameterType.NUMBER,
              defaultValue: 8,
              constraints: { min: 3, max: 16, step: 1 },
              description: 'Number of symmetry axes',
              animatable: true
            },
            {
              name: 'complexity',
              type: ParameterType.NUMBER,
              defaultValue: 3,
              constraints: { min: 1, max: 8, step: 1 },
              description: 'Pattern complexity level',
              animatable: true
            }
          ]
        }
      ],
      hierarchies: [],
      constraints: []
    };

    const mandelbrotParams: ParameterSet = {
      id: 'mandelbrot',
      name: 'Mandelbrot Set',
      description: 'Parameters for Mandelbrot set generation',
      groups: [
        {
          name: 'View',
          description: 'View parameters',
          order: 1,
          parameters: [
            {
              name: 'centerX',
              type: ParameterType.NUMBER,
              defaultValue: -0.5,
              constraints: { min: -2, max: 2, step: 0.001 },
              description: 'X coordinate of center',
              animatable: true
            },
            {
              name: 'centerY',
              type: ParameterType.NUMBER,
              defaultValue: 0.0,
              constraints: { min: -2, max: 2, step: 0.001 },
              description: 'Y coordinate of center',
              animatable: true
            },
            {
              name: 'zoom',
              type: ParameterType.NUMBER,
              defaultValue: 1.0,
              constraints: { min: 0.1, max: 1000, step: 0.1 },
              description: 'Zoom level',
              animatable: true
            },
            {
              name: 'maxIterations',
              type: ParameterType.NUMBER,
              defaultValue: 100,
              constraints: { min: 10, max: 1000, step: 10 },
              description: 'Maximum iterations',
              animatable: false
            }
          ]
        }
      ],
      hierarchies: [],
      constraints: []
    };

    this.parameterEngine.registerParameterSet(islamicGeometricParams);
    this.parameterEngine.registerParameterSet(mandelbrotParams);
  }

  destroy(): void {
    // Clean up resources
  }
}