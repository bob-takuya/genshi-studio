/**
 * Comprehensive Geometric Pattern Library for Genshi Studio
 * Unified interface for all pattern generators with parameter definitions and presets
 */

import { Color, PatternGeneratorOptions, PatternParameterConfig, CustomPattern } from '../../types/graphics';
import { IslamicPatternGenerator, IslamicPatternType } from './IslamicPatternGenerator';
import { MathematicalTilingGenerator, MathematicalTilingType } from './MathematicalTilingGenerator';
import { CelticKnotGenerator, CelticPatternType } from './CelticKnotGenerator';
import { FractalPatternGenerator, FractalPatternType } from './FractalPatternGenerator';
import { OrganicPatternGenerator, OrganicPatternType } from './OrganicPatternGenerator';

export type AllPatternTypes = 
  | IslamicPatternType 
  | MathematicalTilingType 
  | CelticPatternType 
  | FractalPatternType 
  | OrganicPatternType;

export interface PatternCategory {
  id: string;
  name: string;
  description: string;
  patterns: PatternDefinition[];
  defaultColors: { color1: Color, color2: Color };
}

export interface PatternDefinition {
  id: AllPatternTypes;
  name: string;
  description: string;
  category: string;
  parameters: PatternParameterConfig[];
  presets: PatternPreset[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  performance: 'fast' | 'medium' | 'slow';
  mobileOptimized: boolean;
}

export interface PatternPreset {
  id: string;
  name: string;
  description: string;
  parameters: { [key: string]: any };
  colors?: { color1: Color, color2: Color };
  tags: string[];
}

export interface PatternLibraryOptions {
  enableCache?: boolean;
  maxCacheSize?: number;
  preferredQuality?: 'draft' | 'standard' | 'high';
  mobileOptimizations?: boolean;
  animationSupport?: boolean;
}

export class GeometricPatternLibrary {
  private islamicGenerator: IslamicPatternGenerator;
  private mathematicalGenerator: MathematicalTilingGenerator;
  private celticGenerator: CelticKnotGenerator;
  private fractalGenerator: FractalPatternGenerator;
  private organicGenerator: OrganicPatternGenerator;
  
  private patternDefinitions: Map<AllPatternTypes, PatternDefinition> = new Map();
  private categories: Map<string, PatternCategory> = new Map();
  private options: PatternLibraryOptions;

  constructor(options: PatternLibraryOptions = {}) {
    this.options = {
      enableCache: true,
      maxCacheSize: 100,
      preferredQuality: 'standard',
      mobileOptimizations: true,
      animationSupport: true,
      ...options
    };

    this.islamicGenerator = new IslamicPatternGenerator();
    this.mathematicalGenerator = new MathematicalTilingGenerator();
    this.celticGenerator = new CelticKnotGenerator();
    this.fractalGenerator = new FractalPatternGenerator();
    this.organicGenerator = new OrganicPatternGenerator();

    this.initializePatternLibrary();
  }

  /**
   * Generate a pattern using the unified interface
   */
  generatePattern(
    patternType: AllPatternTypes,
    width: number,
    height: number,
    options: PatternGeneratorOptions & { [key: string]: any }
  ): ImageData {
    const definition = this.patternDefinitions.get(patternType);
    if (!definition) {
      throw new Error(`Unknown pattern type: ${patternType}`);
    }

    // Apply mobile optimizations if enabled
    if (this.options.mobileOptimizations && this.isMobileDevice()) {
      width = Math.min(width, 512);
      height = Math.min(height, 512);
    }

    // Route to appropriate generator
    switch (definition.category) {
      case 'islamic':
        return this.islamicGenerator.generatePattern(
          patternType as IslamicPatternType,
          width,
          height,
          options
        );
      case 'mathematical':
        return this.mathematicalGenerator.generatePattern(
          patternType as MathematicalTilingType,
          width,
          height,
          options
        );
      case 'celtic':
        return this.celticGenerator.generatePattern(
          patternType as CelticPatternType,
          width,
          height,
          options
        );
      case 'fractal':
        return this.fractalGenerator.generatePattern(
          patternType as FractalPatternType,
          width,
          height,
          options
        );
      case 'organic':
        return this.organicGenerator.generatePattern(
          patternType as OrganicPatternType,
          width,
          height,
          options
        );
      default:
        throw new Error(`Unknown pattern category: ${definition.category}`);
    }
  }

