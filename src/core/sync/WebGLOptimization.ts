/**
 * WebGL Optimization Layer for Genshi Studio Sync Engine
 * Provides GPU-accelerated rendering for real-time synchronization
 */

import { SyncChange, ModeType, ChangeType } from './SynchronizationEngine'
import { DrawData, ParametricData, GrowthData } from './TranslationLayers'

// WebGL rendering context and resources
interface WebGLResources {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  programs: Map<string, WebGLProgram>
  buffers: Map<string, WebGLBuffer>
  textures: Map<string, WebGLTexture>
  framebuffers: Map<string, WebGLFramebuffer>
}

// Rendering batch for efficient GPU operations
interface RenderBatch {
  mode: ModeType
  changeType: ChangeType
  vertexData: Float32Array
  indexData?: Uint16Array
  uniforms: Record<string, any>
  textureSlots: number[]
  instances: number
}

// Performance optimization settings
interface OptimizationSettings {
  batchSize: number
  useInstancing: boolean
  enableMipMaps: boolean
  cullBackFaces: boolean
  useDepthTesting: boolean
  frameBufferSize: { width: number; height: number }
  antiAliasing: boolean
}

/**
 * WebGL Optimization Engine for real-time rendering
 */
export class WebGLOptimization {
  private resources: WebGLResources | null = null
  private renderQueue: RenderBatch[] = []
  private settings: OptimizationSettings
  private isInitialized = false
  private canvas: HTMLCanvasElement | null = null
  private animationFrame: number | null = null
  private frameTime = 0
  private lastFrameTime = 0
  
  // Shader sources
  private readonly vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    attribute float a_pointSize;
    
    uniform mat3 u_transform;
    uniform vec2 u_resolution;
    uniform float u_time;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    
    void main() {
      vec3 position = u_transform * vec3(a_position, 1.0);
      vec2 clipSpace = ((position.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
      
      gl_Position = vec4(clipSpace, 0.0, 1.0);
      gl_PointSize = a_pointSize;
      
      v_color = a_color;
      v_texCoord = a_texCoord;
    }
  `
  
  private readonly fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    uniform float u_opacity;
    uniform float u_time;
    uniform vec2 u_resolution;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    
    void main() {
      vec4 textureColor = texture2D(u_texture, v_texCoord);
      vec4 finalColor = v_color * textureColor;
      finalColor.a *= u_opacity;
      
      gl_FragColor = finalColor;
    }
  `
  
  // Growth pattern shader for organic rendering
  private readonly growthFragmentShader = `
    precision mediump float;
    
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_growthColors[3];
    uniform float u_growthRate;
    uniform float u_density;
    
    varying vec2 v_texCoord;
    
    // Noise function for organic growth
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 st = v_texCoord * u_resolution / min(u_resolution.x, u_resolution.y);
      
      // Multi-octave noise for organic patterns
      float n = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      
      for (int i = 0; i < 4; i++) {
        n += noise(st * frequency + u_time * u_growthRate) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      
      // Growth pattern based on density
      float growth = smoothstep(0.0, 1.0, n * u_density);
      
      // Color mixing based on growth intensity
      vec3 color = mix(u_growthColors[0], u_growthColors[1], growth);
      color = mix(color, u_growthColors[2], growth * 0.5);
      
      gl_FragColor = vec4(color, growth);
    }
  `
  
  constructor() {
    this.settings = {
      batchSize: 1000,
      useInstancing: true,
      enableMipMaps: true,
      cullBackFaces: true,
      useDepthTesting: false,
      frameBufferSize: { width: 1920, height: 1080 },
      antiAliasing: true
    }
    
    console.log('🎮 WebGLOptimization initialized')
  }
  
  /**
   * Initialize WebGL context and resources
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas
    
    // Get WebGL context with optimization settings
    const contextAttributes: WebGLContextAttributes = {
      alpha: true,
      antialias: this.settings.antiAliasing,
      depth: this.settings.useDepthTesting,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    }
    
    const gl = canvas.getContext('webgl2', contextAttributes) || 
                canvas.getContext('webgl', contextAttributes)
    
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    
    this.resources = {
      gl,
      programs: new Map(),
      buffers: new Map(),
      textures: new Map(),
      framebuffers: new Map()
    }
    
    // Initialize shaders and resources
    await this.initializeShaders()
    await this.initializeBuffers()
    await this.initializeTextures()
    
    // Setup WebGL state
    this.setupWebGLState()
    
    // Start render loop
    this.startRenderLoop()
    
    this.isInitialized = true
    console.log('✅ WebGL optimization layer initialized')
  }
  
  /**
   * Add a change to the render queue for batched processing
   */
  public queueRender(change: SyncChange): void {
    if (!this.isInitialized || !this.resources) return
    
    const batch = this.createRenderBatch(change)
    if (batch) {
      this.renderQueue.push(batch)
    }
  }
  
  /**
   * Render all queued changes in optimized batches
   */
  public renderFrame(): void {
    if (!this.isInitialized || !this.resources || this.renderQueue.length === 0) return
    
    const gl = this.resources.gl
    const startTime = performance.now()
    
    // Clear frame
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT | (this.settings.useDepthTesting ? gl.DEPTH_BUFFER_BIT : 0))
    
    // Group batches by mode for optimal rendering
    const batchGroups = this.groupBatchesByMode()
    
    // Render each group
    for (const [mode, batches] of batchGroups) {
      this.renderModeGroup(mode, batches)
    }
    
    // Clear render queue
    this.renderQueue = []
    
    // Update performance metrics
    this.frameTime = performance.now() - startTime
  }
  
  /**
   * Update optimization settings
   */
  public updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    if (this.isInitialized && this.resources) {
      this.setupWebGLState()
    }
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return {
      frameTime: this.frameTime,
      fps: this.frameTime > 0 ? 1000 / this.frameTime : 60,
      queueSize: this.renderQueue.length,
      memoryUsage: this.estimateMemoryUsage(),
      batchCount: this.renderQueue.length
    }
  }
  
