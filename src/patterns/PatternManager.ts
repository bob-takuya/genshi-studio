/**
 * Pattern Manager
 * Handles pattern rendering, caching, and application to canvas elements
 */

import { CulturalPatternGenerator, PatternType } from '../graphics/patterns/CulturalPatternGenerator'
import { 
  PatternDefinition, 
  PatternInstance, 
  PatternRenderOptions,
  PatternApplication,
  CanvasBlendMode 
} from './types'
import { JAPANESE_PATTERNS } from './JapanesePatterns'
import { Color } from '../types/graphics'

export class PatternManager {
  private patternGenerator: CulturalPatternGenerator
  private patternCache: Map<string, CanvasPattern> = new Map()
  private imageDataCache: Map<string, ImageData> = new Map()
  private definitions: Map<string, PatternDefinition> = new Map()
  private activeInstances: Map<string, PatternInstance> = new Map()

  constructor() {
    this.patternGenerator = new CulturalPatternGenerator()
    this.initializeDefinitions()
  }

  private initializeDefinitions(): void {
    // Load Japanese patterns
    JAPANESE_PATTERNS.forEach(pattern => {
      this.definitions.set(pattern.id, pattern)
    })
  }

  /**
   * Get all available pattern definitions
   */
  getPatternDefinitions(): PatternDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * Get pattern definition by ID
   */
  getPatternDefinition(id: string): PatternDefinition | undefined {
    return this.definitions.get(id)
  }

  /**
   * Create a pattern instance with custom settings
   */
  createPatternInstance(
    patternId: string, 
    customization: Partial<PatternInstance>
  ): PatternInstance {
    const definition = this.definitions.get(patternId)
    if (!definition) {
      throw new Error(`Pattern ${patternId} not found`)
    }

    const instance: PatternInstance = {
      id: `${patternId}_${Date.now()}`,
      patternId,
      scale: customization.scale || definition.customizable.scale.default,
      rotation: customization.rotation || 0,
      opacity: customization.opacity || definition.customizable.opacity.default,
      colors: customization.colors || {
        primary: { r: 0, g: 0, b: 0, a: 1 },
        secondary: { r: 1, g: 1, b: 1, a: 1 },
        background: { r: 1, g: 1, b: 1, a: 0 }
      },
      complexity: customization.complexity,
      blendMode: customization.blendMode || CanvasBlendMode.NORMAL
    }

    this.activeInstances.set(instance.id, instance)
    return instance
  }

  /**
   * Render pattern to ImageData
   */
  renderPatternToImageData(
    patternId: string,
    options: PatternRenderOptions
  ): ImageData {
    // Create cache key
    const cacheKey = this.createCacheKey(patternId, options)
    
    // Check cache
    const cached = this.imageDataCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Map pattern ID to PatternType enum
    const patternType = this.mapPatternIdToType(patternId)
    
    // Generate pattern
    const imageData = this.patternGenerator.generatePattern(
      patternType,
      options.width,
      options.height,
      {
        scale: options.scale,
        rotation: options.rotation * Math.PI / 180, // Convert to radians
        color1: options.colors.primary,
        color2: options.colors.secondary,
        complexity: options.complexity
      }
    )

    // Apply opacity if needed
    if (options.opacity < 1) {
      this.applyOpacity(imageData, options.opacity)
    }

    // Cache the result
    this.imageDataCache.set(cacheKey, imageData)
    
    return imageData
  }

  /**
   * Create a canvas pattern for use with fill/stroke
   */
  createCanvasPattern(
    ctx: CanvasRenderingContext2D,
    patternInstance: PatternInstance,
    width: number = 512,
    height: number = 512
  ): CanvasPattern | null {
    const cacheKey = `pattern_${patternInstance.id}_${width}_${height}`
    
    // Check cache
    const cached = this.patternCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Create off-screen canvas
    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = width
    patternCanvas.height = height
    const patternCtx = patternCanvas.getContext('2d')
    
    if (!patternCtx) {
      return null
    }

    // Render pattern to image data
    const imageData = this.renderPatternToImageData(patternInstance.patternId, {
      width,
      height,
      scale: patternInstance.scale,
      rotation: patternInstance.rotation,
      opacity: patternInstance.opacity,
      colors: patternInstance.colors,
      complexity: patternInstance.complexity
    })

    // Put image data on pattern canvas
    patternCtx.putImageData(imageData, 0, 0)

    // Create pattern
    const pattern = ctx.createPattern(patternCanvas, 'repeat')
    
    if (pattern) {
      this.patternCache.set(cacheKey, pattern)
    }

    return pattern
  }

