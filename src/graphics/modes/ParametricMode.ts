/**
 * Parametric Mode - Mathematical pattern generation with real-time controls
 * Supports formulas, geometric patterns, fractals, and wave functions
 */

import { Point, Color, Rectangle } from '../../types/graphics';
import { unifiedDataModel, DataNode, DataNodeType, ParametricData, Parameter, Equation } from '../../core/UnifiedDataModel';

export interface ParametricModeConfig {
  resolution: number; // Points per unit
  animationSpeed: number; // 0-1
  interpolation: 'linear' | 'smooth' | 'cubic';
  antialias: boolean;
  showControlPoints: boolean;
  showGrid: boolean;
  gridDivisions: number;
}

export enum PatternType {
  FORMULA = 'formula',
  GEOMETRIC = 'geometric',
  FRACTAL = 'fractal',
  WAVE = 'wave',
  SPIROGRAPH = 'spirograph',
  LISSAJOUS = 'lissajous',
  ROSE = 'rose',
  EPICYCLOID = 'epicycloid'
}

export interface ParametricPattern {
  id: string;
  type: PatternType;
  name: string;
  parameters: Parameter[];
  equations: Equation[];
  bounds: Rectangle;
  animated: boolean;
  animationPhase: number;
  color: Color;
  strokeWidth: number;
  fillEnabled: boolean;
  fillColor?: Color;
}

export interface ControlPoint {
  id: string;
  position: Point;
  parameter?: string; // Linked parameter name
  value: number;
  min: number;
  max: number;
  active: boolean;
}

export class ParametricMode {
  private config: ParametricModeConfig;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private gl: WebGLRenderingContext | null = null;
  
  // Pattern management
  private patterns: Map<string, ParametricPattern> = new Map();
  private activePattern: string | null = null;
  private patternCache: Map<string, Path2D> = new Map();
  
  // Control points
  private controlPoints: Map<string, ControlPoint> = new Map();
  private selectedControlPoint: string | null = null;
  private isDraggingControl: boolean = false;
  
  // Animation
  private animationFrame: number | null = null;
  private animationStartTime: number = 0;
  private isAnimating: boolean = false;
  
  // Grid and guides
  private gridCanvas: HTMLCanvasElement;
  private gridContext: CanvasRenderingContext2D;
  
  // WebGL resources for GPU acceleration
  private shaderProgram: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private parameterBuffer: WebGLBuffer | null = null;
  
  // Mathematical expression parser
  private expressionParser: ExpressionParser;
  
  constructor(canvas: HTMLCanvasElement, gl?: WebGLRenderingContext) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.gl = gl || null;
    
    // Default configuration
    this.config = {
      resolution: 100,
      animationSpeed: 0.5,
      interpolation: 'smooth',
      antialias: true,
      showControlPoints: true,
      showGrid: true,
      gridDivisions: 10
    };
    
    // Initialize grid
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.width = canvas.width;
    this.gridCanvas.height = canvas.height;
    this.gridContext = this.gridCanvas.getContext('2d')!;
    
    // Initialize expression parser
    this.expressionParser = new ExpressionParser();
    
    // Initialize WebGL if available
    if (this.gl) {
      this.initializeWebGL();
    }
    
    // Create default patterns
    this.createDefaultPatterns();
    
