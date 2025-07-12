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
    
    // Initialize WebGL context
    this.webglContext = new WebGLContextManager(this.mainCanvas);
    
    // Initialize renderer
    this.renderer = new Renderer(this.mainCanvas);
    
    // Initialize infinite canvas
    const size = this.getCanvasSize();
    this.infiniteCanvas = new InfiniteCanvas(size.width, size.height);
    
    // Initialize mode engines
    this.initializeModeEngines();
    
    // Setup multi-layer system
    this.setupMultiLayerSystem(config.modes);
    
    // Setup interaction handling
    this.setupInteractionHandlers();
    
    // Start render loop
    this.startRenderLoop();
    
    console.log('🎨 Unified Canvas System initialized with multi-mode support');
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
    
    // Get appropriate context
    let context: CanvasRenderingContext2D | WebGLRenderingContext;
    if (mode === CanvasMode.DRAW || mode === CanvasMode.GROWTH) {
      // Use WebGL for performance-critical modes
      context = overlayCanvas.getContext('webgl') || overlayCanvas.getContext('experimental-webgl') as WebGLRenderingContext;
    } else {
      // Use Canvas 2D for parametric and code modes
      context = overlayCanvas.getContext('2d') as CanvasRenderingContext2D;
    }
    
    if (!context) {
      throw new Error(`Failed to create context for ${mode} mode overlay`);
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
    this.mainCanvas.width = width;
    this.mainCanvas.height = height;
    
    // Resize overlays
    this.overlays.forEach(overlay => {
      overlay.canvas.width = width;
      overlay.canvas.height = height;
    });
    
    // Update renderer and infinite canvas
    this.renderer.resize(width, height);
    this.infiniteCanvas.setViewport(0, 0, width, height);
    
    this.needsRedraw = true;
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