/**
 * Main Graphics Engine for Genshi Studio
 * Integrates all graphics subsystems with full pressure-sensitive input support
 */

import { Renderer } from './Renderer';
import { EnhancedBrushEngine } from '../tools/EnhancedBrushEngine';
import { CulturalPatternGenerator, PatternType } from '../patterns/CulturalPatternGenerator';
import { InfiniteCanvas } from '../canvas/InfiniteCanvas';
import { Layer, DrawingTool, Point, Color, Size, Rectangle } from '../../types/graphics';
import { PressureEventHandler, PressureEventData } from '../../input/PressureEventHandler';
import { inputDeviceManager } from '../../input/InputDeviceManager';

export interface GraphicsEngineConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
}

export class GraphicsEngine {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private brushEngine: EnhancedBrushEngine;
  private patternGenerator: CulturalPatternGenerator;
  private infiniteCanvas: InfiniteCanvas;
  private pressureEventHandler: PressureEventHandler;
  
  // Layer system
  private layers: Map<string, Layer> = new Map();
  private activeLayerId: string | null = null;
  private layerCounter: number = 0;
  
  // Drawing state
  private currentTool: DrawingTool | null = null;
  private currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
  private isDrawing: boolean = false;
  private isPanning: boolean = false;
  private lastPanPoint: Point | null = null;
  
  // Performance
  private animationFrameId: number | null = null;
  private needsRedraw: boolean = true;

  constructor(config: GraphicsEngineConfig) {
    this.canvas = config.canvas;
    
    // Initialize subsystems
    this.renderer = new Renderer(this.canvas);
    const gl = this.renderer['contextManager'].getContext();
    this.brushEngine = new EnhancedBrushEngine(this.renderer, gl);
    this.patternGenerator = new CulturalPatternGenerator();
    
    // Initialize infinite canvas
    const size = this.getCanvasSize();
    this.infiniteCanvas = new InfiniteCanvas(size.width, size.height);
    
    // Create default layer
    this.createLayer('Background');
    
    // Set up pressure-sensitive event handling
    this.pressureEventHandler = new PressureEventHandler(this.canvas, {
      onStart: this.handlePressureStart.bind(this),
      onMove: this.handlePressureMove.bind(this),
      onEnd: this.handlePressureEnd.bind(this)
    });
    
    // Set up additional event listeners
    this.setupEventListeners();
    
    // Start render loop
    this.startRenderLoop();
  }

