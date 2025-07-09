/**
 * Main Graphics Engine for Genshi Studio
 * Integrates all graphics subsystems
 */

import { Renderer } from './Renderer';
import { BrushEngine } from '../tools/BrushEngine';
import { CulturalPatternGenerator, PatternType } from '../patterns/CulturalPatternGenerator';
import { InfiniteCanvas } from '../canvas/InfiniteCanvas';
import { Layer, DrawingTool, Point, Color, Size, Rectangle } from '../../types/graphics';

export interface GraphicsEngineConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
}

export class GraphicsEngine {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private brushEngine: BrushEngine;
  private patternGenerator: CulturalPatternGenerator;
  private infiniteCanvas: InfiniteCanvas;
  
  // Layer system
  private layers: Map<string, Layer> = new Map();
  private activeLayerId: string | null = null;
  private layerCounter: number = 0;
  
  // Drawing state
  private currentTool: DrawingTool | null = null;
  private currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
  private isDrawing: boolean = false;
  
  // Performance
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = true;

  constructor(config: GraphicsEngineConfig) {
    this.canvas = config.canvas;
    
    // Initialize subsystems
    this.renderer = new Renderer(this.canvas);
    const gl = this.renderer['contextManager'].getContext();
    this.brushEngine = new BrushEngine(this.renderer, gl);
    this.patternGenerator = new CulturalPatternGenerator();
    
    // Initialize infinite canvas
    const size = this.getCanvasSize();
    this.infiniteCanvas = new InfiniteCanvas(size.width, size.height);
    
    // Create default layer
    this.createLayer('Background');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start render loop
    this.startRenderLoop();
  }

