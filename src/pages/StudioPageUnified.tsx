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
import { StudioErrorBoundary, CanvasErrorBoundary } from '../components/ErrorBoundary'

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
  const [initError, setInitError] = useState<string | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
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
      // Log browser capabilities for debugging
      console.log('🔧 Browser capabilities:', {
        webgl: !!document.createElement('canvas').getContext('webgl'),
        webgl2: !!document.createElement('canvas').getContext('webgl2'),
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent.substring(0, 100),
        canvasSize: { width: canvas.width, height: canvas.height }
      })

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
      system.on('system:initialized', () => {
        console.log('✅ System core initialized')
      })
      
      system.on('system:started', () => {
        console.log('✅ Unified Editing System started successfully')
        setSystemInitialized(true)
      })
      
      system.on('system:error', (event: any) => {
        console.error('❌ System error:', event.error)
        setInitError(event.error)
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

      // Start the system asynchronously
      const startSystem = async () => {
        try {
          // Only configure draw mode initially for faster startup
          system.setModeActive(CanvasMode.DRAW, true)
          system.setPrimaryMode(CanvasMode.DRAW)
          
          // Start the system
          await system.start()
          
          // Configure other modes after startup
          setTimeout(() => {
            activeModes.forEach(mode => {
              if (mode !== CanvasMode.DRAW) {
                system.setModeActive(mode, true)
                const opacity = modeOpacities.get(mode) || 1.0
                system.setModeOpacity(mode, opacity)
              }
            })
          }, 500)
        } catch (error) {
          console.error('Failed to start system:', error)
          throw error
        }
      }
      
      startSystem()

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      
      // Check if this is a WebGL error and suggest fallback
      if (errorMessage.toLowerCase().includes('webgl')) {
        setInitError('WebGL initialization failed. Your browser may not support hardware acceleration.')
        setFallbackMode(true)
      } else {
        setInitError(`Graphics system initialization failed: ${errorMessage}`)
      }
      
      setSystemInitialized(false)
    }
  }, [canvasRef.current, containerRef.current])

  // Add initialization timeout with fallback mode
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!systemInitialized && !initError) {
        console.warn('⚠️ Initialization timeout - switching to simplified mode')
        // Instead of showing error, try fallback mode
        setFallbackMode(true)
        setSystemInitialized(true) // Allow simplified mode to render
      }
    }, 5000) // Reduced to 5 seconds for faster fallback

    return () => clearTimeout(timeoutId)
  }, [systemInitialized, initError])

  // Simple fallback drawing functionality
  useEffect(() => {
    if (!fallbackMode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    updateCanvasSize()

    let isDrawing = false
    let lastX = 0
    let lastY = 0

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      lastX = clientX - rect.left
      lastY = clientY - rect.top
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return
      
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const currentX = clientX - rect.left
      const currentY = clientY - rect.top

      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(currentX, currentY)
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()

      lastX = currentX
      lastY = currentY
    }

    const stopDrawing = () => {
      isDrawing = false
    }

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)

    // Touch events
    canvas.addEventListener('touchstart', startDrawing)
    canvas.addEventListener('touchmove', draw)
    canvas.addEventListener('touchend', stopDrawing)

    window.addEventListener('resize', updateCanvasSize)

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseout', stopDrawing)
      canvas.removeEventListener('touchstart', startDrawing)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDrawing)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [fallbackMode, activeColor])

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
    let canvas: HTMLCanvasElement | undefined
    
    if (fallbackMode) {
      // Use the simple canvas directly
      canvas = canvasRef.current || undefined
      console.log('📤 Export requested from fallback mode, canvas:', canvas)
    } else {
      // Use the unified system canvas
      if (!systemRef.current) return
      canvas = systemRef.current.getCanvas()?.getElement()
      console.log('📤 Export requested from unified mode, canvas:', canvas)
    }
    
    setExportDialogOpen(true)
  }, [setExportDialogOpen, fallbackMode])

  // Handle error state
  if (initError) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Graphics System Error</h2>
          <p className="text-gray-400 mb-4">
            {initError || 'Initialization timeout'}
          </p>
          {fallbackMode && (
            <p className="text-yellow-400 text-sm mb-4">
              💡 Try using a different browser or enabling hardware acceleration in your browser settings.
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = '/genshi-studio/'} 
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle loading state
  if (!systemInitialized) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Initializing Unified Editing System</h2>
          <p className="text-gray-400 mb-2">Setting up multi-mode collaborative canvas...</p>
          <p className="text-gray-500 text-sm">This should take 3-5 seconds...</p>
        </div>
      </div>
    )
  }

  // Render simplified fallback mode
  if (fallbackMode) {
    return (
      <div ref={containerRef} className="flex flex-col h-full bg-gray-900 text-white">
        <div className="flex-shrink-0">
          <Toolbar />
          
          {/* Simplified Mode Status Bar */}
          <div className="bg-yellow-900 border-b border-yellow-700 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-yellow-200">🚀 Simplified Drawing Mode</span>
                <span className="text-xs text-yellow-300">Basic canvas functionality - full features loading failed</span>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-yellow-100 text-xs rounded transition-colors"
              >
                Try Full Mode
              </button>
            </div>
          </div>
        </div>

        {/* Simplified Canvas Area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            data-testid="main-canvas"
            className="w-full h-full bg-white cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
          
          {/* Simple drawing overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
            ✏️ Simple drawing mode active - Click and drag to draw
          </div>
        </div>

        {/* Dialogs */}
        {exportDialogOpen && <ExportDialog />}
        {presetDialogOpen && <PresetDialog />}
        {bookmarkDialogOpen && <BookmarkDialog />}
      </div>
    )
  }

  return (
    <StudioErrorBoundary>
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
        <CanvasErrorBoundary>
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
        </CanvasErrorBoundary>
        
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
    </StudioErrorBoundary>
  )
}