  /**
   * Apply pattern to a shape or path
   */
  applyPatternToContext(
    ctx: CanvasRenderingContext2D,
    application: PatternApplication,
    bounds: { width: number; height: number }
  ): void {
    const pattern = this.createCanvasPattern(
      ctx,
      application.patternInstance,
      Math.min(bounds.width, 512),
      Math.min(bounds.height, 512)
    )

    if (!pattern) {
      return
    }

    // Save context state
    ctx.save()

    // Apply blend mode
    ctx.globalCompositeOperation = application.patternInstance.blendMode || 'source-over'

    // Apply pattern transform if needed
    if (application.offset.x !== 0 || application.offset.y !== 0) {
      pattern.setTransform({
        a: 1, b: 0, c: 0, d: 1,
        e: application.offset.x,
        f: application.offset.y
      })
    }

    // Apply pattern based on target type
    switch (application.targetType) {
      case 'fill':
        ctx.fillStyle = pattern
        break
      case 'stroke':
        ctx.strokeStyle = pattern
        break
      case 'background':
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, bounds.width, bounds.height)
        break
      case 'mask':
        // For mask, we need special handling
        ctx.globalCompositeOperation = 'destination-in'
        ctx.fillStyle = pattern
        break
    }

    // Restore context state
    ctx.restore()
  }

  /**
   * Export pattern instance as JSON
   */
  exportPatternInstance(instanceId: string): string {
    const instance = this.activeInstances.get(instanceId)
    if (!instance) {
      throw new Error(`Pattern instance ${instanceId} not found`)
    }
    return JSON.stringify(instance)
  }

  /**
   * Import pattern instance from JSON
   */
  importPatternInstance(json: string): PatternInstance {
    const instance = JSON.parse(json) as PatternInstance
    instance.id = `${instance.patternId}_${Date.now()}` // Generate new ID
    this.activeInstances.set(instance.id, instance)
    return instance
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.patternCache.clear()
    this.imageDataCache.clear()
  }

  /**
   * Get pattern preview as data URL
   */
  getPatternPreview(
    patternId: string,
    size: number = 128,
    options?: Partial<PatternRenderOptions>
  ): string {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return ''
    }

    const definition = this.definitions.get(patternId)
    if (!definition) {
      return ''
    }

    const renderOptions: PatternRenderOptions = {
      width: size,
      height: size,
      scale: options?.scale || definition.customizable.scale.default,
      rotation: options?.rotation || 0,
      opacity: options?.opacity || 1,
      colors: options?.colors || {
        primary: { r: 0, g: 0, b: 0, a: 1 },
        secondary: { r: 1, g: 1, b: 1, a: 1 }
      },
      complexity: options?.complexity
    }

    const imageData = this.renderPatternToImageData(patternId, renderOptions)
    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL()
  }

  /**
   * Private helper methods
   */
  private mapPatternIdToType(patternId: string): PatternType {
    const mapping: Record<string, PatternType> = {
      'ichimatsu': PatternType.Ichimatsu,
      'seigaiha': PatternType.Seigaiha,
      'asanoha': PatternType.Asanoha,
      'shippo': PatternType.Shippo,
      'kagome': PatternType.Kagome,
      'kikkoumon': PatternType.Kikkoumon,
      'sayagata': PatternType.Sayagata,
      'tatewaku': PatternType.Tatewaku
    }
    
    return mapping[patternId] || PatternType.Ichimatsu
  }

  private createCacheKey(patternId: string, options: PatternRenderOptions): string {
    return `${patternId}_${options.width}x${options.height}_s${options.scale}_r${options.rotation}_o${options.opacity}`
  }

  private applyOpacity(imageData: ImageData, opacity: number): void {
    const data = imageData.data
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] * opacity)
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearCache()
    this.patternGenerator.destroy()
    this.activeInstances.clear()
  }
}