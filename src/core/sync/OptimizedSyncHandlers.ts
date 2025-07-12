/**
 * Optimized Synchronization Handlers
 * DEVELOPER_010 - High-performance sync handlers for <100ms latency
 */

import { CanvasMode } from '../src/graphics/canvas/UnifiedCanvas'
import { ModeType, ChangeType, SyncChange } from '../src/core/sync/SynchronizationEngine'
import { CanvasEntity, EntityType, CreativeMode } from '../src/unified/UnifiedDataModel'

// Performance optimizations
const BATCH_SIZE = 10
const THROTTLE_DELAY = 16 // ~60fps
const DEBOUNCE_DELAY = 50
const CACHE_TTL = 5000 // 5 seconds

// Translation cache for performance
class TranslationCache {
  private cache: Map<string, { result: any; timestamp: number }> = new Map()

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return entry.result
  }

  set(key: string, result: any): void {
    this.cache.set(key, { result, timestamp: Date.now() })
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100)
      
      oldest.forEach(([key]) => this.cache.delete(key))
    }
  }

  generateKey(change: SyncChange, targetMode: ModeType): string {
    return `${change.sourceMode}_${change.changeType}_${targetMode}_${this.hashData(change.data)}`
  }

  private hashData(data: any): string {
    return JSON.stringify(data).slice(0, 50)
  }
}

// Optimized stroke handler for Draw mode
export class DrawSyncHandler {
  private strokeBuffer: Map<string, any[]> = new Map()
  private batchTimeout: NodeJS.Timeout | null = null
  private translationCache = new TranslationCache()

