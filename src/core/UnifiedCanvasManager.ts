/**
 * Unified Canvas Manager for Multi-Modal Rendering Pipeline
 * DEVELOPER_INTEGRATION_001 Implementation
 * 
 * Manages simultaneous rendering of all four creative modes
 * with 60fps performance target and seamless mode switching
 */

import { EventEmitter } from 'events';
import { 
  CanvasEntity, 
  CreativeMode, 
  GeometryData,
  VectorRepresentation,
  ParametricRepresentation,
  ProceduralRepresentation,
  OrganicRepresentation,
  StyleProperties
} from '../unified/UnifiedDataModel';

export interface CanvasConfig {
  width: number;
  height: number;
  devicePixelRatio: number;
  enableMultiMode: boolean;
  targetFPS: number;
  enableWebGL: boolean;
  maxEntities: number;
  cullingSizeThreshold: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  width: number;
  height: number;
}

export interface ModeRenderState {
  mode: CreativeMode;
  visible: boolean;
  opacity: number;
  blendMode: string;
  enabled: boolean;
  lastRenderTime: number;
}

export interface RenderTarget {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGLRenderingContext;
  framebuffer?: WebGLFramebuffer;
  texture?: WebGLTexture;
  width: number;
  height: number;
}

export interface RenderStats {
  frameTime: number;
  entitiesRendered: number;
  entitiesCulled: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

export class UnifiedCanvasManager extends EventEmitter {
  private config: CanvasConfig;
  private mainCanvas: HTMLCanvasElement;
  private viewport: ViewportState;
  private modeStates: Map<CreativeMode, ModeRenderState> = new Map();
  private renderTargets: Map<CreativeMode, RenderTarget> = new Map();
  private entities: Map<string, CanvasEntity> = new Map();
  
  // Rendering infrastructure
  private webglContext: WebGLRenderingContext | null = null;
  private shaderPrograms: Map<string, WebGLProgram> = new Map();
  private frameBuffer: WebGLFramebuffer | null = null;
  private isRendering: boolean = false;
  private renderLoop: number | null = null;
  private frameStartTime: number = 0;
  
  // Performance monitoring
  private renderStats: RenderStats;
  private frameHistory: number[] = [];
  private spatialIndex: SpatialIndex;
  private renderCache: RenderCache;
  
  // Mode-specific renderers
  private vectorRenderer: VectorModeRenderer;
  private parametricRenderer: ParametricModeRenderer;
  private proceduralRenderer: ProceduralModeRenderer;
  private organicRenderer: OrganicModeRenderer;
  private compositor: LayerCompositor;

  constructor(mainCanvas: HTMLCanvasElement, config: CanvasConfig) {
    super();
    this.mainCanvas = mainCanvas;
    this.config = config;
    
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0,
      width: config.width,
      height: config.height
    };
    
    this.renderStats = this.initializeRenderStats();
    this.spatialIndex = new SpatialIndex();
    this.renderCache = new RenderCache();
    
    this.initializeModeStates();
    this.initializeRenderers();
  }

  /**
   * Initialize the canvas manager and set up rendering contexts
   */
  async initialize(): Promise<void> {
    try {
      // Set up main canvas
      this.setupMainCanvas();
      
      // Initialize WebGL context if enabled
      if (this.config.enableWebGL) {
        await this.initializeWebGL();
      }
      
      // Create render targets for each mode
      await this.createRenderTargets();
      
      // Initialize mode-specific renderers
      await this.initializeAllRenderers();
      
      // Start the render loop
      this.startRenderLoop();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize canvas manager: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update entity in the canvas manager
   */
  updateEntity(entity: CanvasEntity): void {
    const previousEntity = this.entities.get(entity.id);
    this.entities.set(entity.id, entity);
    
    // Update spatial index
    this.spatialIndex.updateEntity(entity);
    
    // Invalidate render cache for affected regions
    this.renderCache.invalidateEntity(entity.id);
    
    // Mark affected modes for re-render
    this.markModesForRerender(entity, previousEntity);
    
    this.emit('entity:updated', { entityId: entity.id, entity });
  }

  /**
   * Remove entity from canvas
   */
  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      this.entities.delete(entityId);
      this.spatialIndex.removeEntity(entityId);
      this.renderCache.invalidateEntity(entityId);
      this.emit('entity:removed', { entityId });
    }
  }

  /**
   * Update viewport (pan, zoom, rotate)
   */
  updateViewport(viewport: Partial<ViewportState>): void {
    const oldViewport = { ...this.viewport };
    Object.assign(this.viewport, viewport);
    
    // Invalidate render cache if viewport changed significantly
    if (this.hasSignificantViewportChange(oldViewport, this.viewport)) {
      this.renderCache.clear();
    }
    
    this.emit('viewport:changed', { viewport: this.viewport });
  }

