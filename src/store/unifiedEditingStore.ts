/**
 * Unified Editing Store - Central state management for real-time synchronization
 * DEVELOPER_010 - Shared state store for all editing modes with event-driven updates
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { UnifiedEditingSystem } from '../src/core/UnifiedEditingSystem'
import { CanvasEntity } from '../src/unified/UnifiedDataModel'
import { CanvasMode } from '../src/graphics/canvas/UnifiedCanvas'
import { ModeType, ChangeType, SyncPriority } from '../src/core/sync/SynchronizationEngine'

// Event bus for real-time communication
class EventBus {
  private events: Map<string, Function[]> = new Map()
  private eventQueue: Array<{ event: string; data: any; timestamp: number }> = []
  private processing = false

  on(event: string, handler: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.events.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  emit(event: string, data: any): void {
    // Add to queue with timestamp
    this.eventQueue.push({
      event,
      data,
      timestamp: performance.now()
    })

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.eventQueue.length > 0) {
      const item = this.eventQueue.shift()!
      const handlers = this.events.get(item.event)

      if (handlers) {
        // Process handlers in parallel for speed
        const promises = handlers.map(handler => 
          Promise.resolve().then(() => handler(item.data))
            .catch(error => console.error(`Error in event handler for ${item.event}:`, error))
        )
        
        await Promise.all(promises)
      }

      // Log performance
      const latency = performance.now() - item.timestamp
      if (latency > 100) {
        console.warn(`High latency detected for event ${item.event}: ${latency.toFixed(1)}ms`)
      }
    }

    this.processing = false
  }
}

// Shared event bus instance
export const eventBus = new EventBus()

// Entity state with optimistic updates
interface EntityState {
  entity: CanvasEntity
  optimisticChanges: any[]
  lastSync: number
  dirty: boolean
}

// Mode state with activity tracking
interface ModeState {
  active: boolean
  primaryMode: boolean
  opacity: number
  visible: boolean
  lastActivity: number
  changeCount: number
}

// Performance metrics
interface PerformanceState {
  fps: number
  syncLatency: number
  translationTime: number
  entityCount: number
  activeUsers: number
}

// Store interface
interface UnifiedEditingStore {
  // System
  system: UnifiedEditingSystem | null
  isInitialized: boolean
  isRunning: boolean

  // Entities
  entities: Map<string, EntityState>
  selectedEntityIds: Set<string>
  
  // Modes
  modes: Map<CanvasMode, ModeState>
  primaryMode: CanvasMode

  // Performance
  performance: PerformanceState

  // Canvas state
  canvasState: {
    zoom: number
    pan: { x: number; y: number }
    viewport: { width: number; height: number }
  }

  // Actions
  initializeSystem: (canvas: HTMLCanvasElement) => Promise<void>
  startSystem: () => void
  stopSystem: () => void

  // Entity management
  addEntity: (entity: CanvasEntity) => void
  updateEntity: (id: string, changes: Partial<CanvasEntity>, optimistic?: boolean) => void
  removeEntity: (id: string) => void
  selectEntity: (id: string, multi?: boolean) => void
  clearSelection: () => void

  // Mode management
  setPrimaryMode: (mode: CanvasMode) => void
  setModeActive: (mode: CanvasMode, active: boolean) => void
  setModeOpacity: (mode: CanvasMode, opacity: number) => void
  setModeVisibility: (mode: CanvasMode, visible: boolean) => void

  // Canvas operations
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setViewport: (width: number, height: number) => void

  // Sync operations
  applyChange: (change: any) => Promise<void>
  forceSyncAll: () => Promise<void>
  clearAll: () => void

  // Performance monitoring
  updatePerformance: (metrics: Partial<PerformanceState>) => void
}

// Create the store with real-time synchronization
export const useUnifiedEditingStore = create<UnifiedEditingStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    system: null,
    isInitialized: false,
    isRunning: false,
    entities: new Map(),
    selectedEntityIds: new Set(),
    modes: new Map([
      [CanvasMode.DRAW, { active: true, primaryMode: true, opacity: 1.0, visible: true, lastActivity: Date.now(), changeCount: 0 }],
      [CanvasMode.PARAMETRIC, { active: true, primaryMode: false, opacity: 0.8, visible: true, lastActivity: Date.now(), changeCount: 0 }],
      [CanvasMode.CODE, { active: true, primaryMode: false, opacity: 0.9, visible: true, lastActivity: Date.now(), changeCount: 0 }],
      [CanvasMode.GROWTH, { active: true, primaryMode: false, opacity: 0.7, visible: true, lastActivity: Date.now(), changeCount: 0 }],
    ]),
    primaryMode: CanvasMode.DRAW,
    performance: {
      fps: 60,
      syncLatency: 0,
      translationTime: 0,
      entityCount: 0,
      activeUsers: 1
    },
    canvasState: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      viewport: { width: 1920, height: 1080 }
    },

    // Initialize the unified editing system
    initializeSystem: async (canvas: HTMLCanvasElement) => {
      const { system, isInitialized } = get()
      
      if (isInitialized && system) {
        console.warn('System already initialized')
        return
      }

      try {
        // Create unified editing system
        const newSystem = new UnifiedEditingSystem({
          canvas,
          width: canvas.width,
          height: canvas.height,
          pixelRatio: window.devicePixelRatio,
          performanceTarget: {
            fps: 60,
            maxSyncLatency: 100
          },
          translation: {
            quality: 'balanced',
            enableCache: true
          }
        })

        // Setup event listeners
        newSystem.on('entity:changed', ({ entityId, change }: any) => {
          // Update entity in store
          const entity = newSystem.getEntity(entityId)
          if (entity) {
            get().updateEntity(entityId, entity)
          }

          // Emit event for other components
          eventBus.emit('entity:changed', { entityId, change })
        })

        newSystem.on('mode:updated', ({ mode, state }: any) => {
          // Update mode state
          const modeState = get().modes.get(mode)
          if (modeState) {
            set(state => ({
              modes: new Map(state.modes).set(mode, {
                ...modeState,
                lastActivity: Date.now(),
                changeCount: modeState.changeCount + 1
              })
            }))
          }

          // Emit event
          eventBus.emit('mode:updated', { mode, state })
        })

        newSystem.on('performance:warning', (warning: any) => {
          console.warn('Performance warning:', warning)
          eventBus.emit('performance:warning', warning)
        })

        newSystem.on('system:started', () => {
          set({ isRunning: true })
          eventBus.emit('system:started', {})
        })

        newSystem.on('system:stopped', () => {
          set({ isRunning: false })
          eventBus.emit('system:stopped', {})
        })

        // Set system and mark as initialized
        set({ system: newSystem, isInitialized: true })
        
        console.log('✅ Unified Editing System initialized in store')
      } catch (error) {
        console.error('❌ Failed to initialize system:', error)
        throw error
      }
    },

    // Start the system
    startSystem: () => {
      const { system, isInitialized } = get()
      if (!system || !isInitialized) {
        console.error('System not initialized')
        return
      }

      system.start()
    },

    // Stop the system
    stopSystem: () => {
      const { system } = get()
      if (system) {
        system.stop()
      }
    },

    // Entity management
    addEntity: (entity: CanvasEntity) => {
      set(state => {
        const newEntities = new Map(state.entities)
        newEntities.set(entity.id, {
          entity,
          optimisticChanges: [],
          lastSync: Date.now(),
          dirty: false
        })
        
        // Update performance
        const performance = { ...state.performance }
        performance.entityCount = newEntities.size

        // Emit event
        eventBus.emit('entity:added', { entity })

        return { 
          entities: newEntities,
          performance
        }
      })
    },

    updateEntity: (id: string, changes: Partial<CanvasEntity>, optimistic = false) => {
      set(state => {
        const entityState = state.entities.get(id)
        if (!entityState) return state

        const newEntities = new Map(state.entities)
        
        if (optimistic) {
          // Apply optimistic update
          newEntities.set(id, {
            ...entityState,
            entity: { ...entityState.entity, ...changes },
            optimisticChanges: [...entityState.optimisticChanges, changes],
            dirty: true
          })
        } else {
          // Apply confirmed update
          newEntities.set(id, {
            entity: { ...entityState.entity, ...changes },
            optimisticChanges: [],
            lastSync: Date.now(),
            dirty: false
          })
        }

        // Emit event
        eventBus.emit('entity:updated', { id, changes, optimistic })

        return { entities: newEntities }
      })
    },

    removeEntity: (id: string) => {
      set(state => {
        const newEntities = new Map(state.entities)
        newEntities.delete(id)
        
        const newSelectedIds = new Set(state.selectedEntityIds)
        newSelectedIds.delete(id)

        // Update performance
        const performance = { ...state.performance }
        performance.entityCount = newEntities.size

        // Emit event
        eventBus.emit('entity:removed', { id })

        return { 
          entities: newEntities,
          selectedEntityIds: newSelectedIds,
          performance
        }
      })
    },

    selectEntity: (id: string, multi = false) => {
      set(state => {
        const newSelectedIds = multi 
          ? new Set(state.selectedEntityIds)
          : new Set<string>()
        
        newSelectedIds.add(id)

        // Emit event
        eventBus.emit('entity:selected', { id, multi })

        return { selectedEntityIds: newSelectedIds }
      })
    },

    clearSelection: () => {
      set({ selectedEntityIds: new Set() })
      eventBus.emit('selection:cleared', {})
    },

    // Mode management
    setPrimaryMode: (mode: CanvasMode) => {
      const { system } = get()
      
      set(state => {
        const newModes = new Map(state.modes)
        
        // Update primary mode flags
        for (const [m, modeState] of newModes) {
          newModes.set(m, {
            ...modeState,
            primaryMode: m === mode
          })
        }

        return { 
          primaryMode: mode,
          modes: newModes
        }
      })

      // Update system
      if (system) {
        system.setPrimaryMode(mode)
      }

      // Emit event
      eventBus.emit('mode:primary', { mode })
    },

    setModeActive: (mode: CanvasMode, active: boolean) => {
      const { system } = get()
      
      set(state => {
        const modeState = state.modes.get(mode)
        if (!modeState) return state

        const newModes = new Map(state.modes)
        newModes.set(mode, { ...modeState, active })

        return { modes: newModes }
      })

      // Update system
      if (system) {
        system.setModeActive(mode, active)
      }

      // Emit event
      eventBus.emit('mode:active', { mode, active })
    },

    setModeOpacity: (mode: CanvasMode, opacity: number) => {
      const { system } = get()
      
      set(state => {
        const modeState = state.modes.get(mode)
        if (!modeState) return state

        const newModes = new Map(state.modes)
        newModes.set(mode, { ...modeState, opacity })

        return { modes: newModes }
      })

      // Update system
      if (system) {
        system.setModeOpacity(mode, opacity)
      }

      // Emit event
      eventBus.emit('mode:opacity', { mode, opacity })
    },

    setModeVisibility: (mode: CanvasMode, visible: boolean) => {
      set(state => {
        const modeState = state.modes.get(mode)
        if (!modeState) return state

        const newModes = new Map(state.modes)
        newModes.set(mode, { ...modeState, visible })

        return { modes: newModes }
      })

      // Emit event
      eventBus.emit('mode:visibility', { mode, visible })
    },

    // Canvas operations
    setZoom: (zoom: number) => {
      set(state => ({
        canvasState: {
          ...state.canvasState,
          zoom: Math.max(0.1, Math.min(10, zoom))
        }
      }))
      eventBus.emit('canvas:zoom', { zoom })
    },

    setPan: (x: number, y: number) => {
      set(state => ({
        canvasState: {
          ...state.canvasState,
          pan: { x, y }
        }
      }))
      eventBus.emit('canvas:pan', { x, y })
    },

    setViewport: (width: number, height: number) => {
      set(state => ({
        canvasState: {
          ...state.canvasState,
          viewport: { width, height }
        }
      }))
      eventBus.emit('canvas:viewport', { width, height })
    },

    // Sync operations
    applyChange: async (change: any) => {
      const { system } = get()
      if (!system) return

      const startTime = performance.now()
      
      try {
        await system['syncEngine'].applyChange(change)
        
        // Update performance metrics
        const latency = performance.now() - startTime
        get().updatePerformance({ syncLatency: latency })
        
        // Emit event
        eventBus.emit('change:applied', { change, latency })
      } catch (error) {
        console.error('Failed to apply change:', error)
        eventBus.emit('change:failed', { change, error })
      }
    },

    forceSyncAll: async () => {
      const { system } = get()
      if (!system) return

      await system['syncEngine'].forceSyncAll()
      eventBus.emit('sync:forced', {})
    },

    clearAll: () => {
      const { system } = get()
      
      set({
        entities: new Map(),
        selectedEntityIds: new Set()
      })

      if (system) {
        system.clearAll()
      }

      eventBus.emit('system:cleared', {})
    },

    // Performance monitoring
    updatePerformance: (metrics: Partial<PerformanceState>) => {
      set(state => ({
        performance: { ...state.performance, ...metrics }
      }))
    }
  }))
)

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const performance = useUnifiedEditingStore(state => state.performance)
  const updatePerformance = useUnifiedEditingStore(state => state.updatePerformance)

  // Monitor FPS
  React.useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (currentTime - lastTime)
        updatePerformance({ fps })
        
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    const handle = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(handle)
  }, [updatePerformance])

  return performance
}

// Selection hook for optimized entity selection
export const useEntitySelection = () => {
  const selectedIds = useUnifiedEditingStore(state => state.selectedEntityIds)
  const entities = useUnifiedEditingStore(state => state.entities)
  const selectEntity = useUnifiedEditingStore(state => state.selectEntity)
  const clearSelection = useUnifiedEditingStore(state => state.clearSelection)

  const selectedEntities = React.useMemo(() => {
    return Array.from(selectedIds)
      .map(id => entities.get(id)?.entity)
      .filter(Boolean) as CanvasEntity[]
  }, [selectedIds, entities])

  return {
    selectedIds,
    selectedEntities,
    selectEntity,
    clearSelection
  }
}

// Mode state hook
export const useModeState = (mode: CanvasMode) => {
  const modeState = useUnifiedEditingStore(state => state.modes.get(mode))
  const setPrimaryMode = useUnifiedEditingStore(state => state.setPrimaryMode)
  const setModeActive = useUnifiedEditingStore(state => state.setModeActive)
  const setModeOpacity = useUnifiedEditingStore(state => state.setModeOpacity)
  const setModeVisibility = useUnifiedEditingStore(state => state.setModeVisibility)

  return {
    ...modeState,
    setPrimary: () => setPrimaryMode(mode),
    setActive: (active: boolean) => setModeActive(mode, active),
    setOpacity: (opacity: number) => setModeOpacity(mode, opacity),
    setVisibility: (visible: boolean) => setModeVisibility(mode, visible)
  }
}

// Export event bus for external use
export { EventBus }