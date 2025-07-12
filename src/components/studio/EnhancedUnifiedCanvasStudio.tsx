/**
 * Enhanced Unified Canvas Studio with Real-Time Sync
 * DEVELOPER_010 - Production-ready component with full synchronization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { 
  Brush, 
  Code, 
  Zap, 
  Grid3x3,
  Eye,
  EyeOff,
  Settings,
  Layers,
  RotateCcw,
  Download,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react'
import { CanvasMode } from '../src/graphics/canvas/UnifiedCanvas'
import { useUnifiedEditingStore, eventBus, usePerformanceMonitor, useModeState } from './unifiedEditingStore'
import { syncCoordinator } from './OptimizedSyncHandlers'
import { ModeType, ChangeType, SyncPriority } from '../src/core/sync/SynchronizationEngine'

// Import mode-specific UI components
import { DrawingTools } from '../src/components/studio/DrawingTools'
import { ParametricControls } from '../src/components/studio/ParametricControls'
import { CodeEditor } from '../src/components/studio/CodeEditor'
import { GrowthController } from '../src/components/studio/GrowthController'

interface EnhancedUnifiedCanvasStudioProps {
  className?: string
  onExport?: (data: any) => void
}

export const EnhancedUnifiedCanvasStudio: React.FC<EnhancedUnifiedCanvasStudioProps> = ({ 
  className = "",
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Store hooks
  const store = useUnifiedEditingStore()
  const performance = usePerformanceMonitor()
  
  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [showModeSettings, setShowModeSettings] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [showPerformance, setShowPerformance] = useState(true)
  
  // Initialize unified editing system
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return

    const initSystem = async () => {
      try {
        await store.initializeSystem(canvasRef.current!)
        store.startSystem()
        setIsInitialized(true)
        
        console.log('✅ Enhanced Unified Canvas Studio initialized')
        
        // Send initialization event
        eventBus.emit('studio:initialized', {
          timestamp: Date.now(),
          modes: Array.from(store.modes.keys())
        })
      } catch (error) {
        console.error('❌ Failed to initialize studio:', error)
      }
    }

    initSystem()

    // Cleanup
    return () => {
      if (store.system) {
        store.stopSystem()
        syncCoordinator.destroy()
      }
    }
  }, [store, isInitialized])

  // Handle canvas resize
  useEffect(() => {
    if (!containerRef.current || !store.system) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        store.setViewport(width, height)
        
        if (store.system) {
          store.system.getCanvas().resize(width, height)
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [store])

  // Setup real-time sync handlers
  useEffect(() => {
    if (!syncEnabled || !store.system) return

    // Handle drawing events
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5
      }

      const change = {
        id: `pointer_${Date.now()}`,
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: { point, type: 'start' }
      }

      store.applyChange(change)
      syncCoordinator.handleChange(change)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 0) return

      const rect = canvasRef.current!.getBoundingClientRect()
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5
      }

      const change = {
        id: `pointer_move_${Date.now()}`,
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_MODIFIED,
        priority: SyncPriority.USER_ACTION,
        data: { point, type: 'move' }
      }

      store.applyChange(change)
      syncCoordinator.handleChange(change)
    }

    const handlePointerUp = (e: PointerEvent) => {
      const change = {
        id: `pointer_end_${Date.now()}`,
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: { type: 'end' }
      }

      store.applyChange(change)
      syncCoordinator.handleChange(change)
    }

    // Add event listeners
    canvasRef.current!.addEventListener('pointerdown', handlePointerDown)
    canvasRef.current!.addEventListener('pointermove', handlePointerMove)
    canvasRef.current!.addEventListener('pointerup', handlePointerUp)

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('pointerdown', handlePointerDown)
        canvasRef.current.removeEventListener('pointermove', handlePointerMove)
        canvasRef.current.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [syncEnabled, store])

  // Mode control handlers
  const toggleMode = useCallback((mode: CanvasMode) => {
    const modeState = store.modes.get(mode)
    if (modeState) {
      store.setModeActive(mode, !modeState.active)
    }
  }, [store])

  const selectPrimaryMode = useCallback((mode: CanvasMode) => {
    const modeState = store.modes.get(mode)
    if (modeState?.active) {
      store.setPrimaryMode(mode)
    }
  }, [store])

  // Canvas operations
  const clearCanvas = useCallback(() => {
    if (confirm('Clear all content? This cannot be undone.')) {
      store.clearAll()
      eventBus.emit('canvas:cleared', { timestamp: Date.now() })
    }
  }, [store])

  const exportCanvas = useCallback(async () => {
    if (!store.system) return

    try {
      const entities = store.system.getAllEntities()
      const exportData = {
        version: '1.0',
        timestamp: Date.now(),
        entities,
        modes: Array.from(store.modes.entries()).map(([mode, state]) => ({
          mode,
          ...state
        })),
        viewport: store.canvasState.viewport
      }

      if (onExport) {
        onExport(exportData)
      } else {
        // Default export as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `genshi-studio-export-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
      }

      eventBus.emit('canvas:exported', { timestamp: Date.now() })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [store, onExport])

  // Render mode controls
  const renderModeControls = () => {
    const modes = Array.from(store.modes.entries())

    return modes.map(([mode, state]) => {
      const icons = {
        [CanvasMode.DRAW]: <Brush className="w-4 h-4" />,
        [CanvasMode.PARAMETRIC]: <Grid3x3 className="w-4 h-4" />,
        [CanvasMode.CODE]: <Code className="w-4 h-4" />,
        [CanvasMode.GROWTH]: <Zap className="w-4 h-4" />
      }

      const colors = {
        [CanvasMode.DRAW]: 'bg-blue-500',
        [CanvasMode.PARAMETRIC]: 'bg-purple-500',
        [CanvasMode.CODE]: 'bg-green-500',
        [CanvasMode.GROWTH]: 'bg-orange-500'
      }

      return (
        <div key={mode} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleMode(mode)}
                className={`
                  w-3 h-3 rounded-full border-2 transition-colors
                  ${state.active 
                    ? `${colors[mode]} border-transparent` 
                    : 'border-white/30 hover:border-white/50'
                  }
                `}
              />
              <button
                onClick={() => selectPrimaryMode(mode)}
                className={`
                  flex items-center gap-1 text-xs font-medium transition-colors
                  ${state.primaryMode ? 'text-white' : 'text-white/60 hover:text-white/80'}
                `}
              >
                {icons[mode]}
                {mode}
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => store.setModeVisibility(mode, !state.visible)}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
              >
                {state.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
              
              {state.active && (
                <span className="text-xs text-white/40">
                  {state.changeCount}
                </span>
              )}
            </div>
          </div>
          
          {showModeSettings && state.active && (
            <div className="ml-5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 min-w-12">Opacity</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.opacity}
                  onChange={(e) => store.setModeOpacity(mode, parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer"
                />
                <span className="text-xs text-white/60 min-w-8">
                  {Math.round(state.opacity * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  // Get active primary mode for UI
  const primaryMode = Array.from(store.modes.entries()).find(([_, state]) => state.primaryMode)?.[0]

  return (
    <div className={`h-full bg-gray-900 text-white relative overflow-hidden ${className}`}>
      {/* Mode Control Panel */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Real-Time Multi-Mode Studio</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`p-1 rounded transition-colors ${
                syncEnabled ? 'text-green-400 hover:bg-green-400/20' : 'text-red-400 hover:bg-red-400/20'
              }`}
              title={syncEnabled ? 'Sync enabled' : 'Sync disabled'}
            >
              {syncEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowModeSettings(!showModeSettings)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Controls */}
        <div className="space-y-3">
          {renderModeControls()}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          
          <button
            onClick={() => store.forceSyncAll()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <Activity className="w-3 h-3" />
            Force Sync
          </button>
        </div>
      </div>

      {/* Performance Monitor */}
      {showPerformance && (
        <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/60">Performance</div>
            <button
              onClick={() => setShowPerformance(false)}
              className="text-white/40 hover:text-white/60"
            >
              ×
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-green-400">FPS:</span>
              <span className={performance.fps < 30 ? 'text-red-400' : 'text-green-400'}>
                {performance.fps.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">Sync:</span>
              <span className={performance.syncLatency > 100 ? 'text-red-400' : 'text-blue-400'}>
                {performance.syncLatency.toFixed(1)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Translation:</span>
              <span className="text-purple-400">{performance.translationTime.toFixed(1)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">Entities:</span>
              <span className="text-orange-400">{performance.entityCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={{ 
          background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            cursor: primaryMode === CanvasMode.DRAW ? 'crosshair' : 'default',
            touchAction: 'none'
          }}
        />
      </div>

      {/* Mode-Specific UI Panels */}
      {primaryMode === CanvasMode.DRAW && (
        <DrawingTools 
          className="absolute bottom-4 left-4 z-40"
          onToolChange={(tool) => eventBus.emit('tool:changed', { tool })}
        />
      )}

      {primaryMode === CanvasMode.PARAMETRIC && (
        <ParametricControls
          className="absolute bottom-4 right-4 z-40"
          onParameterChange={(params) => {
            const change = {
              id: `param_${Date.now()}`,
              timestamp: Date.now(),
              sourceMode: ModeType.PARAMETRIC,
              changeType: ChangeType.PARAMETER_CHANGED,
              priority: SyncPriority.USER_ACTION,
              data: params
            }
            store.applyChange(change)
            syncCoordinator.handleChange(change)
          }}
        />
      )}

      {primaryMode === CanvasMode.CODE && (
        <CodeEditor
          className="absolute bottom-4 right-4 z-40 w-96"
          onExecute={(code, result) => {
            const change = {
              id: `code_${Date.now()}`,
              timestamp: Date.now(),
              sourceMode: ModeType.CODE,
              changeType: ChangeType.CODE_EXECUTED,
              priority: SyncPriority.USER_ACTION,
              data: { code, result }
            }
            store.applyChange(change)
            syncCoordinator.handleChange(change)
          }}
        />
      )}

      {primaryMode === CanvasMode.GROWTH && (
        <GrowthController
          className="absolute bottom-4 right-4 z-40"
          onGrowthUpdate={(growth) => {
            const change = {
              id: `growth_${Date.now()}`,
              timestamp: Date.now(),
              sourceMode: ModeType.GROWTH,
              changeType: ChangeType.GROWTH_UPDATED,
              priority: SyncPriority.ALGORITHM_UPDATE,
              data: growth
            }
            store.applyChange(change)
            syncCoordinator.handleChange(change)
          }}
        />
      )}

      {/* Sync Status Indicator */}
      <div className="absolute bottom-4 right-4 z-50">
        <div className={`
          w-2 h-2 rounded-full animate-pulse
          ${syncEnabled ? 'bg-green-400' : 'bg-red-400'}
        `} 
        title={syncEnabled ? 'Real-time sync active' : 'Sync disabled'} />
      </div>
    </div>
  )
}

export default EnhancedUnifiedCanvasStudio