  /**
   * Set mode render state
   */
  setModeState(mode: CreativeMode, state: Partial<ModeRenderState>): void {
    const currentState = this.modeStates.get(mode);
    if (currentState) {
      Object.assign(currentState, state);
      this.emit('mode:state-changed', { mode, state: currentState });
    }
  }

  /**
   * Get current render statistics
   */
  getRenderStats(): RenderStats {
    return { ...this.renderStats };
  }

  /**
   * Main render loop function
   */
  private renderFrame(): void {
    if (!this.isRendering) return;
    
    this.frameStartTime = performance.now();
    
    try {
      // 1. Prepare frame
      this.prepareFrame();
      
      // 2. Cull entities outside viewport
      const visibleEntities = this.cullEntities();
      
      // 3. Render each visible mode
      this.renderAllModes(visibleEntities);
      
      // 4. Composite layers
      this.compositeLayers();
      
      // 5. Update statistics
      this.updateRenderStats();
      
      // 6. Emit frame rendered event
      this.emit('frame:rendered', { 
        frameTime: performance.now() - this.frameStartTime,
        entitiesRendered: this.renderStats.entitiesRendered
      });
      
    } catch (error) {
      this.emit('error', new Error(`Render error: ${error.message}`));
    }
    
    // Schedule next frame
    this.renderLoop = requestAnimationFrame(() => this.renderFrame());
  }

  /**
   * Render all enabled modes
   */
  private renderAllModes(entities: CanvasEntity[]): void {
    const enabledModes = Array.from(this.modeStates.entries())
      .filter(([mode, state]) => state.enabled && state.visible)
      .map(([mode]) => mode);
    
    for (const mode of enabledModes) {
      const renderTarget = this.renderTargets.get(mode);
      if (renderTarget) {
        this.renderMode(mode, entities, renderTarget);
      }
    }
  }

  /**
   * Render a specific mode
   */
  private renderMode(mode: CreativeMode, entities: CanvasEntity[], target: RenderTarget): void {
    const modeEntities = entities.filter(entity => this.isEntityRelevantForMode(entity, mode));
    
    switch (mode) {
      case CreativeMode.DRAW:
        this.vectorRenderer.render(modeEntities, target, this.viewport);
        break;
      case CreativeMode.PARAMETRIC:
        this.parametricRenderer.render(modeEntities, target, this.viewport);
        break;
      case CreativeMode.CODE:
        this.proceduralRenderer.render(modeEntities, target, this.viewport);
        break;
      case CreativeMode.GROWTH:
        this.organicRenderer.render(modeEntities, target, this.viewport);
        break;
    }
    
    // Update mode render time
    const modeState = this.modeStates.get(mode);
    if (modeState) {
      modeState.lastRenderTime = performance.now();
    }
  }

  /**
   * Composite all mode layers into final output
   */
  private compositeLayers(): void {
    const enabledModes = Array.from(this.modeStates.entries())
      .filter(([mode, state]) => state.enabled && state.visible)
      .sort(([a], [b]) => this.getModeRenderOrder(a) - this.getModeRenderOrder(b));
    
    const layers = enabledModes.map(([mode, state]) => ({
      renderTarget: this.renderTargets.get(mode)!,
      opacity: state.opacity,
      blendMode: state.blendMode
    }));
    
    this.compositor.composite(layers, this.mainCanvas);
  }

