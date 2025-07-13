/**
 * Enhanced Unified Canvas System - True Multi-Mode Simultaneous Editing
 * All four modes (Draw, Parametric, Code, Growth) can edit the same artwork at once
 */

import { Renderer } from '../engine/Renderer';
import { EnhancedBrushEngine } from '../tools/EnhancedBrushEngine';
import { ParametricPatternEngine } from '../patterns/ParametricPatternEngine';
import { CodeExecutionEngine } from '../../core/execution/CodeExecutionEngine';
import { OrganicPatternGenerator } from '../patterns/OrganicPatternGenerator';
import { WebGLContextManager } from '../engine/WebGLContext';
import { Point, Color, Rectangle } from '../../types/graphics';

export enum CanvasMode {
  DRAW = 'draw',
  PARAMETRIC = 'parametric',
  CODE = 'code',
  GROWTH = 'growth'
}

interface ModeLayer {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  opacity: number;
  visible: boolean;
  dirty: boolean;
}

interface UnifiedState {
  // Shared artwork state
  artworkTexture: WebGLTexture;
  artworkFramebuffer: WebGLFramebuffer;
  
  // Mode-specific layers
  modeLayers: Map<CanvasMode, ModeLayer>;
  
  // Active interactions
  activeInteractions: Map<CanvasMode, any>;
  
  // Global transform
  transform: {
    zoom: number;
    panX: number;
    panY: number;
    rotation: number;
  };
}

export class EnhancedUnifiedCanvas {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private renderer: Renderer;
  
  // Mode engines
  private brushEngine: EnhancedBrushEngine;
  private parametricEngine: ParametricPatternEngine;
  private codeEngine: CodeExecutionEngine;
  private growthEngine: OrganicPatternGenerator;
  
  // Unified state
  private state: UnifiedState;
  
  // Render pipeline
  private compositeShader: WebGLProgram;
  private feedbackShader: WebGLProgram;
  private fullscreenQuad: WebGLBuffer;
  
  // Performance
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private fps: number = 60;
  
  // Interaction state
  private activeModes: Set<CanvasMode> = new Set();
  private interactionRoutes: Map<string, CanvasMode> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const contextManager = new WebGLContextManager(canvas);
    this.gl = contextManager.getContext();
    this.renderer = new Renderer(canvas);
    
    // Initialize unified state
    this.state = this.initializeUnifiedState();
    
    // Initialize mode engines
    this.initializeModeEngines();
    
    // Setup render pipeline
    this.setupRenderPipeline();
    
    // Enable all modes by default
    this.activateModes([CanvasMode.DRAW, CanvasMode.PARAMETRIC, CanvasMode.CODE, CanvasMode.GROWTH]);
    
    // Start render loop
    this.startRenderLoop();
    