  private setupEventListeners(): void {
    // Pointer events for drawing
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));
    
    // Wheel event for zooming
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    resizeObserver.observe(this.canvas);
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();
    
    const point = this.getPointerPosition(event);
    const pressure = event.pressure || 0.5;
    
    this.isDrawing = true;
    
    if (this.currentTool && this.currentTool.onPointerDown) {
      this.currentTool.onPointerDown(point, pressure);
    } else {
      // Default brush behavior
      this.brushEngine.startStroke(point, pressure);
    }
    
    this.needsRedraw = true;
  }

  private handlePointerMove(event: PointerEvent): void {
    const point = this.getPointerPosition(event);
    const pressure = event.pressure || 0.5;
    
    if (this.isDrawing) {
      if (this.currentTool && this.currentTool.onPointerMove) {
        this.currentTool.onPointerMove(point, pressure);
      } else {
        // Default brush behavior
        this.brushEngine.continueStroke(point, pressure);
      }
      
      this.needsRedraw = true;
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.isDrawing) return;
    
    const point = this.getPointerPosition(event);
    
    if (this.currentTool && this.currentTool.onPointerUp) {
      this.currentTool.onPointerUp(point);
    } else {
      // Default brush behavior
      this.brushEngine.endStroke();
    }
    
    this.isDrawing = false;
    this.needsRedraw = true;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const point = this.getPointerPosition(event);
    const scale = event.deltaY > 0 ? 0.9 : 1.1;
    
    this.infiniteCanvas.zoom(scale, point.x, point.y);
    this.needsRedraw = true;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Tool shortcuts
    switch (event.key.toLowerCase()) {
      case 'b':
        this.selectBrushTool();
        break;
      case 'e':
        this.selectEraserTool();
        break;
      case 'g':
        this.selectPatternTool();
        break;
      case ' ':
        // Space for pan mode
        if (!event.repeat) {
          this.enterPanMode();
        }
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key === ' ') {
      this.exitPanMode();
    }
  }

  private handleResize(): void {
    const size = this.getCanvasSize();
    this.renderer.resize(size.width, size.height);
    this.infiniteCanvas.setViewport(0, 0, size.width, size.height);
    this.needsRedraw = true;
  }

  private getPointerPosition(event: MouseEvent | PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to world coordinates
    return this.infiniteCanvas.screenToWorld({ x, y });
  }

  private getCanvasSize(): Size {
    return {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight
    };
  }

  // Render loop
  private startRenderLoop(): void {
    const render = () => {
      if (this.needsRedraw) {
        this.render();
        this.needsRedraw = false;
      }
      
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    render();
  }

  private render(): void {
    // Clear canvas
    this.renderer.clear();
    
    // Get visible objects from infinite canvas
    const visibleObjects = this.infiniteCanvas.getVisibleObjects();
    
    // Render layers in order
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => {
        // Render background first, then other layers by creation order
        if (a.name === 'Background') return -1;
        if (b.name === 'Background') return 1;
        return 0;
      });
    
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      
      this.renderLayer(layer);
    }
    
    // Render active drawing
    if (this.isDrawing) {
      // Render current stroke preview
    }
    
    // Render UI overlay (selection, guides, etc.)
    this.renderOverlay();
  }

  private renderLayer(layer: Layer): void {
    this.renderer.pushTransform();
    
    // Apply layer transform
    this.renderer.translate(layer.transform.translateX, layer.transform.translateY);
    this.renderer.rotate(layer.transform.rotation);
    this.renderer.scale(layer.transform.scaleX, layer.transform.scaleY);
    
    // Set layer blend mode and opacity
    this.renderer.setBlendMode(layer.blendMode);
    
    // Render layer content
    if (layer.texture) {
      // Render texture content
    }
    
    this.renderer.popTransform();
  }

  private renderOverlay(): void {
    // Render selection boxes, guides, grid, etc.
    const metrics = this.infiniteCanvas.getMetrics();
    
    // Debug info
    if (process.env.NODE_ENV === 'development') {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 100);
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.renderer.getFPS()}`, 20, 30);
        ctx.fillText(`Objects: ${metrics.visibleCount}/${metrics.objectCount}`, 20, 45);
        ctx.fillText(`Cells: ${metrics.cellCount}`, 20, 60);
        ctx.fillText(`Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`, 20, 75);
        ctx.fillText(`Cull Time: ${metrics.lastCullTime.toFixed(2)}ms`, 20, 90);
        ctx.restore();
      }
    }
  }

  // Layer management
  createLayer(name: string): Layer {
    const id = `layer_${this.layerCounter++}`;
    const layer: Layer = {
      id,
      name,
      visible: true,
      opacity: 1,
      blendMode: 'normal' as any,
      texture: null,
      transform: {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      }
    };
    
    this.layers.set(id, layer);
    
    if (!this.activeLayerId) {
      this.activeLayerId = id;
    }
    
    return layer;
  }

  deleteLayer(id: string): void {
    if (this.layers.size <= 1) {
      console.warn('Cannot delete last layer');
      return;
    }
    
    this.layers.delete(id);
    
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers.keys().next().value || null;
    }
    
    this.needsRedraw = true;
  }

  setActiveLayer(id: string): void {
    if (this.layers.has(id)) {
      this.activeLayerId = id;
    }
  }

  // Tool management
  selectBrushTool(): void {
    this.currentTool = {
      id: 'brush',
      name: 'Brush',
      icon: 'brush',
      cursor: 'crosshair'
    };
  }

  selectEraserTool(): void {
    this.currentTool = {
      id: 'eraser',
      name: 'Eraser',
      icon: 'eraser',
      cursor: 'crosshair'
    };
  }

  selectPatternTool(): void {
    this.currentTool = {
      id: 'pattern',
      name: 'Pattern',
      icon: 'pattern',
      cursor: 'crosshair'
    };
  }

  private enterPanMode(): void {
    this.canvas.style.cursor = 'grab';
  }

  private exitPanMode(): void {
    this.canvas.style.cursor = this.currentTool?.cursor || 'default';
  }

  // Pattern generation
  generatePattern(
    type: PatternType,
    bounds: Rectangle,
    options: any
  ): void {
    const patternData = this.patternGenerator.generatePattern(
      type,
      bounds.width,
      bounds.height,
      options
    );
    
    // Add pattern to canvas
    const patternId = `pattern_${Date.now()}`;
    this.infiniteCanvas.addObject(patternId, bounds, {
      type: 'pattern',
      patternType: type,
      imageData: patternData
    }, 0);
    
    this.needsRedraw = true;
  }

  // Color management
  setColor(color: Color): void {
    this.currentColor = color;
  }

  getColor(): Color {
    return { ...this.currentColor };
  }

  // Brush settings
  updateBrushSettings(settings: any): void {
    this.brushEngine.updateSettings(settings);
  }

  getBrushSettings(): any {
    return this.brushEngine.getSettings();
  }

  // Export/Import
  exportCanvas(): ImageData {
    const size = this.getCanvasSize();
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get 2D context');
    
    return ctx.getImageData(0, 0, size.width, size.height);
  }

  // Performance metrics
  getPerformanceMetrics(): {
    fps: number;
    frameCount: number;
    canvasMetrics: any;
    memoryUsage: any;
  } {
    return {
      fps: this.renderer.getFPS(),
      frameCount: this.renderer.getFrameCount(),
      canvasMetrics: this.infiniteCanvas.getMetrics(),
      memoryUsage: this.renderer.getMemoryUsage()
    };
  }

  // Cleanup
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.brushEngine.destroy();
    this.patternGenerator.destroy();
    this.renderer.destroy();
    
    // Remove event listeners
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}