  /**
   * Cull entities outside viewport
   */
  private cullEntities(): CanvasEntity[] {
    const viewportBounds = this.getViewportBounds();
    const visibleEntityIds = this.spatialIndex.query(viewportBounds);
    
    const visibleEntities = visibleEntityIds
      .map(id => this.entities.get(id))
      .filter((entity): entity is CanvasEntity => entity !== undefined);
    
    this.renderStats.entitiesRendered = visibleEntities.length;
    this.renderStats.entitiesCulled = this.entities.size - visibleEntities.length;
    
    return visibleEntities;
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.renderLoop = requestAnimationFrame(() => this.renderFrame());
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop(): void {
    this.isRendering = false;
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  /**
   * Resize canvas and render targets
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    // Resize main canvas
    this.mainCanvas.width = width * this.config.devicePixelRatio;
    this.mainCanvas.height = height * this.config.devicePixelRatio;
    this.mainCanvas.style.width = `${width}px`;
    this.mainCanvas.style.height = `${height}px`;
    
    // Resize render targets
    for (const [mode, target] of this.renderTargets) {
      this.resizeRenderTarget(target, width, height);
    }
    
    // Update viewport
    this.viewport.width = width;
    this.viewport.height = height;
    
    // Clear cache as sizes changed
    this.renderCache.clear();
    
    this.emit('resized', { width, height });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length || 0;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    
    return {
      fps,
      avgFrameTime,
      frameHistory: this.frameHistory.slice(-60), // Last 60 frames
      renderStats: this.renderStats,
      cacheStats: this.renderCache.getStats(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.stopRenderLoop();
    
    // Cleanup WebGL resources
    if (this.webglContext) {
      for (const program of this.shaderPrograms.values()) {
        this.webglContext.deleteProgram(program);
      }
      this.shaderPrograms.clear();
    }
    
    // Cleanup render targets
    for (const target of this.renderTargets.values()) {
      this.cleanupRenderTarget(target);
    }
    this.renderTargets.clear();
    
    this.renderCache.clear();
    this.emit('shutdown');
  }

  // Private helper methods
  private setupMainCanvas(): void {
    this.mainCanvas.width = this.config.width * this.config.devicePixelRatio;
    this.mainCanvas.height = this.config.height * this.config.devicePixelRatio;
    this.mainCanvas.style.width = `${this.config.width}px`;
    this.mainCanvas.style.height = `${this.config.height}px`;
  }

  private async initializeWebGL(): Promise<void> {
    this.webglContext = this.mainCanvas.getContext('webgl2') || this.mainCanvas.getContext('webgl');
    if (!this.webglContext) {
      throw new Error('WebGL not supported');
    }
    
    // Initialize shaders
    await this.loadShaders();
  }

  private async createRenderTargets(): Promise<void> {
    for (const mode of Object.values(CreativeMode)) {
      const target = await this.createRenderTarget(mode);
      this.renderTargets.set(mode, target);
    }
  }

  private async createRenderTarget(mode: CreativeMode): Promise<RenderTarget> {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width * this.config.devicePixelRatio;
    canvas.height = this.config.height * this.config.devicePixelRatio;
    
    const context = this.config.enableWebGL 
      ? canvas.getContext('webgl2') || canvas.getContext('webgl')
      : canvas.getContext('2d');
    
    if (!context) {
      throw new Error(`Failed to create ${this.config.enableWebGL ? 'WebGL' : '2D'} context for ${mode} mode`);
    }
    
    return {
      canvas,
      context: context as any,
      width: canvas.width,
      height: canvas.height
    };
  }

  private initializeModeStates(): void {
    for (const mode of Object.values(CreativeMode)) {
      this.modeStates.set(mode, {
        mode,
        visible: true,
        opacity: 1.0,
        blendMode: 'normal',
        enabled: true,
        lastRenderTime: 0
      });
    }
  }

  private initializeRenderers(): void {
    this.vectorRenderer = new VectorModeRenderer();
    this.parametricRenderer = new ParametricModeRenderer();
    this.proceduralRenderer = new ProceduralModeRenderer();
    this.organicRenderer = new OrganicModeRenderer();
    this.compositor = new LayerCompositor();
  }

  private async initializeAllRenderers(): Promise<void> {
    await Promise.all([
      this.vectorRenderer.initialize(this.webglContext),
      this.parametricRenderer.initialize(this.webglContext),
      this.proceduralRenderer.initialize(this.webglContext),
      this.organicRenderer.initialize(this.webglContext),
      this.compositor.initialize(this.webglContext)
    ]);
  }

  private initializeRenderStats(): RenderStats {
    return {
      frameTime: 0,
      entitiesRendered: 0,
      entitiesCulled: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  private prepareFrame(): void {
    this.renderStats.drawCalls = 0;
    this.renderStats.triangles = 0;
    
    // Clear render targets if needed
    for (const target of this.renderTargets.values()) {
      this.clearRenderTarget(target);
    }
  }

  private updateRenderStats(): void {
    const frameTime = performance.now() - this.frameStartTime;
    this.renderStats.frameTime = frameTime;
    
    // Keep frame history for performance analysis
    this.frameHistory.push(frameTime);
    if (this.frameHistory.length > 120) { // Keep 2 seconds at 60fps
      this.frameHistory.shift();
    }
  }

  private getViewportBounds() {
    return {
      x: this.viewport.x - this.viewport.width / (2 * this.viewport.zoom),
      y: this.viewport.y - this.viewport.height / (2 * this.viewport.zoom),
      width: this.viewport.width / this.viewport.zoom,
      height: this.viewport.height / this.viewport.zoom
    };
  }

  private markModesForRerender(entity: CanvasEntity, previousEntity?: CanvasEntity): void {
    // Mark modes that need re-rendering based on entity changes
    // Implementation would check which representations changed
  }

  private isEntityRelevantForMode(entity: CanvasEntity, mode: CreativeMode): boolean {
    // Check if entity has relevant data for the given mode
    switch (mode) {
      case CreativeMode.DRAW:
        return entity.representations.vector.strokes.length > 0;
      case CreativeMode.PARAMETRIC:
        return entity.representations.parametric.parameters.size > 0;
      case CreativeMode.CODE:
        return entity.representations.procedural.sourceCode.length > 0;
      case CreativeMode.GROWTH:
        return entity.representations.organic.seeds.length > 0;
      default:
        return false;
    }
  }

  private getModeRenderOrder(mode: CreativeMode): number {
    // Define rendering order for layer composition
    const order = {
      [CreativeMode.GROWTH]: 0,
      [CreativeMode.CODE]: 1,
      [CreativeMode.PARAMETRIC]: 2,
      [CreativeMode.DRAW]: 3
    };
    return order[mode] || 999;
  }

  private hasSignificantViewportChange(oldViewport: ViewportState, newViewport: ViewportState): boolean {
    const zoomDiff = Math.abs(oldViewport.zoom - newViewport.zoom) / oldViewport.zoom;
    const posDiff = Math.sqrt(
      Math.pow(oldViewport.x - newViewport.x, 2) + 
      Math.pow(oldViewport.y - newViewport.y, 2)
    );
    
    return zoomDiff > 0.1 || posDiff > 100;
  }

  private resizeRenderTarget(target: RenderTarget, width: number, height: number): void {
    target.canvas.width = width * this.config.devicePixelRatio;
    target.canvas.height = height * this.config.devicePixelRatio;
    target.width = target.canvas.width;
    target.height = target.canvas.height;
  }

  private clearRenderTarget(target: RenderTarget): void {
    if (target.context instanceof CanvasRenderingContext2D) {
      target.context.clearRect(0, 0, target.width, target.height);
    } else if (target.context instanceof WebGLRenderingContext) {
      target.context.clear(target.context.COLOR_BUFFER_BIT);
    }
  }

  private cleanupRenderTarget(target: RenderTarget): void {
    // Cleanup WebGL resources if any
    if (target.texture && this.webglContext) {
      this.webglContext.deleteTexture(target.texture);
    }
    if (target.framebuffer && this.webglContext) {
      this.webglContext.deleteFramebuffer(target.framebuffer);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage
    return this.entities.size * 1024 + // ~1KB per entity
           this.renderTargets.size * this.config.width * this.config.height * 4; // RGBA bytes
  }

  private async loadShaders(): Promise<void> {
    // Load and compile shaders for different modes
    // This would load actual shader code in a real implementation
  }
}

// Supporting classes for rendering
class SpatialIndex {
  private entityBounds: Map<string, any> = new Map();

  updateEntity(entity: CanvasEntity): void {
    this.entityBounds.set(entity.id, entity.geometry.boundingBox);
  }

  removeEntity(entityId: string): void {
    this.entityBounds.delete(entityId);
  }

  query(bounds: any): string[] {
    // Simple implementation - would use quadtree or similar in production
    return Array.from(this.entityBounds.keys());
  }
}

class RenderCache {
  private cache: Map<string, any> = new Map();
  private stats = { hits: 0, misses: 0 };

  invalidateEntity(entityId: string): void {
    // Remove cached data for entity
    for (const key of this.cache.keys()) {
      if (key.includes(entityId)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return { ...this.stats };
  }
}

// Mode-specific renderer classes
abstract class ModeRenderer {
  abstract initialize(webglContext: WebGLRenderingContext | null): Promise<void>;
  abstract render(entities: CanvasEntity[], target: RenderTarget, viewport: ViewportState): void;
}

class VectorModeRenderer extends ModeRenderer {
  async initialize(webglContext: WebGLRenderingContext | null): Promise<void> {}
  render(entities: CanvasEntity[], target: RenderTarget, viewport: ViewportState): void {}
}

class ParametricModeRenderer extends ModeRenderer {
  async initialize(webglContext: WebGLRenderingContext | null): Promise<void> {}
  render(entities: CanvasEntity[], target: RenderTarget, viewport: ViewportState): void {}
}

class ProceduralModeRenderer extends ModeRenderer {
  async initialize(webglContext: WebGLRenderingContext | null): Promise<void> {}
  render(entities: CanvasEntity[], target: RenderTarget, viewport: ViewportState): void {}
}

class OrganicModeRenderer extends ModeRenderer {
  async initialize(webglContext: WebGLRenderingContext | null): Promise<void> {}
  render(entities: CanvasEntity[], target: RenderTarget, viewport: ViewportState): void {}
}

class LayerCompositor {
  async initialize(webglContext: WebGLRenderingContext | null): Promise<void> {}
  
  composite(layers: Array<{renderTarget: RenderTarget, opacity: number, blendMode: string}>, target: HTMLCanvasElement): void {
    const ctx = target.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, target.width, target.height);
    
    for (const layer of layers) {
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(layer.renderTarget.canvas, 0, 0);
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

export default UnifiedCanvasManager;