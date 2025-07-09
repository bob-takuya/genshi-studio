/**
 * Core Rendering System for Genshi Studio
 */

import { WebGLContextManager } from './WebGLContext';
import { ShaderManager } from './ShaderManager';
import { Transform, Color, Rectangle, BlendMode } from '../../types/graphics';

export class Renderer {
  private contextManager: WebGLContextManager;
  private shaderManager: ShaderManager;
  private gl: WebGL2RenderingContext;
  
  // Buffers
  private quadBuffer: WebGLBuffer;
  private instanceBuffer: WebGLBuffer;
  
  // State
  private currentTransform: Transform;
  private transformStack: Transform[] = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fps: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.contextManager = new WebGLContextManager(canvas);
    this.gl = this.contextManager.getContext();
    this.shaderManager = new ShaderManager(this.gl);
    
    this.currentTransform = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };

    this.quadBuffer = this.createQuadBuffer();
    this.instanceBuffer = this.createInstanceBuffer();
    
    this.setupRenderLoop();
  }

  private createQuadBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('Failed to create quad buffer');

    // Unit quad vertices
    const vertices = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    return buffer;
  }

  private createInstanceBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('Failed to create instance buffer');

    // Reserve space for instance data
    const maxInstances = 10000;
    const bytesPerInstance = 32; // Position(8) + Size(8) + Color(16)
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER, 
      maxInstances * bytesPerInstance, 
      this.gl.DYNAMIC_DRAW
    );

    return buffer;
  }

  private setupRenderLoop(): void {
    const animate = (currentTime: number) => {
      // Calculate FPS
      if (this.lastFrameTime > 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.fps = 1000 / deltaTime;
      }
      this.lastFrameTime = currentTime;
      this.frameCount++;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Transform operations
  pushTransform(): void {
    this.transformStack.push({ ...this.currentTransform });
  }

  popTransform(): void {
    const transform = this.transformStack.pop();
    if (transform) {
      this.currentTransform = transform;
    }
  }

  translate(x: number, y: number): void {
    this.currentTransform.translateX += x;
    this.currentTransform.translateY += y;
  }

  scale(x: number, y: number): void {
    this.currentTransform.scaleX *= x;
    this.currentTransform.scaleY *= y;
  }

  rotate(angle: number): void {
    this.currentTransform.rotation += angle;
  }

  private getTransformMatrix(): Float32Array {
    const { translateX, translateY, scaleX, scaleY, rotation } = this.currentTransform;
    
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    // 3x3 transformation matrix in column-major order
    return new Float32Array([
      cos * scaleX, sin * scaleX, 0,
      -sin * scaleY, cos * scaleY, 0,
      translateX, translateY, 1
    ]);
  }

  // Drawing operations
  clear(color?: Color): void {
    if (color) {
      this.contextManager.clear(color.r, color.g, color.b, color.a);
    } else {
      this.contextManager.clear();
    }
  }

  fillRect(x: number, y: number, width: number, height: number, color: Color): void {
    const shader = this.shaderManager.useShader('basic2d');
    if (!shader) return;

    this.pushTransform();
    this.translate(x, y);
    this.scale(width, height);

    // Set uniforms
    const size = this.contextManager.getSize();
    this.shaderManager.setUniform('u_matrix', this.getTransformMatrix());
    this.shaderManager.setUniform('u_resolution', new Float32Array([size.width, size.height]));
    this.shaderManager.setUniform('u_useTexture', 0);

    // Set up vertex attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    
    const posLocation = shader.attributes.get('a_position');
    if (posLocation !== undefined) {
      this.gl.enableVertexAttribArray(posLocation);
      this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Set color attribute
    const colorLocation = shader.attributes.get('a_color');
    if (colorLocation !== undefined) {
      this.gl.disableVertexAttribArray(colorLocation);
      this.gl.vertexAttrib4f(colorLocation, color.r, color.g, color.b, color.a);
    }

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.popTransform();
  }

  drawCircle(x: number, y: number, radius: number, color: Color, segments: number = 32): void {
    const shader = this.shaderManager.useShader('basic2d');
    if (!shader) return;

    // Create circle vertices
    const vertices: number[] = [x, y]; // Center point
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius
      );
    }

    // Create temporary buffer for circle
    const buffer = this.gl.createBuffer();
    if (!buffer) return;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);

    // Set uniforms
    const size = this.contextManager.getSize();
    this.shaderManager.setUniform('u_matrix', this.getTransformMatrix());
    this.shaderManager.setUniform('u_resolution', new Float32Array([size.width, size.height]));
    this.shaderManager.setUniform('u_useTexture', 0);

    // Set attributes
    const posLocation = shader.attributes.get('a_position');
    if (posLocation !== undefined) {
      this.gl.enableVertexAttribArray(posLocation);
      this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    const colorLocation = shader.attributes.get('a_color');
    if (colorLocation !== undefined) {
      this.gl.disableVertexAttribArray(colorLocation);
      this.gl.vertexAttrib4f(colorLocation, color.r, color.g, color.b, color.a);
    }

    // Draw circle
    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vertices.length / 2);

    // Clean up
    this.gl.deleteBuffer(buffer);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number = 1): void {
    // For proper line rendering, we create a quad that represents the line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    this.pushTransform();
    this.translate(x1, y1);
    this.rotate(angle);
    this.fillRect(0, -lineWidth / 2, length, lineWidth, color);
    this.popTransform();
  }

  setBlendMode(mode: BlendMode): void {
    const gl = this.gl;

    switch (mode) {
      case BlendMode.Normal:
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case BlendMode.Multiply:
        gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case BlendMode.Screen:
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case BlendMode.Overlay:
        // Overlay is complex and would need a shader implementation
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
      default:
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }

  // Performance metrics
  getFPS(): number {
    return Math.round(this.fps);
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getMemoryUsage(): { texture: number; buffer: number } | null {
    return this.contextManager.getMemoryInfo();
  }

  // Resource management
  resize(width: number, height: number): void {
    this.contextManager.resize(width, height);
  }

  destroy(): void {
    this.gl.deleteBuffer(this.quadBuffer);
    this.gl.deleteBuffer(this.instanceBuffer);
    this.shaderManager.destroy();
    this.contextManager.destroy();
  }
}