  private setupEventListeners(): void {
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

  private handlePressureStart(event: PressureEventData): void {
    const worldPoint = this.infiniteCanvas.screenToWorld({ x: event.x, y: event.y });
    
    if (this.isPanning) {
      this.lastPanPoint = worldPoint;
      return;
    }
    
    this.isDrawing = true;
    
    if (this.currentTool && this.currentTool.onPointerDown) {
      this.currentTool.onPointerDown(worldPoint, event.pressure.pressure);
    } else {
      // Enhanced brush with full pressure data
      this.brushEngine.setColor(this.currentColor);
      this.brushEngine.startStroke(worldPoint, event.pressure, event.velocity);
    }
    
    this.needsRedraw = true;
  }

  private handlePressureMove(event: PressureEventData): void {
    const worldPoint = this.infiniteCanvas.screenToWorld({ x: event.x, y: event.y });
    
    if (this.isPanning && this.lastPanPoint) {
      const dx = worldPoint.x - this.lastPanPoint.x;
      const dy = worldPoint.y - this.lastPanPoint.y;
      this.infiniteCanvas.pan(-dx, -dy);
      this.lastPanPoint = worldPoint;
      this.needsRedraw = true;
      return;
    }
    
    if (this.isDrawing) {
      if (this.currentTool && this.currentTool.onPointerMove) {
        this.currentTool.onPointerMove(worldPoint, event.pressure.pressure);
      } else {
        // Enhanced brush with full pressure data
        this.brushEngine.continueStroke(worldPoint, event.pressure, event.velocity);
      }
      
      this.needsRedraw = true;
    }
  }

  private handlePressureEnd(event: PressureEventData): void {
    if (this.isPanning) {
      this.lastPanPoint = null;
      return;
    }
    
    if (!this.isDrawing) return;
    
    const worldPoint = this.infiniteCanvas.screenToWorld({ x: event.x, y: event.y });
    
    if (this.currentTool && this.currentTool.onPointerUp) {
      this.currentTool.onPointerUp(worldPoint);
    } else {
      // Enhanced brush end
      this.brushEngine.endStroke();
    }
    
    this.isDrawing = false;
    this.needsRedraw = true;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scale = event.deltaY > 0 ? 0.9 : 1.1;
    
    this.infiniteCanvas.zoom(scale, x, y);
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
      case '[':
        // Decrease brush size
        const currentSettings = this.brushEngine.getSettings();
        this.brushEngine.updateSettings({ size: Math.max(1, currentSettings.size - 5) });
        break;
      case ']':
        // Increase brush size
        const settings = this.brushEngine.getSettings();
        this.brushEngine.updateSettings({ size: Math.min(500, settings.size + 5) });
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
        ctx.fillRect(10, 10, 220, 130);
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.renderer.getFPS()}`, 20, 30);
        ctx.fillText(`Objects: ${metrics.visibleCount}/${metrics.objectCount}`, 20, 45);
        ctx.fillText(`Cells: ${metrics.cellCount}`, 20, 60);
        ctx.fillText(`Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`, 20, 75);
        ctx.fillText(`Cull Time: ${metrics.lastCullTime.toFixed(2)}ms`, 20, 90);
        
        // Device info
        const device = inputDeviceManager.getCurrentDevice();
        if (device) {
          ctx.fillText(`Device: ${device.vendor || 'Unknown'} ${device.type}`, 20, 105);
          ctx.fillText(`Pressure: ${device.supportsPressure ? 'Yes' : 'No'}`, 20, 120);
        }
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
    // Configure brush engine for eraser mode
    this.brushEngine.updateSettings({
      tipShape: 'round',
      hardness: 0.9
    });
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
    this.isPanning = true;
    this.canvas.style.cursor = 'grab';
  }

  private exitPanMode(): void {
    this.isPanning = false;
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
    this.brushEngine.setColor(color);
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

  // Brush presets
  setBrushPreset(preset: string): void {
    this.brushEngine.setBrushPreset(preset);
  }

  // Pressure curve management
  setPressureCurve(curveName: string): boolean {
    return inputDeviceManager.setPressureCurve(curveName);
  }

  getAvailablePressureCurves(): string[] {
    return inputDeviceManager.getAvailableCurves();
  }

  // Device info
  getInputDeviceInfo(): any {
    return inputDeviceManager.getCurrentDevice();
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

  // Code execution integration methods
  clearExecutionLayer(): void {
    const executionLayer = Array.from(this.layers.values()).find(l => l.name === 'Code Execution');
    if (executionLayer) {
      // Clear the layer's content
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.needsRedraw = true;
    }
  }

  setCanvasBackground(color: string): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
      this.needsRedraw = true;
    }
  }

  clearCanvas(): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.needsRedraw = true;
    }
  }

  setFillColor(color: string): void {
    // Update the current color based on the string color
    this.currentColor = this.parseColorString(color);
  }

  setStrokeColor(color: string): void {
    // Store stroke color for drawing operations
    (this as any).strokeColor = color;
  }

  setStrokeWidth(width: number): void {
    // Store stroke width for drawing operations
    (this as any).strokeWidth = width;
  }

  setFillEnabled(enabled: boolean): void {
    (this as any).fillEnabled = enabled;
  }

  setStrokeEnabled(enabled: boolean): void {
    (this as any).strokeEnabled = enabled;
  }

  drawRect(x: number, y: number, width: number, height: number): void {
    this.requestRedraw();
  }

  drawCircle(x: number, y: number, radius: number): void {
    this.requestRedraw();
  }

  drawEllipse(x: number, y: number, width: number, height: number): void {
    this.requestRedraw();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.requestRedraw();
  }

  drawTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    this.requestRedraw();
  }

  drawPolygon(points: number[]): void {
    this.requestRedraw();
  }

  drawPattern(culture: string, pattern: string, args: any[]): void {
    this.requestRedraw();
  }

  requestRedraw(): void {
    this.needsRedraw = true;
  }

  private parseColorString(color: string): Color {
    // Simple hex color parser
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16) / 255,
          g: parseInt(hex[1] + hex[1], 16) / 255,
          b: parseInt(hex[2] + hex[2], 16) / 255,
          a: 1
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16) / 255,
          g: parseInt(hex.slice(2, 4), 16) / 255,
          b: parseInt(hex.slice(4, 6), 16) / 255,
          a: 1
        };
      }
    }
    // Default to black
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  // Cleanup
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.pressureEventHandler.destroy();
    this.brushEngine.destroy();
    this.patternGenerator.destroy();
    this.renderer.destroy();
    
    // Remove event listeners
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}