    // Render grid
    this.renderGrid();
  }
  
  private initializeWebGL(): void {
    if (!this.gl) return;
    
    // Vertex shader for parametric curves
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_parameter;
      
      uniform mat3 u_transform;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec4 u_params; // Up to 4 parameters
      
      varying float v_parameter;
      
      void main() {
        // Apply parametric transformation
        vec2 position = a_position;
        
        // Example: Apply time-based animation
        position.x += sin(u_time + a_parameter * 6.28318) * u_params.x;
        position.y += cos(u_time + a_parameter * 6.28318) * u_params.y;
        
        // Transform to clip space
        vec3 transformed = u_transform * vec3(position, 1.0);
        vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        
        gl_Position = vec4(clipSpace, 0, 1);
        gl_PointSize = 2.0;
        
        v_parameter = a_parameter;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform vec4 u_color;
      varying float v_parameter;
      
      void main() {
        // Gradient along parameter
        vec3 color = mix(u_color.rgb, vec3(1.0), v_parameter * 0.3);
        gl_FragColor = vec4(color, u_color.a);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (vertexShader && fragmentShader) {
      this.shaderProgram = this.gl.createProgram()!;
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);
      
      if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
        console.error('Failed to link parametric shader program');
        this.shaderProgram = null;
      }
    }
    
    // Create buffers
    this.vertexBuffer = this.gl.createBuffer();
    this.parameterBuffer = this.gl.createBuffer();
  }
  
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
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
  
  private createDefaultPatterns(): void {
    // Spirograph pattern
    this.createPattern({
      id: 'spirograph_default',
      type: PatternType.SPIROGRAPH,
      name: 'Spirograph',
      parameters: [
        { name: 'R', value: 100, min: 50, max: 200, step: 1 },
        { name: 'r', value: 40, min: 10, max: 100, step: 1 },
        { name: 'd', value: 60, min: 10, max: 150, step: 1 },
        { name: 'cycles', value: 10, min: 1, max: 50, step: 1 }
      ],
      equations: [
        {
          id: 'x_eq',
          expression: '(R - r) * cos(t) + d * cos((R - r) * t / r)',
          variables: ['R', 'r', 'd', 't'],
          output: 'x'
        },
        {
          id: 'y_eq',
          expression: '(R - r) * sin(t) - d * sin((R - r) * t / r)',
          variables: ['R', 'r', 'd', 't'],
          output: 'y'
        }
      ],
      bounds: { x: -200, y: -200, width: 400, height: 400 },
      animated: false,
      animationPhase: 0,
      color: { r: 0, g: 0, b: 0, a: 1 },
      strokeWidth: 2,
      fillEnabled: false
    });
    
    // Lissajous curve
    this.createPattern({
      id: 'lissajous_default',
      type: PatternType.LISSAJOUS,
      name: 'Lissajous Curve',
      parameters: [
        { name: 'A', value: 100, min: 50, max: 200, step: 1 },
        { name: 'B', value: 100, min: 50, max: 200, step: 1 },
        { name: 'a', value: 3, min: 1, max: 10, step: 1 },
        { name: 'b', value: 4, min: 1, max: 10, step: 1 },
        { name: 'delta', value: Math.PI / 2, min: 0, max: Math.PI * 2, step: 0.1 }
      ],
      equations: [
        {
          id: 'x_eq',
          expression: 'A * sin(a * t + delta)',
          variables: ['A', 'a', 'delta', 't'],
          output: 'x'
        },
        {
          id: 'y_eq',
          expression: 'B * sin(b * t)',
          variables: ['B', 'b', 't'],
          output: 'y'
        }
      ],
      bounds: { x: -200, y: -200, width: 400, height: 400 },
      animated: true,
      animationPhase: 0,
      color: { r: 255, g: 0, b: 255, a: 1 },
      strokeWidth: 3,
      fillEnabled: false
    });
    
    // Rose curve
    this.createPattern({
      id: 'rose_default',
      type: PatternType.ROSE,
      name: 'Rose Curve',
      parameters: [
        { name: 'a', value: 100, min: 50, max: 200, step: 1 },
        { name: 'k', value: 5, min: 2, max: 12, step: 1 }
      ],
      equations: [
        {
          id: 'r_eq',
          expression: 'a * cos(k * theta)',
          variables: ['a', 'k', 'theta'],
          output: 'radius'
        }
      ],
      bounds: { x: -200, y: -200, width: 400, height: 400 },
      animated: false,
      animationPhase: 0,
      color: { r: 255, g: 100, b: 100, a: 1 },
      strokeWidth: 2,
      fillEnabled: true,
      fillColor: { r: 255, g: 200, b: 200, a: 0.3 }
    });
  }
  
  private createPattern(pattern: ParametricPattern): void {
    this.patterns.set(pattern.id, pattern);
    
    // Create control points for parameters
    pattern.parameters.forEach((param, index) => {
      const angle = (index / pattern.parameters.length) * Math.PI * 2;
      const radius = 150;
      
      const controlPoint: ControlPoint = {
        id: `${pattern.id}_${param.name}`,
        position: {
          x: this.canvas.width / 2 + Math.cos(angle) * radius,
          y: this.canvas.height / 2 + Math.sin(angle) * radius
        },
        parameter: param.name,
        value: param.value,
        min: param.min,
        max: param.max,
        active: true
      };
      
      this.controlPoints.set(controlPoint.id, controlPoint);
    });
    
    // Create data node
    const patternNode = this.createPatternNode(pattern);
    unifiedDataModel.addNode(patternNode);
  }
  
  private createPatternNode(pattern: ParametricPattern): DataNode {
    const parametricData: ParametricData = {
      type: pattern.type as any,
      parameters: pattern.parameters,
      equations: pattern.equations,
      bounds: pattern.bounds
    };
    
    return {
      id: pattern.id,
      type: DataNodeType.EQUATION,
      mode: 'parametric',
      timestamp: Date.now(),
      metadata: {
        name: pattern.name,
        version: 1,
        visible: true,
        opacity: 1
      },
      data: {
        bounds: pattern.bounds,
        style: {
          strokeColor: pattern.color,
          strokeWidth: pattern.strokeWidth,
          fillColor: pattern.fillColor,
          opacity: 1
        },
        parametricData
      }
    };
  }
  
  // Pattern generation
  private generatePattern(pattern: ParametricPattern): Path2D {
    const path = new Path2D();
    const resolution = this.config.resolution;
    
    // Get parameter values
    const params: Record<string, number> = {};
    pattern.parameters.forEach(param => {
      params[param.name] = param.value;
    });
    
    // Add animation phase if animated
    if (pattern.animated) {
      params['phase'] = pattern.animationPhase;
    }
    
    switch (pattern.type) {
      case PatternType.SPIROGRAPH:
      case PatternType.LISSAJOUS:
        this.generateParametricCurve(path, pattern, params, resolution);
        break;
      case PatternType.ROSE:
        this.generatePolarCurve(path, pattern, params, resolution);
        break;
      case PatternType.FRACTAL:
        this.generateFractal(path, pattern, params, 5);
        break;
      case PatternType.WAVE:
        this.generateWavePattern(path, pattern, params, resolution);
        break;
      default:
        this.generateParametricCurve(path, pattern, params, resolution);
    }
    
    return path;
  }
  
  private generateParametricCurve(path: Path2D, pattern: ParametricPattern, params: Record<string, number>, resolution: number): void {
    const xEquation = pattern.equations.find(eq => eq.output === 'x');
    const yEquation = pattern.equations.find(eq => eq.output === 'y');
    
    if (!xEquation || !yEquation) return;
    
    // Determine parameter range
    const tMin = 0;
    const tMax = params['cycles'] ? params['cycles'] * Math.PI * 2 : Math.PI * 2;
    const step = (tMax - tMin) / resolution;
    
    let firstPoint = true;
    
    for (let t = tMin; t <= tMax; t += step) {
      params['t'] = t;
      
      const x = this.expressionParser.evaluate(xEquation.expression, params);
      const y = this.expressionParser.evaluate(yEquation.expression, params);
      
      const canvasX = this.canvas.width / 2 + x;
      const canvasY = this.canvas.height / 2 + y;
      
      if (firstPoint) {
        path.moveTo(canvasX, canvasY);
        firstPoint = false;
      } else {
        if (this.config.interpolation === 'smooth') {
          // Use quadratic curve for smoother lines
          const prevT = t - step;
          params['t'] = prevT;
          const prevX = this.expressionParser.evaluate(xEquation.expression, params);
          const prevY = this.expressionParser.evaluate(yEquation.expression, params);
          
          const cpX = this.canvas.width / 2 + (prevX + x) / 2;
          const cpY = this.canvas.height / 2 + (prevY + y) / 2;
          
          path.quadraticCurveTo(cpX, cpY, canvasX, canvasY);
          params['t'] = t; // Restore t
        } else {
          path.lineTo(canvasX, canvasY);
        }
      }
    }
  }
  
  private generatePolarCurve(path: Path2D, pattern: ParametricPattern, params: Record<string, number>, resolution: number): void {
    const rEquation = pattern.equations.find(eq => eq.output === 'radius');
    if (!rEquation) return;
    
    const thetaMin = 0;
    const thetaMax = Math.PI * 2;
    const step = (thetaMax - thetaMin) / resolution;
    
    let firstPoint = true;
    
    for (let theta = thetaMin; theta <= thetaMax; theta += step) {
      params['theta'] = theta;
      
      const r = this.expressionParser.evaluate(rEquation.expression, params);
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      
      const canvasX = this.canvas.width / 2 + x;
      const canvasY = this.canvas.height / 2 + y;
      
      if (firstPoint) {
        path.moveTo(canvasX, canvasY);
        firstPoint = false;
      } else {
        path.lineTo(canvasX, canvasY);
      }
    }
    
    path.closePath();
  }
  
  private generateFractal(path: Path2D, pattern: ParametricPattern, params: Record<string, number>, depth: number): void {
    // Koch snowflake example
    const size = params['size'] || 200;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    // Initial triangle
    const angle1 = -Math.PI / 2;
    const angle2 = angle1 + (2 * Math.PI / 3);
    const angle3 = angle2 + (2 * Math.PI / 3);
    
    const p1 = { x: cx + size * Math.cos(angle1), y: cy + size * Math.sin(angle1) };
    const p2 = { x: cx + size * Math.cos(angle2), y: cy + size * Math.sin(angle2) };
    const p3 = { x: cx + size * Math.cos(angle3), y: cy + size * Math.sin(angle3) };
    
    path.moveTo(p1.x, p1.y);
    this.kochLine(path, p1, p2, depth);
    this.kochLine(path, p2, p3, depth);
    this.kochLine(path, p3, p1, depth);
  }
  
  private kochLine(path: Path2D, start: Point, end: Point, depth: number): void {
    if (depth === 0) {
      path.lineTo(end.x, end.y);
      return;
    }
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const p1 = { x: start.x + dx / 3, y: start.y + dy / 3 };
    const p3 = { x: start.x + 2 * dx / 3, y: start.y + 2 * dy / 3 };
    
    const angle = Math.atan2(dy, dx) - Math.PI / 3;
    const dist = Math.sqrt(dx * dx + dy * dy) / 3;
    
    const p2 = {
      x: p1.x + dist * Math.cos(angle),
      y: p1.y + dist * Math.sin(angle)
    };
    
    this.kochLine(path, start, p1, depth - 1);
    this.kochLine(path, p1, p2, depth - 1);
    this.kochLine(path, p2, p3, depth - 1);
    this.kochLine(path, p3, end, depth - 1);
  }
  
  private generateWavePattern(path: Path2D, pattern: ParametricPattern, params: Record<string, number>, resolution: number): void {
    const amplitude = params['amplitude'] || 50;
    const frequency = params['frequency'] || 0.02;
    const phase = params['phase'] || 0;
    const waves = params['waves'] || 5;
    
    const width = this.canvas.width;
    const centerY = this.canvas.height / 2;
    const waveSpacing = this.canvas.height / (waves + 1);
    
    for (let wave = 0; wave < waves; wave++) {
      const waveY = centerY + (wave - waves / 2) * waveSpacing;
      
      path.moveTo(0, waveY);
      
      for (let x = 0; x <= width; x += width / resolution) {
        const y = waveY + amplitude * Math.sin(frequency * x + phase + wave * Math.PI / waves);
        path.lineTo(x, y);
      }
    }
  }
  
  // Rendering
  public render(): void {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid if enabled
    if (this.config.showGrid) {
      this.context.globalAlpha = 0.3;
      this.context.drawImage(this.gridCanvas, 0, 0);
      this.context.globalAlpha = 1;
    }
    
    // Render patterns
    this.patterns.forEach((pattern, id) => {
      if (id === this.activePattern || !this.activePattern) {
        this.renderPattern(pattern);
      }
    });
    
    // Render control points if enabled
    if (this.config.showControlPoints) {
      this.renderControlPoints();
    }
  }
  
  private renderPattern(pattern: ParametricPattern): void {
    // Get or generate path
    let path = this.patternCache.get(pattern.id);
    if (!path || pattern.animated) {
      path = this.generatePattern(pattern);
      if (!pattern.animated) {
        this.patternCache.set(pattern.id, path);
      }
    }
    
    // Set styles
    this.context.strokeStyle = `rgba(${pattern.color.r}, ${pattern.color.g}, ${pattern.color.b}, ${pattern.color.a})`;
    this.context.lineWidth = pattern.strokeWidth;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    
    // Apply antialiasing
    if (this.config.antialias) {
      this.context.imageSmoothingEnabled = true;
      this.context.imageSmoothingQuality = 'high';
    }
    
    // Fill if enabled
    if (pattern.fillEnabled && pattern.fillColor) {
      this.context.fillStyle = `rgba(${pattern.fillColor.r}, ${pattern.fillColor.g}, ${pattern.fillColor.b}, ${pattern.fillColor.a})`;
      this.context.fill(path);
    }
    
    // Stroke path
    this.context.stroke(path);
  }
  
  private renderControlPoints(): void {
    this.controlPoints.forEach(point => {
      if (!point.active) return;
      
      this.context.save();
      
      // Draw control point
      this.context.fillStyle = point.id === this.selectedControlPoint ? '#ff0000' : '#0066ff';
      this.context.strokeStyle = '#ffffff';
      this.context.lineWidth = 2;
      
      this.context.beginPath();
      this.context.arc(point.position.x, point.position.y, 8, 0, Math.PI * 2);
      this.context.fill();
      this.context.stroke();
      
      // Draw parameter value
      if (point.parameter) {
        this.context.fillStyle = '#000000';
        this.context.font = '12px monospace';
        this.context.textAlign = 'center';
        this.context.fillText(
          `${point.parameter}: ${point.value.toFixed(1)}`,
          point.position.x,
          point.position.y - 12
        );
      }
      
      this.context.restore();
    });
  }
  
  private renderGrid(): void {
    const ctx = this.gridContext;
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;
    const divisions = this.config.gridDivisions;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = (i / divisions) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Center lines
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }
  
  // Animation
  public startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    
    const animate = (timestamp: number) => {
      if (!this.isAnimating) return;
      
      const elapsed = timestamp - this.animationStartTime;
      const phase = (elapsed / 1000) * this.config.animationSpeed;
      
      // Update animated patterns
      this.patterns.forEach(pattern => {
        if (pattern.animated) {
          pattern.animationPhase = phase;
          this.patternCache.delete(pattern.id); // Force regeneration
        }
      });
      
      // Render
      this.render();
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  public stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  // Interaction
  public handleMouseDown(point: Point): void {
    // Check if clicking on control point
    let clickedPoint: ControlPoint | null = null;
    let minDistance = Infinity;
    
    this.controlPoints.forEach(cp => {
      if (!cp.active) return;
      
      const distance = Math.sqrt(
        Math.pow(point.x - cp.position.x, 2) +
        Math.pow(point.y - cp.position.y, 2)
      );
      
      if (distance < 12 && distance < minDistance) {
        minDistance = distance;
        clickedPoint = cp;
      }
    });
    
    if (clickedPoint) {
      this.selectedControlPoint = clickedPoint.id;
      this.isDraggingControl = true;
    }
  }
  
  public handleMouseMove(point: Point): void {
    if (!this.isDraggingControl || !this.selectedControlPoint) return;
    
    const controlPoint = this.controlPoints.get(this.selectedControlPoint);
    if (!controlPoint) return;
    
    // Update control point position
    controlPoint.position = point;
    
    // Calculate new parameter value based on position
    // This is a simple linear mapping; could be more sophisticated
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const distance = Math.sqrt(
      Math.pow(point.x - centerX, 2) +
      Math.pow(point.y - centerY, 2)
    );
    
    // Map distance to parameter range
    const normalizedDistance = Math.min(distance / 200, 1);
    controlPoint.value = controlPoint.min + 
      (controlPoint.max - controlPoint.min) * normalizedDistance;
    
    // Update pattern parameter
    if (controlPoint.parameter) {
      const patternId = controlPoint.id.split('_')[0];
      const pattern = this.patterns.get(patternId);
      if (pattern) {
        const param = pattern.parameters.find(p => p.name === controlPoint.parameter);
        if (param) {
          param.value = controlPoint.value;
          this.patternCache.delete(patternId); // Force regeneration
          
          // Update data model
          unifiedDataModel.updateNode(patternId, {
            data: {
              parametricData: {
                type: pattern.type as any,
                parameters: pattern.parameters,
                equations: pattern.equations,
                bounds: pattern.bounds
              }
            }
          });
        }
      }
    }
    
    this.render();
  }
  
  public handleMouseUp(): void {
    this.isDraggingControl = false;
  }
  
  // Public API
  public setActivePattern(patternId: string): void {
    this.activePattern = patternId;
    this.render();
  }
  
  public addPattern(pattern: ParametricPattern): void {
    this.createPattern(pattern);
    this.render();
  }
  
  public updateParameter(patternId: string, parameterName: string, value: number): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    
    const param = pattern.parameters.find(p => p.name === parameterName);
    if (param) {
      param.value = Math.max(param.min, Math.min(param.max, value));
      this.patternCache.delete(patternId);
      
      // Update control point
      const controlPointId = `${patternId}_${parameterName}`;
      const controlPoint = this.controlPoints.get(controlPointId);
      if (controlPoint) {
        controlPoint.value = param.value;
      }
      
      this.render();
    }
  }
  
  public setConfig(config: Partial<ParametricModeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.gridDivisions !== undefined) {
      this.renderGrid();
    }
    
    this.render();
  }
  
  public exportPattern(patternId: string): ParametricPattern | null {
    return this.patterns.get(patternId) || null;
  }
  
  public importPattern(pattern: ParametricPattern): void {
    this.createPattern(pattern);
    this.render();
  }
  
  public clear(): void {
    this.patterns.forEach((_, id) => {
      unifiedDataModel.removeNode(id);
    });
    
    this.patterns.clear();
    this.controlPoints.clear();
    this.patternCache.clear();
    this.selectedControlPoint = null;
    this.activePattern = null;
    
    this.render();
  }
  
  public destroy(): void {
    this.stopAnimation();
    
    // Clean up WebGL resources
    if (this.gl) {
      if (this.shaderProgram) {
        this.gl.deleteProgram(this.shaderProgram);
      }
      if (this.vertexBuffer) {
        this.gl.deleteBuffer(this.vertexBuffer);
      }
      if (this.parameterBuffer) {
        this.gl.deleteBuffer(this.parameterBuffer);
      }
    }
    
    this.clear();
  }
}

