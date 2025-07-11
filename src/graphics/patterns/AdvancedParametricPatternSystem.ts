/**
 * Advanced Parametric Pattern System for Genshi Studio
 * Integrates parameter engine, mathematical generators, and WebGL renderer
 * for high-performance real-time pattern generation
 */

import { Size } from '../../types/graphics';
import { WebGLContextManager } from '../engine/WebGLContext';
import { ParametricPatternEngine, ParameterSet, ParameterType, ParameterAnimation } from './ParametricPatternEngine';
import { MathematicalPatternGenerators, MathematicalPatternType } from './MathematicalPatternGenerators';
import { WebGLParametricRenderer, RenderParameters } from './WebGLParametricRenderer';

export interface PatternPreset {
  id: string;
  name: string;
  description: string;
  patternType: MathematicalPatternType;
  parameters: Map<string, any>;
  animations?: ParameterAnimation[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'geometric' | 'fractal' | 'organic' | 'cultural' | 'abstract';
}

export interface PatternExportOptions {
  format: 'png' | 'svg' | 'webp' | 'json';
  resolution: Size;
  quality?: number;
  includeMetadata?: boolean;
  optimizeForWeb?: boolean;
}

export interface PatternGenerationSession {
  id: string;
  patternType: MathematicalPatternType;
  parameters: Map<string, any>;
  variations: Map<string, any>[];
  history: { timestamp: number; parameters: Map<string, any> }[];
  performance: {
    averageRenderTime: number;
    frameRate: number;
    memoryUsage: number;
  };
}

export class AdvancedParametricPatternSystem {
  private parameterEngine: ParametricPatternEngine;
  private mathGenerators: MathematicalPatternGenerators;
  private webglRenderer: WebGLParametricRenderer;
  private contextManager: WebGLContextManager;
  
  private currentSession: PatternGenerationSession | null = null;
  private presets: Map<string, PatternPreset> = new Map();
  private animationFrame: number = 0;
  private isAnimating: boolean = false;
  private startTime: number = 0;
  
  // Performance optimization
  private renderCache: Map<string, {
    texture: WebGLTexture;
    timestamp: number;
    parameters: Map<string, any>;
  }> = new Map();
  
  // Mobile optimization
  private isMobile: boolean = false;
  private performanceLevel: 'high' | 'medium' | 'low' = 'high';
  
  constructor(canvas: HTMLCanvasElement) {
    this.contextManager = new WebGLContextManager(canvas);
    this.parameterEngine = new ParametricPatternEngine();
    this.mathGenerators = new MathematicalPatternGenerators(this.parameterEngine);
    this.webglRenderer = new WebGLParametricRenderer(this.contextManager, this.parameterEngine);
    
    this.detectMobileDevice();
    this.initializePresets();
    this.setupParameterSets();
    this.startTime = performance.now();
    
    // Setup global parameter change listener
    this.parameterEngine.addGlobalChangeListener(this.onParametersChanged.bind(this));
  }

  /**
   * Initialize a new pattern generation session
   */
  initializeSession(patternType: MathematicalPatternType): PatternGenerationSession {
    const session: PatternGenerationSession = {
      id: crypto.randomUUID(),
      patternType,
      parameters: new Map(),
      variations: [],
      history: [],
      performance: {
        averageRenderTime: 0,
        frameRate: 0,
        memoryUsage: 0
      }
    };
    
    // Initialize with default parameters for pattern type
    this.setDefaultParameters(patternType);
    session.parameters = new Map(this.parameterEngine.getAllParameters());
    
    this.currentSession = session;
    return session;
  }

  /**
   * Generate pattern with current parameters
   */
  generatePattern(
    patternType: MathematicalPatternType,
    resolution: Size,
    useWebGL: boolean = true
  ): ImageData | WebGLTexture {
    if (useWebGL && this.webglRenderer) {
      return this.generatePatternWebGL(patternType, resolution);
    } else {
      return this.generatePatternCanvas(patternType, resolution);
    }
  }

  /**
   * Generate pattern using WebGL for high performance
   */
  generatePatternWebGL(patternType: MathematicalPatternType, resolution: Size): WebGLTexture {
    const parameters = this.buildRenderParameters(patternType, resolution);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(patternType, parameters);
    const cached = this.renderCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 1000) {
      return cached.texture;
    }
    
    // Render pattern
    this.webglRenderer.render(parameters);
    const texture = this.webglRenderer.getTexture();
    
