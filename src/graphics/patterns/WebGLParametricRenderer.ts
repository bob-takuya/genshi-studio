/**
 * WebGL-based Parametric Pattern Renderer for Genshi Studio
 * High-performance GPU-accelerated pattern rendering with real-time parameter updates
 */

import { Color, Point, Size, Shader } from '../../types/graphics';
import { WebGLContextManager } from '../engine/WebGLContext';
import { ParametricPatternEngine } from './ParametricPatternEngine';
import { MathematicalPatternType } from './MathematicalPatternGenerators';

export interface RenderParameters {
  patternType: MathematicalPatternType;
  time: number;
  resolution: Size;
  transform: {
    scale: number;
    rotation: number;
    offset: Point;
  };
  colors: {
    primary: Color;
    secondary: Color;
    background: Color;
  };
  opacity: number;
  animation: {
    enabled: boolean;
    speed: number;
    amplitude: number;
  };
  patternSpecific: Map<string, any>;
}

export class WebGLParametricRenderer {
  private gl: WebGL2RenderingContext;
  private contextManager: WebGLContextManager;
  private parameterEngine: ParametricPatternEngine;
  
  private shaderProgram: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private attributes: Map<string, number> = new Map();
  
  private framebuffer: WebGLFramebuffer | null = null;
  private colorTexture: WebGLTexture | null = null;
  private depthTexture: WebGLTexture | null = null;
  
  private isInitialized: boolean = false;
  private currentSize: Size = { width: 0, height: 0 };
  
  // Performance monitoring
  private renderTimes: number[] = [];
  private frameCount: number = 0;
  private lastFPSTime: number = 0;
  private currentFPS: number = 0;