  /**
   * Cleanup WebGL resources
   */
  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    
    if (this.resources) {
      const gl = this.resources.gl
      
      // Delete programs
      for (const program of this.resources.programs.values()) {
        gl.deleteProgram(program)
      }
      
      // Delete buffers
      for (const buffer of this.resources.buffers.values()) {
        gl.deleteBuffer(buffer)
      }
      
      // Delete textures
      for (const texture of this.resources.textures.values()) {
        gl.deleteTexture(texture)
      }
      
      // Delete framebuffers
      for (const framebuffer of this.resources.framebuffers.values()) {
        gl.deleteFramebuffer(framebuffer)
      }
    }
    
    this.resources = null
    this.isInitialized = false
    console.log('🧹 WebGL resources cleaned up')
  }
  
  // Private methods
  
  private async initializeShaders(): Promise<void> {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Create main shader program
    const mainProgram = this.createShaderProgram(
      this.vertexShaderSource,
      this.fragmentShaderSource
    )
    if (mainProgram) {
      this.resources.programs.set('main', mainProgram)
    }
    
    // Create growth shader program
    const growthProgram = this.createShaderProgram(
      this.vertexShaderSource,
      this.growthFragmentShader
    )
    if (growthProgram) {
      this.resources.programs.set('growth', growthProgram)
    }
    
    console.log('📐 Shaders initialized')
  }
  
  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.resources) return null
    
    const gl = this.resources.gl
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource)
    
    if (!vertexShader || !fragmentShader) return null
    
    const program = gl.createProgram()
    if (!program) return null
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program link error:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }
    
    // Clean up shaders
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    
    return program
  }
  
  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.resources) return null
    
    const gl = this.resources.gl
    const shader = gl.createShader(type)
    if (!shader) return null
    
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    
    return shader
  }
  
  private async initializeBuffers(): Promise<void> {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Create vertex buffer
    const vertexBuffer = gl.createBuffer()
    if (vertexBuffer) {
      this.resources.buffers.set('vertex', vertexBuffer)
    }
    
    // Create index buffer
    const indexBuffer = gl.createBuffer()
    if (indexBuffer) {
      this.resources.buffers.set('index', indexBuffer)
    }
    
    console.log('📦 Buffers initialized')
  }
  
  private async initializeTextures(): Promise<void> {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Create default white texture
    const whiteTexture = gl.createTexture()
    if (whiteTexture) {
      gl.bindTexture(gl.TEXTURE_2D, whiteTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                   new Uint8Array([255, 255, 255, 255]))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      this.resources.textures.set('white', whiteTexture)
    }
    
    console.log('🖼️ Textures initialized')
  }
  
  private setupWebGLState(): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Enable blending for transparency
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    
    // Setup depth testing if enabled
    if (this.settings.useDepthTesting) {
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
    }
    
    // Setup face culling if enabled
    if (this.settings.cullBackFaces) {
      gl.enable(gl.CULL_FACE)
      gl.cullFace(gl.BACK)
    }
    
    // Set viewport
    gl.viewport(0, 0, this.canvas?.width || 800, this.canvas?.height || 600)
  }
  
  private startRenderLoop(): void {
    const render = (currentTime: number) => {
      this.lastFrameTime = currentTime
      this.renderFrame()
      this.animationFrame = requestAnimationFrame(render)
    }
    
    this.animationFrame = requestAnimationFrame(render)
  }
  
  private createRenderBatch(change: SyncChange): RenderBatch | null {
    switch (change.sourceMode) {
      case ModeType.DRAW:
        return this.createDrawBatch(change)
      case ModeType.PARAMETRIC:
        return this.createParametricBatch(change)
      case ModeType.GROWTH:
        return this.createGrowthBatch(change)
      case ModeType.CODE:
        return this.createCodeBatch(change)
      default:
        return null
    }
  }
  
  private createDrawBatch(change: SyncChange): RenderBatch | null {
    const drawData: DrawData = change.data
    if (!drawData.strokes || drawData.strokes.length === 0) return null
    
    const vertices: number[] = []
    const indices: number[] = []
    let vertexIndex = 0
    
    // Convert strokes to vertex data
    for (const stroke of drawData.strokes) {
      if (stroke.points.length < 2) continue
      
      // Create line strip from stroke points
      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i]
        
        // Position (x, y)
        vertices.push(point.x, point.y)
        
        // Color (r, g, b, a)
        const color = this.hexToRgba(stroke.color)
        vertices.push(color.r, color.g, color.b, stroke.opacity)
        
        // Texture coordinates
        vertices.push(0, 0)
        
        // Point size
        vertices.push(stroke.width)
        
        // Create line indices
        if (i > 0) {
          indices.push(vertexIndex - 1, vertexIndex)
        }
        vertexIndex++
      }
    }
    
    return {
      mode: ModeType.DRAW,
      changeType: change.changeType,
      vertexData: new Float32Array(vertices),
      indexData: new Uint16Array(indices),
      uniforms: {
        u_opacity: 1.0,
        u_time: this.lastFrameTime / 1000
      },
      textureSlots: [0], // Use white texture
      instances: 1
    }
  }
  
  private createParametricBatch(change: SyncChange): RenderBatch | null {
    const parametricData: ParametricData = change.data
    if (!parametricData.activePattern) return null
    
    const pattern = parametricData.activePattern
    
    // Generate procedural geometry based on pattern type
    const geometry = this.generatePatternGeometry(pattern)
    
    return {
      mode: ModeType.PARAMETRIC,
      changeType: change.changeType,
      vertexData: geometry.vertices,
      indexData: geometry.indices,
      uniforms: {
        u_opacity: pattern.opacity,
        u_time: this.lastFrameTime / 1000,
        u_transform: this.createTransformMatrix(pattern.rotation, pattern.size)
      },
      textureSlots: [0],
      instances: 1
    }
  }
  
  private createGrowthBatch(change: SyncChange): RenderBatch | null {
    const growthData: GrowthData = change.data
    
    // Create fullscreen quad for shader-based growth rendering
    const vertices = new Float32Array([
      -1, -1,  0, 0, 0, 1,  0, 0,  1, // Bottom-left
       1, -1,  0, 0, 0, 1,  1, 0,  1, // Bottom-right
       1,  1,  0, 0, 0, 1,  1, 1,  1, // Top-right
      -1,  1,  0, 0, 0, 1,  0, 1,  1  // Top-left
    ])
    
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3])
    
    return {
      mode: ModeType.GROWTH,
      changeType: change.changeType,
      vertexData: vertices,
      indexData: indices,
      uniforms: {
        u_time: this.lastFrameTime / 1000,
        u_growthRate: growthData.settings.growthRate,
        u_density: growthData.settings.density,
        u_growthColors: [
          this.hexToRgba(growthData.settings.colors.primary),
          this.hexToRgba(growthData.settings.colors.secondary),
          this.hexToRgba(growthData.settings.colors.accent)
        ]
      },
      textureSlots: [],
      instances: 1
    }
  }
  
  private createCodeBatch(change: SyncChange): RenderBatch | null {
    // Code mode would render generated shapes
    return null // Placeholder for now
  }
  
  private groupBatchesByMode(): Map<ModeType, RenderBatch[]> {
    const groups = new Map<ModeType, RenderBatch[]>()
    
    for (const batch of this.renderQueue) {
      if (!groups.has(batch.mode)) {
        groups.set(batch.mode, [])
      }
      groups.get(batch.mode)!.push(batch)
    }
    
    return groups
  }
  
  private renderModeGroup(mode: ModeType, batches: RenderBatch[]): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Select appropriate shader program
    const programName = mode === ModeType.GROWTH ? 'growth' : 'main'
    const program = this.resources.programs.get(programName)
    if (!program) return
    
    gl.useProgram(program)
    
    // Render each batch
    for (const batch of batches) {
      this.renderBatch(batch, program)
    }
  }
  
  private renderBatch(batch: RenderBatch, program: WebGLProgram): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Upload vertex data
    const vertexBuffer = this.resources.buffers.get('vertex')
    if (vertexBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, batch.vertexData, gl.DYNAMIC_DRAW)
    }
    
    // Upload index data if present
    let indexCount = 0
    if (batch.indexData) {
      const indexBuffer = this.resources.buffers.get('index')
      if (indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indexData, gl.DYNAMIC_DRAW)
        indexCount = batch.indexData.length
      }
    }
    
    // Setup vertex attributes
    this.setupVertexAttributes(program)
    
    // Set uniforms
    this.setUniforms(program, batch.uniforms)
    
    // Bind textures
    this.bindTextures(batch.textureSlots)
    
    // Draw
    if (indexCount > 0) {
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0)
    } else {
      gl.drawArrays(gl.POINTS, 0, batch.vertexData.length / 9) // 9 components per vertex
    }
  }
  
  private setupVertexAttributes(program: WebGLProgram): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    const stride = 9 * 4 // 9 floats per vertex, 4 bytes per float
    
    // Position attribute
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0)
    }
    
    // Color attribute
    const colorLocation = gl.getAttribLocation(program, 'a_color')
    if (colorLocation >= 0) {
      gl.enableVertexAttribArray(colorLocation)
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, stride, 2 * 4)
    }
    
    // Texture coordinate attribute
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    if (texCoordLocation >= 0) {
      gl.enableVertexAttribArray(texCoordLocation)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, stride, 6 * 4)
    }
    
    // Point size attribute
    const pointSizeLocation = gl.getAttribLocation(program, 'a_pointSize')
    if (pointSizeLocation >= 0) {
      gl.enableVertexAttribArray(pointSizeLocation)
      gl.vertexAttribPointer(pointSizeLocation, 1, gl.FLOAT, false, stride, 8 * 4)
    }
  }
  
  private setUniforms(program: WebGLProgram, uniforms: Record<string, any>): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    // Set resolution uniform
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, this.canvas?.width || 800, this.canvas?.height || 600)
    }
    
    // Set transform matrix
    const transformLocation = gl.getUniformLocation(program, 'u_transform')
    if (transformLocation && uniforms.u_transform) {
      gl.uniformMatrix3fv(transformLocation, false, uniforms.u_transform)
    } else if (transformLocation) {
      // Identity matrix
      gl.uniformMatrix3fv(transformLocation, false, [1, 0, 0, 0, 1, 0, 0, 0, 1])
    }
    
    // Set other uniforms
    for (const [name, value] of Object.entries(uniforms)) {
      if (name === 'u_transform') continue // Already handled
      
      const location = gl.getUniformLocation(program, name)
      if (!location) continue
      
      if (typeof value === 'number') {
        gl.uniform1f(location, value)
      } else if (Array.isArray(value)) {
        if (value.length === 2) {
          gl.uniform2fv(location, value)
        } else if (value.length === 3) {
          if (name === 'u_growthColors') {
            // Special handling for color array
            gl.uniform3fv(location, value.flat().map(c => [c.r, c.g, c.b]).flat())
          } else {
            gl.uniform3fv(location, value)
          }
        } else if (value.length === 4) {
          gl.uniform4fv(location, value)
        }
      }
    }
  }
  
  private bindTextures(textureSlots: number[]): void {
    if (!this.resources) return
    
    const gl = this.resources.gl
    
    for (let i = 0; i < textureSlots.length; i++) {
      const slot = textureSlots[i]
      gl.activeTexture(gl.TEXTURE0 + i)
      
      const texture = this.resources.textures.get('white') // Default to white texture
      if (texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
      }
    }
  }
  
  private generatePatternGeometry(pattern: any): { vertices: Float32Array; indices: Uint16Array } {
    // Generate simple quad for pattern rendering
    const vertices = new Float32Array([
      0, 0,  1, 0, 0, 1,  0, 0,  pattern.size,
      1, 0,  1, 0, 0, 1,  1, 0,  pattern.size,
      1, 1,  1, 0, 0, 1,  1, 1,  pattern.size,
      0, 1,  1, 0, 0, 1,  0, 1,  pattern.size
    ])
    
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3])
    
    return { vertices, indices }
  }
  
  private createTransformMatrix(rotation: number, scale: number): Float32Array {
    const cos = Math.cos(rotation * Math.PI / 180)
    const sin = Math.sin(rotation * Math.PI / 180)
    
    return new Float32Array([
      cos * scale, -sin * scale, 0,
      sin * scale,  cos * scale, 0,
      0,           0,           1
    ])
  }
  
  private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      a: 1.0
    } : { r: 0, g: 0, b: 0, a: 1 }
  }
  
  private estimateMemoryUsage(): number {
    if (!this.resources) return 0
    
    let totalMemory = 0
    
    // Estimate buffer memory
    totalMemory += this.renderQueue.reduce((sum, batch) => {
      return sum + batch.vertexData.byteLength + (batch.indexData?.byteLength || 0)
    }, 0)
    
    // Estimate texture memory (rough calculation)
    totalMemory += this.resources.textures.size * 1024 * 1024 // 1MB per texture estimate
    
    return totalMemory
  }
}

// Export singleton instance
export const webglOptimization = new WebGLOptimization()