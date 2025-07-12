/**
 * Performance Optimizer - Multi-mode rendering optimization engine
 * Optimizes real-time rendering performance across all canvas modes
 */

import { CanvasMode } from './UnifiedCanvas';

export interface PerformanceMetrics {
  frameRate: number;
  frameTime: number;
  renderTime: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuMemoryUsage?: number;
  drawCalls: number;
  triangleCount: number;
  textureMemory: number;
  bufferSwitches: number;
  shaderSwitches: number;
}

export interface RenderBudget {
  targetFrameRate: number;
  maxFrameTime: number;
  maxRenderTime: number;
  maxDrawCalls: number;
  maxTriangles: number;
  maxTextureMemory: number;
}

export interface LevelOfDetail {
  level: number;
  distance: number;
  quality: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
  settings: {
    brushDetail: number;
    patternResolution: number;
    growthParticles: number;
    codeHighlighting: boolean;
    antiAliasing: boolean;
    shadows: boolean;
    effects: boolean;
  };
}

export interface OptimizationStrategy {
  name: string;
  priority: number;
  condition: (metrics: PerformanceMetrics, budget: RenderBudget) => boolean;
  apply: (context: OptimizationContext) => Promise<void>;
  revert?: (context: OptimizationContext) => Promise<void>;
  cost: number; // Performance cost of applying this optimization
}

export interface OptimizationContext {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  activeModes: Set<CanvasMode>;
  viewport: { width: number; height: number; pixelRatio: number };
  currentLOD: LevelOfDetail;
  renderTargets: Map<string, WebGLFramebuffer>;
  shaderCache: Map<string, WebGLProgram>;
  textureCache: Map<string, WebGLTexture>;
  bufferPool: WebGLBuffer[];
  metrics: PerformanceMetrics;
}

export interface RegionOfInterest {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  priority: number;
  modes: Set<CanvasMode>;
  needsUpdate: boolean;
  lastUpdate: number;
}

export class PerformanceOptimizer {
  private context: OptimizationContext;
  private budget: RenderBudget;
  private strategies: OptimizationStrategy[] = [];
  private appliedStrategies: Set<string> = new Set();
  private lodLevels: LevelOfDetail[] = [];
  private currentLOD: number = 0;
  
  // Performance monitoring
  private frameHistory: number[] = [];
  private maxFrameHistory = 120; // 2 seconds at 60fps
  private performanceTimer: number | null = null;
  private adaptiveMode: boolean = true;
  
  // Region-based optimization
  private regionsOfInterest: Map<string, RegionOfInterest> = new Map();
  private visibilityBuffer: Uint8Array | null = null;
  private cullingEnabled: boolean = true;
  
  // Memory management
  private memoryPressure: number = 0;
  private lastGCTime: number = 0;
  private gcThreshold: number = 0.8; // 80% memory usage

  constructor(context: OptimizationContext, budget: RenderBudget) {
    this.context = context;
    this.budget = budget;
    
    this.setupLODLevels();
    this.setupOptimizationStrategies();
    this.initializePerformanceMonitoring();
    
    console.log('⚡ Performance Optimizer initialized');
  }

  private setupLODLevels(): void {
    this.lodLevels = [
      {
        level: 0,
        distance: 0,
        quality: 'ultra',
        settings: {
          brushDetail: 1.0,
          patternResolution: 1.0,
          growthParticles: 5000,
          codeHighlighting: true,
          antiAliasing: true,
          shadows: true,
          effects: true
        }
      },
      {
        level: 1,
        distance: 100,
        quality: 'high',
        settings: {
          brushDetail: 0.8,
          patternResolution: 0.8,
          growthParticles: 3000,
          codeHighlighting: true,
          antiAliasing: true,
          shadows: true,
          effects: false
        }
      },
      {
        level: 2,
        distance: 200,
        quality: 'medium',
        settings: {
          brushDetail: 0.6,
          patternResolution: 0.6,
          growthParticles: 1500,
          codeHighlighting: true,
          antiAliasing: false,
          shadows: false,
          effects: false
        }
      },
      {
        level: 3,
        distance: 400,
        quality: 'low',
        settings: {
          brushDetail: 0.4,
          patternResolution: 0.4,
          growthParticles: 500,
          codeHighlighting: false,
          antiAliasing: false,
          shadows: false,
          effects: false
        }
      },
      {
        level: 4,
        distance: 800,
        quality: 'minimal',
        settings: {
          brushDetail: 0.2,
          patternResolution: 0.2,
          growthParticles: 100,
          codeHighlighting: false,
          antiAliasing: false,
          shadows: false,
          effects: false
        }
      }
    ];
    
    this.context.currentLOD = this.lodLevels[0];
  }

