/**
 * Comprehensive Geometric Pattern Library - Main Export
 * Provides unified access to all pattern generators and utilities
 */

// Main pattern library
export { GeometricPatternLibrary } from './GeometricPatternLibrary';

// Individual pattern generators
export { IslamicPatternGenerator, IslamicPatternType } from './IslamicPatternGenerator';
export { MathematicalTilingGenerator, MathematicalTilingType } from './MathematicalTilingGenerator';
export { CelticKnotGenerator, CelticPatternType } from './CelticKnotGenerator';
export { FractalPatternGenerator, FractalPatternType } from './FractalPatternGenerator';
export { OrganicPatternGenerator, OrganicPatternType } from './OrganicPatternGenerator';

// Existing generators (for backward compatibility)
export { CulturalPatternGenerator, PatternType } from './CulturalPatternGenerator';
export { AdvancedPatternGenerator } from './AdvancedPatternGenerator';

// Types and interfaces
export type {
  AllPatternTypes,
  PatternCategory,
  PatternDefinition,
  PatternPreset,
  PatternLibraryOptions
} from './GeometricPatternLibrary';

// Utility functions
export const createPatternLibrary = (options = {}) => {
  return new GeometricPatternLibrary(options);
};

export const getAvailablePatterns = () => {
  const library = new GeometricPatternLibrary();
  return library.getAllPatterns();
};

export const getPatternCategories = () => {
  const library = new GeometricPatternLibrary();
  return library.getCategories();
};

export const searchPatterns = (query: string, tags?: string[]) => {
  const library = new GeometricPatternLibrary();
  return library.searchPatterns(query, tags);
};

// Pattern generation helpers
export const generatePattern = (
  patternType: string,
  width: number,
  height: number,
  options: any = {}
) => {
  const library = new GeometricPatternLibrary();
  return library.generatePattern(patternType as any, width, height, options);
};

export const generatePatternWithPreset = (
  patternType: string,
  presetId: string,
  width: number,
  height: number,
  overrides: any = {}
) => {
  const library = new GeometricPatternLibrary();
  return library.generatePatternWithPreset(patternType as any, presetId, width, height, overrides);
};

// Color palettes
export const getIslamicColorPalettes = () => {
  return IslamicPatternGenerator.getTraditionalPalettes();
};

export const getCelticColorPalettes = () => {
  return CelticKnotGenerator.getTraditionalPalettes();
};

// Mobile optimization helpers
export const getMobileOptimizedPatterns = () => {
  const library = new GeometricPatternLibrary({ mobileOptimizations: true });
  return library.getMobileOptimizedPatterns();
};

export const getPerformanceOptimizedPatterns = () => {
  const library = new GeometricPatternLibrary();
  return library.getPatternsByPerformance('fast');
};

// Pattern recommendation system
export const getRecommendedPatterns = (preferences: any = {}) => {
  const library = new GeometricPatternLibrary();
  return library.getRecommendedPatterns(preferences);
};

// Pattern validation
export const validatePatternParameters = (patternType: string, parameters: any) => {
  const library = new GeometricPatternLibrary();
  const definition = library.getPatternDefinition(patternType as any);
  
  if (!definition) {
    throw new Error(`Unknown pattern type: ${patternType}`);
  }
  
  const errors: string[] = [];
  
  definition.parameters.forEach(param => {
    const value = parameters[param.name];
    
    if (value === undefined) {
      errors.push(`Missing parameter: ${param.name}`);
      return;
    }
    
    if (param.type === 'range' && param.min !== undefined && param.max !== undefined) {
      if (value < param.min || value > param.max) {
        errors.push(`Parameter ${param.name} must be between ${param.min} and ${param.max}`);
      }
    }
    
    if (param.type === 'select' && param.options) {
      if (!param.options.includes(value)) {
        errors.push(`Parameter ${param.name} must be one of: ${param.options.join(', ')}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Pattern export utilities
export const exportPatternConfig = (patternType: string, parameters: any) => {
  const library = new GeometricPatternLibrary();
  const definition = library.getPatternDefinition(patternType as any);
  
  if (!definition) {
    throw new Error(`Unknown pattern type: ${patternType}`);
  }
  
  return {
    version: '1.0.0',
    patternType,
    definition,
    parameters,
    generatedAt: new Date().toISOString()
  };
};

// Pattern animation helpers
export const createAnimatedPattern = (
  patternType: string,
  width: number,
  height: number,
  animationConfig: any
) => {
  // This would be implemented to create animated patterns
  // For now, return a placeholder
  return {
    frames: [],
    duration: animationConfig.duration || 1000,
    loop: animationConfig.loop !== false
  };
};

// Pattern combination utilities
export const combinePatterns = (
  pattern1: { type: string, parameters: any },
  pattern2: { type: string, parameters: any },
  blendMode: string = 'multiply'
) => {
  // This would be implemented to combine multiple patterns
  // For now, return a placeholder
  return {
    type: 'combined',
    patterns: [pattern1, pattern2],
    blendMode
  };
};

// Pattern analysis utilities
export const analyzePattern = (patternType: string, parameters: any) => {
  const library = new GeometricPatternLibrary();
  const definition = library.getPatternDefinition(patternType as any);
  
  if (!definition) {
    throw new Error(`Unknown pattern type: ${patternType}`);
  }
  
  return {
    complexity: definition.difficulty,
    performance: definition.performance,
    mobileOptimized: definition.mobileOptimized,
    category: definition.category,
    tags: definition.tags,
    parameterCount: definition.parameters.length,
    presetCount: definition.presets.length
  };
};

// Default export for convenience
export default {
  GeometricPatternLibrary,
  createPatternLibrary,
  generatePattern,
  generatePatternWithPreset,
  getAvailablePatterns,
  getPatternCategories,
  searchPatterns,
  getMobileOptimizedPatterns,
  getPerformanceOptimizedPatterns,
  getRecommendedPatterns,
  validatePatternParameters,
  exportPatternConfig,
  analyzePattern,
  IslamicPatternType,
  MathematicalTilingType,
  CelticPatternType,
  FractalPatternType,
  OrganicPatternType,
  PatternType
};