/**
 * Real-time Synchronization Engine for Genshi Studio
 * Coordinates updates between Draw, Parametric, Code, and Growth modes
 * Implements event-driven architecture with conflict resolution and performance optimization
 */

// Simple EventEmitter implementation for browser compatibility
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Core types for synchronization
export enum ModeType {
  DRAW = 'draw',
  PARAMETRIC = 'parametric', 
  CODE = 'code',
  GROWTH = 'growth'
}

export enum ChangeType {
  STROKE_ADDED = 'stroke_added',
  STROKE_MODIFIED = 'stroke_modified',
  STROKE_REMOVED = 'stroke_removed',
  PARAMETER_CHANGED = 'parameter_changed',
  CODE_EXECUTED = 'code_executed',
  GROWTH_UPDATED = 'growth_updated',
  CANVAS_CLEARED = 'canvas_cleared',
  PATTERN_APPLIED = 'pattern_applied'
}

export enum SyncPriority {
  USER_ACTION = 1,      // Direct user interactions
  ALGORITHM_UPDATE = 2, // Automatic updates from algorithms
  DERIVED_CHANGE = 3,   // Changes derived from other modes
  BACKGROUND_SYNC = 4   // Background synchronization
}

export interface SyncChange {
  id: string
  timestamp: number
  sourceMode: ModeType
  changeType: ChangeType
  priority: SyncPriority
  data: any
  metadata?: {
    userId?: string
    sessionId?: string
    batchId?: string
    causedBy?: string
  }
}

export interface ModeState {
  mode: ModeType
  lastUpdate: number
  version: number
  data: any
  checksum: string
}

export interface ConflictResolution {
  strategy: 'user_wins' | 'merge' | 'latest_wins' | 'rollback'
  reason: string
  appliedChange: SyncChange
  rejectedChanges: SyncChange[]
}

// Performance monitoring interface
export interface PerformanceMetrics {
  syncLatency: number
  translationTime: number
  renderTime: number
  memoryUsage: number
  fps: number
  queueSize: number
}

/**
 * Core Synchronization Engine
 * Manages real-time updates between all studio modes
 */
export class SynchronizationEngine extends EventEmitter {
  private modes: Map<ModeType, ModeState> = new Map()
  private changeQueue: SyncChange[] = []
  private processingQueue: boolean = false
  private loopDetection: Map<string, number> = new Map()
  private performance: PerformanceMetrics
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private isRunning: boolean = false
  
  // Translation layer registry
  private translators: Map<string, (change: SyncChange) => Promise<SyncChange[]>> = new Map()
  
  // Conflict resolution handlers
  private conflictResolvers: Map<string, (changes: SyncChange[]) => ConflictResolution> = new Map()
  
  // Performance optimization
  private batchTimeout: number | null = null
  private readonly BATCH_DELAY = 16 // ~60fps
  private readonly MAX_QUEUE_SIZE = 1000
  private readonly LOOP_DETECTION_THRESHOLD = 5
  
  constructor() {
    super()
    
    // Initialize performance metrics
    this.performance = {
      syncLatency: 0,
      translationTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      fps: 60,
      queueSize: 0
    }
    
    // Initialize mode states
    this.initializeModeStates()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    console.log('🔄 SynchronizationEngine initialized')
  }
  
  /**
   * Start the synchronization engine
   */
  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastFrameTime = performance.now()
    
    // Start processing loop
    this.processQueue()
    
