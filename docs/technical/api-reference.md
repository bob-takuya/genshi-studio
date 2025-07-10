# Genshi Studio API Reference

*Complete developer reference for the Genshi Studio pattern generation system*

## Table of Contents

1. [Core API](#core-api)
2. [Pattern Generators](#pattern-generators)
3. [Animation Engine](#animation-engine)
4. [Graphics Engine](#graphics-engine)
5. [Export System](#export-system)
6. [Storage Services](#storage-services)
7. [Event System](#event-system)
8. [Utility Functions](#utility-functions)

## Core API

### GenshiStudio

Main application entry point and global state manager.

```typescript
class GenshiStudio {
  constructor(options: GenshiStudioOptions);
  
  // Core Methods
  initialize(): Promise<void>;
  destroy(): void;
  getCanvas(): HTMLCanvasElement;
  getRenderer(): Renderer;
  
  // Pattern Management
  createPattern(type: PatternType, params: PatternParams): Pattern;
  applyPattern(pattern: Pattern, target?: RenderTarget): void;
  removePattern(patternId: string): void;
  
  // Animation Control
  startAnimation(): void;
  stopAnimation(): void;
  pauseAnimation(): void;
  seekTo(time: number): void;
  
  // Export Functions
  exportImage(format: ExportFormat, options?: ExportOptions): Promise<Blob>;
  exportAnimation(format: AnimationFormat, options?: AnimationOptions): Promise<Blob>;
  exportData(format: DataFormat): string | object;
}

interface GenshiStudioOptions {
  canvas: HTMLCanvasElement | string;
  width?: number;
  height?: number;
  dpr?: number;
  webgl?: boolean;
  preserveDrawingBuffer?: boolean;
  antialias?: boolean;
  alpha?: boolean;
}
```

### PatternType Enum

```typescript
enum PatternType {
  // Traditional Japanese
  Seigaiha = 'seigaiha',
  Asanoha = 'asanoha',
  Ichimatsu = 'ichimatsu',
  Shippo = 'shippo',
  Kumiko = 'kumiko',
  
  // Celtic Patterns
  CelticKnot = 'celtic-knot',
  CelticSpiral = 'celtic-spiral',
  CelticBraid = 'celtic-braid',
  
  // Islamic Geometric
  IslamicStar = 'islamic-star',
  IslamicTessellation = 'islamic-tessellation',
  Muqarnas = 'muqarnas',
  
  // Mathematical
  Fractal = 'fractal',
  Penrose = 'penrose',
  Voronoi = 'voronoi',
  
  // Organic
  Organic = 'organic',
  Flowing = 'flowing',
  Botanical = 'botanical',
  
  // Custom
  Custom = 'custom'
}
```

## Pattern Generators

### Base Pattern Generator

```typescript
abstract class PatternGenerator {
  abstract generate(params: PatternParams): PatternData;
  
  // Configuration
  getDefaultParams(): PatternParams;
  validateParams(params: PatternParams): boolean;
  getParameterSchema(): ParameterSchema;
  
  // Utilities
  protected createPath(vertices: Point[]): Path2D;
  protected applyTransform(path: Path2D, transform: Transform): Path2D;
  protected generateColors(scheme: ColorScheme): Color[];
}

interface PatternParams {
  // Universal Parameters
  scale: number;          // 0.1 - 10.0
  rotation: number;       // 0 - 360 degrees
  opacity: number;        // 0 - 1.0
  colors: Color[];        // Array of colors
  
  // Pattern-specific parameters
  [key: string]: any;
}

interface PatternData {
  id: string;
  type: PatternType;
  paths: Path2D[];
  colors: Color[];
  bounds: Rectangle;
  metadata: PatternMetadata;
}
```

### Seigaiha Pattern Generator

```typescript
class SeigaihaGenerator extends PatternGenerator {
  generate(params: SeigaihaParams): PatternData;
}

interface SeigaihaParams extends PatternParams {
  waveHeight: number;     // 0.5 - 3.0
  waveFrequency: number;  // 1 - 20
  layerCount: number;     // 1 - 5
  amplitude: number;      // 0.1 - 2.0
  phase: number;          // 0 - 2π
  strokeWidth: number;    // 0.1 - 5.0
  fillStyle: 'solid' | 'gradient' | 'pattern';
}

// Usage Example
const generator = new SeigaihaGenerator();
const pattern = generator.generate({
  scale: 1.5,
  waveHeight: 1.2,
  waveFrequency: 8,
  colors: ['#0066cc', '#66ccff', '#ffffff'],
  strokeWidth: 0.8
});
```

### Asanoha Pattern Generator

```typescript
class AsanohaGenerator extends PatternGenerator {
  generate(params: AsanohaParams): PatternData;
}

interface AsanohaParams extends PatternParams {
  leafSize: number;       // 10 - 100
  spacing: number;        // 1.0 - 3.0
  lineWeight: number;     // 0.5 - 3.0
  symmetry: 3 | 6 | 12;   // Rotational symmetry
  innerDetail: boolean;   // Show inner leaf structure
  strokeStyle: 'solid' | 'dashed' | 'dotted';
}
```

### Celtic Knot Generator

```typescript
class CelticKnotGenerator extends PatternGenerator {
  generate(params: CelticKnotParams): PatternData;
}

interface CelticKnotParams extends PatternParams {
  complexity: number;     // 1 - 10
  strandWidth: number;    // 0.5 - 5.0
  crossingCount: number;  // 4 - 32
  borderStyle: 'none' | 'circle' | 'square' | 'decorative';
  interlacing: boolean;   // Enable over/under weaving
  cornerStyle: 'sharp' | 'rounded' | 'beveled';
}
```

## Animation Engine

### Animation Core

```typescript
class AnimationEngine {
  constructor(canvas: HTMLCanvasElement);
  
  // Animation Control
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  
  // Timeline Management
  setCurrentTime(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setDuration(duration: number): void;
  
  // Animation Creation
  animateParameter(target: string, keyframes: Keyframe[]): Animation;
  morphPattern(from: PatternType, to: PatternType, duration: number): Animation;
  addBreathingEffect(parameter: string, config: BreathingConfig): Animation;
  
  // Modulation
  addPerlinNoise(parameter: string, config: NoiseConfig): void;
  addSpringPhysics(parameter: string, config: SpringConfig): void;
  addAutonomousDrift(parameter: string, config: DriftConfig): void;
}

interface Keyframe {
  time: number;           // 0.0 - 1.0 (normalized time)
  value: any;             // Parameter value at this time
  easing?: EasingFunction; // Interpolation curve
}

type EasingFunction = 
  | 'linear'
  | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'easeInBack' | 'easeOutBack' | 'easeInOutBack'
  | 'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce'
  | 'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic'
  | ((t: number) => number); // Custom function
```

### Pattern Morphing

```typescript
class PatternMorpher {
  constructor();
  
  // Morphing Operations
  morphPatterns(from: Pattern, to: Pattern, progress: number): Pattern;
  createTransition(from: PatternType, to: PatternType, config: TransitionConfig): Transition;
  
  // Geometry Matching
  extractGeometry(pattern: Pattern): GeometryData;
  createCorrespondence(geomA: GeometryData, geomB: GeometryData): CorrespondenceMap;
  interpolateGeometry(geomA: GeometryData, geomB: GeometryData, t: number): GeometryData;
}

interface TransitionConfig {
  duration: number;
  easing: EasingFunction;
  preserveTopology: boolean;
  blendColors: boolean;
  morphingStrategy: 'vertex' | 'path' | 'dual';
}
```

### Organic Modulation

```typescript
class OrganicModulator {
  constructor();
  
  // Noise Modulation
  addPerlinNoise(parameter: string, config: PerlinConfig): void;
  addSimplexNoise(parameter: string, config: SimplexConfig): void;
  addWorleyNoise(parameter: string, config: WorleyConfig): void;
  
  // Physics Simulation
  addSpringSystem(parameter: string, config: SpringConfig): void;
  addDampingEffect(parameter: string, config: DampingConfig): void;
  
  // Organic Behaviors
  addBreathingCycle(parameter: string, config: BreathingConfig): void;
  addHeartbeatPulse(parameter: string, config: HeartbeatConfig): void;
  addGrowthPattern(parameter: string, config: GrowthConfig): void;
}

interface BreathingConfig {
  inhaleTime: number;     // Seconds
  holdTime: number;       // Seconds
  exhaleTime: number;     // Seconds
  restTime: number;       // Seconds
  amplitude: number;      // Modulation amount
  curve: 'natural' | 'linear' | 'sine';
}
```

## Graphics Engine

### Renderer

```typescript
class Renderer {
  constructor(canvas: HTMLCanvasElement, options: RendererOptions);
  
  // Rendering
  render(scene: Scene): void;
  clear(color?: Color): void;
  present(): void;
  
  // State Management
  saveState(): void;
  restoreState(): void;
  setTransform(transform: Transform): void;
  
  // Advanced Rendering
  enablePostProcessing(effects: PostEffect[]): void;
  setRenderQuality(quality: RenderQuality): void;
  enableGPUAcceleration(enabled: boolean): void;
}

interface RendererOptions {
  preferWebGL: boolean;
  antialias: boolean;
  preserveDrawingBuffer: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
  desynchronized: boolean;
}

enum RenderQuality {
  Low = 'low',          // 30fps, reduced effects
  Medium = 'medium',    // 60fps, standard effects
  High = 'high',        // 60fps, all effects
  Ultra = 'ultra'       // 120fps, maximum quality
}
```

### WebGL Renderer

```typescript
class WebGLRenderer extends Renderer {
  constructor(canvas: HTMLCanvasElement, options: WebGLOptions);
  
  // Shader Management
  loadShader(vertex: string, fragment: string): Shader;
  useShader(shader: Shader): void;
  setUniform(name: string, value: any): void;
  
  // Buffer Management
  createBuffer(data: Float32Array, type: BufferType): Buffer;
  bindBuffer(buffer: Buffer): void;
  updateBuffer(buffer: Buffer, data: Float32Array): void;
  
  // Texture Management
  createTexture(width: number, height: number, format: TextureFormat): Texture;
  updateTexture(texture: Texture, data: ImageData): void;
  bindTexture(texture: Texture, unit: number): void;
}
```

### Canvas 2D Renderer

```typescript
class Canvas2DRenderer extends Renderer {
  constructor(canvas: HTMLCanvasElement);
  
  // Drawing Operations
  drawPath(path: Path2D, style: DrawStyle): void;
  drawText(text: string, position: Point, style: TextStyle): void;
  drawImage(image: HTMLImageElement, transform: Transform): void;
  
  // Styling
  setFillStyle(style: FillStyle): void;
  setStrokeStyle(style: StrokeStyle): void;
  setCompositeOperation(operation: CompositeOperation): void;
  
  // Advanced Features
  createPattern(image: HTMLImageElement, repetition: string): CanvasPattern;
  createGradient(type: GradientType, stops: ColorStop[]): CanvasGradient;
  applyFilter(filter: FilterEffect): void;
}
```

## Export System

### Export Manager

```typescript
class ExportManager {
  constructor(renderer: Renderer);
  
  // Static Exports
  exportPNG(options: PNGOptions): Promise<Blob>;
  exportSVG(options: SVGOptions): Promise<string>;
  exportJPEG(options: JPEGOptions): Promise<Blob>;
  exportPDF(options: PDFOptions): Promise<Blob>;
  
  // Animated Exports
  exportGIF(options: GIFOptions): Promise<Blob>;
  exportWebM(options: WebMOptions): Promise<Blob>;
  exportMP4(options: MP4Options): Promise<Blob>;
  
  // Data Exports
  exportJSON(): string;
  exportJavaScript(): string;
  exportCSS(): string;
}

interface PNGOptions {
  width: number;
  height: number;
  dpr: number;
  transparent: boolean;
  compression: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

interface SVGOptions {
  width: number;
  height: number;
  embedFonts: boolean;
  optimizeOutput: boolean;
  includeMetadata: boolean;
}

interface GIFOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  loop: boolean;
  quality: 'low' | 'medium' | 'high';
  dithering: boolean;
}
```

## Storage Services

### Pattern Storage Service

```typescript
class PatternStorageService {
  static savePattern(pattern: CustomPattern): Promise<void>;
  static loadPattern(id: string): Promise<CustomPattern | null>;
  static deletePattern(id: string): Promise<void>;
  static listPatterns(filter?: PatternFilter): Promise<PatternSummary[]>;
  
  // Search and Organization
  static searchPatterns(query: string): Promise<PatternSummary[]>;
  static getPatternsByTag(tag: string): Promise<PatternSummary[]>;
  static getFavoritePatterns(): Promise<PatternSummary[]>;
  
  // Import/Export
  static exportPatterns(ids: string[]): Promise<string>;
  static importPatterns(data: string): Promise<ImportResult>;
  
  // Storage Management
  static getStorageUsage(): StorageUsage;
  static clearStorage(): Promise<void>;
  static optimizeStorage(): Promise<void>;
}

interface CustomPattern {
  id: string;
  name: string;
  description: string;
  type: PatternType;
  parameters: PatternParams;
  animation?: AnimationConfig;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: PatternMetadata;
}

interface PatternSummary {
  id: string;
  name: string;
  type: PatternType;
  thumbnail: string; // Base64 image
  tags: string[];
  createdAt: Date;
}
```

### Project Storage Service

```typescript
class ProjectStorageService {
  static saveProject(project: Project): Promise<void>;
  static loadProject(id: string): Promise<Project | null>;
  static createProject(name: string): Promise<Project>;
  static duplicateProject(id: string, newName: string): Promise<Project>;
  
  // Version Control
  static saveVersion(projectId: string, version: ProjectVersion): Promise<void>;
  static listVersions(projectId: string): Promise<ProjectVersion[]>;
  static restoreVersion(projectId: string, versionId: string): Promise<void>;
  
  // Collaboration
  static shareProject(projectId: string, permissions: SharePermissions): Promise<string>;
  static getSharedProject(shareId: string): Promise<Project | null>;
}

interface Project {
  id: string;
  name: string;
  canvas: CanvasData;
  layers: Layer[];
  patterns: CustomPattern[];
  animations: AnimationData[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

## Event System

### Event Manager

```typescript
class EventManager {
  // Event Registration
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  once(event: string, callback: EventCallback): void;
  
  // Event Emission
  emit(event: string, data?: any): void;
  emitAsync(event: string, data?: any): Promise<any[]>;
  
  // Event Utilities
  listEvents(): string[];
  removeAllListeners(event?: string): void;
}

type EventCallback = (data: any) => void;

// Core Events
interface GenshiEvents {
  'pattern:created': PatternCreatedEvent;
  'pattern:modified': PatternModifiedEvent;
  'pattern:deleted': PatternDeletedEvent;
  'animation:started': AnimationStartedEvent;
  'animation:stopped': AnimationStoppedEvent;
  'animation:frame': AnimationFrameEvent;
  'export:started': ExportStartedEvent;
  'export:completed': ExportCompletedEvent;
  'export:failed': ExportFailedEvent;
  'canvas:resized': CanvasResizedEvent;
  'performance:warning': PerformanceWarningEvent;
}
```

### Gesture Controller

```typescript
class GestureController {
  constructor(canvas: HTMLCanvasElement);
  
  // Gesture Recognition
  enablePinchZoom(enabled: boolean): void;
  enableRotation(enabled: boolean): void;
  enablePanning(enabled: boolean): void;
  
  // Event Handling
  onPinch(callback: (scale: number, center: Point) => void): void;
  onRotate(callback: (angle: number, center: Point) => void): void;
  onPan(callback: (delta: Point) => void): void;
  onTap(callback: (position: Point) => void): void;
  onLongPress(callback: (position: Point) => void): void;
  
  // Physics Response
  enableInertia(enabled: boolean): void;
  setFriction(friction: number): void;
  setBounceBack(enabled: boolean): void;
}
```

## Utility Functions

### Color Utilities

```typescript
namespace ColorUtils {
  // Color Conversion
  function rgbToHsl(rgb: RGB): HSL;
  function hslToRgb(hsl: HSL): RGB;
  function rgbToHex(rgb: RGB): string;
  function hexToRgb(hex: string): RGB;
  
  // Color Manipulation
  function lighten(color: Color, amount: number): Color;
  function darken(color: Color, amount: number): Color;
  function saturate(color: Color, amount: number): Color;
  function desaturate(color: Color, amount: number): Color;
  function rotate(color: Color, degrees: number): Color;
  
  // Color Harmony
  function complementary(color: Color): Color;
  function triadic(color: Color): [Color, Color, Color];
  function analogous(color: Color): Color[];
  function monochromatic(color: Color, count: number): Color[];
  
  // Color Analysis
  function contrast(color1: Color, color2: Color): number;
  function brightness(color: Color): number;
  function isLight(color: Color): boolean;
  function isDark(color: Color): boolean;
}

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
type Color = string | RGB | HSL;
```

### Mathematical Utilities

```typescript
namespace MathUtils {
  // Basic Math
  function clamp(value: number, min: number, max: number): number;
  function lerp(a: number, b: number, t: number): number;
  function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
  function smoothstep(edge0: number, edge1: number, x: number): number;
  
  // Geometry
  function distance(p1: Point, p2: Point): number;
  function angle(p1: Point, p2: Point): number;
  function rotate(point: Point, center: Point, angle: number): Point;
  function scale(point: Point, center: Point, factor: number): Point;
  
  // Noise Functions
  function perlin1D(x: number): number;
  function perlin2D(x: number, y: number): number;
  function perlin3D(x: number, y: number, z: number): number;
  function simplex2D(x: number, y: number): number;
  function simplex3D(x: number, y: number, z: number): number;
  
  // Easing Functions
  function easeInSine(t: number): number;
  function easeOutSine(t: number): number;
  function easeInOutSine(t: number): number;
  function easeInQuad(t: number): number;
  function easeOutQuad(t: number): number;
  function easeInOutQuad(t: number): number;
  // ... additional easing functions
}

interface Point { x: number; y: number; }
interface Rectangle { x: number; y: number; width: number; height: number; }
interface Transform { translate: Point; rotate: number; scale: Point; }
```

### Performance Utilities

```typescript
namespace PerformanceUtils {
  // Monitoring
  function startProfiler(name: string): void;
  function endProfiler(name: string): number;
  function measureFPS(): number;
  function getMemoryUsage(): MemoryUsage;
  
  // Optimization
  function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T;
  function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T;
  function memoize<T extends (...args: any[]) => any>(func: T): T;
  
  // GPU Detection
  function isWebGLSupported(): boolean;
  function getWebGLInfo(): WebGLInfo;
  function getMaxTextureSize(): number;
  function getMaxRenderBufferSize(): number;
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

interface WebGLInfo {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
}
```

## Error Handling

### Custom Exceptions

```typescript
class GenshiError extends Error {
  constructor(message: string, public code: string, public context?: any) {
    super(message);
    this.name = 'GenshiError';
  }
}

class PatternGenerationError extends GenshiError {
  constructor(patternType: PatternType, params: PatternParams, cause: Error) {
    super(`Failed to generate ${patternType} pattern`, 'PATTERN_GENERATION_FAILED', { patternType, params, cause });
  }
}

class AnimationError extends GenshiError {
  constructor(animationType: string, cause: Error) {
    super(`Animation error: ${animationType}`, 'ANIMATION_ERROR', { animationType, cause });
  }
}

class ExportError extends GenshiError {
  constructor(format: string, cause: Error) {
    super(`Export failed for format: ${format}`, 'EXPORT_FAILED', { format, cause });
  }
}

class RenderError extends GenshiError {
  constructor(renderer: string, cause: Error) {
    super(`Rendering error in ${renderer}`, 'RENDER_ERROR', { renderer, cause });
  }
}
```

## Type Definitions

### Core Types

```typescript
// Re-export commonly used types for convenience
export {
  PatternType,
  PatternParams,
  PatternData,
  AnimationConfig,
  ExportFormat,
  RenderQuality,
  Color,
  Point,
  Rectangle,
  Transform
};

// Global type augmentations for better IDE support
declare global {
  interface Window {
    GenshiStudio: typeof GenshiStudio;
    genshi: GenshiStudio;
  }
}
```

## Usage Examples

### Basic Pattern Creation

```typescript
// Initialize Genshi Studio
const studio = new GenshiStudio({
  canvas: 'canvas',
  width: 800,
  height: 600,
  webgl: true
});

await studio.initialize();

// Create a Seigaiha pattern
const seigaiha = studio.createPattern(PatternType.Seigaiha, {
  scale: 1.5,
  waveHeight: 1.2,
  waveFrequency: 8,
  colors: ['#0066cc', '#66ccff'],
  strokeWidth: 0.8
});

// Apply to canvas
studio.applyPattern(seigaiha);
```

### Advanced Animation

```typescript
// Create animation with morphing
const animation = studio.getAnimationEngine();

// Add breathing effect
animation.addBreathingEffect('scale', {
  inhaleTime: 2.0,
  exhaleTime: 2.5,
  amplitude: 0.2
});

// Morph between patterns
animation.morphPattern(PatternType.Seigaiha, PatternType.Asanoha, 3.0);

// Start animation
animation.start();
```

### Pattern Combination

```typescript
// Create multiple patterns
const seigaiha = studio.createPattern(PatternType.Seigaiha, {...});
const asanoha = studio.createPattern(PatternType.Asanoha, {...});

// Combine with blend modes
const combiner = new PatternCombiner();
combiner.addLayer(seigaiha, { opacity: 0.7, blendMode: 'multiply' });
combiner.addLayer(asanoha, { opacity: 0.5, blendMode: 'overlay' });

const combined = combiner.render();
studio.applyPattern(combined);
```

### Export Operations

```typescript
// Export static image
const pngBlob = await studio.exportImage('png', {
  width: 1920,
  height: 1080,
  dpr: 2
});

// Export animated GIF
const gifBlob = await studio.exportAnimation('gif', {
  duration: 5.0,
  fps: 30,
  width: 800,
  height: 600
});

// Export pattern data
const patternData = studio.exportData('json');
```

---

## API Versioning

**Current Version**: 2.0.0  
**Compatibility**: Supports patterns from v1.x with automatic migration  
**Breaking Changes**: See [CHANGELOG.md](../CHANGELOG.md) for version history

## Support

For API questions and examples:
- [GitHub Issues](https://github.com/bob-takuya/genshi-studio/issues)
- [Developer Documentation](../developer/)
- [Example Gallery](../examples/)
- [TypeScript Definitions](https://github.com/bob-takuya/genshi-studio/tree/main/types)