/**
 * Sync Integration Layer for Genshi Studio
 * Connects the synchronization engine with existing components and state management
 */

import { useAppStore } from '../../hooks/useAppStore'
import { syncEngine, SyncChange, ModeType, ChangeType, SyncPriority } from './SynchronizationEngine'
import { TranslationLayers } from './TranslationLayers'
import { conflictResolver } from './ConflictResolution'

// Integration with existing components
export class SyncIntegration {
  private initialized = false
  private eventListeners: Map<string, Function[]> = new Map()
  private modeConnections: Map<ModeType, any> = new Map()
  
  constructor() {
    console.log('🔗 SyncIntegration initializing...')
  }
  
  /**
   * Initialize the sync integration system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return
    
    // Register translation layers
    this.registerTranslationLayers()
    
    // Register conflict resolvers
    this.registerConflictResolvers()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    // Connect to existing store
    this.connectToAppStore()
    
    // Start sync engine
    syncEngine.start()
    
    this.initialized = true
    console.log('✅ SyncIntegration initialized successfully')
  }
  
  /**
   * Connect a mode component to the sync system
   */
  public connectMode(
    mode: ModeType, 
    component: any, 
    options: {
      onUpdate?: (change: SyncChange) => void
      onConflict?: (resolution: any) => void
      filters?: ChangeType[]
    } = {}
  ): void {
    // Store component reference
    this.modeConnections.set(mode, { component, options })
    
    // Register mode with sync engine
    const initialData = this.getInitialModeData(mode, component)
    syncEngine.registerMode(mode, initialData)
    
    // Setup event listeners
    this.setupModeEventListeners(mode, component, options)
    
    console.log(`🔗 Connected ${mode} mode to sync system`)
  }
  
  /**
   * Disconnect a mode from the sync system
   */
  public disconnectMode(mode: ModeType): void {
    this.modeConnections.delete(mode)
    this.removeModeEventListeners(mode)
    console.log(`🔌 Disconnected ${mode} mode from sync system`)
  }
  