    this.emit('engine:started')
    console.log('🚀 SynchronizationEngine started')
  }
  
  /**
   * Stop the synchronization engine
   */
  public stop(): void {
    this.isRunning = false
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    
    this.emit('engine:stopped')
    console.log('⏹️ SynchronizationEngine stopped')
  }
  
  /**
   * Register a mode with the sync engine
   */
  public registerMode(mode: ModeType, initialData: any): void {
    const state: ModeState = {
      mode,
      lastUpdate: Date.now(),
      version: 1,
      data: initialData,
      checksum: this.calculateChecksum(initialData)
    }
    
    this.modes.set(mode, state)
    this.emit('mode:registered', { mode, state })
    console.log(`📝 Mode ${mode} registered`)
  }
  
  /**
   * Apply a change from a specific mode
   */
  public async applyChange(change: SyncChange): Promise<void> {
    // Validate change
    if (!this.validateChange(change)) {
      console.warn('⚠️ Invalid change rejected:', change)
      return
    }
    
    // Check for loops
    if (this.detectLoop(change)) {
      console.warn('🔄 Loop detected, rejecting change:', change.id)
      return
    }
    
    // Add to queue
    this.addToQueue(change)
    
    // Update performance metrics
    this.performance.queueSize = this.changeQueue.length
    
    // Trigger processing if not already running
    if (!this.processingQueue) {
      this.scheduleProcessing()
    }
  }
  
  /**
   * Register a translation layer between modes
   */
  public registerTranslator(
    fromMode: ModeType, 
    toMode: ModeType, 
    translator: (change: SyncChange) => Promise<SyncChange[]>
  ): void {
    const key = `${fromMode}->${toMode}`
    this.translators.set(key, translator)
    console.log(`🔄 Translator registered: ${key}`)
  }
  
  /**
   * Register a conflict resolver
   */
  public registerConflictResolver(
    changeType: ChangeType,
    resolver: (changes: SyncChange[]) => ConflictResolution
  ): void {
    this.conflictResolvers.set(changeType, resolver)
    console.log(`⚖️ Conflict resolver registered: ${changeType}`)
  }
  
  /**
   * Get current mode state
   */
  public getModeState(mode: ModeType): ModeState | undefined {
    return this.modes.get(mode)
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performance }
  }
  
  /**
   * Force sync all modes
   */
  public async forceSyncAll(): Promise<void> {
    console.log('🔄 Force syncing all modes...')
    
    const changes: SyncChange[] = []
    
    // Create sync changes for each mode
    for (const [mode, state] of this.modes) {
      const change: SyncChange = {
        id: `force-sync-${mode}-${Date.now()}`,
        timestamp: Date.now(),
        sourceMode: mode,
        changeType: ChangeType.PATTERN_APPLIED,
        priority: SyncPriority.BACKGROUND_SYNC,
        data: state.data,
        metadata: { batchId: 'force-sync-all' }
      }
      changes.push(change)
    }
    
    // Process all changes
    for (const change of changes) {
      await this.applyChange(change)
    }
  }
  
  /**
   * Clear all mode states
   */
  public clearAll(): void {
    for (const mode of this.modes.keys()) {
      const clearChange: SyncChange = {
        id: `clear-${mode}-${Date.now()}`,
        timestamp: Date.now(),
        sourceMode: mode,
        changeType: ChangeType.CANVAS_CLEARED,
        priority: SyncPriority.USER_ACTION,
        data: null
      }
      this.applyChange(clearChange)
    }
  }
  
  // Private methods
  
  private initializeModeStates(): void {
    // Initialize with empty states for each mode
    const modes = [ModeType.DRAW, ModeType.PARAMETRIC, ModeType.CODE, ModeType.GROWTH]
    
    for (const mode of modes) {
      this.registerMode(mode, this.getDefaultModeData(mode))
    }
  }
  
  private getDefaultModeData(mode: ModeType): any {
    switch (mode) {
      case ModeType.DRAW:
        return { strokes: [], layers: [] }
      case ModeType.PARAMETRIC:
        return { patterns: [], parameters: {} }
      case ModeType.CODE:
        return { code: '', executionResult: null }
      case ModeType.GROWTH:
        return { algorithm: 'organic', parameters: {}, points: [] }
      default:
        return {}
    }
  }
  
  private validateChange(change: SyncChange): boolean {
    // Basic validation
    if (!change.id || !change.sourceMode || !change.changeType) {
      return false
    }
    
    // Check if source mode is registered
    if (!this.modes.has(change.sourceMode)) {
      return false
    }
    
    // Validate timestamp
    if (change.timestamp <= 0) {
      return false
    }
    
    return true
  }
  
  private detectLoop(change: SyncChange): boolean {
    const key = `${change.sourceMode}-${change.changeType}`
    const count = this.loopDetection.get(key) || 0
    
    this.loopDetection.set(key, count + 1)
    
    // Clear old entries periodically
    if (this.loopDetection.size > 100) {
      this.loopDetection.clear()
    }
    
    return count >= this.LOOP_DETECTION_THRESHOLD
  }
  
  private addToQueue(change: SyncChange): void {
    // Check queue size limit
    if (this.changeQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('⚠️ Queue overflow, dropping oldest changes')
      this.changeQueue.splice(0, this.changeQueue.length - this.MAX_QUEUE_SIZE + 1)
    }
    
    // Insert change based on priority
    const insertIndex = this.findInsertIndex(change)
    this.changeQueue.splice(insertIndex, 0, change)
  }
  
  private findInsertIndex(change: SyncChange): number {
    for (let i = 0; i < this.changeQueue.length; i++) {
      if (this.changeQueue[i].priority > change.priority) {
        return i
      }
    }
    return this.changeQueue.length
  }
  
  private scheduleProcessing(): void {
    if (this.batchTimeout) return
    
    this.batchTimeout = setTimeout(() => {
      this.processQueue()
      this.batchTimeout = null
    }, this.BATCH_DELAY)
  }
  
  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isRunning) return
    
    this.processingQueue = true
    const startTime = performance.now()
    
    try {
      // Process batch of changes
      const batch = this.changeQueue.splice(0, Math.min(10, this.changeQueue.length))
      
      if (batch.length === 0) {
        this.processingQueue = false
        return
      }
      
      // Group changes by type for conflict resolution
      const changeGroups = this.groupChangesByType(batch)
      
      for (const [changeType, changes] of changeGroups) {
        await this.processChangeGroup(changeType, changes)
      }
      
      // Update performance metrics
      const endTime = performance.now()
      this.performance.syncLatency = endTime - startTime
      this.performance.queueSize = this.changeQueue.length
      
      // Continue processing if queue has more items
      if (this.changeQueue.length > 0) {
        this.scheduleProcessing()
      }
      
    } catch (error) {
      console.error('❌ Error processing sync queue:', error)
    } finally {
      this.processingQueue = false
    }
  }
  
  private groupChangesByType(changes: SyncChange[]): Map<ChangeType, SyncChange[]> {
    const groups = new Map<ChangeType, SyncChange[]>()
    
    for (const change of changes) {
      if (!groups.has(change.changeType)) {
        groups.set(change.changeType, [])
      }
      groups.get(change.changeType)!.push(change)
    }
    
    return groups
  }
  
  private async processChangeGroup(changeType: ChangeType, changes: SyncChange[]): Promise<void> {
    // Handle conflicts if multiple changes of same type
    if (changes.length > 1) {
      const resolution = this.resolveConflicts(changeType, changes)
      changes = [resolution.appliedChange]
      
      this.emit('conflict:resolved', resolution)
    }
    
    // Process each change
    for (const change of changes) {
      await this.processSingleChange(change)
    }
  }
  
  private resolveConflicts(changeType: ChangeType, changes: SyncChange[]): ConflictResolution {
    const resolver = this.conflictResolvers.get(changeType)
    
    if (resolver) {
      return resolver(changes)
    }
    
    // Default conflict resolution: prioritize user actions
    const userChanges = changes.filter(c => c.priority === SyncPriority.USER_ACTION)
    const appliedChange = userChanges.length > 0 ? userChanges[0] : changes[0]
    const rejectedChanges = changes.filter(c => c.id !== appliedChange.id)
    
    return {
      strategy: 'user_wins',
      reason: 'Default resolution: user actions take priority',
      appliedChange,
      rejectedChanges
    }
  }
  
  private async processSingleChange(change: SyncChange): Promise<void> {
    // Update source mode state
    await this.updateModeState(change)
    
    // Translate to other modes
    await this.translateChange(change)
    
    // Emit change event
    this.emit('change:applied', change)
  }
  
  private async updateModeState(change: SyncChange): Promise<void> {
    const currentState = this.modes.get(change.sourceMode)
    if (!currentState) return
    
    // Apply change to mode data
    const newData = await this.applyChangeToData(currentState.data, change)
    
    // Update state
    const updatedState: ModeState = {
      ...currentState,
      lastUpdate: change.timestamp,
      version: currentState.version + 1,
      data: newData,
      checksum: this.calculateChecksum(newData)
    }
    
    this.modes.set(change.sourceMode, updatedState)
    this.emit('mode:updated', { mode: change.sourceMode, state: updatedState, change })
  }
  
  private async applyChangeToData(currentData: any, change: SyncChange): Promise<any> {
    // This will be implemented by specific mode handlers
    // For now, return the change data
    switch (change.changeType) {
      case ChangeType.CANVAS_CLEARED:
        return this.getDefaultModeData(change.sourceMode)
      default:
        return { ...currentData, ...change.data }
    }
  }
  
  private async translateChange(change: SyncChange): Promise<void> {
    const translationStart = performance.now()
    
    // Find all relevant translators
    const targetModes = Array.from(this.modes.keys()).filter(mode => mode !== change.sourceMode)
    
    for (const targetMode of targetModes) {
      const translatorKey = `${change.sourceMode}->${targetMode}`
      const translator = this.translators.get(translatorKey)
      
      if (translator) {
        try {
          const translatedChanges = await translator(change)
          
          // Apply translated changes
          for (const translatedChange of translatedChanges) {
            if (translatedChange.sourceMode !== change.sourceMode) {
              await this.applyChange(translatedChange)
            }
          }
        } catch (error) {
          console.error(`❌ Translation error ${translatorKey}:`, error)
        }
      }
    }
    
    // Update performance metrics
    this.performance.translationTime = performance.now() - translationStart
  }
  
  private calculateChecksum(data: any): string {
    // Simple checksum for change detection
    return btoa(JSON.stringify(data)).slice(0, 16)
  }
  
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      if (!this.isRunning) return
      
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastFrameTime
      
      this.frameCount++
      
      // Calculate FPS every second
      if (deltaTime >= 1000) {
        this.performance.fps = (this.frameCount * 1000) / deltaTime
        this.frameCount = 0
        this.lastFrameTime = currentTime
        
        // Emit performance update
        this.emit('performance:updated', this.performance)
        
        // Log performance if needed
        if (this.performance.fps < 30) {
          console.warn('⚠️ Low FPS detected:', this.performance.fps)
        }
      }
      
      // Memory usage (rough estimation)
      this.performance.memoryUsage = this.estimateMemoryUsage()
      
    }, 100) // Check every 100ms
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimation based on queue size and mode states
    const queueSize = this.changeQueue.length * 1000 // Rough estimate per change
    const stateSize = this.modes.size * 10000 // Rough estimate per mode state
    return queueSize + stateSize
  }
}

// Export singleton instance
export const syncEngine = new SynchronizationEngine()