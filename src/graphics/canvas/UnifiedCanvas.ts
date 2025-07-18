/**
 * Unified Canvas System - Multi-Mode Rendering Engine
 * Supports simultaneous Draw, Parametric, Code, and Growth mode editing
 */

import { Renderer } from '../engine/Renderer';
import { EnhancedBrushEngine } from '../tools/EnhancedBrushEngine';
import { CulturalPatternGenerator } from '../patterns/CulturalPatternGenerator';
import { InfiniteCanvas } from './InfiniteCanvas';
import { CodeExecutionEngine } from '../../core/execution/CodeExecutionEngine';
import { GraphicsBridge } from '../../core/execution/GraphicsBridge';
import { OrganicPatternGenerator } from '../patterns/OrganicPatternGenerator';
import { WebGLContextManager } from '../engine/WebGLContext';
import { Point, Color, Size, Rectangle, Layer, BlendMode } from '../../types/graphics';

export enum CanvasMode {
  DRAW = 'draw',
  PARAMETRIC = 'parametric', 
  CODE = 'code',
  GROWTH = 'growth'
}

export interface ModeState {
  active: boolean;
  opacity: number;
  locked: boolean;
  visible: boolean;
}

export interface UnifiedCanvasConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  modes: {
    [key in CanvasMode]: ModeState;
  };
  simplifiedInit?: boolean;  // Skip heavy initialization for faster startup
  useWebGL?: boolean;  // Allow disabling WebGL for fallback
}

export interface ModeOverlay {
  mode: CanvasMode;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGLRenderingContext;
  zIndex: number;
  interactionEnabled: boolean;
}

export interface InteractionContext {
  mode: CanvasMode;
  tool: string;
  point: Point;
  pressure?: number;
  velocity?: Point;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
}

export class UnifiedCanvas {
  private mainCanvas: HTMLCanvasElement;
  private renderer: Renderer;
  private webglContext: WebGLContextManager;
  private infiniteCanvas: InfiniteCanvas;
  
  // Mode-specific engines
  private brushEngine: EnhancedBrushEngine;
  private patternGenerator: CulturalPatternGenerator;
  private organicGenerator: OrganicPatternGenerator;
  private codeEngine: CodeExecutionEngine;
  private graphicsBridge: GraphicsBridge;
  
  // Multi-layer system
  private layers: Map<string, Layer> = new Map();
  private modeLayers: Map<CanvasMode, string> = new Map();
  private overlays: Map<CanvasMode, ModeOverlay> = new Map();
  
  // Mode states
  private modeStates: Map<CanvasMode, ModeState> = new Map();
  private activeModes: Set<CanvasMode> = new Set();
  private primaryMode: CanvasMode | null = null;
  
  // Interaction management
  private interactionQueue: InteractionContext[] = [];
  private isDrawing: boolean = false;
  private lastInteractionTime: number = 0;
  private currentTool: string | null = null;
  
  // Performance optimization
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = true;
  private layersDirty: Set<string> = new Set();
  private performanceMetrics = {
    fps: 0,
    frameTime: 0,
    lastFrameStart: 0,
    renderCount: 0
  };