  private setupOptimizationStrategies(): void {
    // Frustum culling strategy
    this.strategies.push({
      name: 'frustum_culling',
      priority: 100,
      condition: (metrics) => metrics.drawCalls > this.budget.maxDrawCalls * 0.7,
      apply: async (context) => {
        await this.enableFrustumCulling(context);
      },
      revert: async (context) => {
        await this.disableFrustumCulling(context);
      },
      cost: 5
    });

    // Occlusion culling strategy
    this.strategies.push({
      name: 'occlusion_culling',
      priority: 90,
      condition: (metrics) => metrics.drawCalls > this.budget.maxDrawCalls * 0.8,
      apply: async (context) => {
        await this.enableOcclusionCulling(context);
      },
      cost: 10
    });

    // Level of detail reduction
    this.strategies.push({
      name: 'lod_reduction',
      priority: 80,
      condition: (metrics, budget) => metrics.frameTime > budget.maxFrameTime,
      apply: async (context) => {
        await this.reduceLevelOfDetail(context);
      },
      revert: async (context) => {
        await this.increaseLevelOfDetail(context);
      },
      cost: 15
    });

    // Texture atlas optimization
    this.strategies.push({
      name: 'texture_atlas',
      priority: 70,
      condition: (metrics) => metrics.textureMemory > this.budget.maxTextureMemory * 0.7,
      apply: async (context) => {
        await this.optimizeTextureAtlas(context);
      },
      cost: 20
    });

    // Batch rendering optimization
    this.strategies.push({
      name: 'batch_rendering',
      priority: 85,
      condition: (metrics) => metrics.drawCalls > this.budget.maxDrawCalls * 0.6,
      apply: async (context) => {
        await this.enableBatchRendering(context);
      },
      cost: 25
    });

    // Mode-specific optimizations
    this.strategies.push({
      name: 'mode_specific_culling',
      priority: 75,
      condition: (metrics) => context.activeModes.size > 2,
      apply: async (context) => {
        await this.enableModeSpecificCulling(context);
      },
      cost: 12
    });

    // Memory pressure optimization
    this.strategies.push({
      name: 'memory_cleanup',
      priority: 95,
      condition: (metrics) => this.memoryPressure > 0.7,
      apply: async (context) => {
        await this.performMemoryCleanup(context);
      },
      cost: 30
    });

    // Temporal caching
    this.strategies.push({
      name: 'temporal_caching',
      priority: 60,
      condition: (metrics) => metrics.renderTime > this.budget.maxRenderTime * 0.8,
      apply: async (context) => {
        await this.enableTemporalCaching(context);
      },
      cost: 40
    });

    // Sort by priority
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  private initializePerformanceMonitoring(): void {
    // Start performance monitoring loop
    this.performanceTimer = window.setInterval(() => {
      this.updatePerformanceMetrics();
      
      if (this.adaptiveMode) {
        this.adaptPerformance();
      }
    }, 100); // Check every 100ms
  }

  private updatePerformanceMetrics(): void {
    // Update frame rate history
    const currentTime = performance.now();
    this.frameHistory.push(currentTime);
    
    if (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift();
    }
    
    // Calculate average frame rate
    if (this.frameHistory.length > 1) {
      const duration = this.frameHistory[this.frameHistory.length - 1] - this.frameHistory[0];
      this.context.metrics.frameRate = (this.frameHistory.length - 1) / (duration / 1000);
      this.context.metrics.frameTime = duration / (this.frameHistory.length - 1);
    }
    
    // Update memory pressure
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.memoryPressure = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      this.context.metrics.memoryUsage = memInfo.usedJSHeapSize;
    }
  }

