/**
 * Draw Mode - Free-form vector drawing with pressure sensitivity
 * Supports advanced brush dynamics, stabilization, and real-time rendering
 */

import { Point, Color, Rectangle } from '../../types/graphics';
import { unifiedDataModel, DataNode, DataNodeType, StrokeData, StrokePoint } from '../../core/UnifiedDataModel';
import { EnhancedBrushEngine } from '../tools/EnhancedBrushEngine';
import { Renderer } from '../engine/Renderer';

export interface DrawModeConfig {
  smoothing: number; // 0-1, stroke smoothing amount
  stabilization: number; // 0-1, cursor stabilization
  pressureSensitivity: number; // 0-2, pressure response curve
  velocitySensitivity: number; // 0-2, velocity response curve
  snapToGrid: boolean;
  gridSize: number;
}

export interface DrawTool {
  type: 'brush' | 'pen' | 'pencil' | 'eraser' | 'smudge';
  size: number;
  opacity: number;
  hardness: number; // 0-1, brush edge hardness
  spacing: number; // 0-1, distance between brush stamps
  scattering: number; // 0-1, randomness in position
  angleJitter: number; // 0-360, rotation randomness
  sizeJitter: number; // 0-1, size variation
  opacityJitter: number; // 0-1, opacity variation
  textureId?: string; // Brush texture
  blendMode?: string;
}

export interface StrokeState {
  id: string;
  tool: DrawTool;
  points: StrokePoint[];
  bounds: Rectangle;
  startTime: number;
  endTime?: number;
  averagePressure: number;
  averageSpeed: number;
  color: Color;
}

export class DrawMode {
  private config: DrawModeConfig;
  private brushEngine: EnhancedBrushEngine;
  private renderer: Renderer;
  private gl: WebGLRenderingContext;
  
  // Current drawing state
  private currentStroke: StrokeState | null = null;
  private currentTool: DrawTool;
  private currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
  private isDrawing: boolean = false;
  
  // Stroke management
  private strokes: Map<string, StrokeState> = new Map();
  private strokeHistory: string[] = [];
  private redoStack: string[] = [];
  
  // Stabilization
  private stabilizationBuffer: Point[] = [];
  private stabilizationWindow: number = 5;
  private lastStabilizedPoint: Point | null = null;
  
  // Performance optimization
  private strokeRenderCache: Map<string, ImageData> = new Map();
  private dirtyStrokes: Set<string> = new Set();
  private lastRenderTime: number = 0;
  private renderDebounceTimer: number | null = null;
  
  // Pressure and velocity tracking
  private pressureHistory: number[] = [];
  private velocityHistory: number[] = [];
  private lastPoint: Point | null = null;
  private lastPointTime: number = 0;
  
  // Grid snapping
  private gridCanvas: HTMLCanvasElement | null = null;
  private gridContext: CanvasRenderingContext2D | null = null;
  
  // WebGL resources
  private strokeVAO: WebGLVertexArrayObject | null = null;
  private strokeShaderProgram: WebGLProgram | null = null;
  private strokeVertexBuffer: WebGLBuffer | null = null;
  private strokeColorBuffer: WebGLBuffer | null = null;
  
  constructor(brushEngine: EnhancedBrushEngine, renderer: Renderer, gl: WebGLRenderingContext) {
    this.brushEngine = brushEngine;
    this.renderer = renderer;
    this.gl = gl;
    
    // Default configuration
    this.config = {
      smoothing: 0.5,
      stabilization: 0.3,
      pressureSensitivity: 1.0,
      velocitySensitivity: 0.5,
      snapToGrid: false,
      gridSize: 10
    };
    
    // Default tool
    this.currentTool = {
      type: 'brush',
      size: 10,
      opacity: 1.0,
      hardness: 0.8,
      spacing: 0.1,
      scattering: 0,
      angleJitter: 0,
      sizeJitter: 0,
      opacityJitter: 0
    };
    
    this.initializeWebGL();
    this.initializeGrid();
  }
  
