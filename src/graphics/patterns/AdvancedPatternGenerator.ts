/**
 * Advanced Pattern Generator for Genshi Studio
 * Supports animations, custom variations, and pattern combinations
 */

import { 
  Color, 
  PatternGeneratorOptions, 
  CustomPattern, 
  AnimationConfig, 
  AnimationKeyframe, 
  PatternCombination,
  BlendMode
} from '../../types/graphics';
import { CulturalPatternGenerator, PatternType } from './CulturalPatternGenerator';

export class AdvancedPatternGenerator extends CulturalPatternGenerator {
  private animationFrame: number = 0;
  private animationStartTime: number = 0;
  private animationEnabled: boolean = false;
  private animationCallbacks: Map<string, (imageData: ImageData) => void> = new Map();
  private combinerCanvas: OffscreenCanvas;
  private combinerCtx: OffscreenCanvasRenderingContext2D;

  constructor() {
    super();
    this.combinerCanvas = new OffscreenCanvas(1024, 1024);
    const ctx = this.combinerCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create combiner 2D context');
    this.combinerCtx = ctx;
  }

  /**
   * Generate an animated pattern
   */
  generateAnimatedPattern(
    type: PatternType,
    width: number,
    height: number,
    options: PatternGeneratorOptions,
    animation: AnimationConfig,
    onFrame?: (imageData: ImageData) => void
  ): void {
    this.animationEnabled = true;
    this.animationStartTime = Date.now();
    
    if (onFrame) {
      const callbackId = `${type}_${width}_${height}_${Date.now()}`;
      this.animationCallbacks.set(callbackId, onFrame);
      
      const animate = () => {
        if (!this.animationEnabled) return;
        
        const elapsed = (Date.now() - this.animationStartTime) / 1000;
        const progress = this.calculateAnimationProgress(elapsed, animation);
        
        const animatedOptions = this.interpolateOptions(options, animation, progress);
        const imageData = this.generatePattern(type, width, height, animatedOptions);
        
        onFrame(imageData);
        
        this.animationFrame = requestAnimationFrame(animate);
      };
      
      animate();
    }
  }

  /**
   * Stop pattern animation
   */
  stopAnimation(): void {
    this.animationEnabled = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.animationCallbacks.clear();
  }

  /**
   * Generate a custom pattern variation
   */
  generateCustomPattern(
    customPattern: CustomPattern,
    width: number,
    height: number
  ): ImageData {
    const baseType = customPattern.basePattern as PatternType;
    const options = this.buildOptionsFromParameters(customPattern.parameters);
    
    return this.generatePattern(baseType, width, height, options);
  }

  /**
   * Combine multiple patterns
   */
  combinePatterns(
    patterns: PatternCombination,
    width: number,
    height: number
  ): ImageData {
    // Resize combiner canvas if needed
    if (this.combinerCanvas.width !== width || this.combinerCanvas.height !== height) {
      this.combinerCanvas.width = width;
      this.combinerCanvas.height = height;
    }

    // Clear the canvas
    this.combinerCtx.clearRect(0, 0, width, height);
    
    // Set composition mode
    this.combinerCtx.globalCompositeOperation = patterns.compositionMode;

    // Render each pattern
    patterns.patterns.forEach((patternConfig, index) => {
      const patternType = patternConfig.patternId as PatternType;
      const options: PatternGeneratorOptions = {
        scale: patternConfig.scale,
        rotation: patternConfig.rotation,
        color1: { r: 1, g: 1, b: 1, a: 1 }, // Default colors
        color2: { r: 0, g: 0, b: 0, a: 1 },
        opacity: patternConfig.opacity,
        blendMode: patternConfig.blendMode
      };

      const patternData = this.generatePattern(patternType, width, height, options);
      
      // Create temporary canvas for this pattern
      const tempCanvas = new OffscreenCanvas(width, height);
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCtx.putImageData(patternData, 0, 0);
      
      // Apply blend mode and opacity
      this.combinerCtx.globalAlpha = patternConfig.opacity;
      this.combinerCtx.globalCompositeOperation = patternConfig.blendMode as GlobalCompositeOperation;
      
      // Apply offset and draw
      this.combinerCtx.drawImage(
        tempCanvas,
        patternConfig.offset.x,
        patternConfig.offset.y
      );
    });

    // Reset composition settings
    this.combinerCtx.globalAlpha = 1;
    this.combinerCtx.globalCompositeOperation = 'source-over';

    return this.combinerCtx.getImageData(0, 0, width, height);
  }

  /**
   * Create a custom pattern variation
   */
  createCustomVariation(
    basePattern: PatternType,
    name: string,
    description: string,
    customParameters: { [key: string]: any }
  ): CustomPattern {
    const baseOptions = this.getDefaultOptionsForPattern(basePattern);
    const parameters = this.buildParameterConfigsFromOptions(baseOptions, customParameters);
    
    return {
      id: crypto.randomUUID(),
      name,
      description,
      basePattern,
      parameters,
      createdAt: new Date(),
      modifiedAt: new Date(),
      tags: ['custom'],
      isPublic: false
    };
  }

  /**
   * Create pattern variations with different parameter combinations
   */
  generatePatternVariations(
    basePattern: PatternType,
    variationCount: number = 8
  ): CustomPattern[] {
    const variations: CustomPattern[] = [];
    const baseOptions = this.getDefaultOptionsForPattern(basePattern);
    
    for (let i = 0; i < variationCount; i++) {
      const customParams = this.generateRandomVariationParameters(baseOptions);
      const variation = this.createCustomVariation(
        basePattern,
        `${basePattern} Variation ${i + 1}`,
        `Auto-generated variation of ${basePattern} pattern`,
        customParams
      );
      variations.push(variation);
    }
    
    return variations;
  }

