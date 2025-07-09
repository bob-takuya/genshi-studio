/**
 * WebGL 2.0 Context Manager for Genshi Studio
 */

import { Size } from '../../types/graphics';

export class WebGLContextManager {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private pixelRatio: number;
  private size: Size;
  private extensions: Map<string, any> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.size = { width: 0, height: 0 };

    const gl = this.initializeContext();
    if (!gl) {
      throw new Error('WebGL 2.0 is not supported in this browser');
    }
    this.gl = gl;

    this.loadExtensions();
    this.setupDefaults();
    this.resize();
  }

  private initializeContext(): WebGL2RenderingContext | null {
    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: false, // We'll implement our own AA
      depth: false,
      stencil: true,
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      desynchronized: true, // Better performance
      powerPreference: 'high-performance'
    };

    return this.canvas.getContext('webgl2', contextOptions);
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
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
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

    this.gl.viewport(0, 0, realWidth, realHeight);
    this.gl.scissor(0, 0, realWidth, realHeight);
  }

  clear(r = 0, g = 0, b = 0, a = 0): void {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  getContext(): WebGL2RenderingContext {
    return this.gl;
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
}