    if (texture) {
      // Cache the result
      this.renderCache.set(cacheKey, {
        texture,
        timestamp: Date.now(),
        parameters: new Map(this.parameterEngine.getAllParameters())
      });
      
      // Update performance metrics
      this.updatePerformanceMetrics();
    }
    
    return texture!;
  }

  /**
   * Generate pattern using canvas fallback
   */
  generatePatternCanvas(patternType: MathematicalPatternType, resolution: Size): ImageData {
    const parameters = this.parameterEngine.getAllParameters();
    
    switch (patternType) {
      case MathematicalPatternType.ISLAMIC_GEOMETRIC:
        return this.mathGenerators.generateIslamicGeometric(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.MANDELBROT:
        return this.mathGenerators.generateMandelbrot(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.JULIA_SET:
        return this.mathGenerators.generateJuliaSet(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.VORONOI:
        return this.mathGenerators.generateVoronoi(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.PENROSE_TILING:
        return this.mathGenerators.generatePenroseTiling(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.TRUCHET_TILES:
        return this.mathGenerators.generateTruchetTiles(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.CELTIC_KNOT:
        return this.mathGenerators.generateCelticKnot(resolution.width, resolution.height, parameters);
      case MathematicalPatternType.GIRIH_TILES:
        return this.mathGenerators.generateGirihTiles(resolution.width, resolution.height, parameters);
      default:
        throw new Error(`Unsupported pattern type: ${patternType}`);
    }
  }

  /**
   * Start real-time pattern animation
   */
  startAnimation(patternType: MathematicalPatternType, resolution: Size): void {
    if (this.isAnimating) {
      this.stopAnimation();
    }
    
    this.isAnimating = true;
    const animate = () => {
      if (!this.isAnimating) return;
      
      this.webglRenderer.renderToCanvas(this.buildRenderParameters(patternType, resolution));
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Stop pattern animation
   */
  stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  /**
   * Generate pattern variations for exploration
   */
  generateVariations(
    patternType: MathematicalPatternType,
    baseParameters: Map<string, any>,
    count: number = 8,
    variationStrength: number = 0.3
  ): Map<string, any>[] {
    const variations = this.parameterEngine.generateVariations(
      baseParameters,
      count,
      variationStrength
    );
    
    // Store variations in current session
    if (this.currentSession) {
      this.currentSession.variations = variations;
    }
    
    return variations;
  }

  /**
   * Apply a preset configuration
   */
  applyPreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) return false;
    
    // Apply preset parameters
    this.parameterEngine.setParameters(preset.parameters);
    
    // Apply animations if present
    if (preset.animations && preset.animations.length > 0) {
      this.parameterEngine.startAnimation(preset.animations);
    }
    
    return true;
  }

  /**
   * Save current configuration as preset
   */
  saveAsPreset(
    name: string,
    description: string,
    patternType: MathematicalPatternType,
    category: PatternPreset['category'],
    difficulty: PatternPreset['difficulty']
  ): string {
    const preset: PatternPreset = {
      id: crypto.randomUUID(),
      name,
      description,
      patternType,
      parameters: new Map(this.parameterEngine.getAllParameters()),
      tags: [],
      category,
      difficulty
    };
    
    this.presets.set(preset.id, preset);
    return preset.id;
  }

  /**
   * Export pattern in various formats
   */
  async exportPattern(
    patternType: MathematicalPatternType,
    options: PatternExportOptions
  ): Promise<Blob | string> {
    const { format, resolution, quality = 0.9, includeMetadata = false } = options;
    
    switch (format) {
      case 'png':
      case 'webp':
        return this.exportRasterImage(patternType, resolution, format, quality);
      case 'svg':
        return this.exportVectorImage(patternType, resolution);
      case 'json':
        return this.exportConfiguration(includeMetadata);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get available presets
   */
  getPresets(): PatternPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: PatternPreset['category']): PatternPreset[] {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  /**
   * Get current session information
   */
  getCurrentSession(): PatternGenerationSession | null {
    return this.currentSession;
  }

  /**
   * Set parameter value
   */
  setParameter(name: string, value: any): boolean {
    const success = this.parameterEngine.setParameter(name, value);
    
    if (success && this.currentSession) {
      // Update session parameters
      this.currentSession.parameters.set(name, value);
      
      // Add to history
      this.currentSession.history.push({
        timestamp: Date.now(),
        parameters: new Map(this.parameterEngine.getAllParameters())
      });
      
      // Keep history size manageable
      if (this.currentSession.history.length > 100) {
        this.currentSession.history.shift();
      }
    }
    
    return success;
  }

  /**
   * Get parameter value
   */
  getParameter(name: string): any {
    return this.parameterEngine.getParameter(name);
  }

  /**
   * Get all current parameters
   */
  getAllParameters(): Map<string, any> {
    return this.parameterEngine.getAllParameters();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    renderer: any;
    system: {
      cacheSize: number;
      memoryUsage: number;
      performanceLevel: string;
    };
  } {
    return {
      renderer: this.webglRenderer.getPerformanceMetrics(),
      system: {
        cacheSize: this.renderCache.size,
        memoryUsage: this.estimateMemoryUsage(),
        performanceLevel: this.performanceLevel
      }
    };
  }

  /**
   * Optimize for mobile performance
   */
  optimizeForMobile(): void {
    this.isMobile = true;
    this.performanceLevel = 'medium';
    
    // Reduce cache size
    this.clearRenderCache();
    
    // Adjust default parameters for mobile
    this.parameterEngine.setParameter('fractalIterations', 50);
    this.parameterEngine.setParameter('voronoiPointCount', 25);
  }

  /**
   * Clear render cache
   */
  clearRenderCache(): void {
    this.renderCache.clear();
  }

  // Private methods

  private detectMobileDevice(): void {
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (this.isMobile) {
      this.performanceLevel = 'medium';
    }
  }

  private initializePresets(): void {
    // Islamic Geometric presets
    this.presets.set('islamic_star_8', {
      id: 'islamic_star_8',
      name: '8-Point Star',
      description: 'Classic 8-point Islamic star pattern',
      patternType: MathematicalPatternType.ISLAMIC_GEOMETRIC,
      parameters: new Map([
        ['symmetry', 8],
        ['complexity', 3],
        ['scale', 1.2],
        ['primaryColor', { r: 0.1, g: 0.3, b: 0.7, a: 1.0 }],
        ['secondaryColor', { r: 0.9, g: 0.8, b: 0.6, a: 1.0 }]
      ]),
      tags: ['islamic', 'geometric', 'star'],
      category: 'geometric',
      difficulty: 'beginner'
    });

    // Mandelbrot presets
    this.presets.set('mandelbrot_classic', {
      id: 'mandelbrot_classic',
      name: 'Classic Mandelbrot',
      description: 'Traditional Mandelbrot set view',
      patternType: MathematicalPatternType.MANDELBROT,
      parameters: new Map([
        ['fractalCenter', { x: -0.5, y: 0.0 }],
        ['fractalZoom', 1.0],
        ['fractalIterations', 100],
        ['colorScheme', 'rainbow']
      ]),
      tags: ['fractal', 'mandelbrot'],
      category: 'fractal',
      difficulty: 'intermediate'
    });

    // Voronoi presets
    this.presets.set('voronoi_organic', {
      id: 'voronoi_organic',
      name: 'Organic Cells',
      description: 'Organic-looking Voronoi diagram',
      patternType: MathematicalPatternType.VORONOI,
      parameters: new Map([
        ['voronoiPointCount', 30],
        ['voronoiSeed', 42],
        ['primaryColor', { r: 0.7, g: 0.9, b: 0.6, a: 1.0 }],
        ['colorVariation', 0.4]
      ]),
      tags: ['voronoi', 'organic', 'cells'],
      category: 'organic',
      difficulty: 'beginner'
    });
  }

  private setupParameterSets(): void {
    // Parameter sets are already registered in the individual generators
    // This method could be used to add additional cross-pattern parameter sets
  }

  private setDefaultParameters(patternType: MathematicalPatternType): void {
    const defaults = this.getDefaultParametersForPattern(patternType);
    this.parameterEngine.setParameters(defaults);
  }

  private getDefaultParametersForPattern(patternType: MathematicalPatternType): Map<string, any> {
    const defaults = new Map<string, any>();
    
    // Common parameters
    defaults.set('scale', 1.0);
    defaults.set('rotation', 0.0);
    defaults.set('offsetX', 0.0);
    defaults.set('offsetY', 0.0);
    defaults.set('primaryColor', { r: 0.2, g: 0.3, b: 0.8, a: 1.0 });
    defaults.set('secondaryColor', { r: 0.8, g: 0.9, b: 1.0, a: 1.0 });
    defaults.set('backgroundColor', { r: 0.95, g: 0.95, b: 0.95, a: 1.0 });
    
    // Pattern-specific parameters
    switch (patternType) {
      case MathematicalPatternType.ISLAMIC_GEOMETRIC:
        defaults.set('symmetry', 8);
        defaults.set('complexity', 3);
        break;
      case MathematicalPatternType.MANDELBROT:
        defaults.set('fractalCenter', { x: -0.5, y: 0.0 });
        defaults.set('fractalZoom', 1.0);
        defaults.set('fractalIterations', 100);
        break;
      case MathematicalPatternType.VORONOI:
        defaults.set('voronoiPointCount', 50);
        defaults.set('voronoiSeed', 0);
        break;
      case MathematicalPatternType.TRUCHET_TILES:
        defaults.set('tileSize', 40);
        defaults.set('curvature', 0.5);
        defaults.set('randomness', 0.5);
        break;
    }
    
    return defaults;
  }

  private buildRenderParameters(patternType: MathematicalPatternType, resolution: Size): RenderParameters {
    const allParams = this.parameterEngine.getAllParameters();
    const currentTime = (performance.now() - this.startTime) / 1000;
    
    return {
      patternType,
      time: currentTime,
      resolution,
      transform: {
        scale: allParams.get('scale') || 1.0,
        rotation: (allParams.get('rotation') || 0.0) * Math.PI / 180,
        offset: {
          x: allParams.get('offsetX') || 0.0,
          y: allParams.get('offsetY') || 0.0
        }
      },
      colors: {
        primary: allParams.get('primaryColor') || { r: 0.2, g: 0.3, b: 0.8, a: 1.0 },
        secondary: allParams.get('secondaryColor') || { r: 0.8, g: 0.9, b: 1.0, a: 1.0 },
        background: allParams.get('backgroundColor') || { r: 0.95, g: 0.95, b: 0.95, a: 1.0 }
      },
      opacity: allParams.get('opacity') || 1.0,
      animation: {
        enabled: allParams.get('animationEnabled') || false,
        speed: allParams.get('animationSpeed') || 1.0,
        amplitude: allParams.get('animationAmplitude') || 0.1
      },
      patternSpecific: allParams
    };
  }

  private generateCacheKey(patternType: MathematicalPatternType, parameters: RenderParameters): string {
    const keyData = {
      patternType,
      resolution: parameters.resolution,
      transform: parameters.transform,
      colors: parameters.colors,
      patternSpecific: Object.fromEntries(parameters.patternSpecific)
    };
    
    return btoa(JSON.stringify(keyData));
  }

  private onParametersChanged(allValues: Map<string, any>): void {
    // Clear cache when parameters change
    this.clearRenderCache();
    
    // Update current session if active
    if (this.currentSession) {
      this.currentSession.parameters = new Map(allValues);
    }
  }

  private updatePerformanceMetrics(): void {
    const metrics = this.webglRenderer.getPerformanceMetrics();
    
    if (this.currentSession) {
      this.currentSession.performance = {
        averageRenderTime: metrics.avgRenderTime,
        frameRate: metrics.fps,
        memoryUsage: this.estimateMemoryUsage()
      };
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in MB
    let usage = 0;
    
    // Cache usage
    usage += this.renderCache.size * 0.1; // Assume 0.1MB per cached texture
    
    // Parameter engine usage
    usage += this.parameterEngine.getAllParameters().size * 0.001; // 1KB per parameter
    
    return usage;
  }

  private async exportRasterImage(
    patternType: MathematicalPatternType,
    resolution: Size,
    format: 'png' | 'webp',
    quality: number
  ): Promise<Blob> {
    // Generate high-resolution pattern
    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }
    
    // Generate pattern using canvas fallback for export
    const imageData = this.generatePatternCanvas(patternType, resolution);
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export image'));
        }
      }, `image/${format}`, quality);
    });
  }

  private exportVectorImage(patternType: MathematicalPatternType, resolution: Size): string {
    // Basic SVG export - would need more sophisticated implementation for each pattern type
    const svg = `<svg width="${resolution.width}" height="${resolution.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#333">
        ${patternType} Pattern (SVG export not fully implemented)
      </text>
    </svg>`;
    
    return svg;
  }

  private exportConfiguration(includeMetadata: boolean): string {
    const config = {
      parameters: Object.fromEntries(this.parameterEngine.getAllParameters()),
      session: includeMetadata ? this.currentSession : null,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAnimation();
    this.parameterEngine.destroy();
    this.mathGenerators.destroy();
    this.webglRenderer.destroy();
    this.contextManager.destroy();
    this.clearRenderCache();
  }
}