  /**
   * Get all available pattern categories
   */
  getCategories(): PatternCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get patterns in a specific category
   */
  getPatternsByCategory(categoryId: string): PatternDefinition[] {
    const category = this.categories.get(categoryId);
    return category ? category.patterns : [];
  }

  /**
   * Get pattern definition by ID
   */
  getPatternDefinition(patternId: AllPatternTypes): PatternDefinition | undefined {
    return this.patternDefinitions.get(patternId);
  }

  /**
   * Get all pattern definitions
   */
  getAllPatterns(): PatternDefinition[] {
    return Array.from(this.patternDefinitions.values());
  }

  /**
   * Search patterns by tags, name, or description
   */
  searchPatterns(query: string, tags?: string[]): PatternDefinition[] {
    const searchTerm = query.toLowerCase();
    const allPatterns = Array.from(this.patternDefinitions.values());
    
    return allPatterns.filter(pattern => {
      const matchesQuery = !query || 
        pattern.name.toLowerCase().includes(searchTerm) ||
        pattern.description.toLowerCase().includes(searchTerm);
      
      const matchesTags = !tags || 
        tags.some(tag => pattern.tags.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  }

  /**
   * Get patterns optimized for mobile devices
   */
  getMobileOptimizedPatterns(): PatternDefinition[] {
    return Array.from(this.patternDefinitions.values())
      .filter(pattern => pattern.mobileOptimized);
  }

  /**
   * Get patterns by performance level
   */
  getPatternsByPerformance(performance: 'fast' | 'medium' | 'slow'): PatternDefinition[] {
    return Array.from(this.patternDefinitions.values())
      .filter(pattern => pattern.performance === performance);
  }

  /**
   * Get patterns by difficulty level
   */
  getPatternsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PatternDefinition[] {
    return Array.from(this.patternDefinitions.values())
      .filter(pattern => pattern.difficulty === difficulty);
  }

  /**
   * Create a custom pattern variation
   */
  createCustomPattern(
    basePattern: AllPatternTypes,
    name: string,
    description: string,
    parameters: { [key: string]: any },
    colors?: { color1: Color, color2: Color }
  ): CustomPattern {
    const definition = this.patternDefinitions.get(basePattern);
    if (!definition) {
      throw new Error(`Unknown base pattern: ${basePattern}`);
    }

    const parameterConfigs = this.buildParameterConfigs(parameters, definition.parameters);
    
    return {
      id: crypto.randomUUID(),
      name,
      description,
      basePattern,
      parameters: parameterConfigs,
      createdAt: new Date(),
      modifiedAt: new Date(),
      tags: ['custom'],
      isPublic: false
    };
  }

  /**
   * Generate pattern with preset
   */
  generatePatternWithPreset(
    patternType: AllPatternTypes,
    presetId: string,
    width: number,
    height: number,
    overrides: { [key: string]: any } = {}
  ): ImageData {
    const definition = this.patternDefinitions.get(patternType);
    if (!definition) {
      throw new Error(`Unknown pattern type: ${patternType}`);
    }

    const preset = definition.presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    const options = {
      ...preset.parameters,
      ...overrides
    };

    // Apply preset colors if available
    if (preset.colors) {
      options.color1 = preset.colors.color1;
      options.color2 = preset.colors.color2;
    }

    return this.generatePattern(patternType, width, height, options);
  }

  /**
   * Get recommended patterns based on usage patterns
   */
  getRecommendedPatterns(
    preferences: {
      categories?: string[];
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      performance?: 'fast' | 'medium' | 'slow';
      tags?: string[];
    } = {}
  ): PatternDefinition[] {
    let patterns = Array.from(this.patternDefinitions.values());

    // Filter by preferences
    if (preferences.categories) {
      patterns = patterns.filter(p => preferences.categories!.includes(p.category));
    }

    if (preferences.difficulty) {
      patterns = patterns.filter(p => p.difficulty === preferences.difficulty);
    }

    if (preferences.performance) {
      patterns = patterns.filter(p => p.performance === preferences.performance);
    }

    if (preferences.tags) {
      patterns = patterns.filter(p => 
        preferences.tags!.some(tag => p.tags.includes(tag))
      );
    }

    // Sort by popularity/rating (placeholder logic)
    return patterns.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.islamicGenerator.clearCache();
    this.mathematicalGenerator.clearCache();
    this.celticGenerator.clearCache();
    this.fractalGenerator.clearCache();
    this.organicGenerator.clearCache();
  }

  /**
   * Destroy the pattern library and clean up resources
   */
  destroy(): void {
    this.islamicGenerator.destroy();
    this.mathematicalGenerator.destroy();
    this.celticGenerator.destroy();
    this.fractalGenerator.destroy();
    this.organicGenerator.destroy();
  }

  private initializePatternLibrary(): void {
    this.initializeIslamicPatterns();
    this.initializeMathematicalPatterns();
    this.initializeCelticPatterns();
    this.initializeFractalPatterns();
    this.initializeOrganicPatterns();
  }

  private initializeIslamicPatterns(): void {
    const category: PatternCategory = {
      id: 'islamic',
      name: 'Islamic Geometric',
      description: 'Traditional Islamic geometric patterns with mathematical precision',
      patterns: [],
      defaultColors: {
        color1: { r: 0.9, g: 0.8, b: 0.7, a: 1 },
        color2: { r: 0.2, g: 0.3, b: 0.6, a: 1 }
      }
    };

    // Eight-fold star pattern
    this.addPattern({
      id: IslamicPatternType.EightFoldStar,
      name: 'Eight-Fold Star',
      description: 'Classic Islamic eight-pointed star with interlacing geometry',
      category: 'islamic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'strokeWidth', type: 'range', min: 1, max: 10, step: 0.5, value: 2, description: 'Line thickness' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Line color' }
      ],
      presets: [
        {
          id: 'classic',
          name: 'Classic',
          description: 'Traditional eight-fold star',
          parameters: { scale: 1, rotation: 0, strokeWidth: 2 },
          tags: ['traditional', 'classic']
        },
        {
          id: 'ornate',
          name: 'Ornate',
          description: 'Detailed ornamental version',
          parameters: { scale: 1.2, rotation: 22.5, strokeWidth: 3 },
          tags: ['ornate', 'decorative']
        }
      ],
      tags: ['islamic', 'geometric', 'star', 'traditional'],
      difficulty: 'intermediate',
      performance: 'medium',
      mobileOptimized: true
    });

    // Twelve-fold star pattern
    this.addPattern({
      id: IslamicPatternType.TwelveFoldStar,
      name: 'Twelve-Fold Star',
      description: 'Complex twelve-pointed star with dodecagonal symmetry',
      category: 'islamic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'strokeWidth', type: 'range', min: 1, max: 10, step: 0.5, value: 2, description: 'Line thickness' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Line color' }
      ],
      presets: [
        {
          id: 'standard',
          name: 'Standard',
          description: 'Standard twelve-fold star',
          parameters: { scale: 1, rotation: 0, strokeWidth: 2 },
          tags: ['standard', 'traditional']
        }
      ],
      tags: ['islamic', 'geometric', 'star', 'complex'],
      difficulty: 'advanced',
      performance: 'medium',
      mobileOptimized: true
    });

