/**
 * Genshi Studio - WebGL Graphics Engine
 * Main entry point and public API
 */

// Core Graphics Engine
export { GraphicsEngine } from './graphics/engine/GraphicsEngine';
export { Renderer } from './graphics/engine/Renderer';
export { WebGLContextManager } from './graphics/engine/WebGLContext';
export { ShaderManager } from './graphics/engine/ShaderManager';

// Drawing Tools
export { BrushEngine } from './graphics/tools/BrushEngine';

// Pattern Generation
export { 
  CulturalPatternGenerator, 
  PatternType 
} from './graphics/patterns/CulturalPatternGenerator';

// Canvas Management
export { InfiniteCanvas } from './graphics/canvas/InfiniteCanvas';

// React Components
export {
  Canvas,
  Toolbar,
  PatternPanel,
  GenshiStudioApp
} from './components/Canvas';

// Type Definitions
export type {
  Size,
  Point,
  Rectangle,
  Color,
  Transform,
  RenderState,
  Shader,
  Layer,
  DrawingTool,
  BrushSettings,
  PatternGeneratorOptions
} from './types/graphics';

export { BlendMode } from './types/graphics';

// Version
export const VERSION = '0.1.0';

// Default configuration
export const DEFAULT_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    pixelRatio: window.devicePixelRatio || 1
  },
  performance: {
    targetFPS: 60,
    maxMemoryMB: 512,
    spatialIndexCellSize: 256
  },
  brush: {
    defaultSize: 10,
    defaultHardness: 0.8,
    defaultOpacity: 1.0,
    defaultFlow: 1.0,
    defaultSmoothing: 0.5
  },
  patterns: {
    defaultScale: 1.0,
    defaultRotation: 0,
    cacheEnabled: true
  }
};