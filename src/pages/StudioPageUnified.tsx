import React, { useRef, useEffect, useState, useCallback } from 'react'
import { UnifiedCanvasStudio } from '../components/studio/UnifiedCanvasStudio'
import { Toolbar } from '../components/studio/Toolbar'
import { ExportDialog } from '../components/studio/ExportDialog'
import { PresetDialog } from '../components/studio/PresetDialog'
import { BookmarkDialog } from '../components/studio/BookmarkDialog'
import { useAppStore } from '../hooks/useAppStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { UnifiedEditingSystem, SystemMetrics, UnifiedEditingConfig } from '../core/UnifiedEditingSystem'
import { CanvasMode } from '../graphics/canvas/UnifiedCanvas'

export function StudioPageUnified() {
  const { 
    exportDialogOpen, 
    setExportDialogOpen,
    presetDialogOpen,
    setPresetDialogOpen,
    bookmarkDialogOpen,
    setBookmarkDialogOpen,
    theme,
    activeColor,
    zoom,
    setZoom
  } = useAppStore()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const systemRef = useRef<UnifiedEditingSystem | null>(null)
  
  // System state
  const [systemInitialized, setSystemInitialized] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [activeModes, setActiveModes] = useState<Set<CanvasMode>>(new Set([
    CanvasMode.DRAW,
    CanvasMode.PARAMETRIC,
    CanvasMode.CODE,
    CanvasMode.GROWTH
  ]))
  const [primaryMode, setPrimaryMode] = useState<CanvasMode>(CanvasMode.DRAW)
  const [modeOpacities, setModeOpacities] = useState<Map<CanvasMode, number>>(new Map([
    [CanvasMode.DRAW, 1.0],
    [CanvasMode.PARAMETRIC, 0.8],
    [CanvasMode.CODE, 0.9],
    [CanvasMode.GROWTH, 0.7]
  ]))
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Initialize unified editing system
  useEffect(() => {
    console.log('StudioPageUnified useEffect running', {
      canvasRef: canvasRef.current,
      containerRef: containerRef.current,
      systemInitialized
    });
    
    if (!canvasRef.current || !containerRef.current || systemInitialized) return;

    const canvas = canvasRef.current
    const container = containerRef.current
    
    // Set canvas size
    const updateCanvasSize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    
    updateCanvasSize()

    try {
      // Create unified editing system configuration
      const config: UnifiedEditingConfig = {
        canvas,
        width: canvas.width,
        height: canvas.height,
        pixelRatio: window.devicePixelRatio,
        performanceTarget: {
          fps: 60,
          maxSyncLatency: 16 // ~60fps target
        },
        translation: {
          quality: 'balanced',
          enableCache: true
        }
      }

      // Initialize the system
      const system = new UnifiedEditingSystem(config)
      systemRef.current = system

      // Setup event listeners
      system.on('system:started', () => {
        console.log('✅ Unified Editing System started successfully')
        setSystemInitialized(true)
      })

      system.on('entity:changed', (event: any) => {
        console.log('🔄 Entity changed:', event.entityId)
        // Could update UI state here
      })

      system.on('mode:toggled', (event: any) => {
        console.log('🎛️ Mode toggled:', event.mode, event.active)
        setActiveModes(prev => {
          const newSet = new Set(prev)
          if (event.active) {
            newSet.add(event.mode)
          } else {
            newSet.delete(event.mode)
          }
          return newSet
        })
      })

      system.on('mode:primary', (event: any) => {
        console.log('🎯 Primary mode changed:', event.mode)
        setPrimaryMode(event.mode)
      })

      system.on('mode:opacity', (event: any) => {
        console.log('👁️ Mode opacity changed:', event.mode, event.opacity)
        setModeOpacities(prev => new Map(prev.set(event.mode, event.opacity)))
      })

      system.on('performance:warning', (event: any) => {
        console.warn('⚠️ Performance warning:', event.type, 'current:', event.current, 'target:', event.target)
      })

      // Configure initial mode states
      activeModes.forEach(mode => {
        system.setModeActive(mode, true)
        const opacity = modeOpacities.get(mode) || 1.0
        system.setModeOpacity(mode, opacity)
      })

      system.setPrimaryMode(primaryMode)

      // Start the system
      system.start()

      // Handle resize
      const handleResize = () => {
        updateCanvasSize()
        const canvas = system.getCanvas()
        const { width, height } = container.getBoundingClientRect()
        canvas.resize(
          width * window.devicePixelRatio, 
          height * window.devicePixelRatio
        )
      }

      window.addEventListener('resize', handleResize)

      // Performance monitoring
      const metricsInterval = setInterval(() => {
        if (systemRef.current) {
          const metrics = systemRef.current.getSystemMetrics()
          setSystemMetrics(metrics)
        }
      }, 1000)

      return () => {
        window.removeEventListener('resize', handleResize)
        clearInterval(metricsInterval)
        
        if (systemRef.current) {
          systemRef.current.destroy()
          systemRef.current = null
        }
        setSystemInitialized(false)
      }
    } catch (error) {
      console.error('❌ Failed to initialize Unified Editing System:', error)
      setSystemInitialized(false)
    }
  }, [canvasRef.current, containerRef.current])

  // Handle mode toggle
  const handleModeToggle = useCallback((mode: CanvasMode) => {
    if (!systemRef.current) return

    const isActive = activeModes.has(mode)
    systemRef.current.setModeActive(mode, !isActive)
  }, [activeModes])

  // Handle primary mode change
  const handlePrimaryModeChange = useCallback((mode: CanvasMode) => {
    if (!systemRef.current || !activeModes.has(mode)) return

    systemRef.current.setPrimaryMode(mode)
  }, [activeModes])

  // Handle opacity change
  const handleOpacityChange = useCallback((mode: CanvasMode, opacity: number) => {
    if (!systemRef.current) return

    systemRef.current.setModeOpacity(mode, opacity)
  }, [])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (!systemRef.current) return

    systemRef.current.clearAll()
    console.log('🗑️ All modes cleared')
  }, [])

  // Handle export
  const handleExport = useCallback(() => {
    if (!systemRef.current) return

    const canvas = systemRef.current.getCanvas()
    setExportDialogOpen(true)
    console.log('📤 Export requested, canvas:', canvas)
  }, [setExportDialogOpen])

  if (!systemInitialized) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Initializing Unified Editing System</h2>
          <p className="text-gray-400">Setting up multi-mode collaborative canvas...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-900 text-white">
      {/* Enhanced Toolbar with Multi-Mode Controls */}
      <div className="flex-shrink-0">
        <Toolbar />
        
        {/* Multi-Mode Status Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-300">Active Modes:</span>
              <div className="flex gap-2">
                {Array.from(activeModes).map(mode => (
                  <div
                    key={mode}
                    className={`
                      px-2 py-1 rounded-md text-xs font-medium border
                      ${primaryMode === mode 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                      }
                    `}
                    title={`${mode} mode ${primaryMode === mode ? '(Primary)' : ''}`}
                  >
                    {mode}
                    {primaryMode === mode && ' ★'}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Performance Metrics */}
            {systemMetrics && process.env.NODE_ENV === 'development' && (
              <div className="flex gap-4 text-xs font-mono text-gray-400">
                <span className="text-green-400">FPS: {systemMetrics.performance.fps}</span>
                <span className="text-blue-400">Sync: {systemMetrics.performance.syncLatency.toFixed(1)}ms</span>
                <span className="text-purple-400">Entities: {systemMetrics.entities.total}</span>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Studio Area - Unified Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="relative w-full h-full"
          data-testid="main-canvas"
          style={{ 
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)'
          }}
        >
          <canvas
            ref={canvasRef}
            id="drawing-canvas"
            data-testid="drawing-canvas"
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ 
              imageRendering: 'crisp-edges',
              touchAction: 'none'
            }}
          />
          
          {/* Mode Control Overlay */}
          <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Unified Multi-Mode Canvas</h3>
              <div className="text-xs text-green-400">
                ● Live Sync Active
              </div>
            </div>

            {/* Mode Control Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[CanvasMode.DRAW, CanvasMode.PARAMETRIC, CanvasMode.CODE, CanvasMode.GROWTH].map(mode => {
                const isActive = activeModes.has(mode)
                const isPrimary = primaryMode === mode
                const opacity = modeOpacities.get(mode) || 1.0
                
                return (
                  <div key={mode} className="bg-white/5 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => handleModeToggle(mode)}
                        className={`
                          text-sm font-medium transition-colors
                          ${isActive ? 'text-white' : 'text-gray-500'}
                        `}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                      
                      {isActive && (
                        <button
                          onClick={() => handlePrimaryModeChange(mode)}
                          className={`
                            w-3 h-3 rounded-full border-2 transition-colors
                            ${isPrimary 
                              ? 'bg-blue-500 border-blue-400' 
                              : 'border-white/30 hover:border-white/50'
                            }
                          `}
                          title="Set as primary mode"
                        />
                      )}
                    </div>
                    
                    {isActive && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60 min-w-12">Opacity</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={opacity}
                            onChange={(e) => handleOpacityChange(mode, parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer"
                          />
                          <span className="text-xs text-white/60 min-w-8">
                            {Math.round(opacity * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* System Status */}
            <div className="text-xs text-white/60 border-t border-white/20 pt-3">
              <div className="flex justify-between">
                <span>Real-time sync enabled</span>
                <span>All modes collaborative</span>
              </div>
            </div>
          </div>

          {/* Mode-Specific Feedback Overlays */}
          {primaryMode === CanvasMode.PARAMETRIC && (
            <div className="absolute bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-xs font-semibold text-purple-400 mb-2">Parametric Controls</div>
              <div className="text-xs text-white/60">
                Click and drag to adjust pattern parameters
              </div>
            </div>
          )}

          {primaryMode === CanvasMode.CODE && (
            <div className="absolute bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-xs font-semibold text-green-400 mb-2">Code Execution</div>
              <div className="text-xs text-white/60">
                Click to highlight execution points
              </div>
            </div>
          )}

          {primaryMode === CanvasMode.GROWTH && (
            <div className="absolute bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
              <div className="text-xs font-semibold text-orange-400 mb-2">Growth Algorithm</div>
              <div className="text-xs text-white/60">
                Click to add growth seeds
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <ExportDialog 
        isOpen={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        canvas={systemRef.current?.getCanvas() || null}
      />
      
      <PresetDialog 
        isOpen={presetDialogOpen} 
        onClose={() => setPresetDialogOpen(false)}
      />
      
      <BookmarkDialog 
        isOpen={bookmarkDialogOpen} 
        onClose={() => setBookmarkDialogOpen(false)}
      />
    </div>
  )
}