    console.log('🎨 Enhanced Unified Canvas initialized - All modes active simultaneously');
  }

  private initializeUnifiedState(): UnifiedState {
    // Create main artwork texture
    const artworkTexture = this.createTexture(this.canvas.width, this.canvas.height);
    const artworkFramebuffer = this.createFramebuffer(artworkTexture);
    
    // Create mode layers
    const modeLayers = new Map<CanvasMode, ModeLayer>();
    
    for (const mode of Object.values(CanvasMode)) {
      const texture = this.createTexture(this.canvas.width, this.canvas.height);
      const framebuffer = this.createFramebuffer(texture);
      
      modeLayers.set(mode as CanvasMode, {
        texture,
        framebuffer,
        opacity: 1.0,
        visible: true,
        dirty: false
      });
    }
    
    return {
      artworkTexture,
      artworkFramebuffer,
      modeLayers,
      activeInteractions: new Map(),
      transform: {
        zoom: 1.0,
        panX: 0,
        panY: 0,
        rotation: 0
      }
    };
  }

  private initializeModeEngines(): void {
    // Drawing mode
    this.brushEngine = new EnhancedBrushEngine(this.renderer, this.gl);
    
    // Parametric mode
    this.parametricEngine = new ParametricPatternEngine();
    this.setupParametricDefaults();
    
    // Code mode
    this.codeEngine = new CodeExecutionEngine();
    this.codeEngine.connectGraphicsEngine(this);
    
    // Growth mode
    this.growthEngine = new OrganicPatternGenerator();
    this.setupGrowthDefaults();
  }

  private setupRenderPipeline(): void {
    // Create composite shader for blending layers
    this.compositeShader = this.createCompositeShader();
    
    // Create feedback shader for mode interactions
    this.feedbackShader = this.createFeedbackShader();
    
    // Create fullscreen quad for rendering
    this.fullscreenQuad = this.createFullscreenQuad();
  }

  private createCompositeShader(): WebGLProgram {
    const vertexSource = `#version 300 es
      in vec2 position;
      out vec2 uv;
      
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentSource = `#version 300 es
      precision highp float;
      
      in vec2 uv;
      out vec4 fragColor;
      
      uniform sampler2D baseLayer;
      uniform sampler2D drawLayer;
      uniform sampler2D parametricLayer;
      uniform sampler2D codeLayer;
      uniform sampler2D growthLayer;
      
      uniform float drawOpacity;
      uniform float parametricOpacity;
      uniform float codeOpacity;
      uniform float growthOpacity;
      
      uniform bool drawVisible;
      uniform bool parametricVisible;
      uniform bool codeVisible;
      uniform bool growthVisible;
      
      // Advanced blending functions
      vec3 blendScreen(vec3 base, vec3 blend) {
        return 1.0 - (1.0 - base) * (1.0 - blend);
      }
      
      vec3 blendMultiply(vec3 base, vec3 blend) {
        return base * blend;
      }
      
      vec3 blendOverlay(vec3 base, vec3 blend) {
        return mix(
          2.0 * base * blend,
          1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
          step(0.5, base)
        );
      }
      
      void main() {
        vec4 base = texture(baseLayer, uv);
        vec4 result = base;
        
        // Apply drawing layer (normal blend)
        if (drawVisible) {
          vec4 draw = texture(drawLayer, uv);
          result = mix(result, draw, draw.a * drawOpacity);
        }
        
        // Apply parametric layer (multiply blend for patterns)
        if (parametricVisible) {
          vec4 parametric = texture(parametricLayer, uv);
          result.rgb = mix(result.rgb, blendMultiply(result.rgb, parametric.rgb), parametric.a * parametricOpacity);
        }
        
        // Apply code layer (screen blend for additive effects)
        if (codeVisible) {
          vec4 code = texture(codeLayer, uv);
          result.rgb = mix(result.rgb, blendScreen(result.rgb, code.rgb), code.a * codeOpacity);
        }
        
        // Apply growth layer (overlay blend for organic effects)
        if (growthVisible) {
          vec4 growth = texture(growthLayer, uv);
          result.rgb = mix(result.rgb, blendOverlay(result.rgb, growth.rgb), growth.a * growthOpacity);
        }
        
        fragColor = result;
      }
    `;
    
    return this.compileShaderProgram(vertexSource, fragmentSource);
  }

  private createFeedbackShader(): WebGLProgram {
    const vertexSource = `#version 300 es
      in vec2 position;
      out vec2 uv;
      
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentSource = `#version 300 es
      precision highp float;
      
      in vec2 uv;
      out vec4 fragColor;
      
      uniform sampler2D inputTexture;
      uniform vec2 interactionPoint;
      uniform float interactionRadius;
      uniform vec3 feedbackColor;
      uniform float time;
      
      void main() {
        vec4 color = texture(inputTexture, uv);
        
        // Calculate distance from interaction point
        float dist = distance(uv, interactionPoint);
        
        // Create ripple effect
        float ripple = sin(dist * 50.0 - time * 5.0) * 0.5 + 0.5;
        ripple *= smoothstep(interactionRadius, 0.0, dist);
        ripple *= smoothstep(0.0, 0.1, dist);
        
        // Apply feedback
        color.rgb = mix(color.rgb, feedbackColor, ripple * 0.3);
        
        fragColor = color;
      }
    `;
    
    return this.compileShaderProgram(vertexSource, fragmentSource);
  }

  // Unified interaction system
  public handleInteraction(event: PointerEvent, type: 'down' | 'move' | 'up'): void {
    const point = this.getCanvasPoint(event);
    const pressure = (event as any).pressure || 1.0;
    
    // Route to all active modes simultaneously
    if (this.activeModes.has(CanvasMode.DRAW)) {
      this.handleDrawInteraction(point, pressure, type);
    }
    
    if (this.activeModes.has(CanvasMode.PARAMETRIC)) {
      this.handleParametricInteraction(point, type);
    }
    
    if (this.activeModes.has(CanvasMode.CODE)) {
      this.handleCodeInteraction(point, type);
    }
    
    if (this.activeModes.has(CanvasMode.GROWTH)) {
      this.handleGrowthInteraction(point, type);
    }
    
    // Mark all active mode layers as dirty
    this.activeModes.forEach(mode => {
      const layer = this.state.modeLayers.get(mode);
      if (layer) layer.dirty = true;
    });
  }

  private handleDrawInteraction(point: Point, pressure: number, type: 'down' | 'move' | 'up'): void {
    const layer = this.state.modeLayers.get(CanvasMode.DRAW)!;
    
    // Bind drawing layer framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
    
    const pressureData = { pressure, tiltX: 0, tiltY: 0, twist: 0 };
    const velocity = 0; // Calculate velocity from previous points if needed
    
    switch (type) {
      case 'down':
        this.brushEngine.startStroke(point, pressureData, velocity);
        this.state.activeInteractions.set(CanvasMode.DRAW, { drawing: true });
        break;
      case 'move':
        if (this.state.activeInteractions.get(CanvasMode.DRAW)?.drawing) {
          this.brushEngine.continueStroke(point, pressureData, velocity);
        }
        break;
      case 'up':
        this.brushEngine.endStroke();
        this.state.activeInteractions.delete(CanvasMode.DRAW);
        break;
    }
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private handleParametricInteraction(point: Point, type: 'down' | 'move' | 'up'): void {
    if (type === 'down') {
      // Generate parametric pattern at interaction point
      const layer = this.state.modeLayers.get(CanvasMode.PARAMETRIC)!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
      
      // Create pattern centered at point
      const pattern = this.parametricEngine.generatePattern('celtic', {
        center: point,
        scale: 50,
        rotation: Math.random() * Math.PI * 2,
        complexity: 3
      });
      
      // Render pattern to layer
      this.renderParametricPattern(pattern);
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      
      // Store interaction for visual feedback
      this.state.activeInteractions.set(CanvasMode.PARAMETRIC, {
        point,
        time: performance.now()
      });
    }
  }

  private handleCodeInteraction(point: Point, type: 'down' | 'move' | 'up'): void {
    if (type === 'down') {
      // Execute code visualization at point
      const layer = this.state.modeLayers.get(CanvasMode.CODE)!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
      
      // Example: Generate procedural shape
      const code = `
        // Procedural star at interaction point
        const cx = ${point.x};
        const cy = ${point.y};
        const spikes = 5;
        const outerRadius = 30;
        const innerRadius = 15;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.fill();
      `;
      
      this.codeEngine.execute(code).then(result => {
        if (result.success) {
          console.log('Code executed successfully');
        }
      });
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      
      this.state.activeInteractions.set(CanvasMode.CODE, {
        point,
        executing: true
      });
    }
  }

  private handleGrowthInteraction(point: Point, type: 'down' | 'move' | 'up'): void {
    if (type === 'down') {
      // Plant growth seed
      const layer = this.state.modeLayers.get(CanvasMode.GROWTH)!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
      
      // Initialize growth at point
      this.growthEngine.addSeed({
        position: point,
        type: 'organic',
        energy: 1.0,
        direction: { x: 0, y: -1 },
        age: 0
      });
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      
      this.state.activeInteractions.set(CanvasMode.GROWTH, {
        seeds: [point],
        growing: true
      });
    }
  }

  private render(): void {
    const startTime = performance.now();
    
    // Update growth simulation
    if (this.activeModes.has(CanvasMode.GROWTH)) {
      this.updateGrowthSimulation();
    }
    
    // Render dirty layers
    this.state.modeLayers.forEach((layer, mode) => {
      if (layer.dirty) {
        this.renderModeLayer(mode);
        layer.dirty = false;
      }
    });
    
    // Composite all layers to main canvas
    this.compositeLayersToCanvas();
    
    // Render interaction feedback
    this.renderInteractionFeedback();
    
    // Update performance metrics
    const frameTime = performance.now() - startTime;
    this.fps = Math.round(1000 / frameTime);
  }

  private compositeLayersToCanvas(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Use composite shader
    this.gl.useProgram(this.compositeShader);
    
    // Bind all layer textures
    const layers = [
      { name: 'baseLayer', texture: this.state.artworkTexture, unit: 0 },
      { name: 'drawLayer', texture: this.state.modeLayers.get(CanvasMode.DRAW)!.texture, unit: 1 },
      { name: 'parametricLayer', texture: this.state.modeLayers.get(CanvasMode.PARAMETRIC)!.texture, unit: 2 },
      { name: 'codeLayer', texture: this.state.modeLayers.get(CanvasMode.CODE)!.texture, unit: 3 },
      { name: 'growthLayer', texture: this.state.modeLayers.get(CanvasMode.GROWTH)!.texture, unit: 4 }
    ];
    
    layers.forEach(({ name, texture, unit }) => {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      const location = this.gl.getUniformLocation(this.compositeShader, name);
      this.gl.uniform1i(location, unit);
    });
    
    // Set opacity uniforms
    Object.values(CanvasMode).forEach(mode => {
      const layer = this.state.modeLayers.get(mode as CanvasMode)!;
      const opacityLoc = this.gl.getUniformLocation(this.compositeShader, `${mode}Opacity`);
      const visibleLoc = this.gl.getUniformLocation(this.compositeShader, `${mode}Visible`);
      this.gl.uniform1f(opacityLoc, layer.opacity);
      this.gl.uniform1i(visibleLoc, layer.visible ? 1 : 0);
    });
    
    // Draw fullscreen quad
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuad);
    const posLoc = this.gl.getAttribLocation(this.compositeShader, 'position');
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(posLoc);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private renderInteractionFeedback(): void {
    // Show real-time feedback for all active interactions
    this.state.activeInteractions.forEach((interaction, mode) => {
      if (interaction.point) {
        this.renderModeFeedback(mode, interaction);
      }
    });
  }

  private renderModeFeedback(mode: CanvasMode, interaction: any): void {
    this.gl.useProgram(this.feedbackShader);
    
    // Set uniforms based on mode
    const colors = {
      [CanvasMode.DRAW]: [0.2, 0.5, 1.0],
      [CanvasMode.PARAMETRIC]: [0.8, 0.2, 0.8],
      [CanvasMode.CODE]: [0.2, 1.0, 0.4],
      [CanvasMode.GROWTH]: [1.0, 0.5, 0.2]
    };
    
    const pointLoc = this.gl.getUniformLocation(this.feedbackShader, 'interactionPoint');
    const colorLoc = this.gl.getUniformLocation(this.feedbackShader, 'feedbackColor');
    const timeLoc = this.gl.getUniformLocation(this.feedbackShader, 'time');
    
    const normalizedPoint = {
      x: interaction.point.x / this.canvas.width,
      y: 1.0 - (interaction.point.y / this.canvas.height)
    };
    
    this.gl.uniform2f(pointLoc, normalizedPoint.x, normalizedPoint.y);
    this.gl.uniform3fv(colorLoc, colors[mode]);
    this.gl.uniform1f(timeLoc, performance.now() / 1000);
    
    // Render feedback effect
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  // Utility methods
  private createTexture(width: number, height: number): WebGLTexture {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      width, height, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  private createFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) throw new Error('Failed to create framebuffer');
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );
    
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer incomplete');
    }
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return framebuffer;
  }

  private createFullscreenQuad(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('Failed to create buffer');
    
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    
    return buffer;
  }

  private compileShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
    
    const program = this.gl.createProgram();
    if (!program) throw new Error('Failed to create shader program');
    
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Failed to link shader program: ' + this.gl.getProgramInfoLog(program));
    }
    
    return program;
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Failed to compile shader: ' + this.gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  private getCanvasPoint(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private setupParametricDefaults(): void {
    // Set up default parametric patterns
    this.parametricEngine.registerPatternSet({
      id: 'default',
      name: 'Default Patterns',
      description: 'Built-in parametric patterns',
      groups: [],
      hierarchies: [],
      constraints: []
    });
  }

  private setupGrowthDefaults(): void {
    // Configure growth engine defaults
    this.growthEngine.setConfig({
      algorithm: 'organic',
      growthRate: 0.1,
      branchingProbability: 0.3,
      maxDepth: 5
    });
  }

  private updateGrowthSimulation(): void {
    const growth = this.state.activeInteractions.get(CanvasMode.GROWTH);
    if (growth?.growing) {
      const layer = this.state.modeLayers.get(CanvasMode.GROWTH)!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
      
      // Update growth simulation
      this.growthEngine.update(0.016); // 60fps
      this.growthEngine.render();
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      layer.dirty = true;
    }
  }

  private renderModeLayer(mode: CanvasMode): void {
    // Mode-specific rendering logic
    switch (mode) {
      case CanvasMode.DRAW:
        // Brush engine handles its own rendering
        break;
      case CanvasMode.PARAMETRIC:
        // Parametric patterns rendered on interaction
        break;
      case CanvasMode.CODE:
        // Code execution results rendered on demand
        break;
      case CanvasMode.GROWTH:
        // Growth simulation updated in updateGrowthSimulation
        break;
    }
  }

  private renderParametricPattern(pattern: any): void {
    // Render parametric pattern to current framebuffer
    // Implementation depends on pattern type
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  // Public API
  public activateModes(modes: CanvasMode[]): void {
    modes.forEach(mode => this.activeModes.add(mode));
  }

  public deactivateModes(modes: CanvasMode[]): void {
    modes.forEach(mode => this.activeModes.delete(mode));
  }

  public setModeOpacity(mode: CanvasMode, opacity: number): void {
    const layer = this.state.modeLayers.get(mode);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  public setModeVisibility(mode: CanvasMode, visible: boolean): void {
    const layer = this.state.modeLayers.get(mode);
    if (layer) {
      layer.visible = visible;
    }
  }

  public getPerformanceMetrics() {
    return {
      fps: this.fps,
      activeModes: Array.from(this.activeModes),
      activeInteractions: this.state.activeInteractions.size
    };
  }

  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Clean up WebGL resources
    this.state.modeLayers.forEach(layer => {
      this.gl.deleteTexture(layer.texture);
      this.gl.deleteFramebuffer(layer.framebuffer);
    });
    
    this.gl.deleteTexture(this.state.artworkTexture);
    this.gl.deleteFramebuffer(this.state.artworkFramebuffer);
    this.gl.deleteProgram(this.compositeShader);
    this.gl.deleteProgram(this.feedbackShader);
    this.gl.deleteBuffer(this.fullscreenQuad);
  }
}