  handleStrokeChange(change: SyncChange): SyncChange[] {
    // Buffer strokes for batch processing
    const strokeId = change.data.strokeId || change.id
    
    if (!this.strokeBuffer.has(strokeId)) {
      this.strokeBuffer.set(strokeId, [])
    }
    
    this.strokeBuffer.get(strokeId)!.push(change.data)
    
    // Schedule batch processing
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.processBatch(), THROTTLE_DELAY)
    }
    
    return []
  }

  private processBatch(): SyncChange[] {
    const results: SyncChange[] = []
    
    // Process each buffered stroke
    for (const [strokeId, points] of this.strokeBuffer) {
      // Optimize points (reduce density)
      const optimizedPoints = this.optimizePoints(points)
      
      // Create sync changes for other modes
      results.push(
        this.createParametricChange(strokeId, optimizedPoints),
        this.createCodeChange(strokeId, optimizedPoints),
        this.createGrowthChange(strokeId, optimizedPoints)
      )
    }
    
    // Clear buffer
    this.strokeBuffer.clear()
    this.batchTimeout = null
    
    return results
  }

  private optimizePoints(points: any[]): any[] {
    if (points.length <= 10) return points
    
    // Douglas-Peucker algorithm for point reduction
    const tolerance = 2.0
    return this.douglasPeucker(points, tolerance)
  }

  private douglasPeucker(points: any[], tolerance: number): any[] {
    if (points.length <= 2) return points
    
    let maxDistance = 0
    let maxIndex = 0
    
    // Find point with maximum distance
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(
        points[i],
        points[0],
        points[points.length - 1]
      )
      
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance)
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance)
      
      return [...left.slice(0, -1), ...right]
    }
    
    return [points[0], points[points.length - 1]]
  }

  private perpendicularDistance(point: any, lineStart: any, lineEnd: any): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    
    const mag = Math.sqrt(dx * dx + dy * dy)
    if (mag === 0) return 0
    
    const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag)
    
    const closestPoint = {
      x: lineStart.x + u * dx,
      y: lineStart.y + u * dy
    }
    
    const distance = Math.sqrt(
      Math.pow(point.x - closestPoint.x, 2) +
      Math.pow(point.y - closestPoint.y, 2)
    )
    
    return distance
  }

  private createParametricChange(strokeId: string, points: any[]): SyncChange {
    // Check cache
    const cacheKey = `draw_parametric_${strokeId}`
    const cached = this.translationCache.get(cacheKey)
    if (cached) return cached
    
    // Analyze stroke to extract parametric properties
    const analysis = this.analyzeStroke(points)
    
    const change: SyncChange = {
      id: `${strokeId}_to_parametric`,
      timestamp: Date.now(),
      sourceMode: ModeType.PARAMETRIC,
      changeType: ChangeType.PATTERN_APPLIED,
      priority: 3,
      data: {
        patternType: analysis.patternType,
        parameters: {
          complexity: analysis.complexity,
          smoothness: analysis.smoothness,
          symmetry: analysis.symmetry
        },
        centerPoint: analysis.center,
        boundingBox: analysis.bounds
      }
    }
    
    this.translationCache.set(cacheKey, change)
    return change
  }

  private createCodeChange(strokeId: string, points: any[]): SyncChange {
    // Generate code representation
    const code = this.generateDrawingCode(points)
    
    return {
      id: `${strokeId}_to_code`,
      timestamp: Date.now(),
      sourceMode: ModeType.CODE,
      changeType: ChangeType.CODE_EXECUTED,
      priority: 3,
      data: {
        code,
        executionResult: {
          type: 'path',
          points: points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
        }
      }
    }
  }

  private createGrowthChange(strokeId: string, points: any[]): SyncChange {
    // Use stroke as growth seed
    const seeds = this.extractGrowthSeeds(points)
    
    return {
      id: `${strokeId}_to_growth`,
      timestamp: Date.now(),
      sourceMode: ModeType.GROWTH,
      changeType: ChangeType.GROWTH_UPDATED,
      priority: 3,
      data: {
        algorithm: 'stroke-based',
        seeds,
        growthDirection: this.calculateGrowthDirection(points),
        energy: this.calculateStrokeEnergy(points)
      }
    }
  }

  private analyzeStroke(points: any[]) {
    // Calculate stroke properties
    const bounds = this.calculateBounds(points)
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    }
    
    // Analyze complexity
    const angles = this.calculateAngles(points)
    const complexity = this.calculateComplexity(angles)
    
    // Detect pattern type
    const patternType = this.detectPatternType(points, angles)
    
    return {
      bounds,
      center,
      complexity,
      smoothness: this.calculateSmoothness(angles),
      symmetry: this.calculateSymmetry(points, center),
      patternType
    }
  }

  private calculateBounds(points: any[]) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    for (const point of points) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }
    
    return { minX, maxX, minY, maxY }
  }

  private calculateAngles(points: any[]): number[] {
    const angles: number[] = []
    
    for (let i = 1; i < points.length - 1; i++) {
      const angle = Math.atan2(
        points[i + 1].y - points[i].y,
        points[i + 1].x - points[i].x
      ) - Math.atan2(
        points[i].y - points[i - 1].y,
        points[i].x - points[i - 1].x
      )
      
      angles.push(angle)
    }
    
    return angles
  }

  private calculateComplexity(angles: number[]): number {
    if (angles.length === 0) return 0
    
    // Standard deviation of angles
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length
    const variance = angles.reduce((sum, angle) => sum + Math.pow(angle - mean, 2), 0) / angles.length
    
    return Math.sqrt(variance)
  }

  private calculateSmoothness(angles: number[]): number {
    if (angles.length <= 1) return 1
    
    // Calculate angle change rate
    let totalChange = 0
    for (let i = 1; i < angles.length; i++) {
      totalChange += Math.abs(angles[i] - angles[i - 1])
    }
    
    return 1 / (1 + totalChange / angles.length)
  }

  private calculateSymmetry(points: any[], center: any): number {
    // Simple symmetry check
    let symmetryScore = 0
    const threshold = 10
    
    for (let i = 0; i < points.length / 2; i++) {
      const p1 = points[i]
      const p2 = points[points.length - 1 - i]
      
      const d1 = Math.sqrt(Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2))
      const d2 = Math.sqrt(Math.pow(p2.x - center.x, 2) + Math.pow(p2.y - center.y, 2))
      
      if (Math.abs(d1 - d2) < threshold) {
        symmetryScore++
      }
    }
    
    return symmetryScore / (points.length / 2)
  }

  private detectPatternType(points: any[], angles: number[]): string {
    const complexity = this.calculateComplexity(angles)
    const smoothness = this.calculateSmoothness(angles)
    
    if (complexity < 0.1 && smoothness > 0.8) return 'linear'
    if (complexity < 0.3 && smoothness > 0.6) return 'curve'
    if (complexity > 0.7) return 'complex'
    
    return 'organic'
  }

  private generateDrawingCode(points: any[]): string {
    let code = '// Generated from drawing\n'
    code += 'function drawPath() {\n'
    code += '  beginPath();\n'
    
    points.forEach((point, i) => {
      if (i === 0) {
        code += `  moveTo(${Math.round(point.x)}, ${Math.round(point.y)});\n`
      } else {
        code += `  lineTo(${Math.round(point.x)}, ${Math.round(point.y)});\n`
      }
    })
    
    code += '  stroke();\n'
    code += '}\n'
    
    return code
  }

  private extractGrowthSeeds(points: any[]): any[] {
    // Sample points as growth seeds
    const seeds = []
    const step = Math.max(1, Math.floor(points.length / 5))
    
    for (let i = 0; i < points.length; i += step) {
      seeds.push({
        position: points[i],
        energy: points[i].pressure || 0.5,
        direction: i < points.length - 1 
          ? Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x)
          : 0
      })
    }
    
    return seeds
  }

  private calculateGrowthDirection(points: any[]): number {
    if (points.length < 2) return 0
    
    // Overall direction from start to end
    const start = points[0]
    const end = points[points.length - 1]
    
    return Math.atan2(end.y - start.y, end.x - start.x)
  }

  private calculateStrokeEnergy(points: any[]): number {
    // Based on speed and pressure
    let totalEnergy = 0
    
    for (let i = 1; i < points.length; i++) {
      const distance = Math.sqrt(
        Math.pow(points[i].x - points[i - 1].x, 2) +
        Math.pow(points[i].y - points[i - 1].y, 2)
      )
      
      const pressure = (points[i].pressure || 0.5) + (points[i - 1].pressure || 0.5) / 2
      totalEnergy += distance * pressure
    }
    
    return totalEnergy / points.length
  }
}