  private initializeWebGL(): void {
    // Create shader program for efficient stroke rendering
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_pressure;
      
      uniform mat3 u_transform;
      uniform vec2 u_resolution;
      uniform float u_pointSize;
      
      varying vec4 v_color;
      varying float v_pressure;
      
      void main() {
        vec3 transformed = u_transform * vec3(a_position, 1.0);
        vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        
        gl_Position = vec4(clipSpace, 0, 1);
        gl_PointSize = u_pointSize * a_pressure;
        
        v_color = a_color;
        v_pressure = a_pressure;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying float v_pressure;
      
      uniform sampler2D u_brushTexture;
      uniform float u_hardness;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }
        
        // Apply brush hardness
        float alpha = smoothstep(0.5, 0.5 * (1.0 - u_hardness), dist);
        alpha *= v_pressure;
        
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (vertexShader && fragmentShader) {
      this.strokeShaderProgram = this.gl.createProgram()!;
      this.gl.attachShader(this.strokeShaderProgram, vertexShader);
      this.gl.attachShader(this.strokeShaderProgram, fragmentShader);
      this.gl.linkProgram(this.strokeShaderProgram);
      
      if (!this.gl.getProgramParameter(this.strokeShaderProgram, this.gl.LINK_STATUS)) {
        console.error('Failed to link stroke shader program');
        this.strokeShaderProgram = null;
      }
    }
    
    // Create buffers
    this.strokeVertexBuffer = this.gl.createBuffer();
    this.strokeColorBuffer = this.gl.createBuffer();
    
    // Create VAO if available
    const vaoExt = this.gl.getExtension('OES_vertex_array_object');
    if (vaoExt) {
      this.strokeVAO = vaoExt.createVertexArrayOES();
    }
  }
  
  private compileShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  private initializeGrid(): void {
    if (this.config.snapToGrid) {
      this.gridCanvas = document.createElement('canvas');
      this.gridCanvas.width = 1024;
      this.gridCanvas.height = 1024;
      this.gridContext = this.gridCanvas.getContext('2d')!;
      this.renderGrid();
    }
  }
  