  /**
   * Trigger a sync change from a mode
   */
  public async triggerChange(
    sourceMode: ModeType,
    changeType: ChangeType,
    data: any,
    priority: SyncPriority = SyncPriority.USER_ACTION,
    metadata?: any
  ): Promise<void> {
    const change: SyncChange = {
      id: `${sourceMode}-${changeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sourceMode,
      changeType,
      priority,
      data,
      metadata: {
        ...metadata,
        triggeredBy: 'sync_integration'
      }
    }
    
    await syncEngine.applyChange(change)
  }
  
  /**
   * Get current state of all modes
   */
  public getAllModeStates(): Record<ModeType, any> {
    const states: Record<ModeType, any> = {} as any
    
    for (const mode of Object.values(ModeType)) {
      const state = syncEngine.getModeState(mode)
      if (state) {
        states[mode] = state.data
      }
    }
    
    return states
  }
  
  /**
   * Force sync all modes
   */
  public async forceSyncAll(): Promise<void> {
    await syncEngine.forceSyncAll()
  }
  
  /**
   * Clear all modes
   */
  public clearAll(): void {
    syncEngine.clearAll()
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return syncEngine.getPerformanceMetrics()
  }
  
  /**
   * Get sync engine status
   */
  public getStatus() {
    return {
      initialized: this.initialized,
      connectedModes: Array.from(this.modeConnections.keys()),
      performance: this.getPerformanceMetrics(),
      conflictStats: conflictResolver.getConflictStats()
    }
  }
  
  // Event system for components
  
  /**
   * Listen for sync events
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }
  
  /**
   * Stop listening for sync events
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  /**
   * Emit sync event
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event) || []
    for (const listener of listeners) {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in sync event listener for ${event}:`, error)
      }
    }
  }
  
  // Private methods
  
  private registerTranslationLayers(): void {
    // Register all translation functions
    syncEngine.registerTranslator(ModeType.DRAW, ModeType.PARAMETRIC, TranslationLayers.drawToParametric)
    syncEngine.registerTranslator(ModeType.PARAMETRIC, ModeType.CODE, TranslationLayers.parametricToCode)
    syncEngine.registerTranslator(ModeType.CODE, ModeType.DRAW, TranslationLayers.codeToVisual)
    syncEngine.registerTranslator(ModeType.GROWTH, ModeType.DRAW, TranslationLayers.growthToAll)
    
    // Bidirectional translations
    syncEngine.registerTranslator(ModeType.DRAW, ModeType.GROWTH, 
      (change) => TranslationLayers.translateChange(change).then(changes => 
        changes.filter(c => c.sourceMode === ModeType.GROWTH)))
    
    syncEngine.registerTranslator(ModeType.PARAMETRIC, ModeType.GROWTH,
      (change) => TranslationLayers.translateChange(change).then(changes => 
        changes.filter(c => c.sourceMode === ModeType.GROWTH)))
    
    syncEngine.registerTranslator(ModeType.PARAMETRIC, ModeType.DRAW,
      (change) => TranslationLayers.translateChange(change).then(changes => 
        changes.filter(c => c.sourceMode === ModeType.DRAW)))
    
    console.log('🔄 Translation layers registered')
  }
  
  private registerConflictResolvers(): void {
    // Register conflict resolvers for specific change types
    syncEngine.registerConflictResolver(ChangeType.STROKE_ADDED, (changes) => 
      conflictResolver.resolveConflicts(changes))
    
    syncEngine.registerConflictResolver(ChangeType.PARAMETER_CHANGED, (changes) => 
      conflictResolver.resolveConflicts(changes))
    
    syncEngine.registerConflictResolver(ChangeType.CODE_EXECUTED, (changes) => 
      conflictResolver.resolveConflicts(changes))
    
    syncEngine.registerConflictResolver(ChangeType.GROWTH_UPDATED, (changes) => 
      conflictResolver.resolveConflicts(changes))
    
    console.log('⚖️ Conflict resolvers registered')
  }
  
  private setupPerformanceMonitoring(): void {
    // Monitor performance and emit events
    syncEngine.on('performance:updated', (metrics) => {
      this.emit('performance:updated', metrics)
      
      // Warn if performance degrades
      if (metrics.fps < 30) {
        this.emit('performance:warning', {
          type: 'low_fps',
          value: metrics.fps,
          timestamp: Date.now()
        })
      }
      
      if (metrics.syncLatency > 100) {
        this.emit('performance:warning', {
          type: 'high_latency',
          value: metrics.syncLatency,
          timestamp: Date.now()
        })
      }
    })
    
    console.log('📊 Performance monitoring setup')
  }
  
  private connectToAppStore(): void {
    // Integration with Zustand store will be handled by React hooks
    console.log('🏪 App store connection prepared')
  }
  
  private getInitialModeData(mode: ModeType, component: any): any {
    // Extract initial data from component based on mode type
    switch (mode) {
      case ModeType.DRAW:
        return {
          strokes: [],
          layers: [],
          canvas: {
            width: 1920,
            height: 1080,
            background: '#ffffff'
          }
        }
      
      case ModeType.PARAMETRIC:
        return {
          patterns: [],
          parameters: {},
          activePattern: null
        }
      
      case ModeType.CODE:
        return {
          code: '// Welcome to Genshi Studio\ncanvas.background("#f0f0f0")',
          executionResult: null,
          lastExecution: null
        }
      
      case ModeType.GROWTH:
        return {
          algorithm: 'organic',
          parameters: {},
          points: [],
          generation: 0,
          settings: {
            growthRate: 0.02,
            density: 0.3,
            colors: {
              primary: '#000000',
              secondary: '#00ff88',
              accent: '#ff0088'
            },
            interactive: true
          }
        }
      
      default:
        return {}
    }
  }
  
  private setupModeEventListeners(
    mode: ModeType, 
    component: any, 
    options: {
      onUpdate?: (change: SyncChange) => void
      onConflict?: (resolution: any) => void
      filters?: ChangeType[]
    }
  ): void {
    // Listen for mode updates
    syncEngine.on('mode:updated', (event) => {
      if (event.mode === mode) {
        // Filter changes if specified
        if (options.filters && !options.filters.includes(event.change.changeType)) {
          return
        }
        
        // Notify component
        if (options.onUpdate) {
          options.onUpdate(event.change)
        }
        
        // Emit integration event
        this.emit(`mode:${mode}:updated`, event.state, event.change)
      }
    })
    
    // Listen for conflicts affecting this mode
    syncEngine.on('conflict:resolved', (resolution) => {
      if (resolution.appliedChange.sourceMode === mode) {
        if (options.onConflict) {
          options.onConflict(resolution)
        }
        
        this.emit(`mode:${mode}:conflict`, resolution)
      }
    })
    
    // Listen for changes applied
    syncEngine.on('change:applied', (change) => {
      if (change.sourceMode === mode) {
        this.emit(`mode:${mode}:change`, change)
      }
    })
  }
  
  private removeModeEventListeners(mode: ModeType): void {
    // Remove specific listeners for this mode
    syncEngine.removeAllListeners(`mode:${mode}:updated`)
    syncEngine.removeAllListeners(`mode:${mode}:conflict`)
    syncEngine.removeAllListeners(`mode:${mode}:change`)
  }
}