    // Girih tiling
    this.addPattern({
      id: IslamicPatternType.GirihTiling,
      name: 'Girih Tiling',
      description: 'Traditional Persian girih tiling system',
      category: 'islamic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'strokeWidth', type: 'range', min: 1, max: 10, step: 0.5, value: 2, description: 'Line thickness' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Line color' }
      ],
      presets: [
        {
          id: 'traditional',
          name: 'Traditional',
          description: 'Classic girih tiling',
          parameters: { scale: 1, rotation: 0, strokeWidth: 2 },
          tags: ['traditional', 'persian']
        }
      ],
      tags: ['islamic', 'girih', 'tiling', 'persian'],
      difficulty: 'advanced',
      performance: 'slow',
      mobileOptimized: false
    });

    category.patterns = [
      this.patternDefinitions.get(IslamicPatternType.EightFoldStar)!,
      this.patternDefinitions.get(IslamicPatternType.TwelveFoldStar)!,
      this.patternDefinitions.get(IslamicPatternType.GirihTiling)!
    ];

    this.categories.set('islamic', category);
  }

  private initializeMathematicalPatterns(): void {
    const category: PatternCategory = {
      id: 'mathematical',
      name: 'Mathematical Tilings',
      description: 'Precise mathematical tiling systems and aperiodic patterns',
      patterns: [],
      defaultColors: {
        color1: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
        color2: { r: 0.2, g: 0.2, b: 0.2, a: 1 }
      }
    };

    // Penrose P2 tiling
    this.addPattern({
      id: MathematicalTilingType.PenroseP2,
      name: 'Penrose P2 Tiling',
      description: 'Aperiodic tiling with kites and darts',
      category: 'mathematical',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'generation', type: 'range', min: 1, max: 6, step: 1, value: 4, description: 'Detail level' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Line color' }
      ],
      presets: [
        {
          id: 'standard',
          name: 'Standard',
          description: 'Standard Penrose tiling',
          parameters: { scale: 1, rotation: 0, generation: 4 },
          tags: ['standard', 'aperiodic']
        }
      ],
      tags: ['mathematical', 'penrose', 'aperiodic', 'tiling'],
      difficulty: 'advanced',
      performance: 'slow',
      mobileOptimized: false
    });

    // Truchet tiles
    this.addPattern({
      id: MathematicalTilingType.TruchetTiles,
      name: 'Truchet Tiles',
      description: 'Classic Truchet tile patterns',
      category: 'mathematical',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'tileSize', type: 'range', min: 10, max: 100, step: 5, value: 40, description: 'Tile size' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Line color' }
      ],
      presets: [
        {
          id: 'classic',
          name: 'Classic',
          description: 'Classic Truchet tiles',
          parameters: { scale: 1, rotation: 0, tileSize: 40 },
          tags: ['classic', 'truchet']
        }
      ],
      tags: ['mathematical', 'truchet', 'tiling', 'classic'],
      difficulty: 'beginner',
      performance: 'fast',
      mobileOptimized: true
    });

    category.patterns = [
      this.patternDefinitions.get(MathematicalTilingType.PenroseP2)!,
      this.patternDefinitions.get(MathematicalTilingType.TruchetTiles)!
    ];

    this.categories.set('mathematical', category);
  }

  private initializeCelticPatterns(): void {
    const category: PatternCategory = {
      id: 'celtic',
      name: 'Celtic Knots',
      description: 'Interlaced Celtic knot patterns and border designs',
      patterns: [],
      defaultColors: {
        color1: { r: 0.9, g: 0.95, b: 0.9, a: 1 },
        color2: { r: 0.2, g: 0.6, b: 0.3, a: 1 }
      }
    };

    // Trinity knot
    this.addPattern({
      id: CelticPatternType.TrinityKnot,
      name: 'Trinity Knot',
      description: 'Classic Celtic trinity knot (triquetra)',
      category: 'celtic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'knotWidth', type: 'range', min: 5, max: 30, step: 1, value: 15, description: 'Knot strand width' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Knot color' }
      ],
      presets: [
        {
          id: 'traditional',
          name: 'Traditional',
          description: 'Traditional trinity knot',
          parameters: { scale: 1, rotation: 0, knotWidth: 15 },
          tags: ['traditional', 'trinity']
        }
      ],
      tags: ['celtic', 'knot', 'trinity', 'traditional'],
      difficulty: 'intermediate',
      performance: 'medium',
      mobileOptimized: true
    });

    // Celtic border
    this.addPattern({
      id: CelticPatternType.CelticBorder,
      name: 'Celtic Border',
      description: 'Interlaced Celtic border pattern',
      category: 'celtic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'borderWidth', type: 'range', min: 20, max: 100, step: 5, value: 40, description: 'Border width' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Border color' }
      ],
      presets: [
        {
          id: 'elegant',
          name: 'Elegant',
          description: 'Elegant Celtic border',
          parameters: { scale: 1, rotation: 0, borderWidth: 40 },
          tags: ['elegant', 'border']
        }
      ],
      tags: ['celtic', 'border', 'decorative', 'frame'],
      difficulty: 'intermediate',
      performance: 'medium',
      mobileOptimized: true
    });

    category.patterns = [
      this.patternDefinitions.get(CelticPatternType.TrinityKnot)!,
      this.patternDefinitions.get(CelticPatternType.CelticBorder)!
    ];

    this.categories.set('celtic', category);
  }

  private initializeFractalPatterns(): void {
    const category: PatternCategory = {
      id: 'fractal',
      name: 'Fractals & Recursive',
      description: 'Self-similar fractal patterns and recursive structures',
      patterns: [],
      defaultColors: {
        color1: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        color2: { r: 0.9, g: 0.9, b: 0.9, a: 1 }
      }
    };

    // Sierpinski triangle
    this.addPattern({
      id: FractalPatternType.SierpinskiTriangle,
      name: 'Sierpinski Triangle',
      description: 'Classic Sierpinski triangle fractal',
      category: 'fractal',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'iterations', type: 'range', min: 1, max: 8, step: 1, value: 6, description: 'Iteration depth' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Triangle color' }
      ],
      presets: [
        {
          id: 'classic',
          name: 'Classic',
          description: 'Classic Sierpinski triangle',
          parameters: { scale: 1, rotation: 0, iterations: 6 },
          tags: ['classic', 'sierpinski']
        }
      ],
      tags: ['fractal', 'sierpinski', 'triangle', 'recursive'],
      difficulty: 'intermediate',
      performance: 'medium',
      mobileOptimized: true
    });

    // Mandelbrot set
    this.addPattern({
      id: FractalPatternType.MandelbrotSet,
      name: 'Mandelbrot Set',
      description: 'The famous Mandelbrot set fractal',
      category: 'fractal',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'maxIterations', type: 'range', min: 50, max: 500, step: 10, value: 100, description: 'Max iterations' },
        { name: 'zoom', type: 'range', min: 0.1, max: 10, step: 0.1, value: 1, description: 'Zoom level' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Inside color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Outside color' }
      ],
      presets: [
        {
          id: 'standard',
          name: 'Standard',
          description: 'Standard Mandelbrot view',
          parameters: { scale: 1, rotation: 0, maxIterations: 100, zoom: 1 },
          tags: ['standard', 'mandelbrot']
        }
      ],
      tags: ['fractal', 'mandelbrot', 'complex', 'mathematical'],
      difficulty: 'advanced',
      performance: 'slow',
      mobileOptimized: false
    });

    category.patterns = [
      this.patternDefinitions.get(FractalPatternType.SierpinskiTriangle)!,
      this.patternDefinitions.get(FractalPatternType.MandelbrotSet)!
    ];

    this.categories.set('fractal', category);
  }

  private initializeOrganicPatterns(): void {
    const category: PatternCategory = {
      id: 'organic',
      name: 'Organic & Natural',
      description: 'Natural and organic patterns inspired by biology and nature',
      patterns: [],
      defaultColors: {
        color1: { r: 0.9, g: 0.9, b: 0.8, a: 1 },
        color2: { r: 0.3, g: 0.5, b: 0.2, a: 1 }
      }
    };

    // Voronoi diagram
    this.addPattern({
      id: OrganicPatternType.VoronoiDiagram,
      name: 'Voronoi Diagram',
      description: 'Natural cell-like Voronoi patterns',
      category: 'organic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'seedCount', type: 'range', min: 10, max: 200, step: 5, value: 50, description: 'Number of seeds' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Background color' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'Cell color' }
      ],
      presets: [
        {
          id: 'cellular',
          name: 'Cellular',
          description: 'Cell-like Voronoi pattern',
          parameters: { scale: 1, rotation: 0, seedCount: 50 },
          tags: ['cellular', 'organic']
        }
      ],
      tags: ['organic', 'voronoi', 'cellular', 'natural'],
      difficulty: 'intermediate',
      performance: 'medium',
      mobileOptimized: true
    });

    // Perlin noise
    this.addPattern({
      id: OrganicPatternType.PerlinNoise,
      name: 'Perlin Noise',
      description: 'Smooth organic noise patterns',
      category: 'organic',
      parameters: [
        { name: 'scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, description: 'Pattern scale' },
        { name: 'rotation', type: 'range', min: 0, max: 360, step: 1, value: 0, description: 'Pattern rotation' },
        { name: 'frequency', type: 'range', min: 0.005, max: 0.1, step: 0.005, value: 0.01, description: 'Noise frequency' },
        { name: 'octaves', type: 'range', min: 1, max: 8, step: 1, value: 4, description: 'Octaves' },
        { name: 'color1', type: 'color', value: category.defaultColors.color1, description: 'Low values' },
        { name: 'color2', type: 'color', value: category.defaultColors.color2, description: 'High values' }
      ],
      presets: [
        {
          id: 'clouds',
          name: 'Clouds',
          description: 'Cloud-like noise pattern',
          parameters: { scale: 1, rotation: 0, frequency: 0.01, octaves: 4 },
          tags: ['clouds', 'smooth']
        }
      ],
      tags: ['organic', 'noise', 'perlin', 'smooth'],
      difficulty: 'beginner',
      performance: 'medium',
      mobileOptimized: true
    });

    category.patterns = [
      this.patternDefinitions.get(OrganicPatternType.VoronoiDiagram)!,
      this.patternDefinitions.get(OrganicPatternType.PerlinNoise)!
    ];

    this.categories.set('organic', category);
  }

  private addPattern(definition: PatternDefinition): void {
    this.patternDefinitions.set(definition.id, definition);
  }

  private buildParameterConfigs(parameters: { [key: string]: any }, templateParams: PatternParameterConfig[]): PatternParameterConfig[] {
    return templateParams.map(template => ({
      ...template,
      value: parameters[template.name] !== undefined ? parameters[template.name] : template.value
    }));
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Export pattern library configuration
   */
  exportLibraryConfig(): any {
    return {
      version: '1.0.0',
      categories: Array.from(this.categories.values()),
      patterns: Array.from(this.patternDefinitions.values()),
      options: this.options
    };
  }

  /**
   * Generate pattern thumbnails for UI
   */
  generateThumbnails(size: number = 64): Map<AllPatternTypes, ImageData> {
    const thumbnails = new Map<AllPatternTypes, ImageData>();
    
    for (const [patternId, definition] of this.patternDefinitions) {
      try {
        const defaultParams = {};
        definition.parameters.forEach(param => {
          defaultParams[param.name] = param.value;
        });
        
        const thumbnail = this.generatePattern(patternId, size, size, defaultParams);
        thumbnails.set(patternId, thumbnail);
      } catch (error) {
        console.warn(`Failed to generate thumbnail for ${patternId}:`, error);
      }
    }
    
    return thumbnails;
  }
}