// Optimized parametric handler
export class ParametricSyncHandler {
  private parameterBuffer = new Map<string, any>()
  private updateTimeout: NodeJS.Timeout | null = null

  handleParameterChange(change: SyncChange): SyncChange[] {
    // Buffer parameter changes
    const patternId = change.data.patternId || change.id
    this.parameterBuffer.set(patternId, change.data)
    
    // Debounce updates
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }
    
    this.updateTimeout = setTimeout(() => this.processParameterUpdates(), DEBOUNCE_DELAY)
    
    return []
  }

  private processParameterUpdates(): SyncChange[] {
    const results: SyncChange[] = []
    
    for (const [patternId, data] of this.parameterBuffer) {
      // Generate visual representation
      const visualData = this.generateVisualData(data)
      
      results.push(
        this.createDrawChange(patternId, visualData),
        this.createCodeChange(patternId, data),
        this.createGrowthChange(patternId, data)
      )
    }
    
    this.parameterBuffer.clear()
    this.updateTimeout = null
    
    return results
  }

  private generateVisualData(data: any) {
    // Generate points based on parametric equation
    const points = []
    const { parameters, patternType } = data
    
    switch (patternType) {
      case 'spiral':
        for (let t = 0; t < Math.PI * 4; t += 0.1) {
          const r = parameters.scale * t
          points.push({
            x: 200 + r * Math.cos(t * parameters.frequency),
            y: 150 + r * Math.sin(t * parameters.frequency)
          })
        }
        break
        
      case 'wave':
        for (let x = 0; x < 400; x += 5) {
          points.push({
            x,
            y: 150 + parameters.amplitude * Math.sin(x * parameters.frequency)
          })
        }
        break
        
      default:
        // Default circular pattern
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          points.push({
            x: 200 + parameters.scale * 50 * Math.cos(angle),
            y: 150 + parameters.scale * 50 * Math.sin(angle)
          })
        }
    }
    
    return { points, patternType }
  }

  private createDrawChange(patternId: string, visualData: any): SyncChange {
    return {
      id: `${patternId}_to_draw`,
      timestamp: Date.now(),
      sourceMode: ModeType.DRAW,
      changeType: ChangeType.STROKE_ADDED,
      priority: 3,
      data: {
        strokeId: patternId,
        points: visualData.points,
        style: {
          color: '#A855F7',
          width: 2,
          opacity: 0.8
        }
      }
    }
  }

  private createCodeChange(patternId: string, data: any): SyncChange {
    const code = this.generateParametricCode(data)
    
    return {
      id: `${patternId}_to_code`,
      timestamp: Date.now(),
      sourceMode: ModeType.CODE,
      changeType: ChangeType.CODE_EXECUTED,
      priority: 3,
      data: {
        code,
        executionResult: {
          type: 'parametric',
          parameters: data.parameters
        }
      }
    }
  }

  private createGrowthChange(patternId: string, data: any): SyncChange {
    return {
      id: `${patternId}_to_growth`,
      timestamp: Date.now(),
      sourceMode: ModeType.GROWTH,
      changeType: ChangeType.GROWTH_UPDATED,
      priority: 3,
      data: {
        algorithm: 'parametric',
        parameters: {
          ...data.parameters,
          growthRate: data.parameters.scale || 1.0
        },
        pattern: data.patternType
      }
    }
  }

  private generateParametricCode(data: any): string {
    const { patternType, parameters } = data
    
    let code = `// Parametric ${patternType} pattern\n`
    code += `function generatePattern() {\n`
    code += `  const params = ${JSON.stringify(parameters, null, 2)};\n`
    code += `  const points = [];\n\n`
    
    switch (patternType) {
      case 'spiral':
        code += `  for (let t = 0; t < Math.PI * 4; t += 0.1) {\n`
        code += `    const r = params.scale * t;\n`
        code += `    points.push({\n`
        code += `      x: 200 + r * Math.cos(t * params.frequency),\n`
        code += `      y: 150 + r * Math.sin(t * params.frequency)\n`
        code += `    });\n`
        code += `  }\n`
        break
        
      default:
        code += `  // Add pattern generation logic\n`
    }
    
    code += `  return points;\n`
    code += `}\n`
    
    return code
  }
}