  /**
   * Export pattern as different formats
   */
  async exportPattern(
    pattern: CustomPattern,
    width: number,
    height: number,
    format: 'png' | 'svg' | 'json'
  ): Promise<string | Blob> {
    const imageData = this.generateCustomPattern(pattern, width, height);
    
    switch (format) {
      case 'png':
        // Convert ImageData to PNG blob
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create export context');
        
        ctx.putImageData(imageData, 0, 0);
        return await canvas.convertToBlob({ type: 'image/png' });
        
      case 'svg':
        return this.convertToSVG(pattern, width, height);
        
      case 'json':
        return JSON.stringify(pattern, null, 2);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods

  private calculateAnimationProgress(elapsed: number, animation: AnimationConfig): number {
    const cycleTime = elapsed % animation.duration;
    let progress = cycleTime / animation.duration;
    
    switch (animation.direction) {
      case 'reverse':
        progress = 1 - progress;
        break;
      case 'alternate':
        const cycle = Math.floor(elapsed / animation.duration);
        if (cycle % 2 === 1) progress = 1 - progress;
        break;
    }
    
    return this.applyEasing(progress, animation.easing);
  }

  private applyEasing(progress: number, easing: AnimationConfig['easing']): number {
    switch (easing) {
      case 'ease':
        return progress * progress * (3 - 2 * progress);
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }

  private interpolateOptions(
    baseOptions: PatternGeneratorOptions,
    animation: AnimationConfig,
    progress: number
  ): PatternGeneratorOptions {
    const result = { ...baseOptions };
    
    // Find the keyframes to interpolate between
    const keyframes = animation.keyframes.sort((a, b) => a.time - b.time);
    
    if (keyframes.length === 0) return result;
    
    // Find surrounding keyframes
    let beforeFrame = keyframes[0];
    let afterFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        beforeFrame = keyframes[i];
        afterFrame = keyframes[i + 1];
        break;
      }
    }
    
    // Interpolate between keyframes
    const frameProgress = (progress - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
    
    animation.animatedParams.forEach(param => {
      const beforeValue = beforeFrame.parameters[param];
      const afterValue = afterFrame.parameters[param];
      
      if (typeof beforeValue === 'number' && typeof afterValue === 'number') {
        (result as any)[param] = beforeValue + (afterValue - beforeValue) * frameProgress;
      } else if (param === 'color1' || param === 'color2') {
        (result as any)[param] = this.interpolateColor(beforeValue, afterValue, frameProgress);
      }
    });
    
    return result;
  }

  private interpolateColor(color1: Color, color2: Color, progress: number): Color {
    return {
      r: color1.r + (color2.r - color1.r) * progress,
      g: color1.g + (color2.g - color1.g) * progress,
      b: color1.b + (color2.b - color1.b) * progress,
      a: color1.a + (color2.a - color1.a) * progress
    };
  }

  private buildOptionsFromParameters(parameters: any[]): PatternGeneratorOptions {
    const options: PatternGeneratorOptions = {
      scale: 1,
      rotation: 0,
      color1: { r: 0, g: 0, b: 0, a: 1 },
      color2: { r: 1, g: 1, b: 1, a: 1 }
    };

    parameters.forEach(param => {
      (options as any)[param.name] = param.value;
    });

    return options;
  }

  private buildParameterConfigsFromOptions(baseOptions: PatternGeneratorOptions, customParams: any): any[] {
    const configs: any[] = [];
    
    Object.entries({ ...baseOptions, ...customParams }).forEach(([key, value]) => {
      let config: any = {
        name: key,
        value: value
      };
      
      // Set appropriate parameter type based on the key and value
      if (key.includes('color') || key.includes('Color')) {
        config.type = 'color';
      } else if (typeof value === 'boolean') {
        config.type = 'boolean';
      } else if (typeof value === 'number') {
        config.type = 'range';
        config.min = 0;
        config.max = key === 'scale' ? 5 : key === 'rotation' ? 360 : 100;
        config.step = 0.1;
      } else {
        config.type = 'text';
      }
      
      configs.push(config);
    });
    
    return configs;
  }

  private getDefaultOptionsForPattern(pattern: PatternType): PatternGeneratorOptions {
    return {
      scale: 1,
      rotation: 0,
      color1: { r: 0.2, g: 0.3, b: 0.8, a: 1 },
      color2: { r: 0.8, g: 0.9, b: 1, a: 1 },
      complexity: 5
    };
  }

  private generateRandomVariationParameters(baseOptions: PatternGeneratorOptions): any {
    return {
      scale: baseOptions.scale + (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      color1: {
        r: Math.random(),
        g: Math.random(),
        b: Math.random(),
        a: 1
      },
      color2: {
        r: Math.random(),
        g: Math.random(),
        b: Math.random(),
        a: 1
      },
      complexity: Math.floor(Math.random() * 8) + 3
    };
  }

  private convertToSVG(pattern: CustomPattern, width: number, height: number): string {
    // Basic SVG conversion - this would need to be expanded for each pattern type
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="100" height="100">
          <!-- Pattern implementation would go here -->
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#${pattern.id})"/>
    </svg>`;
  }

  destroy(): void {
    this.stopAnimation();
    super.destroy();
  }
}