  constructor(
    contextManager: WebGLContextManager,
    parameterEngine: ParametricPatternEngine
  ) {
    this.contextManager = contextManager;
    this.parameterEngine = parameterEngine;
    this.gl = contextManager.getContext();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadShaders();
      this.setupGeometry();
      this.setupFramebuffer();
      this.cacheUniformLocations();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WebGL parametric renderer:', error);
      throw error;
    }
  }

  private async loadShaders(): Promise<void> {
    const vertexShaderSource = await this.loadShaderSource('/src/shaders/parametric-patterns.vert');
    const fragmentShaderSource = await this.loadShaderSource('/src/shaders/parametric-patterns.frag');
    
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    this.shaderProgram = this.gl.createProgram();
    if (!this.shaderProgram) {
      throw new Error('Failed to create shader program');
    }
    
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);
    
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.shaderProgram);
      throw new Error(`Shader linking failed: ${error}`);
    }
    
    // Clean up individual shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
  }

  private async loadShaderSource(path: string): Promise<string> {
    // In a real implementation, this would load from the actual file
    // For now, we'll embed the shader source directly
    if (path.includes('vert')) {
      return `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        
        uniform mat3 u_transform;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_scale;
        uniform float u_rotation;
        uniform vec2 u_offset;
        
        out vec2 v_texCoord;
        out vec2 v_position;
        out vec2 v_screenPosition;
        
        void main() {
          vec2 transformed = a_position;
          
          float cos_r = cos(u_rotation);
          float sin_r = sin(u_rotation);
          mat2 rotation = mat2(cos_r, -sin_r, sin_r, cos_r);
          transformed = rotation * transformed;
          
          transformed *= u_scale;
          transformed += u_offset;
          
          vec3 position = u_transform * vec3(transformed, 1.0);
          vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
          
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          
          v_texCoord = a_texCoord;
          v_position = transformed;
          v_screenPosition = position.xy;
        }`;
    } else {
      return `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        in vec2 v_position;
        in vec2 v_screenPosition;
        
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec4 u_primaryColor;
        uniform vec4 u_secondaryColor;
        uniform vec4 u_backgroundColor;
        uniform float u_opacity;
        uniform int u_patternType;
        uniform float u_scale;
        uniform float u_rotation;
        uniform vec2 u_offset;
        uniform float u_complexity;
        uniform float u_symmetry;
        uniform float u_strokeWidth;
        uniform float u_smoothness;
        uniform float u_animationSpeed;
        uniform float u_animationAmplitude;
        uniform bool u_animationEnabled;
        uniform vec2 u_fractalCenter;
        uniform float u_fractalZoom;
        uniform int u_fractalIterations;
        uniform vec2 u_juliaConstant;
        uniform float u_voronoiPointCount;
        uniform float u_voronoiSeed;
        
        out vec4 fragColor;
        
        // Pattern type constants
        const int PATTERN_ISLAMIC_GEOMETRIC = 0;
        const int PATTERN_MANDELBROT = 3;
        const int PATTERN_VORONOI = 5;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        vec2 random2(vec2 st) {
          st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
        }
        
        float smoothstep_aa(float edge0, float edge1, float x) {
          float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
          return t * t * (3.0 - 2.0 * t);
        }
        
        vec4 generateIslamicGeometric(vec2 pos) {
          vec2 center = vec2(0.0);
          float radius = length(pos - center);
          float angle = atan(pos.y - center.y, pos.x - center.x);
          
          float animTime = u_animationEnabled ? u_time * u_animationSpeed : 0.0;
          angle += animTime;
          
          float symAngle = mod(angle * u_symmetry, 2.0 * 3.14159);
          float star = abs(sin(symAngle * u_complexity));
          
          float radialPattern = sin(radius * u_scale + animTime) * 0.5 + 0.5;
          
          float pattern = star * radialPattern;
          pattern = smoothstep_aa(0.3, 0.7, pattern);
          
          return mix(u_backgroundColor, u_primaryColor, pattern);
        }
        
        vec4 generateMandelbrot(vec2 pos) {
          vec2 c = (pos - u_fractalCenter) / u_fractalZoom;
          vec2 z = vec2(0.0);
          
          int iterations = 0;
          for (int i = 0; i < 256; i++) {
            if (i >= u_fractalIterations) break;
            if (dot(z, z) > 4.0) break;
            
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            iterations++;
          }
          
          if (iterations == u_fractalIterations) {
            return vec4(0.0, 0.0, 0.0, 1.0);
          }
          
          float t = float(iterations) / float(u_fractalIterations);
          
          vec3 color = vec3(
            sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
            sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
            sin(t * 6.28318 + 4.188) * 0.5 + 0.5
          );
          
          return vec4(color, 1.0);
        }
        
        vec4 generateVoronoi(vec2 pos) {
          vec2 scaledPos = pos * u_scale;
          vec2 grid = floor(scaledPos);
          vec2 local = fract(scaledPos);
          
          float minDistance = 1.0;
          vec2 closestPoint = vec2(0.0);
          
          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 neighbor = vec2(float(x), float(y));
              vec2 cellGrid = grid + neighbor;
              vec2 cellPoint = random2(cellGrid + vec2(u_voronoiSeed)) * 0.8 + 0.1;
              
              vec2 pointPos = neighbor + cellPoint;
              float distance = length(pointPos - local);
              
              if (distance < minDistance) {
                minDistance = distance;
                closestPoint = cellGrid;
              }
            }
          }
          
          float cellColor = random(closestPoint + vec2(u_voronoiSeed));
          vec3 color = mix(u_backgroundColor.rgb, u_primaryColor.rgb, cellColor);
          
          float edgeWidth = 0.02;
          float edge = smoothstep_aa(edgeWidth, edgeWidth * 2.0, minDistance);
          color = mix(u_secondaryColor.rgb, color, edge);
          
          return vec4(color, 1.0);
        }
        
        void main() {
          vec2 pos = v_position;
          vec4 color = u_backgroundColor;
          
          if (u_animationEnabled) {
            pos += vec2(cos(u_time * u_animationSpeed), sin(u_time * u_animationSpeed)) * u_animationAmplitude;
          }
          
          if (u_patternType == PATTERN_ISLAMIC_GEOMETRIC) {
            color = generateIslamicGeometric(pos);
          } else if (u_patternType == PATTERN_MANDELBROT) {
            color = generateMandelbrot(pos);
          } else if (u_patternType == PATTERN_VORONOI) {
            color = generateVoronoi(pos);
          }
          
          color.a *= u_opacity;
          fragColor = color;
        }`;
    }
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }
    
    return shader;
  }

  private setupGeometry(): void {
    // Create a full-screen quad
    const vertices = new Float32Array([
      // Position  // TexCoord
      -1.0, -1.0,  0.0, 0.0,
       1.0, -1.0,  1.0, 0.0,
       1.0,  1.0,  1.0, 1.0,
      -1.0,  1.0,  0.0, 1.0
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);
    
    // Create vertex buffer
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    
    // Create index buffer
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    
    // Create VAO
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);
    
    // Setup attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    const positionLoc = this.gl.getAttribLocation(this.shaderProgram!, 'a_position');
    const texCoordLoc = this.gl.getAttribLocation(this.shaderProgram!, 'a_texCoord');
    
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 4 * 4, 0);
    
    this.gl.enableVertexAttribArray(texCoordLoc);
    this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 4 * 4, 2 * 4);
    
    this.gl.bindVertexArray(null);
  }

  private setupFramebuffer(): void {
    this.framebuffer = this.gl.createFramebuffer();
    this.colorTexture = this.gl.createTexture();
    this.depthTexture = this.gl.createTexture();
    
    this.resizeFramebuffer(this.contextManager.getSize());
  }

  private resizeFramebuffer(size: Size): void {
    if (this.currentSize.width === size.width && this.currentSize.height === size.height) {
      return;
    }
    
    this.currentSize = size;
    
    // Resize color texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA8,
      size.width, size.height, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    // Resize depth texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24,
      size.width, size.height, 0,
      this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    
    // Setup framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.colorTexture, 0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D, this.depthTexture, 0
    );
    
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer is not complete');
    }
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private cacheUniformLocations(): void {
    if (!this.shaderProgram) return;
    
    const uniformNames = [
      'u_time', 'u_resolution', 'u_transform',
      'u_primaryColor', 'u_secondaryColor', 'u_backgroundColor',
      'u_opacity', 'u_patternType', 'u_scale', 'u_rotation', 'u_offset',
      'u_complexity', 'u_symmetry', 'u_strokeWidth', 'u_smoothness',
      'u_animationSpeed', 'u_animationAmplitude', 'u_animationEnabled',
      'u_fractalCenter', 'u_fractalZoom', 'u_fractalIterations',
      'u_juliaConstant', 'u_voronoiPointCount', 'u_voronoiSeed'
    ];
    
    for (const name of uniformNames) {
      const location = this.gl.getUniformLocation(this.shaderProgram, name);
      if (location !== null) {
        this.uniforms.set(name, location);
      }
    }
  }

  /**
   * Render a parametric pattern
   */
  render(parameters: RenderParameters): void {
    if (!this.isInitialized || !this.shaderProgram) {
      throw new Error('Renderer not initialized');
    }
    
    const startTime = performance.now();
    
    // Update framebuffer size if needed
    this.resizeFramebuffer(parameters.resolution);
    
    // Bind framebuffer for offscreen rendering
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, parameters.resolution.width, parameters.resolution.height);
    
    // Clear
    this.gl.clearColor(
      parameters.colors.background.r,
      parameters.colors.background.g,
      parameters.colors.background.b,
      parameters.colors.background.a
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Use shader program
    this.gl.useProgram(this.shaderProgram);
    
    // Set uniforms
    this.setUniforms(parameters);
    
    // Bind geometry
    this.gl.bindVertexArray(this.vao);
    
    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    
    // Unbind
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    // Update performance metrics
    const endTime = performance.now();
    this.updatePerformanceMetrics(endTime - startTime);
  }

  /**
   * Render directly to canvas
   */
  renderToCanvas(parameters: RenderParameters): void {
    if (!this.isInitialized || !this.shaderProgram) {
      throw new Error('Renderer not initialized');
    }
    
    const startTime = performance.now();
    
    // Render to default framebuffer (canvas)
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, parameters.resolution.width, parameters.resolution.height);
    
    // Clear
    this.gl.clearColor(
      parameters.colors.background.r,
      parameters.colors.background.g,
      parameters.colors.background.b,
      parameters.colors.background.a
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    this.gl.useProgram(this.shaderProgram);
    
    // Set uniforms
    this.setUniforms(parameters);
    
    // Bind geometry
    this.gl.bindVertexArray(this.vao);
    
    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    
    // Unbind
    this.gl.bindVertexArray(null);
    
    // Update performance metrics
    const endTime = performance.now();
    this.updatePerformanceMetrics(endTime - startTime);
  }

  /**
   * Get the rendered texture
   */
  getTexture(): WebGLTexture | null {
    return this.colorTexture;
  }

  /**
   * Read pixels from the framebuffer
   */
  readPixels(x: number, y: number, width: number, height: number): Uint8Array {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    
    const pixels = new Uint8Array(width * height * 4);
    this.gl.readPixels(x, y, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    return pixels;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    fps: number;
    avgRenderTime: number;
    minRenderTime: number;
    maxRenderTime: number;
  } {
    if (this.renderTimes.length === 0) {
      return { fps: 0, avgRenderTime: 0, minRenderTime: 0, maxRenderTime: 0 };
    }
    
    const avg = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    const min = Math.min(...this.renderTimes);
    const max = Math.max(...this.renderTimes);
    
    return {
      fps: this.currentFPS,
      avgRenderTime: avg,
      minRenderTime: min,
      maxRenderTime: max
    };
  }

  private setUniforms(parameters: RenderParameters): void {
    const { patternType, time, resolution, transform, colors, opacity, animation, patternSpecific } = parameters;
    
    // Basic uniforms
    this.setUniform('u_time', time);
    this.setUniform('u_resolution', [resolution.width, resolution.height]);
    this.setUniform('u_primaryColor', [colors.primary.r, colors.primary.g, colors.primary.b, colors.primary.a]);
    this.setUniform('u_secondaryColor', [colors.secondary.r, colors.secondary.g, colors.secondary.b, colors.secondary.a]);
    this.setUniform('u_backgroundColor', [colors.background.r, colors.background.g, colors.background.b, colors.background.a]);
    this.setUniform('u_opacity', opacity);
    
    // Pattern type
    this.setUniform('u_patternType', this.getPatternTypeIndex(patternType));
    
    // Transform uniforms
    this.setUniform('u_scale', transform.scale);
    this.setUniform('u_rotation', transform.rotation);
    this.setUniform('u_offset', [transform.offset.x, transform.offset.y]);
    
    // Animation uniforms
    this.setUniform('u_animationEnabled', animation.enabled);
    this.setUniform('u_animationSpeed', animation.speed);
    this.setUniform('u_animationAmplitude', animation.amplitude);
    
    // Pattern-specific uniforms
    this.setUniform('u_complexity', patternSpecific.get('complexity') || 1.0);
    this.setUniform('u_symmetry', patternSpecific.get('symmetry') || 8.0);
    this.setUniform('u_strokeWidth', patternSpecific.get('strokeWidth') || 0.02);
    this.setUniform('u_smoothness', patternSpecific.get('smoothness') || 0.01);
    
    // Fractal uniforms
    const fractalCenter = patternSpecific.get('fractalCenter') || { x: -0.5, y: 0.0 };
    this.setUniform('u_fractalCenter', [fractalCenter.x, fractalCenter.y]);
    this.setUniform('u_fractalZoom', patternSpecific.get('fractalZoom') || 1.0);
    this.setUniform('u_fractalIterations', patternSpecific.get('fractalIterations') || 100);
    
    const juliaConstant = patternSpecific.get('juliaConstant') || { x: -0.7, y: 0.27015 };
    this.setUniform('u_juliaConstant', [juliaConstant.x, juliaConstant.y]);
    
    // Voronoi uniforms
    this.setUniform('u_voronoiPointCount', patternSpecific.get('voronoiPointCount') || 50.0);
    this.setUniform('u_voronoiSeed', patternSpecific.get('voronoiSeed') || 0.0);
    
    // Transform matrix (identity for now)
    this.setUniform('u_transform', [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  }

  private setUniform(name: string, value: number | number[] | boolean): void {
    const location = this.uniforms.get(name);
    if (!location) return;
    
    if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (typeof value === 'boolean') {
      this.gl.uniform1i(location, value ? 1 : 0);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value);
          break;
        case 3:
          this.gl.uniform3fv(location, value);
          break;
        case 4:
          this.gl.uniform4fv(location, value);
          break;
        case 9:
          this.gl.uniformMatrix3fv(location, false, value);
          break;
        case 16:
          this.gl.uniformMatrix4fv(location, false, value);
          break;
      }
    }
  }

  private getPatternTypeIndex(patternType: MathematicalPatternType): number {
    switch (patternType) {
      case MathematicalPatternType.ISLAMIC_GEOMETRIC: return 0;
      case MathematicalPatternType.PENROSE_TILING: return 1;
      case MathematicalPatternType.TRUCHET_TILES: return 2;
      case MathematicalPatternType.MANDELBROT: return 3;
      case MathematicalPatternType.JULIA_SET: return 4;
      case MathematicalPatternType.VORONOI: return 5;
      case MathematicalPatternType.GIRIH_TILES: return 6;
      case MathematicalPatternType.CELTIC_KNOT: return 7;
      default: return 0;
    }
  }

  private updatePerformanceMetrics(renderTime: number): void {
    this.renderTimes.push(renderTime);
    
    // Keep only last 60 frames
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }
    
    // Update FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFPSTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFPSTime = now;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Delete shader program
    if (this.shaderProgram) {
      this.gl.deleteProgram(this.shaderProgram);
      this.shaderProgram = null;
    }
    
    // Delete buffers
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    
    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
      this.indexBuffer = null;
    }
    
    // Delete VAO
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
    
    // Delete framebuffer and textures
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;
    }
    
    if (this.colorTexture) {
      this.gl.deleteTexture(this.colorTexture);
      this.colorTexture = null;
    }
    
    if (this.depthTexture) {
      this.gl.deleteTexture(this.depthTexture);
      this.depthTexture = null;
    }
    
    // Clear maps
    this.uniforms.clear();
    this.attributes.clear();
    
    this.isInitialized = false;
  }
}