  private renderGrid(): void {
    if (!this.gridContext) return;
    
    const ctx = this.gridContext;
    const size = this.config.gridSize;
    
    ctx.clearRect(0, 0, this.gridCanvas!.width, this.gridCanvas!.height);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let x = 0; x < this.gridCanvas!.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.gridCanvas!.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < this.gridCanvas!.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.gridCanvas!.width, y);
      ctx.stroke();
    }
  }
  
  // Drawing operations
  public startStroke(point: Point, pressure: number = 1.0, tiltX: number = 0, tiltY: number = 0): void {
    const strokeId = this.generateStrokeId();
    
    // Apply stabilization
    const stabilizedPoint = this.applyStabilization(point);
    
    // Apply grid snapping
    const snappedPoint = this.config.snapToGrid ? this.snapToGrid(stabilizedPoint) : stabilizedPoint;
    
    // Create stroke point
    const strokePoint: StrokePoint = {
      x: snappedPoint.x,
      y: snappedPoint.y,
      pressure: this.applyPressureCurve(pressure),
      tiltX,
      tiltY,
      time: performance.now()
    };
    
    // Initialize stroke state
    this.currentStroke = {
      id: strokeId,
      tool: { ...this.currentTool },
      points: [strokePoint],
      bounds: {
        x: strokePoint.x,
        y: strokePoint.y,
        width: 0,
        height: 0
      },
      startTime: strokePoint.time,
      averagePressure: strokePoint.pressure,
      averageSpeed: 0,
      color: { ...this.currentColor }
    };
    
    this.isDrawing = true;
    this.lastPoint = snappedPoint;
    this.lastPointTime = strokePoint.time;
    
    // Clear redo stack on new stroke
    this.redoStack = [];
    
    // Start brush engine stroke
    this.brushEngine.startStroke(snappedPoint, {
      pressure: strokePoint.pressure,
      tiltX,
      tiltY,
      twist: 0
    });
  }
  
  public continueStroke(point: Point, pressure: number = 1.0, tiltX: number = 0, tiltY: number = 0): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    // Apply stabilization
    const stabilizedPoint = this.applyStabilization(point);
    
    // Apply grid snapping
    const snappedPoint = this.config.snapToGrid ? this.snapToGrid(stabilizedPoint) : stabilizedPoint;
    
    // Calculate velocity
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastPointTime;
    const distance = this.calculateDistance(this.lastPoint!, snappedPoint);
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;
    
    // Apply velocity sensitivity
    const velocityMultiplier = this.applyVelocityCurve(velocity);
    
    // Create stroke point
    const strokePoint: StrokePoint = {
      x: snappedPoint.x,
      y: snappedPoint.y,
      pressure: this.applyPressureCurve(pressure) * velocityMultiplier,
      tiltX,
      tiltY,
      time: currentTime
    };
    
    // Add point with spacing consideration
    const shouldAddPoint = this.shouldAddPoint(strokePoint);
    if (shouldAddPoint) {
      this.currentStroke.points.push(strokePoint);
      
      // Update bounds
      this.updateStrokeBounds(this.currentStroke, strokePoint);
      
      // Update averages
      this.updateStrokeAverages(this.currentStroke, strokePoint, velocity);
      
      // Continue brush engine stroke
      this.brushEngine.continueStroke(snappedPoint, {
        pressure: strokePoint.pressure,
        tiltX,
        tiltY,
        twist: 0
      }, { x: velocity, y: 0 });
    }
    
    this.lastPoint = snappedPoint;
    this.lastPointTime = currentTime;
  }
  
  public endStroke(): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.currentStroke.endTime = performance.now();
    
    // Apply smoothing to the entire stroke
    if (this.config.smoothing > 0) {
      this.smoothStroke(this.currentStroke);
    }
    
    // Store stroke
    this.strokes.set(this.currentStroke.id, this.currentStroke);
    this.strokeHistory.push(this.currentStroke.id);
    
    // Create data node for unified model
    const strokeNode = this.createStrokeNode(this.currentStroke);
    unifiedDataModel.addNode(strokeNode);
    
    // Mark stroke as dirty for rendering
    this.dirtyStrokes.add(this.currentStroke.id);
    
    // End brush engine stroke
    this.brushEngine.endStroke();
    
    // Reset state
    this.currentStroke = null;
    this.isDrawing = false;
    this.stabilizationBuffer = [];
    this.lastStabilizedPoint = null;
    
    // Schedule render
    this.scheduleRender();
  }
  
  // Stabilization and smoothing
  private applyStabilization(point: Point): Point {
    if (this.config.stabilization === 0) return point;
    
    // Add to buffer
    this.stabilizationBuffer.push(point);
    
    // Limit buffer size
    if (this.stabilizationBuffer.length > this.stabilizationWindow) {
      this.stabilizationBuffer.shift();
    }
    
    // Calculate weighted average
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    
    this.stabilizationBuffer.forEach((p, index) => {
      const weight = (index + 1) / this.stabilizationBuffer.length;
      weightedX += p.x * weight;
      weightedY += p.y * weight;
      totalWeight += weight;
    });
    
    const stabilizedPoint = {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight
    };
    
    // Interpolate with previous stabilized point
    if (this.lastStabilizedPoint) {
      const t = this.config.stabilization;
      stabilizedPoint.x = this.lastStabilizedPoint.x + (stabilizedPoint.x - this.lastStabilizedPoint.x) * (1 - t);
      stabilizedPoint.y = this.lastStabilizedPoint.y + (stabilizedPoint.y - this.lastStabilizedPoint.y) * (1 - t);
    }
    
    this.lastStabilizedPoint = stabilizedPoint;
    return stabilizedPoint;
  }
  
  private smoothStroke(stroke: StrokeState): void {
    if (stroke.points.length < 3) return;
    
    const smoothingFactor = this.config.smoothing;
    const smoothedPoints: StrokePoint[] = [stroke.points[0]];
    
    // Apply Catmull-Rom spline smoothing
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p0 = stroke.points[Math.max(0, i - 1)];
      const p1 = stroke.points[i];
      const p2 = stroke.points[Math.min(stroke.points.length - 1, i + 1)];
      const p3 = stroke.points[Math.min(stroke.points.length - 1, i + 2)];
      
      // Catmull-Rom tangent
      const tx = 0.5 * (p2.x - p0.x);
      const ty = 0.5 * (p2.y - p0.y);
      
      // Interpolate
      const smoothedPoint: StrokePoint = {
        x: p1.x + tx * smoothingFactor,
        y: p1.y + ty * smoothingFactor,
        pressure: p1.pressure,
        tiltX: p1.tiltX,
        tiltY: p1.tiltY,
        time: p1.time
      };
      
      smoothedPoints.push(smoothedPoint);
    }
    
    smoothedPoints.push(stroke.points[stroke.points.length - 1]);
    stroke.points = smoothedPoints;
  }
  
  // Grid snapping
  private snapToGrid(point: Point): Point {
    const size = this.config.gridSize;
    return {
      x: Math.round(point.x / size) * size,
      y: Math.round(point.y / size) * size
    };
  }
  
  // Pressure and velocity curves
  private applyPressureCurve(pressure: number): number {
    const sensitivity = this.config.pressureSensitivity;
    
    if (sensitivity === 1.0) return pressure;
    
    // Apply exponential curve
    if (sensitivity < 1.0) {
      // Make less sensitive (harder to reach full pressure)
      return Math.pow(pressure, 1 / sensitivity);
    } else {
      // Make more sensitive (easier to reach full pressure)
      return 1 - Math.pow(1 - pressure, sensitivity);
    }
  }
  
  private applyVelocityCurve(velocity: number): number {
    const sensitivity = this.config.velocitySensitivity;
    
    if (sensitivity === 0) return 1.0;
    
    // Normalize velocity (0-100 pixels/ms range)
    const normalizedVelocity = Math.min(velocity / 100, 1);
    
    // Invert for size reduction at high speeds
    const speedFactor = 1 - normalizedVelocity;
    
    // Apply curve
    return 1 - (1 - speedFactor) * sensitivity;
  }
  
  // Point spacing
  private shouldAddPoint(point: StrokePoint): boolean {
    if (!this.currentStroke || this.currentStroke.points.length === 0) return true;
    
    const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
    const distance = this.calculateDistance(
      { x: lastPoint.x, y: lastPoint.y },
      { x: point.x, y: point.y }
    );
    
    const minDistance = this.currentTool.size * this.currentTool.spacing;
    return distance >= minDistance;
  }
  
  // Stroke management
  private updateStrokeBounds(stroke: StrokeState, point: StrokePoint): void {
    stroke.bounds.x = Math.min(stroke.bounds.x, point.x);
    stroke.bounds.y = Math.min(stroke.bounds.y, point.y);
    
    const maxX = Math.max(stroke.bounds.x + stroke.bounds.width, point.x);
    const maxY = Math.max(stroke.bounds.y + stroke.bounds.height, point.y);
    
    stroke.bounds.width = maxX - stroke.bounds.x;
    stroke.bounds.height = maxY - stroke.bounds.y;
  }
  
  private updateStrokeAverages(stroke: StrokeState, point: StrokePoint, velocity: number): void {
    const n = stroke.points.length;
    
    // Running average for pressure
    stroke.averagePressure = ((n - 1) * stroke.averagePressure + point.pressure) / n;
    
    // Running average for speed
    stroke.averageSpeed = ((n - 1) * stroke.averageSpeed + velocity) / n;
  }
  
  private createStrokeNode(stroke: StrokeState): DataNode {
    const strokeData: StrokeData = {
      points: stroke.points,
      smoothing: this.config.smoothing,
      closed: false,
      pressure: true,
      velocity: true
    };
    
    return {
      id: stroke.id,
      type: DataNodeType.STROKE,
      mode: 'draw',
      timestamp: Date.now(),
      metadata: {
        name: `Stroke ${stroke.id}`,
        version: 1,
        visible: true,
        opacity: stroke.tool.opacity
      },
      data: {
        bounds: stroke.bounds,
        style: {
          strokeColor: stroke.color,
          strokeWidth: stroke.tool.size,
          opacity: stroke.tool.opacity,
          blendMode: stroke.tool.blendMode
        },
        strokeData
      }
    };
  }
  
  // Rendering
  public render(context?: CanvasRenderingContext2D | WebGLRenderingContext): void {
    if (this.dirtyStrokes.size === 0 && !this.isDrawing) return;
    
    // Render to WebGL if available
    if (context instanceof WebGLRenderingContext || this.gl) {
      this.renderWebGL(context as WebGLRenderingContext || this.gl);
    } else if (context instanceof CanvasRenderingContext2D) {
      this.renderCanvas2D(context);
    }
    
    this.dirtyStrokes.clear();
  }
  
  private renderWebGL(gl: WebGLRenderingContext): void {
    if (!this.strokeShaderProgram) return;
    
    gl.useProgram(this.strokeShaderProgram);
    
    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(this.strokeShaderProgram, 'u_resolution');
    const transformLocation = gl.getUniformLocation(this.strokeShaderProgram, 'u_transform');
    const pointSizeLocation = gl.getUniformLocation(this.strokeShaderProgram, 'u_pointSize');
    const hardnessLocation = gl.getUniformLocation(this.strokeShaderProgram, 'u_hardness');
    
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniformMatrix3fv(transformLocation, false, [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
    
    // Render each stroke
    this.strokes.forEach((stroke, id) => {
      if (!this.dirtyStrokes.has(id) && id !== this.currentStroke?.id) return;
      
      // Prepare vertex data
      const positions: number[] = [];
      const colors: number[] = [];
      const pressures: number[] = [];
      
      stroke.points.forEach(point => {
        positions.push(point.x, point.y);
        colors.push(
          stroke.color.r / 255,
          stroke.color.g / 255,
          stroke.color.b / 255,
          stroke.color.a
        );
        pressures.push(point.pressure || 1.0);
      });
      
      // Upload vertex data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.strokeVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      
      const positionLocation = gl.getAttribLocation(this.strokeShaderProgram!, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Upload color data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.strokeColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      
      const colorLocation = gl.getAttribLocation(this.strokeShaderProgram!, 'a_color');
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
      
      // Set stroke-specific uniforms
      gl.uniform1f(pointSizeLocation, stroke.tool.size);
      gl.uniform1f(hardnessLocation, stroke.tool.hardness);
      
      // Draw as line strip with points
      gl.drawArrays(gl.LINE_STRIP, 0, stroke.points.length);
      gl.drawArrays(gl.POINTS, 0, stroke.points.length);
    });
  }
  
  private renderCanvas2D(ctx: CanvasRenderingContext2D): void {
    // Save context state
    ctx.save();
    
    // Render each stroke
    this.strokes.forEach((stroke, id) => {
      if (!this.dirtyStrokes.has(id) && id !== this.currentStroke?.id) return;
      
      ctx.globalAlpha = stroke.tool.opacity;
      ctx.strokeStyle = `rgba(${stroke.color.r}, ${stroke.color.g}, ${stroke.color.b}, ${stroke.color.a})`;
      ctx.lineWidth = stroke.tool.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set blend mode if specified
      if (stroke.tool.blendMode) {
        ctx.globalCompositeOperation = stroke.tool.blendMode as GlobalCompositeOperation;
      }
      
      // Draw stroke path
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          // Variable width based on pressure
          ctx.lineWidth = stroke.tool.size * (point.pressure || 1.0);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
    
    // Restore context state
    ctx.restore();
  }
  
  private scheduleRender(): void {
    if (this.renderDebounceTimer) return;
    
    this.renderDebounceTimer = window.setTimeout(() => {
      this.render();
      this.renderDebounceTimer = null;
    }, 16); // ~60fps
  }
  
  // Utility methods
  private generateStrokeId(): string {
    return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Public API
  public setTool(tool: Partial<DrawTool>): void {
    this.currentTool = { ...this.currentTool, ...tool };
    
    // Update brush engine settings
    this.brushEngine.updateSettings({
      size: this.currentTool.size,
      opacity: this.currentTool.opacity,
      flow: this.currentTool.opacity,
      hardness: this.currentTool.hardness,
      spacing: this.currentTool.spacing,
      scattering: this.currentTool.scattering,
      angleJitter: this.currentTool.angleJitter,
      sizeJitter: this.currentTool.sizeJitter
    });
  }
  
  public setColor(color: Color): void {
    this.currentColor = color;
    this.brushEngine.setColor(color);
  }
  
  public setConfig(config: Partial<DrawModeConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update grid if needed
    if (config.snapToGrid !== undefined || config.gridSize !== undefined) {
      this.initializeGrid();
    }
    
    // Update stabilization window
    if (config.stabilization !== undefined) {
      this.stabilizationWindow = Math.round(5 + config.stabilization * 10);
    }
  }
  
  public undo(): void {
    if (this.strokeHistory.length === 0) return;
    
    const strokeId = this.strokeHistory.pop()!;
    this.redoStack.push(strokeId);
    
    // Remove from unified data model
    unifiedDataModel.removeNode(strokeId);
    
    // Mark all strokes as dirty for re-render
    this.strokes.forEach((_, id) => this.dirtyStrokes.add(id));
    this.scheduleRender();
  }
  
  public redo(): void {
    if (this.redoStack.length === 0) return;
    
    const strokeId = this.redoStack.pop()!;
    this.strokeHistory.push(strokeId);
    
    // Re-add to unified data model
    const stroke = this.strokes.get(strokeId);
    if (stroke) {
      const strokeNode = this.createStrokeNode(stroke);
      unifiedDataModel.addNode(strokeNode);
    }
    
    // Mark for re-render
    this.dirtyStrokes.add(strokeId);
    this.scheduleRender();
  }
  
  public clear(): void {
    // Clear all strokes
    this.strokes.forEach((_, id) => {
      unifiedDataModel.removeNode(id);
    });
    
    this.strokes.clear();
    this.strokeHistory = [];
    this.redoStack = [];
    this.dirtyStrokes.clear();
    this.strokeRenderCache.clear();
    
    // Clear brush engine
    this.brushEngine.clear();
    
    this.scheduleRender();
  }
  
  public exportStrokes(): StrokeState[] {
    return Array.from(this.strokes.values());
  }
  
  public importStrokes(strokes: StrokeState[]): void {
    this.clear();
    
    strokes.forEach(stroke => {
      this.strokes.set(stroke.id, stroke);
      this.strokeHistory.push(stroke.id);
      
      const strokeNode = this.createStrokeNode(stroke);
      unifiedDataModel.addNode(strokeNode);
      
      this.dirtyStrokes.add(stroke.id);
    });
    
    this.scheduleRender();
  }
  
  public destroy(): void {
    // Clean up WebGL resources
    if (this.strokeShaderProgram) {
      this.gl.deleteProgram(this.strokeShaderProgram);
    }
    if (this.strokeVertexBuffer) {
      this.gl.deleteBuffer(this.strokeVertexBuffer);
    }
    if (this.strokeColorBuffer) {
      this.gl.deleteBuffer(this.strokeColorBuffer);
    }
    if (this.strokeVAO) {
      const vaoExt = this.gl.getExtension('OES_vertex_array_object');
      if (vaoExt) {
        vaoExt.deleteVertexArrayOES(this.strokeVAO);
      }
    }
    
    // Clear timers
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    
    // Clear data
    this.clear();
  }
}