// React Hook for using sync integration in components
export function useSyncIntegration(
  mode?: ModeType,
  options: {
    onUpdate?: (change: SyncChange) => void
    onConflict?: (resolution: any) => void
    onPerformanceWarning?: (warning: any) => void
  } = {}
) {
  const [syncStatus, setSyncStatus] = React.useState(syncIntegration.getStatus())
  const [performance, setPerformance] = React.useState(syncIntegration.getPerformanceMetrics())
  
  React.useEffect(() => {
    // Initialize if not already done
    if (!syncStatus.initialized) {
      syncIntegration.initialize()
    }
    
    // Setup event listeners
    const handleStatusUpdate = () => {
      setSyncStatus(syncIntegration.getStatus())
    }
    
    const handlePerformanceUpdate = (metrics: any) => {
      setPerformance(metrics)
    }
    
    const handlePerformanceWarning = (warning: any) => {
      if (options.onPerformanceWarning) {
        options.onPerformanceWarning(warning)
      }
    }
    
    syncIntegration.on('performance:updated', handlePerformanceUpdate)
    syncIntegration.on('performance:warning', handlePerformanceWarning)
    
    if (mode) {
      syncIntegration.on(`mode:${mode}:updated`, options.onUpdate || (() => {}))
      syncIntegration.on(`mode:${mode}:conflict`, options.onConflict || (() => {}))
    }
    
    // Cleanup
    return () => {
      syncIntegration.off('performance:updated', handlePerformanceUpdate)
      syncIntegration.off('performance:warning', handlePerformanceWarning)
      
      if (mode) {
        syncIntegration.off(`mode:${mode}:updated`, options.onUpdate || (() => {}))
        syncIntegration.off(`mode:${mode}:conflict`, options.onConflict || (() => {}))
      }
    }
  }, [mode, options.onUpdate, options.onConflict, options.onPerformanceWarning])
  
  return {
    syncStatus,
    performance,
    triggerChange: (changeType: ChangeType, data: any, priority?: SyncPriority, metadata?: any) => {
      if (mode) {
        return syncIntegration.triggerChange(mode, changeType, data, priority, metadata)
      }
    },
    forceSyncAll: () => syncIntegration.forceSyncAll(),
    clearAll: () => syncIntegration.clearAll(),
    getAllStates: () => syncIntegration.getAllModeStates()
  }
}

// React Hook for connecting mode components
export function useModeSync(
  mode: ModeType,
  component: any,
  options: {
    onUpdate?: (change: SyncChange) => void
    onConflict?: (resolution: any) => void
    filters?: ChangeType[]
  } = {}
) {
  React.useEffect(() => {
    // Connect mode when component mounts
    syncIntegration.connectMode(mode, component, options)
    
    // Disconnect when component unmounts
    return () => {
      syncIntegration.disconnectMode(mode)
    }
  }, [mode, component])
  
  return useSyncIntegration(mode, options)
}

// Export singleton instance
export const syncIntegration = new SyncIntegration()

// Import React for hooks (this would normally be imported at the top)
import React from 'react'