// Simple expression parser for mathematical formulas
class ExpressionParser {
  private operators = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '*': (a: number, b: number) => a * b,
    '/': (a: number, b: number) => a / b,
    '^': (a: number, b: number) => Math.pow(a, b)
  };
  
  private functions = {
    'sin': Math.sin,
    'cos': Math.cos,
    'tan': Math.tan,
    'asin': Math.asin,
    'acos': Math.acos,
    'atan': Math.atan,
    'sqrt': Math.sqrt,
    'abs': Math.abs,
    'log': Math.log,
    'exp': Math.exp,
    'floor': Math.floor,
    'ceil': Math.ceil,
    'round': Math.round,
    'min': Math.min,
    'max': Math.max
  };
  
  private constants = {
    'PI': Math.PI,
    'E': Math.E,
    'pi': Math.PI,
    'e': Math.E
  };
  
  evaluate(expression: string, variables: Record<string, number>): number {
    // Simple expression evaluation
    // In production, use a proper expression parser library
    
    // Replace variables and constants
    let expr = expression;
    
    Object.entries(variables).forEach(([name, value]) => {
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    });
    
    Object.entries(this.constants).forEach(([name, value]) => {
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    });
    
    // Replace functions
    Object.entries(this.functions).forEach(([name, func]) => {
      expr = expr.replace(new RegExp(`${name}\\s*\\(([^)]+)\\)`, 'g'), (match, args) => {
        try {
          const value = eval(args);
          return func(value).toString();
        } catch {
          return '0';
        }
      });
    });
    
    // Evaluate the expression
    try {
      return eval(expr);
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return 0;
    }
  }
}