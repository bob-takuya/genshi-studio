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
  Download,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { EnhancedUnifiedCanvas, CanvasMode } from '../../graphics/canvas/EnhancedUnifiedCanvas'
import { SimpleUnifiedCanvas } from './SimpleUnifiedCanvas'
import { useAppStore } from '../../hooks/useAppStore'

interface ModeConfig {
  mode: CanvasMode;
  name: string;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  opacity: number;
  visible: boolean;
}

interface UnifiedCanvasStudioProps {
  className?: string;
}

export const UnifiedCanvasStudio: React.FC<UnifiedCanvasStudioProps> = ({ 
  className = "" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const unifiedCanvasRef = useRef<EnhancedUnifiedCanvas | null>(null)
  const [webGLFailed, setWebGLFailed] = useState(false)
  
  const { activeColor } = useAppStore()
  
  // Mode configurations
  const [modeConfigs, setModeConfigs] = useState<ModeConfig[]>([
    {
      mode: CanvasMode.DRAW,
      name: 'Draw',
      icon: <Brush className="w-4 h-4" />,
      color: 'bg-blue-500',
      active: true,
      opacity: 1.0,
      visible: true
    },
    {
      mode: CanvasMode.PARAMETRIC,
      name: 'Parametric',
      icon: <Grid3x3 className="w-4 h-4" />,
      color: 'bg-purple-500',
      active: true,
      opacity: 0.8,
      visible: true
    },
    {
      mode: CanvasMode.CODE,
      name: 'Code',
      icon: <Code className="w-4 h-4" />,
      color: 'bg-green-500',
      active: true,
      opacity: 0.9,
      visible: true
    },
    {
      mode: CanvasMode.GROWTH,
      name: 'Growth',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-orange-500',
      active: true,
      opacity: 0.7,
      visible: true
    }
  ])
  
  const [showModeSettings, setShowModeSettings] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    activeModes: [] as string[],
    activeInteractions: 0
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [showDemo, setShowDemo] = useState(false)

  // Initialize unified canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    
    // Set canvas size with device pixel ratio
    const updateCanvasSize = () => {
      const { width, height } = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    
    updateCanvasSize()

    // Initialize enhanced unified canvas
    try {
      const unifiedCanvas = new EnhancedUnifiedCanvas(canvas)
      unifiedCanvasRef.current = unifiedCanvas
      
      // Activate all modes for simultaneous editing
      unifiedCanvas.activateModes([
        CanvasMode.DRAW,
        CanvasMode.PARAMETRIC,
        CanvasMode.CODE,
        CanvasMode.GROWTH
      ])
      
      console.log('🎨 Enhanced Unified Canvas Studio initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Unified Canvas:', error)
      console.log('⚡ Falling back to Canvas 2D implementation')
      setWebGLFailed(true)
    }

    // Handle resize
    const handleResize = () => {
      updateCanvasSize()
      // Canvas will handle resize internally
    }

    window.addEventListener('resize', handleResize)

    // Performance monitoring
    const performanceInterval = setInterval(() => {
      if (unifiedCanvasRef.current) {
        const metrics = unifiedCanvasRef.current.getPerformanceMetrics()
        setPerformanceMetrics(metrics)
      }
    }, 100) // Update 10 times per second for smooth display

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(performanceInterval)
      
      if (unifiedCanvasRef.current) {
        unifiedCanvasRef.current.destroy()
        unifiedCanvasRef.current = null
      }
    }
  }, [])

  // Update mode configurations
  useEffect(() => {
    if (!unifiedCanvasRef.current) return

    modeConfigs.forEach(config => {
      unifiedCanvasRef.current!.setModeOpacity(config.mode, config.opacity)
      unifiedCanvasRef.current!.setModeVisibility(config.mode, config.visible)
      
      if (config.active) {
        unifiedCanvasRef.current!.activateModes([config.mode])
      } else {
        unifiedCanvasRef.current!.deactivateModes([config.mode])
      }
    })
  }, [modeConfigs])

  // Handle canvas interactions
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (!unifiedCanvasRef.current) return
    unifiedCanvasRef.current.handleInteraction(event.nativeEvent, 'down')
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!unifiedCanvasRef.current) return
    unifiedCanvasRef.current.handleInteraction(event.nativeEvent, 'move')
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!unifiedCanvasRef.current) return
    unifiedCanvasRef.current.handleInteraction(event.nativeEvent, 'up')
  }, [])

  // Handle mode toggle
  const toggleMode = useCallback((mode: CanvasMode) => {
    setModeConfigs(prev => prev.map(config => 
      config.mode === mode 
        ? { ...config, active: !config.active }
        : config
    ))
  }, [])

  // Handle mode visibility toggle
  const toggleModeVisibility = useCallback((mode: CanvasMode) => {
    setModeConfigs(prev => prev.map(config =>
      config.mode === mode
        ? { ...config, visible: !config.visible }
        : config
    ))
  }, [])

  // Handle opacity change
  const handleOpacityChange = useCallback((mode: CanvasMode, opacity: number) => {
    setModeConfigs(prev => prev.map(config =>
      config.mode === mode
        ? { ...config, opacity }
        : config
    ))
  }, [])

  // Clear canvas (would need implementation)
  const clearCanvas = useCallback(() => {
    console.log('Clear canvas requested')
    // Would clear all layers
  }, [])

  // Export canvas (would need implementation)
  const exportCanvas = useCallback(() => {
    console.log('Export canvas requested')
    // Would export composite image
  }, [])

  // Demo mode - show all modes working together
  const startDemo = useCallback(() => {
    if (!unifiedCanvasRef.current || !canvasRef.current) return
    setShowDemo(true)
    
    // Simulate interactions for each mode
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // Create synthetic pointer events
    const createEvent = (x: number, y: number, pressure: number = 1.0): PointerEvent => {
      return new PointerEvent('pointermove', {
        clientX: rect.left + x,
        clientY: rect.top + y,
        pressure,
        bubbles: true
      } as any)
    }
    
    let frame = 0
    const demoInterval = setInterval(() => {
      if (frame > 300 || !showDemo) {
        clearInterval(demoInterval)
        setShowDemo(false)
        return
      }
      
      // Drawing mode - create a spiral
      const drawAngle = frame * 0.1
      const drawRadius = 50 + frame * 0.5
      const drawX = rect.width / 2 + Math.cos(drawAngle) * drawRadius
      const drawY = rect.height / 2 + Math.sin(drawAngle) * drawRadius
      
      if (frame === 0) {
        unifiedCanvasRef.current!.handleInteraction(createEvent(drawX, drawY), 'down')
      } else if (frame < 100) {
        unifiedCanvasRef.current!.handleInteraction(createEvent(drawX, drawY, 0.5 + Math.sin(frame * 0.2) * 0.5), 'move')
      } else if (frame === 100) {
        unifiedCanvasRef.current!.handleInteraction(createEvent(drawX, drawY), 'up')
      }
      
      // Parametric mode - add patterns
      if (frame % 30 === 0 && frame < 150) {
        const patternX = rect.width * 0.2 + (frame / 30) * rect.width * 0.15
        const patternY = rect.height * 0.7
        unifiedCanvasRef.current!.handleInteraction(createEvent(patternX, patternY), 'down')
        unifiedCanvasRef.current!.handleInteraction(createEvent(patternX, patternY), 'up')
      }
      
      // Code mode - procedural shapes
      if (frame % 40 === 20 && frame < 200) {
        const codeX = rect.width * 0.8 - (frame / 40) * rect.width * 0.1
        const codeY = rect.height * 0.3
        unifiedCanvasRef.current!.handleInteraction(createEvent(codeX, codeY), 'down')
        unifiedCanvasRef.current!.handleInteraction(createEvent(codeX, codeY), 'up')
      }
      
      // Growth mode - organic patterns
      if (frame % 50 === 0 && frame < 250) {
        const growthX = rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.3
        const growthY = rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.3
        unifiedCanvasRef.current!.handleInteraction(createEvent(growthX, growthY), 'down')
        unifiedCanvasRef.current!.handleInteraction(createEvent(growthX, growthY), 'up')
      }
      
      frame++
    }, 16) // 60fps
  }, [showDemo])

  // If WebGL failed, use simple Canvas 2D implementation
  if (webGLFailed) {
    return <SimpleUnifiedCanvas className={className} />
  }

  return (
    <div className={`h-full bg-gray-900 text-white relative overflow-hidden ${className}`}>
      {/* Mode Control Panel */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Unified Multi-Mode Canvas</h3>
          <div className="flex gap-2">
            <button
              onClick={startDemo}
              className="p-1 hover:bg-white/10 rounded"
              title="Run demo"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowModeSettings(!showModeSettings)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Mode Indicators */}
        <div className="flex gap-2 mb-4">
          {modeConfigs.map(config => (
            <button
              key={config.mode}
              onClick={() => toggleMode(config.mode)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all
                ${config.active 
                  ? `${config.color} text-white shadow-lg` 
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
                }
              `}
              title={`${config.active ? 'Deactivate' : 'Activate'} ${config.name} mode`}
            >
              {config.icon}
              {config.name}
              {config.active && <span className="text-xs">●</span>}
            </button>
          ))}
        </div>

        {/* Mode Controls */}
        {showModeSettings && (
          <div className="space-y-3 border-t border-white/20 pt-4">
            {modeConfigs.map(config => (
              <div key={config.mode} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-xs font-medium">{config.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleModeVisibility(config.mode)}
                      className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                    >
                      {config.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                
                {config.active && (
                  <div className="ml-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60 min-w-12">Opacity</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.opacity}
                        onChange={(e) => handleOpacityChange(config.mode, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-white/60 min-w-8">
                        {Math.round(config.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
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
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <Layers className="w-3 h-3" />
            Layers
          </button>
        </div>

        {/* Demo indicator */}
        {showDemo && (
          <div className="mt-4 p-2 bg-yellow-500/20 rounded text-xs text-yellow-300">
            Demo running - showing all modes working together...
          </div>
        )}
      </div>

      {/* Performance Monitor */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs font-mono">
        <div className="text-white/60 mb-1">Performance</div>
        <div className="text-green-400">FPS: {performanceMetrics.fps}</div>
        <div className="text-blue-400">Active Modes: {performanceMetrics.activeModes.length}</div>
        <div className="text-purple-400">Interactions: {performanceMetrics.activeInteractions}</div>
      </div>

      {/* Mode Activity Indicators */}
      <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2">
        <div className="text-xs text-white/60 mb-1">Mode Activity</div>
        {modeConfigs.filter(config => config.active && config.visible).map(config => (
          <div 
            key={config.mode}
            className="flex items-center gap-2"
          >
            <div 
              className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}
              style={{ 
                opacity: config.opacity,
                animationDuration: performanceMetrics.activeInteractions > 0 ? '0.5s' : '2s'
              }}
            />
            <span className="text-xs text-white/80">{config.name}</span>
          </div>
        ))}
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
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
          className="absolute inset-0 w-full h-full"
          style={{ 
            imageRendering: 'crisp-edges',
            touchAction: 'none',
            cursor: 'crosshair'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        
        {/* Visual feedback overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Mode connection lines would be rendered here */}
        </div>
      </div>

      {/* Mode-Specific UI Panels */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Parametric Controls */}
        {modeConfigs.find(c => c.mode === CanvasMode.PARAMETRIC)?.active && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-400 mb-2">Parametric Patterns</div>
            <select className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded">
              <option>Celtic Knots</option>
              <option>Islamic Geometry</option>
              <option>Japanese Patterns</option>
              <option>Fractal Designs</option>
            </select>
          </div>
        )}

        {/* Code Controls */}
        {modeConfigs.find(c => c.mode === CanvasMode.CODE)?.active && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-semibold text-green-400 mb-2">Code Mode</div>
            <div className="text-xs text-white/60">Click to execute procedural shapes</div>
          </div>
        )}

        {/* Growth Controls */}
        {modeConfigs.find(c => c.mode === CanvasMode.GROWTH)?.active && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-semibold text-orange-400 mb-2">Growth Algorithm</div>
            <select className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded">
              <option>Organic Growth</option>
              <option>L-System</option>
              <option>Cellular Automata</option>
              <option>Reaction-Diffusion</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedCanvasStudio