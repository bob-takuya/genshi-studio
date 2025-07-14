/**
 * Enhanced Real-time Synchronization Engine for Genshi Studio
 * Implements <100ms latency target with CRDT and OT support
 * Optimized for 60fps updates across all modes
 */

import { SynchronizationEngine, ModeType, ChangeType, SyncPriority, SyncChange, ModeState } from './SynchronizationEngine'
import { CRDTManager, CRDTOperation } from './CRDTManager'
import { OperationalTransform, OTOperation } from './OperationalTransform'

// Performance optimization constants
const TARGET_LATENCY = 100 // Target latency in milliseconds
const TARGET_FPS = 60
const FRAME_BUDGET = 1000 / TARGET_FPS // ~16.67ms per frame
const BATCH_SIZE = 50 // Maximum operations per batch
const COMPRESSION_THRESHOLD = 100 // Compress after this many operations

// Enhanced change type with CRDT/OT support
export interface EnhancedSyncChange extends SyncChange {
  crdtOp?: CRDTOperation
  otOp?: OTOperation
  compressed?: boolean
  batchId?: string
  version?: number
}

// Performance tracking
interface PerformanceTracker {
  frameTime: number
  syncLatency: number
  transformTime: number
  batchTime: number
  compressionRatio: number
  droppedFrames: number
  totalOperations: number
}

// WebSocket support for multiplayer
interface WebSocketConfig {
  url?: string
  reconnectDelay?: number
  heartbeatInterval?: number
}

/**
 * Enhanced Synchronization Engine with CRDT and OT support
 * Achieves <100ms latency with 60fps update rate
 */
export class SyncEngine extends SynchronizationEngine {
  private crdtManager: CRDTManager
  private otTransform: OperationalTransform
  
  // Performance optimization
  private performanceTracker: PerformanceTracker
  private frameId: number | null = null
  private batchBuffer: EnhancedSyncChange[] = []
  private dirtyRegions: Set<string> = new Set()
  private compressionCache: Map<string, any> = new Map()
  
  // WebSocket for multiplayer
  private ws?: WebSocket
  private wsConfig?: WebSocketConfig
  private reconnectTimer?: number
  private heartbeatTimer?: number
  
  // Undo/redo history
  private history: EnhancedSyncChange[][] = []
  private historyIndex: number = -1
  private maxHistorySize: number = 1000
  
  constructor(wsConfig?: WebSocketConfig) {
    super()
    
    // Initialize CRDT and OT managers
    this.crdtManager = new CRDTManager()
    this.otTransform = new OperationalTransform()
    
    // Initialize performance tracker
    this.performanceTracker = {
      frameTime: 0,
      syncLatency: 0,
      transformTime: 0,
      batchTime: 0,
      compressionRatio: 1,
      droppedFrames: 0,
      totalOperations: 0
    }
    
    // WebSocket configuration
    this.wsConfig = wsConfig
    if (wsConfig?.url) {
      this.connectWebSocket()
    }
    
    // Setup optimized processing loop
    this.setupOptimizedLoop()
    
    console.log('⚡ Enhanced SyncEngine initialized with CRDT/OT support')
  }
  
  /**
   * Apply change with CRDT/OT support
   */
  public async applyChange(change: EnhancedSyncChange): Promise<void> {
    const startTime = performance.now()
    
    // Add CRDT operation if not present
    if (!change.crdtOp) {
      change.crdtOp = this.crdtManager.createOperation(change)
    }
    
    // Add to batch buffer for optimized processing
    this.batchBuffer.push(change)
    this.performanceTracker.totalOperations++
    
    // Mark dirty regions for optimized rendering
    this.markDirtyRegion(change)
    
    // Send to WebSocket if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage('change', change)
    }
    
    // Track latency
    const latency = performance.now() - startTime
    this.performanceTracker.syncLatency = 
      (this.performanceTracker.syncLatency * 0.9) + (latency * 0.1) // Moving average
    
    // Process immediately if under frame budget
    if (latency < FRAME_BUDGET * 0.5) {
      this.requestProcessing()
    }
  }
  
  /**
   * Process batch of changes with optimization
   */
  protected async processBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) return
    
    const startTime = performance.now()
    const batch = this.batchBuffer.splice(0, Math.min(BATCH_SIZE, this.batchBuffer.length))
    
    try {
      // Group operations by type for optimization
      const grouped = this.groupOperations(batch)
      
      // Apply CRDT merge for concurrent operations
      const merged = await this.crdtManager.mergeOperations(grouped)
      
      // Apply operational transforms
      const transformed = await this.otTransform.transformOperations(merged)
      
      // Compress if needed
      if (transformed.length > COMPRESSION_THRESHOLD) {
        const compressed = await this.compressOperations(transformed)
        await this.applyCompressedChanges(compressed)
      } else {
        await this.applyTransformedChanges(transformed)
      }
      
      // Update history for undo/redo
      this.updateHistory(batch)
      
      // Clear processed dirty regions
      this.clearProcessedRegions(batch)
      
    } catch (error) {
      console.error('❌ Batch processing error:', error)
      // Rollback on error
      await this.rollbackBatch(batch)
    }
    
    // Track performance
    const batchTime = performance.now() - startTime
    this.performanceTracker.batchTime = 
      (this.performanceTracker.batchTime * 0.9) + (batchTime * 0.1)
    
    // Emit batch complete event
    this.emit('batch:processed', {
      count: batch.length,
      time: batchTime,
      remaining: this.batchBuffer.length
    })
  }
  
  /**
   * Undo last operation
   */
  public async undo(): Promise<void> {
    if (this.historyIndex < 0) return
    
    const batch = this.history[this.historyIndex]
    const inverseBatch = await this.createInverseBatch(batch)
    
    // Apply inverse operations
    for (const change of inverseBatch) {
      await super.applyChange(change)
    }
    
    this.historyIndex--
    this.emit('history:undo', { index: this.historyIndex })
  }
  
  /**
   * Redo operation
   */
  public async redo(): Promise<void> {
    if (this.historyIndex >= this.history.length - 1) return
    
    this.historyIndex++
    const batch = this.history[this.historyIndex]
    
    // Reapply operations
    for (const change of batch) {
      await super.applyChange(change)
    }
    
    this.emit('history:redo', { index: this.historyIndex })
  }
  
  /**
   * Get dirty regions for optimized rendering
   */
  public getDirtyRegions(): string[] {
    return Array.from(this.dirtyRegions)
  }
  
  /**
   * Clear specific dirty regions after rendering
   */
  public clearDirtyRegions(regions: string[]): void {
    regions.forEach(region => this.dirtyRegions.delete(region))
  }
  
  /**
   * Get enhanced performance metrics
   */
  public getEnhancedMetrics(): PerformanceTracker & {
    crdtStats: any
    otStats: any
    wsStatus: string
  } {
    return {
      ...this.performanceTracker,
      crdtStats: this.crdtManager.getStats(),
      otStats: this.otTransform.getStats(),
      wsStatus: this.ws?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected'
    }
  }
  
  // Private methods
  
  private setupOptimizedLoop(): void {
    const processFrame = () => {
      const frameStart = performance.now()
      
      // Process pending changes
      if (this.batchBuffer.length > 0) {
        this.processBatch().catch(console.error)
      }
      
      // Calculate frame time
      const frameTime = performance.now() - frameStart
      this.performanceTracker.frameTime = 
        (this.performanceTracker.frameTime * 0.9) + (frameTime * 0.1)
      
      // Check for dropped frames
      if (frameTime > FRAME_BUDGET) {
        this.performanceTracker.droppedFrames++
      }
      
      // Schedule next frame
      this.frameId = requestAnimationFrame(processFrame)
    }
    
    // Start the loop
    this.frameId = requestAnimationFrame(processFrame)
  }
  
  private requestProcessing(): void {
    // Cancel current frame and request immediate processing
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
    }
    this.frameId = requestAnimationFrame(() => {
      this.processBatch().catch(console.error)
      this.setupOptimizedLoop()
    })
  }
  
  private groupOperations(changes: EnhancedSyncChange[]): Map<string, EnhancedSyncChange[]> {
    const groups = new Map<string, EnhancedSyncChange[]>()
    
    changes.forEach(change => {
      const key = `${change.sourceMode}-${change.changeType}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(change)
    })
    
    return groups
  }
  
  private async compressOperations(operations: EnhancedSyncChange[]): Promise<EnhancedSyncChange[]> {
    const compressed: EnhancedSyncChange[] = []
    const startTime = performance.now()
    
    // Group consecutive similar operations
    let current: EnhancedSyncChange | null = null
    
    for (const op of operations) {
      if (current && this.canMergeOperations(current, op)) {
        // Merge operations
        current = await this.mergeOperations(current, op)
      } else {
        if (current) compressed.push(current)
        current = op
      }
    }
    
    if (current) compressed.push(current)
    
    // Calculate compression ratio
    this.performanceTracker.compressionRatio = operations.length / compressed.length
    
    // Track transform time
    this.performanceTracker.transformTime = performance.now() - startTime
    
    return compressed
  }
  
  private canMergeOperations(a: EnhancedSyncChange, b: EnhancedSyncChange): boolean {
    return a.sourceMode === b.sourceMode &&
           a.changeType === b.changeType &&
           Math.abs(a.timestamp - b.timestamp) < 100 // Within 100ms
  }
  
  private async mergeOperations(a: EnhancedSyncChange, b: EnhancedSyncChange): Promise<EnhancedSyncChange> {
    // Merge CRDT operations
    const mergedCrdt = this.crdtManager.merge(a.crdtOp!, b.crdtOp!)
    
    // Merge OT operations if present
    const mergedOt = a.otOp && b.otOp ? 
      await this.otTransform.compose(a.otOp, b.otOp) : 
      (a.otOp || b.otOp)
    
    return {
      ...b,
      data: { ...a.data, ...b.data },
      crdtOp: mergedCrdt,
      otOp: mergedOt,
      compressed: true,
      metadata: {
        ...a.metadata,
        ...b.metadata,
        mergedCount: ((a.metadata?.mergedCount as number) || 1) + 1
      }
    }
  }
  
  private async applyTransformedChanges(changes: EnhancedSyncChange[]): Promise<void> {
    for (const change of changes) {
      await super.applyChange(change)
    }
  }
  
  private async applyCompressedChanges(changes: EnhancedSyncChange[]): Promise<void> {
    // Apply compressed changes in optimized batches
    const batchSize = Math.ceil(changes.length / 4) // Process in 4 parallel batches
    const promises: Promise<void>[] = []
    
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize)
      promises.push(this.applyTransformedChanges(batch))
    }
    
    await Promise.all(promises)
  }
  
  private markDirtyRegion(change: EnhancedSyncChange): void {
    // Mark regions that need re-rendering
    const region = this.getRegionForChange(change)
    if (region) {
      this.dirtyRegions.add(region)
    }
  }
  
  private getRegionForChange(change: EnhancedSyncChange): string | null {
    // Determine affected region based on change type and data
    switch (change.changeType) {
      case ChangeType.STROKE_ADDED:
      case ChangeType.STROKE_MODIFIED:
        return `stroke-${change.data.id || change.id}`
      case ChangeType.PARAMETER_CHANGED:
        return `param-${change.data.parameter || 'global'}`
      case ChangeType.PATTERN_APPLIED:
        return 'pattern-full'
      case ChangeType.CANVAS_CLEARED:
        return 'canvas-full'
      default:
        return null
    }
  }
  
  private clearProcessedRegions(batch: EnhancedSyncChange[]): void {
    batch.forEach(change => {
      const region = this.getRegionForChange(change)
      if (region) {
        this.dirtyRegions.delete(region)
      }
    })
  }
  
  private updateHistory(batch: EnhancedSyncChange[]): void {
    // Truncate history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }
    
    // Add new batch
    this.history.push([...batch])
    this.historyIndex++
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.historyIndex--
    }
  }
  
  private async createInverseBatch(batch: EnhancedSyncChange[]): Promise<EnhancedSyncChange[]> {
    const inverse: EnhancedSyncChange[] = []
    
    for (const change of batch.reverse()) {
      const inverseOp = await this.createInverseOperation(change)
      if (inverseOp) {
        inverse.push(inverseOp)
      }
    }
    
    return inverse
  }
  
  private async createInverseOperation(change: EnhancedSyncChange): Promise<EnhancedSyncChange | null> {
    // Create inverse CRDT operation
    const inverseCrdt = this.crdtManager.invert(change.crdtOp!)
    if (!inverseCrdt) return null
    
    // Create inverse OT operation if present
    const inverseOt = change.otOp ? 
      await this.otTransform.invert(change.otOp) : 
      undefined
    
    return {
      ...change,
      id: `inverse-${change.id}`,
      timestamp: Date.now(),
      crdtOp: inverseCrdt,
      otOp: inverseOt,
      metadata: {
        ...change.metadata,
        inverse: true,
        originalId: change.id
      }
    }
  }
  
  private async rollbackBatch(batch: EnhancedSyncChange[]): Promise<void> {
    console.warn('🔄 Rolling back batch due to error')
    const inverseBatch = await this.createInverseBatch(batch)
    
    for (const change of inverseBatch) {
      try {
        await super.applyChange(change)
      } catch (error) {
        console.error('❌ Rollback error:', error)
      }
    }
  }
  
  // WebSocket methods
  
  private connectWebSocket(): void {
    if (!this.wsConfig?.url) return
    
    try {
      this.ws = new WebSocket(this.wsConfig.url)
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected')
        this.emit('websocket:connected')
        this.startHeartbeat()
      }
      
      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data)
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.emit('websocket:error', error)
      }
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        this.emit('websocket:disconnected')
        this.stopHeartbeat()
        this.scheduleReconnect()
      }
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error)
    }
  }
  
  private scheduleReconnect(): void {
    if (!this.wsConfig?.reconnectDelay) return
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connectWebSocket()
    }, this.wsConfig.reconnectDelay)
  }
  
  private startHeartbeat(): void {
    if (!this.wsConfig?.heartbeatInterval) return
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendWebSocketMessage('heartbeat', { timestamp: Date.now() })
      }
    }, this.wsConfig.heartbeatInterval)
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }
  
  private sendWebSocketMessage(type: string, data: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    
    try {
      this.ws.send(JSON.stringify({ type, data }))
    } catch (error) {
      console.error('❌ WebSocket send error:', error)
    }
  }
  
  private async handleWebSocketMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'change':
          // Apply remote change
          await this.applyChange(message.data)
          break
        case 'sync':
          // Full sync request
          await this.handleSyncRequest(message.data)
          break
        case 'heartbeat':
          // Heartbeat response
          break
        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
      
    } catch (error) {
      console.error('❌ WebSocket message error:', error)
    }
  }
  
  private async handleSyncRequest(data: any): Promise<void> {
    // Handle full synchronization request
    const states = new Map<ModeType, ModeState>()
    
    for (const [mode, state] of this.modes) {
      states.set(mode, state)
    }
    
    this.sendWebSocketMessage('sync-response', {
      states: Object.fromEntries(states),
      version: Date.now()
    })
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Stop processing loop
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.stopHeartbeat()
    
    // Clear caches
    this.compressionCache.clear()
    this.dirtyRegions.clear()
    
    // Stop parent engine
    this.stop()
  }
}

// Export singleton instance
export const enhancedSyncEngine = new SyncEngine({
  // url: 'ws://localhost:8080/sync', // Uncomment for multiplayer
  reconnectDelay: 5000,
  heartbeatInterval: 30000
})