  private adaptPerformance(): void {
    const metrics = this.context.metrics;
    const budget = this.budget;
    
    // Check if we need to apply optimizations
    const needsOptimization = 
      metrics.frameRate < budget.targetFrameRate * 0.9 ||
      metrics.frameTime > budget.maxFrameTime ||
      metrics.renderTime > budget.maxRenderTime ||
      this.memoryPressure > this.gcThreshold;
    
    if (needsOptimization) {
      this.applyOptimizations();
    } else {
      // Check if we can revert some optimizations
      this.revertOptimizations();
    }
  }

  private async applyOptimizations(): Promise<void> {
    for (const strategy of this.strategies) {
      if (this.appliedStrategies.has(strategy.name)) continue;
      
      if (strategy.condition(this.context.metrics, this.budget)) {
        try {
          await strategy.apply(this.context);
          this.appliedStrategies.add(strategy.name);
          console.log(`⚡ Applied optimization: ${strategy.name}`);
          
          // Only apply one optimization per frame to avoid instability
          break;
        } catch (error) {
          console.error(`❌ Failed to apply optimization ${strategy.name}:`, error);
        }
      }
    }
  }

  private async revertOptimizations(): Promise<void> {
    // Only revert if performance is stable
    const metrics = this.context.metrics;
    const budget = this.budget;
    
    if (metrics.frameRate > budget.targetFrameRate * 1.1 && 
        metrics.frameTime < budget.maxFrameTime * 0.8) {
      
      // Find least impactful optimization to revert
      const revertibleStrategies = this.strategies
        .filter(s => this.appliedStrategies.has(s.name) && s.revert)
        .sort((a, b) => a.cost - b.cost);
      
      if (revertibleStrategies.length > 0) {
        const strategy = revertibleStrategies[0];
        
        try {
          await strategy.revert!(this.context);
          this.appliedStrategies.delete(strategy.name);
          console.log(`⚡ Reverted optimization: ${strategy.name}`);
        } catch (error) {
          console.error(`❌ Failed to revert optimization ${strategy.name}:`, error);
        }
      }
    }
  }

  // Optimization strategy implementations
  private async enableFrustumCulling(context: OptimizationContext): Promise<void> {
    this.cullingEnabled = true;
    // Implementation would enable frustum culling in renderer
  }

  private async disableFrustumCulling(context: OptimizationContext): Promise<void> {
    this.cullingEnabled = false;
  }

  private async enableOcclusionCulling(context: OptimizationContext): Promise<void> {
    // Setup occlusion queries and visibility buffer
    const gl = context.gl;
    const width = context.viewport.width;
    const height = context.viewport.height;
    
    this.visibilityBuffer = new Uint8Array(width * height);
  }

  private async reduceLevelOfDetail(context: OptimizationContext): Promise<void> {
    if (this.currentLOD < this.lodLevels.length - 1) {
      this.currentLOD++;
      context.currentLOD = this.lodLevels[this.currentLOD];
      console.log(`📉 Reduced LOD to level ${this.currentLOD}`);
    }
  }

  private async increaseLevelOfDetail(context: OptimizationContext): Promise<void> {
    if (this.currentLOD > 0) {
      this.currentLOD--;
      context.currentLOD = this.lodLevels[this.currentLOD];
      console.log(`📈 Increased LOD to level ${this.currentLOD}`);
    }
  }

  private async optimizeTextureAtlas(context: OptimizationContext): Promise<void> {
    // Combine small textures into atlases
    const gl = context.gl;
    
    // Implementation would create texture atlases
    console.log('🔄 Optimizing texture atlas');
  }

  private async enableBatchRendering(context: OptimizationContext): Promise<void> {
    // Group draw calls by material/shader
    console.log('📦 Enabling batch rendering');
  }