  constructor(config: UnifiedCanvasConfig) {
    this.mainCanvas = config.canvas;
    const startTime = Date.now();
    
    try {
      // Initialize with error handling and timing
      this.initializeCore(config);
      
      console.log(`🎨 Unified Canvas System initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Failed to initialize UnifiedCanvas:', error);
      throw error;
    }
  }

  private initializeCore(config: UnifiedCanvasConfig): void {
    // Apply enhanced device pixel ratio handling
    this.applyDevicePixelRatio(config);
    
    // Initialize WebGL context with fallback
    if (config.useWebGL !== false) {
      try {
        this.webglContext = new WebGLContextManager(this.mainCanvas);
      } catch (webglError) {
        console.warn('WebGL initialization failed, using Canvas2D fallback:', webglError);
        // Continue without WebGL
      }
    }
    
    // Initialize renderer (will use Canvas2D if WebGL failed)
    this.renderer = new Renderer(this.mainCanvas);
    
    // Initialize infinite canvas
    const size = this.getCanvasSize();
    this.infiniteCanvas = new InfiniteCanvas(size.width, size.height);
    
    if (config.simplifiedInit) {
      // Minimal initialization for faster startup
      this.initializeMinimalModeEngines();
      this.setupMinimalLayerSystem(config.modes);
      this.setupInteractionHandlers();
      
      // Defer heavy initialization
      setTimeout(() => {
        this.completeInitialization(config);
      }, 100);
    } else {
      // Full initialization
      this.initializeModeEngines();
      this.setupMultiLayerSystem(config.modes);
      this.setupInteractionHandlers();
    }
    
    // Start render loop
    this.startRenderLoop();
  }

  private applyDevicePixelRatio(config: UnifiedCanvasConfig): void {
    // Get the base device pixel ratio
    const basePixelRatio = window.devicePixelRatio || 1;
    
    // Adaptive pixel ratio based on device capabilities
    let adaptivePixelRatio = basePixelRatio;
    
    // Cap pixel ratio for performance on high-DPI displays
    if (basePixelRatio > 2) {
      adaptivePixelRatio = 2; // Max 2x for performance
    }
    
    // Reduce pixel ratio on mobile devices to save battery
    if (this.isMobileDevice()) {
      adaptivePixelRatio = Math.min(adaptivePixelRatio, 1.5);
    }
    
    // Use config override if provided
    const finalPixelRatio = config.pixelRatio || adaptivePixelRatio;
    
    // Apply to canvas with proper scaling
    const rect = this.mainCanvas.getBoundingClientRect();
    const width = config.width || rect.width;
    const height = config.height || rect.height;
    
    // Set canvas internal dimensions
    this.mainCanvas.width = Math.floor(width * finalPixelRatio);
    this.mainCanvas.height = Math.floor(height * finalPixelRatio);
    
    // Set canvas display dimensions
    this.mainCanvas.style.width = `${width}px`;
    this.mainCanvas.style.height = `${height}px`;
    
    // Apply high-quality rendering settings
    this.mainCanvas.style.imageRendering = 'crisp-edges';
    this.mainCanvas.style.imageRendering = 'pixelated'; // Fallback for older browsers
    
    console.log(`📱 Device pixel ratio applied: ${finalPixelRatio} (base: ${basePixelRatio}, canvas: ${this.mainCanvas.width}x${this.mainCanvas.height})`);
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
  }

  private initializeMinimalModeEngines(): void {
    // Only initialize the brush engine for draw mode initially
    const gl = this.webglContext?.getContext();
    this.brushEngine = new EnhancedBrushEngine(this.renderer, gl);
    
    // Defer other engines
    this.patternGenerator = null as any;
    this.organicGenerator = null as any;
    this.codeEngine = null as any;
    this.graphicsBridge = null as any;
  }

  private completeInitialization(config: UnifiedCanvasConfig): void {
    console.log('Completing deferred canvas initialization...');
    
    // Initialize remaining engines
    if (!this.patternGenerator) {
      this.patternGenerator = new CulturalPatternGenerator();
    }
    if (!this.organicGenerator) {
      this.organicGenerator = new OrganicPatternGenerator();
    }
    if (!this.codeEngine) {
      this.codeEngine = new CodeExecutionEngine();
      this.graphicsBridge = new GraphicsBridge(this);
      this.codeEngine.connectGraphicsEngine(this.graphicsBridge);
    }
    
    // Create overlays for inactive modes
    let index = 1;
    Object.keys(config.modes).forEach(mode => {
      const canvasMode = mode as CanvasMode;
      if (!this.overlays.has(canvasMode) && config.modes[canvasMode].active) {
        this.createModeOverlay(canvasMode, index++);
      }
    });
    
    console.log('✓ Canvas initialization completed');
  }

  private initializeModeEngines(): void {
    const gl = this.webglContext.getContext();
    
    // Draw mode engine
    this.brushEngine = new EnhancedBrushEngine(this.renderer, gl);
    
    // Parametric mode engine
    this.patternGenerator = new CulturalPatternGenerator();
    
    // Growth mode engine
    this.organicGenerator = new OrganicPatternGenerator();
    
    // Code mode engine
    this.codeEngine = new CodeExecutionEngine();
    this.graphicsBridge = new GraphicsBridge(this);
    this.codeEngine.connectGraphicsEngine(this.graphicsBridge);
  }

  private setupMultiLayerSystem(modes: {[key in CanvasMode]: ModeState}): void {
    // Create dedicated layers for each mode
    Object.keys(modes).forEach((mode, index) => {
      const canvasMode = mode as CanvasMode;
      const modeState = modes[canvasMode];
      
      // Store mode state
      this.modeStates.set(canvasMode, { ...modeState });
      
      if (modeState.active) {
        this.activeModes.add(canvasMode);
      }
      
      // Create layer for this mode
      const layerId = `${canvasMode}_layer`;
      const layer: Layer = {
        id: layerId,
        name: `${canvasMode.charAt(0).toUpperCase() + canvasMode.slice(1)} Layer`,
        visible: modeState.visible,
        opacity: modeState.opacity,
        blendMode: this.getDefaultBlendMode(canvasMode),
        texture: null,
        transform: {
          translateX: 0,
          translateY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0
        }
      };
      
      this.layers.set(layerId, layer);
      this.modeLayers.set(canvasMode, layerId);
      
      // Create mode overlay
      this.createModeOverlay(canvasMode, index);
    });
    
    // Set primary mode to first active mode
    if (this.activeModes.size > 0) {
      this.primaryMode = Array.from(this.activeModes)[0];
    }
  }

  private setupMinimalLayerSystem(modes: {[key in CanvasMode]: ModeState}): void {
    // Only set up the primary draw layer initially
    const drawMode = CanvasMode.DRAW;
    const modeState = modes[drawMode];
    
    // Store mode state
    this.modeStates.set(drawMode, { ...modeState });
    
    if (modeState.active) {
      this.activeModes.add(drawMode);
    }
    
    // Create layer for draw mode only
    const layerId = `${drawMode}_layer`;
    const layer: Layer = {
      id: layerId,
      name: 'Draw Layer',
      visible: modeState.visible,
      opacity: modeState.opacity,
      blendMode: this.getDefaultBlendMode(drawMode),
      texture: null,
      transform: {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      }
    };
    
    this.layers.set(layerId, layer);
    this.modeLayers.set(drawMode, layerId);
    
    // Create minimal overlay without WebGL for draw mode
    this.createMinimalOverlay(drawMode);
    
    // Store other mode states for later
    Object.keys(modes).forEach(mode => {
      const canvasMode = mode as CanvasMode;
      if (canvasMode !== drawMode) {
        this.modeStates.set(canvasMode, { ...modes[canvasMode] });
      }
    });
    
    // Set primary mode
    this.primaryMode = drawMode;
  }

  private createMinimalOverlay(mode: CanvasMode): void {
    // Create a minimal overlay without WebGL
    const overlayCanvas = document.createElement('canvas');
    
    overlayCanvas.width = this.mainCanvas.width;
    overlayCanvas.height = this.mainCanvas.height;
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.width = '100%';
    overlayCanvas.style.height = '100%';
    overlayCanvas.style.zIndex = '1000';
    overlayCanvas.style.pointerEvents = 'none';
    
    // Always use Canvas2D for minimal mode
    const context = overlayCanvas.getContext('2d');
    
    if (!context) {
      console.error(`Failed to create 2D context for ${mode} mode`);
      return;
    }
    
    const overlay: ModeOverlay = {
      mode,
      canvas: overlayCanvas,
      context,
      zIndex: 1000,
      interactionEnabled: this.modeStates.get(mode)?.active || false
    };
    
    this.overlays.set(mode, overlay);
    
    // Don't append to DOM yet to save initialization time
  }

  private createModeOverlay(mode: CanvasMode, zIndex: number): void {
    // Create overlay canvas for mode-specific interactions
    const overlayCanvas = document.createElement('canvas');
    const rect = this.mainCanvas.getBoundingClientRect();
    
    overlayCanvas.width = this.mainCanvas.width;
    overlayCanvas.height = this.mainCanvas.height;
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.width = '100%';
    overlayCanvas.style.height = '100%';
    overlayCanvas.style.zIndex = (1000 + zIndex).toString();
    overlayCanvas.style.pointerEvents = 'none'; // Enable selectively
    
    // Get appropriate context with error handling
    let context: CanvasRenderingContext2D | WebGLRenderingContext | null = null;
    
    if (this.webglContext && (mode === CanvasMode.DRAW || mode === CanvasMode.GROWTH)) {
      // Try WebGL for performance-critical modes
      try {
        context = overlayCanvas.getContext('webgl', {
          alpha: true,
          antialias: false,
          failIfMajorPerformanceCaveat: true
        }) || overlayCanvas.getContext('experimental-webgl');
      } catch (e) {
        console.warn(`WebGL failed for ${mode} overlay, falling back to 2D`);
      }
    }
    
    // Fallback to Canvas2D
    if (!context) {
      context = overlayCanvas.getContext('2d');
    }
    
    if (!context) {
      console.error(`Failed to create any context for ${mode} mode overlay`);
      return; // Don't throw, just skip this overlay
    }
    
    const overlay: ModeOverlay = {
      mode,
      canvas: overlayCanvas,
      context,
      zIndex: 1000 + zIndex,
      interactionEnabled: this.modeStates.get(mode)?.active || false
    };
    
    this.overlays.set(mode, overlay);
    
    // Append to canvas parent
    if (this.mainCanvas.parentElement) {
      this.mainCanvas.parentElement.appendChild(overlayCanvas);
    }
  }

  private getDefaultBlendMode(mode: CanvasMode): BlendMode {
    switch (mode) {
      case CanvasMode.DRAW:
        return BlendMode.Normal;
      case CanvasMode.PARAMETRIC:
        return BlendMode.Multiply;
      case CanvasMode.CODE:
        return BlendMode.Screen;
      case CanvasMode.GROWTH:
        return BlendMode.Overlay;
      default:
        return BlendMode.Normal;
    }
  }

  private setupInteractionHandlers(): void {
    // Main canvas event handlers
    this.mainCanvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.mainCanvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.mainCanvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.mainCanvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Keyboard handlers
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mode switching handlers
    this.setupModeSpecificHandlers();
  }

  private setupModeSpecificHandlers(): void {
    // Enable interaction on overlays for active modes
    this.overlays.forEach((overlay, mode) => {
      if (this.modeStates.get(mode)?.active) {
        overlay.canvas.style.pointerEvents = 'auto';
        
        // Mode-specific event handlers
        overlay.canvas.addEventListener('pointerdown', (e) => {
          this.handleModeSpecificInteraction(mode, e, 'down');
        });
        
        overlay.canvas.addEventListener('pointermove', (e) => {
          this.handleModeSpecificInteraction(mode, e, 'move');
        });
        
        overlay.canvas.addEventListener('pointerup', (e) => {
          this.handleModeSpecificInteraction(mode, e, 'up');
        });
      } else {
        overlay.canvas.style.pointerEvents = 'none';
      }
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    const point = this.getCanvasPoint(event);
    const interaction: InteractionContext = {
      mode: this.primaryMode || CanvasMode.DRAW,
      tool: this.currentTool || 'brush',
      point,
      pressure: (event as any).pressure || 1.0,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    };
    
    this.isDrawing = true;
    this.processInteraction(interaction, 'down');
    this.needsRedraw = true;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.isDrawing) return;
    
    const point = this.getCanvasPoint(event);
    const interaction: InteractionContext = {
      mode: this.primaryMode || CanvasMode.DRAW,
      tool: this.currentTool || 'brush',
      point,
      pressure: (event as any).pressure || 1.0,
      velocity: this.calculateVelocity(point),
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    };
    
    this.processInteraction(interaction, 'move');
    this.needsRedraw = true;
  }

  private handlePointerUp(event: PointerEvent): void {
    const point = this.getCanvasPoint(event);
    const interaction: InteractionContext = {
      mode: this.primaryMode || CanvasMode.DRAW,
      tool: this.currentTool || 'brush',
      point,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    };
    
    this.isDrawing = false;
    this.processInteraction(interaction, 'up');
    this.needsRedraw = true;
  }

  private handleModeSpecificInteraction(mode: CanvasMode, event: PointerEvent, phase: 'down' | 'move' | 'up'): void {
    const point = this.getCanvasPoint(event);
    const interaction: InteractionContext = {
      mode,
      tool: this.getModeSpecificTool(mode),
      point,
      pressure: (event as any).pressure || 1.0,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    };
    
    this.processInteraction(interaction, phase);
    this.needsRedraw = true;
  }

  private processInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    // Add to interaction queue for processing
    this.interactionQueue.push(interaction);
    
    // Process immediately for real-time feedback
    this.executeInteraction(interaction, phase);
  }

  private executeInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    const layerId = this.modeLayers.get(interaction.mode);
    if (!layerId) return;
    
    // Mark layer as dirty for redraw
    this.layersDirty.add(layerId);
    
    switch (interaction.mode) {
      case CanvasMode.DRAW:
        this.executeDrawInteraction(interaction, phase);
        break;
      case CanvasMode.PARAMETRIC:
        this.executeParametricInteraction(interaction, phase);
        break;
      case CanvasMode.CODE:
        this.executeCodeInteraction(interaction, phase);
        break;
      case CanvasMode.GROWTH:
        this.executeGrowthInteraction(interaction, phase);
        break;
    }
  }

  private executeDrawInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    const worldPoint = this.infiniteCanvas.screenToWorld(interaction.point);
    
    switch (phase) {
      case 'down':
        this.brushEngine.startStroke(worldPoint, { 
          pressure: interaction.pressure || 1.0,
          tiltX: 0,
          tiltY: 0,
          twist: 0
        }, interaction.velocity);
        break;
      case 'move':
        this.brushEngine.continueStroke(worldPoint, {
          pressure: interaction.pressure || 1.0,
          tiltX: 0,
          tiltY: 0,
          twist: 0
        }, interaction.velocity);
        break;
      case 'up':
        this.brushEngine.endStroke();
        break;
    }
  }

  private executeParametricInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    // Handle parametric pattern interaction
    if (phase === 'down') {
      // Start parametric pattern at interaction point
      const bounds: Rectangle = {
        x: interaction.point.x - 50,
        y: interaction.point.y - 50,
        width: 100,
        height: 100
      };
      
      // Generate pattern using current settings
      this.generateParametricPattern(bounds);
    }
  }

  private executeCodeInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    // Handle code execution visualization
    if (phase === 'down') {
      // Trigger code execution highlight at interaction point
      this.highlightCodeExecution(interaction.point);
    }
  }

  private executeGrowthInteraction(interaction: InteractionContext, phase: 'down' | 'move' | 'up'): void {
    // Handle growth algorithm seeding
    if (phase === 'down') {
      // Add growth seed at interaction point
      this.addGrowthSeed(interaction.point);
    }
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      this.performanceMetrics.lastFrameStart = timestamp;
      
      if (this.needsRedraw || this.layersDirty.size > 0) {
        this.renderFrame();
        this.needsRedraw = false;
        this.layersDirty.clear();
      }
      
      this.updatePerformanceMetrics(timestamp);
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    this.animationFrameId = requestAnimationFrame(render);
  }

  private renderFrame(): void {
    // Clear main canvas
    this.renderer.clear();
    
    // Render layers in order
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => {
        // Sort by mode order: Draw -> Parametric -> Code -> Growth
        const modeOrder = [CanvasMode.DRAW, CanvasMode.PARAMETRIC, CanvasMode.CODE, CanvasMode.GROWTH];
        const aMode = this.getLayerMode(a.id);
        const bMode = this.getLayerMode(b.id);
        return modeOrder.indexOf(aMode) - modeOrder.indexOf(bMode);
      });
    
    for (const layer of sortedLayers) {
      this.renderLayer(layer);
    }
    
    // Render mode-specific overlays
    this.renderModeOverlays();
    
    // Render interaction feedback
    this.renderInteractionFeedback();
  }

  private renderLayer(layer: Layer): void {
    this.renderer.pushTransform();
    
    // Apply layer transforms
    this.renderer.translate(layer.transform.translateX, layer.transform.translateY);
    this.renderer.rotate(layer.transform.rotation);
    this.renderer.scale(layer.transform.scaleX, layer.transform.scaleY);
    
    // Set blend mode and opacity
    this.renderer.setBlendMode(layer.blendMode);
    this.renderer.setGlobalAlpha(layer.opacity);
    
    // Render layer content based on mode
    const mode = this.getLayerMode(layer.id);
    this.renderModeContent(mode, layer);
    
    this.renderer.popTransform();
  }

  private renderModeContent(mode: CanvasMode, layer: Layer): void {
    switch (mode) {
      case CanvasMode.DRAW:
        // Render brush strokes
        this.brushEngine.render();
        break;
      case CanvasMode.PARAMETRIC:
        // Render parametric patterns
        this.renderParametricContent();
        break;
      case CanvasMode.CODE:
        // Render code execution results
        this.renderCodeContent();
        break;
      case CanvasMode.GROWTH:
        // Render growth patterns
        this.renderGrowthContent();
        break;
    }
  }

  private renderModeOverlays(): void {
    this.overlays.forEach((overlay, mode) => {
      if (!this.modeStates.get(mode)?.visible) return;
      
      // Render mode-specific overlay content
      this.renderModeOverlay(mode, overlay);
    });
  }

  private renderModeOverlay(mode: CanvasMode, overlay: ModeOverlay): void {
    switch (mode) {
      case CanvasMode.DRAW:
        this.renderDrawOverlay(overlay);
        break;
      case CanvasMode.PARAMETRIC:
        this.renderParametricOverlay(overlay);
        break;
      case CanvasMode.CODE:
        this.renderCodeOverlay(overlay);
        break;
      case CanvasMode.GROWTH:
        this.renderGrowthOverlay(overlay);
        break;
    }
  }

  private renderDrawOverlay(overlay: ModeOverlay): void {
    // Render brush cursor and stroke preview
    if (overlay.context instanceof CanvasRenderingContext2D) {
      const ctx = overlay.context;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
      
      // Draw brush cursor
      if (this.currentTool === 'brush') {
        const settings = this.brushEngine.getSettings();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(overlay.canvas.width / 2, overlay.canvas.height / 2, settings.size / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private renderParametricOverlay(overlay: ModeOverlay): void {
    // Render parameter control points and sliders
    if (overlay.context instanceof CanvasRenderingContext2D) {
      const ctx = overlay.context;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
      
      // Draw parameter control points
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      
      // Example control points
      const controlPoints = [
        { x: 100, y: 100 },
        { x: 200, y: 150 },
        { x: 300, y: 120 }
      ];
      
      controlPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  }

  private renderCodeOverlay(overlay: ModeOverlay): void {
    // Render execution highlights and debug overlays
    if (overlay.context instanceof CanvasRenderingContext2D) {
      const ctx = overlay.context;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
      
      // Draw execution highlights
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      
      // Example execution highlight
      ctx.fillRect(50, 50, 100, 30);
      ctx.strokeRect(50, 50, 100, 30);
    }
  }

  private renderGrowthOverlay(overlay: ModeOverlay): void {
    // Render growth direction indicators and algorithm visualization
    if (overlay.context instanceof CanvasRenderingContext2D) {
      const ctx = overlay.context;
      ctx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
      
      // Draw growth direction arrows
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.lineWidth = 2;
      
      // Example growth arrows
      const arrows = [
        { start: { x: 150, y: 150 }, end: { x: 180, y: 120 } },
        { start: { x: 150, y: 150 }, end: { x: 120, y: 180 } }
      ];
      
      arrows.forEach(arrow => {
        ctx.beginPath();
        ctx.moveTo(arrow.start.x, arrow.start.y);
        ctx.lineTo(arrow.end.x, arrow.end.y);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(arrow.end.y - arrow.start.y, arrow.end.x - arrow.start.x);
        ctx.beginPath();
        ctx.moveTo(arrow.end.x, arrow.end.y);
        ctx.lineTo(arrow.end.x - 10 * Math.cos(angle - Math.PI / 6), arrow.end.y - 10 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(arrow.end.x, arrow.end.y);
        ctx.lineTo(arrow.end.x - 10 * Math.cos(angle + Math.PI / 6), arrow.end.y - 10 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      });
    }
  }

  private renderInteractionFeedback(): void {
    // Render real-time interaction feedback
    if (this.isDrawing && this.primaryMode) {
      // Show active interaction feedback
      this.renderActiveInteraction();
    }
  }

  private renderActiveInteraction(): void {
    // Render feedback for current interaction
    const overlay = this.overlays.get(this.primaryMode!);
    if (!overlay || !(overlay.context instanceof CanvasRenderingContext2D)) return;
    
    const ctx = overlay.context;
    
    // Draw interaction feedback based on mode
    switch (this.primaryMode) {
      case CanvasMode.DRAW:
        // Show brush preview line
        break;
      case CanvasMode.PARAMETRIC:
        // Show parameter adjustment preview
        break;
      case CanvasMode.CODE:
        // Show code execution progress
        break;
      case CanvasMode.GROWTH:
        // Show growth prediction
        break;
    }
  }

  // Utility methods
  private getCanvasPoint(event: PointerEvent): Point {
    const rect = this.mainCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.mainCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (this.mainCanvas.height / rect.height)
    };
  }

  private calculateVelocity(currentPoint: Point): Point {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastInteractionTime;
    
    if (deltaTime === 0) return { x: 0, y: 0 };
    
    // Would calculate from previous point
    this.lastInteractionTime = currentTime;
    return { x: 0, y: 0 }; // Simplified for now
  }

  private getModeSpecificTool(mode: CanvasMode): string {
    switch (mode) {
      case CanvasMode.DRAW:
        return 'brush';
      case CanvasMode.PARAMETRIC:
        return 'parameter-adjust';
      case CanvasMode.CODE:
        return 'code-highlight';
      case CanvasMode.GROWTH:
        return 'growth-seed';
      default:
        return 'default';
    }
  }

  private getLayerMode(layerId: string): CanvasMode {
    for (const [mode, id] of this.modeLayers) {
      if (id === layerId) return mode;
    }
    return CanvasMode.DRAW;
  }

  private getCanvasSize(): Size {
    return {
      width: this.mainCanvas.clientWidth,
      height: this.mainCanvas.clientHeight
    };
  }

  private updatePerformanceMetrics(timestamp: number): void {
    const frameTime = timestamp - this.performanceMetrics.lastFrameStart;
    this.performanceMetrics.frameTime = frameTime;
    this.performanceMetrics.renderCount++;
    
    // Calculate FPS every 60 frames
    if (this.performanceMetrics.renderCount % 60 === 0) {
      this.performanceMetrics.fps = Math.round(1000 / frameTime);
    }
  }

  // Placeholder methods for mode-specific operations
  private renderParametricContent(): void {
    // Implement parametric pattern rendering
  }

  private renderCodeContent(): void {
    // Implement code execution result rendering
  }

  private renderGrowthContent(): void {
    // Implement growth pattern rendering
  }

  private generateParametricPattern(bounds: Rectangle): void {
    // Implement parametric pattern generation
  }

  private highlightCodeExecution(point: Point): void {
    // Implement code execution highlighting
  }

  private addGrowthSeed(point: Point): void {
    // Implement growth algorithm seeding
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    // Implement zoom/pan
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Implement keyboard shortcuts
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Implement keyboard shortcut releases
  }

  // Public API methods
  public setMode(mode: CanvasMode, active: boolean): void {
    const modeState = this.modeStates.get(mode);
    if (!modeState) return;
    
    modeState.active = active;
    
    if (active) {
      this.activeModes.add(mode);
      if (!this.primaryMode) {
        this.primaryMode = mode;
      }
    } else {
      this.activeModes.delete(mode);
      if (this.primaryMode === mode && this.activeModes.size > 0) {
        this.primaryMode = Array.from(this.activeModes)[0];
      }
    }
    
    this.setupModeSpecificHandlers();
    this.needsRedraw = true;
  }

  public setPrimaryMode(mode: CanvasMode): void {
    if (this.activeModes.has(mode)) {
      this.primaryMode = mode;
      this.needsRedraw = true;
    }
  }

  public setModeOpacity(mode: CanvasMode, opacity: number): void {
    const modeState = this.modeStates.get(mode);
    const layerId = this.modeLayers.get(mode);
    
    if (modeState && layerId) {
      modeState.opacity = Math.max(0, Math.min(1, opacity));
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.opacity = modeState.opacity;
        this.layersDirty.add(layerId);
        this.needsRedraw = true;
      }
    }
  }

  public getActiveModes(): CanvasMode[] {
    return Array.from(this.activeModes);
  }

  public getPrimaryMode(): CanvasMode | null {
    return this.primaryMode;
  }

  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  public resize(width: number, height: number): void {
    // Apply device pixel ratio to dimensions
    const pixelRatio = this.webglContext?.getPixelRatio() || window.devicePixelRatio || 1;
    const scaledWidth = Math.floor(width * pixelRatio);
    const scaledHeight = Math.floor(height * pixelRatio);
    
    // Update main canvas
    this.mainCanvas.width = scaledWidth;
    this.mainCanvas.height = scaledHeight;
    this.mainCanvas.style.width = `${width}px`;
    this.mainCanvas.style.height = `${height}px`;
    
    // Resize overlays with proper scaling
    this.overlays.forEach(overlay => {
      overlay.canvas.width = scaledWidth;
      overlay.canvas.height = scaledHeight;
      overlay.canvas.style.width = `${width}px`;
      overlay.canvas.style.height = `${height}px`;
      
      // Apply pixel ratio scaling to 2D contexts
      if (overlay.context instanceof CanvasRenderingContext2D) {
        overlay.context.scale(pixelRatio, pixelRatio);
      }
    });
    
    // Update renderer and infinite canvas
    this.renderer.resize(scaledWidth, scaledHeight);
    this.infiniteCanvas.setViewport(0, 0, width, height); // Use display dimensions
    
    // Update WebGL context if available
    if (this.webglContext) {
      this.webglContext.resize(width, height);
    }
    
    this.needsRedraw = true;
    console.log(`📏 Canvas resized to ${width}x${height} (scaled: ${scaledWidth}x${scaledHeight})`);
  }

  // Export methods for compatibility with ExportDialog
  public toDataURL(options?: {
    format?: string;
    quality?: number;
    multiplier?: number;
    backgroundColor?: string;
  }): string {
    const opts = {
      format: 'png',
      quality: 1.0,
      multiplier: 1.0,
      backgroundColor: 'transparent',
      ...options
    };

    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d')!;
    
    // Set dimensions considering multiplier
    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;
    exportCanvas.width = width * opts.multiplier;
    exportCanvas.height = height * opts.multiplier;
    
    // Scale context for multiplier
    if (opts.multiplier !== 1) {
      exportCtx.scale(opts.multiplier, opts.multiplier);
    }
    
    // Add background if specified
    if (opts.backgroundColor !== 'transparent') {
      exportCtx.fillStyle = opts.backgroundColor;
      exportCtx.fillRect(0, 0, width, height);
    }
    
    // Render all active mode layers to export canvas
    this.activeModes.forEach(mode => {
      const overlay = this.overlays.get(mode);
      const state = this.modeStates.get(mode);
      if (overlay && state && state.visible) {
        exportCtx.globalAlpha = state.opacity;
        exportCtx.drawImage(overlay.canvas, 0, 0);
      }
    });
    
    // Reset alpha
    exportCtx.globalAlpha = 1.0;
    
    return exportCanvas.toDataURL(`image/${opts.format}`, opts.quality);
  }

  public toSVG(options?: any): string {
    console.warn('SVG export not yet implemented for UnifiedCanvas. Using PNG fallback.');
    // For now, return a basic SVG with embedded PNG data
    const dataURL = this.toDataURL(options);
    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Genshi Studio Pattern</title>
  <desc>Exported from Genshi Studio Unified Canvas</desc>
  <image x="0" y="0" width="${width}" height="${height}" href="${dataURL}"/>
</svg>`;
  }

  // Get the main canvas element for direct access
  public getElement(): HTMLCanvasElement {
    return this.mainCanvas;
  }

  // Get canvas dimensions
  public get width(): number {
    return this.mainCanvas.width;
  }

  public get height(): number {
    return this.mainCanvas.height;
  }

  public destroy(): void {
    // Stop render loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Destroy engines
    this.brushEngine.destroy();
    this.patternGenerator.destroy();
    this.organicGenerator.destroy();
    this.codeEngine.destroy();
    this.renderer.destroy();
    
    // Remove overlays
    this.overlays.forEach(overlay => {
      if (overlay.canvas.parentElement) {
        overlay.canvas.parentElement.removeChild(overlay.canvas);
      }
    });
    
    // Clear collections
    this.layers.clear();
    this.modeLayers.clear();
    this.overlays.clear();
    this.modeStates.clear();
    this.activeModes.clear();
    
    console.log('🗑️ Unified Canvas System destroyed');
  }
}