// Conflict resolution handler
export class ConflictResolver {
  private conflictHistory = new Map<string, any[]>()

  resolveConflict(changes: SyncChange[]): SyncChange {
    // Sort by priority and timestamp
    const sorted = changes.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return b.timestamp - a.timestamp
    })
    
    // Apply conflict resolution strategy
    const winner = sorted[0]
    
    // Merge compatible changes
    const merged = this.mergeCompatibleChanges(sorted)
    
    // Record conflict
    this.recordConflict(winner.id, sorted)
    
    return merged || winner
  }

  private mergeCompatibleChanges(changes: SyncChange[]): SyncChange | null {
    // Check if changes can be merged
    const allSameType = changes.every(c => c.changeType === changes[0].changeType)
    if (!allSameType) return null
    
    // Merge data
    const mergedData = changes.reduce((acc, change) => {
      return { ...acc, ...change.data }
    }, {})
    
    return {
      id: `merged_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: changes[0].sourceMode,
      changeType: changes[0].changeType,
      priority: Math.min(...changes.map(c => c.priority)),
      data: mergedData,
      metadata: {
        mergedFrom: changes.map(c => c.id)
      }
    }
  }

  private recordConflict(winnerId: string, changes: SyncChange[]): void {
    if (!this.conflictHistory.has(winnerId)) {
      this.conflictHistory.set(winnerId, [])
    }
    
    this.conflictHistory.get(winnerId)!.push({
      timestamp: Date.now(),
      conflicts: changes.map(c => ({ id: c.id, sourceMode: c.sourceMode }))
    })
    
    // Limit history size
    if (this.conflictHistory.size > 100) {
      const oldest = Array.from(this.conflictHistory.keys()).slice(0, 10)
      oldest.forEach(key => this.conflictHistory.delete(key))
    }
  }
}

// Main sync coordinator
export class OptimizedSyncCoordinator {
  private drawHandler = new DrawSyncHandler()
  private parametricHandler = new ParametricSyncHandler()
  private conflictResolver = new ConflictResolver()
  private pendingChanges = new Map<string, SyncChange[]>()
  private processInterval: NodeJS.Timer

  constructor() {
    // Process pending changes at 60fps
    this.processInterval = setInterval(() => this.processPendingChanges(), 16)
  }

  handleChange(change: SyncChange): void {
    const start = performance.now()
    
    // Route to appropriate handler
    let results: SyncChange[] = []
    
    switch (change.sourceMode) {
      case ModeType.DRAW:
        results = this.drawHandler.handleStrokeChange(change)
        break
        
      case ModeType.PARAMETRIC:
        results = this.parametricHandler.handleParameterChange(change)
        break
        
      // Add other mode handlers...
    }
    
    // Queue results
    if (results.length > 0) {
      results.forEach(result => {
        const key = `${result.sourceMode}_${result.changeType}`
        if (!this.pendingChanges.has(key)) {
          this.pendingChanges.set(key, [])
        }
        this.pendingChanges.get(key)!.push(result)
      })
    }
    
    // Log performance
    const elapsed = performance.now() - start
    if (elapsed > 10) {
      console.warn(`Slow sync handling: ${elapsed.toFixed(1)}ms`)
    }
  }

  private processPendingChanges(): void {
    if (this.pendingChanges.size === 0) return
    
    const start = performance.now()
    
    // Process each change group
    for (const [key, changes] of this.pendingChanges) {
      if (changes.length === 1) {
        // Single change, apply directly
        this.applyChange(changes[0])
      } else {
        // Multiple changes, resolve conflicts
        const resolved = this.conflictResolver.resolveConflict(changes)
        this.applyChange(resolved)
      }
    }
    
    // Clear processed changes
    this.pendingChanges.clear()
    
    // Log performance
    const elapsed = performance.now() - start
    if (elapsed > 16) {
      console.warn(`Frame budget exceeded: ${elapsed.toFixed(1)}ms`)
    }
  }

  private applyChange(change: SyncChange): void {
    // This would integrate with the actual sync engine
    // For now, just emit event
    const event = `sync:apply:${change.sourceMode}`
    eventBus.emit(event, change)
  }

  destroy(): void {
    clearInterval(this.processInterval)
  }
}

// Export singleton coordinator
export const syncCoordinator = new OptimizedSyncCoordinator()