  private async enableModeSpecificCulling(context: OptimizationContext): Promise<void> {
    // Cull objects not relevant to active modes
    context.activeModes.forEach(mode => {
      switch (mode) {
        case CanvasMode.DRAW:
          // Only render brush strokes and immediate drawing
          break;
        case CanvasMode.PARAMETRIC:
          // Only render parametric patterns
          break;
        case CanvasMode.CODE:
          // Only render code execution results
          break;
        case CanvasMode.GROWTH:
          // Only render growth patterns
          break;
      }
    });
  }

  private async performMemoryCleanup(context: OptimizationContext): Promise<void> {
    const now = performance.now();
    
    // Only run GC if enough time has passed
    if (now - this.lastGCTime > 5000) { // 5 seconds
      // Clear unused textures
      context.textureCache.forEach((texture, key) => {
        // Check if texture is still needed
        // if not used recently, delete it
      });
      
      // Clear unused buffers
      while (context.bufferPool.length > 10) {
        const buffer = context.bufferPool.pop();
        if (buffer) {
          context.gl.deleteBuffer(buffer);
        }
      }
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
      
      this.lastGCTime = now;
      console.log('🧹 Performed memory cleanup');
    }
  }

  private async enableTemporalCaching(context: OptimizationContext): Promise<void> {
    // Cache rendered frames for static content
    console.log('⏰ Enabling temporal caching');
  }

  // Region of Interest management
  public addRegionOfInterest(roi: RegionOfInterest): void {
    this.regionsOfInterest.set(roi.id, roi);
  }

  public removeRegionOfInterest(id: string): void {
    this.regionsOfInterest.delete(id);
  }

  public updateRegionOfInterest(id: string, updates: Partial<RegionOfInterest>): void {
    const roi = this.regionsOfInterest.get(id);
    if (roi) {
      Object.assign(roi, updates);
      roi.needsUpdate = true;
    }
  }

  // Public API methods
  public setRenderBudget(budget: Partial<RenderBudget>): void {
    Object.assign(this.budget, budget);
  }

  public setAdaptiveMode(enabled: boolean): void {
    this.adaptiveMode = enabled;
  }

  public getCurrentLOD(): LevelOfDetail {
    return this.lodLevels[this.currentLOD];
  }

  public setLOD(level: number): void {
    this.currentLOD = Math.max(0, Math.min(this.lodLevels.length - 1, level));
    this.context.currentLOD = this.lodLevels[this.currentLOD];
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.context.metrics };
  }

  public getAppliedOptimizations(): string[] {
    return Array.from(this.appliedStrategies);
  }

  public forceOptimization(strategyName: string): Promise<void> {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (strategy && !this.appliedStrategies.has(strategyName)) {
      return strategy.apply(this.context).then(() => {
        this.appliedStrategies.add(strategyName);
      });
    }
    return Promise.resolve();
  }

  public revertOptimization(strategyName: string): Promise<void> {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (strategy && strategy.revert && this.appliedStrategies.has(strategyName)) {
      return strategy.revert(this.context).then(() => {
        this.appliedStrategies.delete(strategyName);
      });
    }
    return Promise.resolve();
  }

  public updateContext(context: Partial<OptimizationContext>): void {
    Object.assign(this.context, context);
  }

  public getMemoryPressure(): number {
    return this.memoryPressure;
  }

  public destroy(): void {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
    
    // Clean up WebGL resources
    const gl = this.context.gl;
    
    this.context.textureCache.forEach(texture => {
      gl.deleteTexture(texture);
    });
    
    this.context.bufferPool.forEach(buffer => {
      gl.deleteBuffer(buffer);
    });
    
    Object.values(this.context.shaderCache).forEach(program => {
      gl.deleteProgram(program);
    });
    
    this.regionsOfInterest.clear();
    this.frameHistory.length = 0;
    this.appliedStrategies.clear();
    
    console.log('🗑️ Performance Optimizer destroyed');
  }
}