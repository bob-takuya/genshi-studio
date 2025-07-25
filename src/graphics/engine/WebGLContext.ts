/**
 * WebGL 2.0 Context Manager for Genshi Studio
 * With Canvas2D fallback for maximum compatibility
 */

import { Size } from '../../types/graphics';
import { Canvas2DFallbackManager } from './Canvas2DFallback';

export class WebGLContextManager {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private fallbackManager: Canvas2DFallbackManager | null = null;
  private pixelRatio: number;
  private size: Size;
  private extensions: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  private isUsingFallback: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    this.size = { width: 0, height: 0 };

    try {
      const startTime = Date.now();
      console.log('Initializing WebGL context...');
      
      const gl = this.initializeContext();
      if (!gl) {
        throw new Error('WebGL 2.0 context creation failed');
      }
      
      this.gl = gl;
      this.loadExtensions();
      this.setupDefaults();
      this.resize();
      
      this.isInitialized = true;
      console.log(`WebGL initialized in ${Date.now() - startTime}ms`);
    } catch (webglError) {
      console.warn('WebGL initialization error:', webglError);
      
      // Try WebGL 1 as intermediate fallback
      const gl1 = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      if (gl1) {
        console.warn('Falling back to WebGL 1.0');
        this.gl = gl1 as any; // Type assertion for compatibility
        this.setupDefaults();
        this.resize();
        this.isInitialized = true;
      } else {
        console.warn('WebGL completely unavailable, using Canvas2D fallback');
        
        // Ultimate fallback to Canvas2D
        try {
          this.fallbackManager = new Canvas2DFallbackManager(this.canvas);
          this.isUsingFallback = true;
          this.isInitialized = true;
          console.log('Canvas2D fallback initialized successfully');
        } catch (fallbackError) {
          console.error('Canvas2D fallback also failed:', fallbackError);
          throw new Error(`Both WebGL and Canvas2D failed: WebGL - ${webglError.message}, Canvas2D - ${fallbackError.message}`);
        }
      }
    }
  }

  private initializeContext(): WebGL2RenderingContext | null {
    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: false, // We'll implement our own AA
      depth: false,
      stencil: false, // Disable stencil to reduce memory usage
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      desynchronized: true, // Better performance
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false // Don't fail on software rendering
    };

    try {
      // Try to get WebGL2 context with timeout protection
      const gl = this.canvas.getContext('webgl2', contextOptions);
      
      if (gl) {
        // Test if context is actually usable
        const testProgram = gl.createProgram();
        if (!testProgram) {
          console.warn('WebGL2 context is not fully functional');
          return null;
        }
        gl.deleteProgram(testProgram);
      }
      
      return gl;
    } catch (error) {
      console.error('WebGL2 context creation error:', error);
      return null;
    }
  }

  private loadExtensions(): void {
    // Load useful extensions
    const desiredExtensions = [
      'EXT_color_buffer_float',
      'OES_texture_float_linear',
      'EXT_float_blend',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc1',
      'WEBGL_compressed_texture_astc'
    ];

    for (const ext of desiredExtensions) {
      const extension = this.gl.getExtension(ext);
      if (extension) {
        this.extensions.set(ext, extension);
      }
    }
  }

  private setupDefaults(): void {
    const gl = this.gl;
    if (!gl) return;

    try {
      // Enable alpha blending by default
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );

      // Set clear color to transparent
      gl.clearColor(0, 0, 0, 0);

      // Disable depth testing for 2D graphics
      gl.disable(gl.DEPTH_TEST);

      // Enable scissor test for viewport clipping
      gl.enable(gl.SCISSOR_TEST);

      // Set pixel unpack alignment for texture uploads
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      
      // Only set premultiply alpha if supported
      if (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL !== undefined) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      }
    } catch (error) {
      console.error('Error setting WebGL defaults:', error);
    }
  }

  resize(width?: number, height?: number): void {
    if (width === undefined || height === undefined) {
      width = this.canvas.clientWidth;
      height = this.canvas.clientHeight;
    }

    this.size = { width, height };

    // Apply pixel ratio for high DPI displays
    const realWidth = Math.floor(width * this.pixelRatio);
    const realHeight = Math.floor(height * this.pixelRatio);

    this.canvas.width = realWidth;
    this.canvas.height = realHeight;

    if (this.isUsingFallback && this.fallbackManager) {
      this.fallbackManager.resize(width, height);
    } else if (this.gl) {
      this.gl.viewport(0, 0, realWidth, realHeight);
      this.gl.scissor(0, 0, realWidth, realHeight);
    }
  }

  clear(r = 0, g = 0, b = 0, a = 0): void {
    if (this.isUsingFallback && this.fallbackManager) {
      this.fallbackManager.clear(r, g, b, a);
    } else if (this.gl) {
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }

  getContext(): WebGL2RenderingContext | null {
    return this.gl;
  }

  getFallbackManager(): Canvas2DFallbackManager | null {
    return this.fallbackManager;
  }

  isWebGL2(): boolean {
    return this.gl !== null && 'texStorage2D' in this.gl;
  }

  isWebGL1(): boolean {
    return this.gl !== null && !this.isWebGL2();
  }

  isCanvas2D(): boolean {
    return this.isUsingFallback && this.fallbackManager !== null;
  }

  isReady(): boolean {
    return this.isInitialized && (this.gl !== null || this.fallbackManager !== null);
  }

  getSize(): Size {
    return { ...this.size };
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  hasExtension(name: string): boolean {
    return this.extensions.has(name);
  }

  getExtension(name: string): any {
    return this.extensions.get(name);
  }

  // Performance monitoring
  getMemoryInfo(): { texture: number; buffer: number } | null {
    const ext = this.gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;

    // This is an approximation - actual implementation would need more sophisticated tracking
    return {
      texture: 0, // Would track texture memory usage
      buffer: 0   // Would track buffer memory usage
    };
  }

  destroy(): void {
    if (this.isUsingFallback && this.fallbackManager) {
      // Clean up Canvas2D fallback resources
      this.fallbackManager.destroy();
      this.fallbackManager = null;
    } else if (this.gl) {
      // Clean up WebGL resources
      this.gl.useProgram(null);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      
      // Lose context to free GPU resources
      const loseContext = this.gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
    
    this.isInitialized = false;
    this.isUsingFallback = false;
  }
}