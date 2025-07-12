import React, { useRef, useEffect, useState } from 'react'
import { 
  Play, 
  Info, 
  Sparkles,
  MousePointer,
  Grid3x3,
  Code,
  Zap,
  HelpCircle
} from 'lucide-react'
import { UnifiedEditingSystemDemo, DemoScenario } from '../../core/UnifiedEditingSystemDemo'
import { CanvasMode } from '../../graphics/canvas/UnifiedCanvas'

interface UnifiedEditingDemoProps {
  className?: string;
}

export const UnifiedEditingDemo: React.FC<UnifiedEditingDemoProps> = ({ 
  className = "" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const systemRef = useRef<UnifiedEditingSystemDemo | null>(null)
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentMode, setCurrentMode] = useState<CanvasMode>(CanvasMode.DRAW)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [metrics, setMetrics] = useState({
    fps: 0,
    entities: 0,
    syncLatency: 0
  })

  // Initialize the demonstration system
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || isInitialized) return

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
      // Create unified editing system with demo capabilities
      const config = {
        canvas,
        width: canvas.width,
        height: canvas.height,
        pixelRatio: window.devicePixelRatio,
        performanceTarget: {
          fps: 60,
          maxSyncLatency: 16
        },
        translation: {
          quality: 'balanced',
          enableCache: true
        }
      }

      const system = new UnifiedEditingSystemDemo(config)
      systemRef.current = system

      // Setup event listeners
      system.on('mode:primary', (event: any) => {
        setCurrentMode(event.mode)
      })

      // Initialize all modes as active
      system.setModeActive(CanvasMode.DRAW, true)
      system.setModeActive(CanvasMode.PARAMETRIC, true)
      system.setModeActive(CanvasMode.CODE, true)
      system.setModeActive(CanvasMode.GROWTH, true)

      // Set opacities for layered visualization
      system.setModeOpacity(CanvasMode.DRAW, 1.0)
      system.setModeOpacity(CanvasMode.PARAMETRIC, 0.8)
      system.setModeOpacity(CanvasMode.CODE, 0.9)
      system.setModeOpacity(CanvasMode.GROWTH, 0.7)

      // Start the system
      system.start()
      
      setIsInitialized(true)
      
      // Performance monitoring
      const metricsInterval = setInterval(() => {
        if (systemRef.current) {
          const systemMetrics = systemRef.current.getSystemMetrics()
          setMetrics({
            fps: systemMetrics.performance.fps,
            entities: systemMetrics.entities.total,
            syncLatency: systemMetrics.performance.syncLatency
          })
        }
      }, 1000)

      // Handle resize
      const handleResize = () => {
        updateCanvasSize()
        if (systemRef.current) {
          const canvas = systemRef.current.getCanvas()
          const { width, height } = container.getBoundingClientRect()
          canvas.resize(
            width * window.devicePixelRatio, 
            height * window.devicePixelRatio
          )
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        clearInterval(metricsInterval)
        
        if (systemRef.current) {
          systemRef.current.destroy()
          systemRef.current = null
        }
        setIsInitialized(false)
      }
    } catch (error) {
      console.error('Failed to initialize demo system:', error)
      setIsInitialized(false)
    }
  }, [])

  // Mode selection
  const selectMode = (mode: CanvasMode) => {
    if (systemRef.current) {
      systemRef.current.setPrimaryMode(mode)
      setCurrentMode(mode)
    }
  }

  // Run demonstration scenarios
  const runDemoScenario = (scenario: DemoScenario) => {
    if (systemRef.current && !isDemoRunning) {
      setIsDemoRunning(true)
      setShowInstructions(false)
      systemRef.current.startDemoScenario(scenario)
      
      // Reset demo state after completion
      setTimeout(() => {
        setIsDemoRunning(false)
      }, scenario.steps.length * 3000)
    }
  }

  const toggleDemoMode = () => {
    if (systemRef.current) {
      systemRef.current.toggleDemoMode()
    }
  }

  const clearCanvas = () => {
    if (systemRef.current) {
      systemRef.current.clearAll()
    }
  }

  const modeInfo = {
    [CanvasMode.DRAW]: {
      icon: <MousePointer className="w-5 h-5" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      description: 'Draw strokes that become patterns'
    },
    [CanvasMode.PARAMETRIC]: {
      icon: <Grid3x3 className="w-5 h-5" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      description: 'Adjust mathematical parameters'
    },
    [CanvasMode.CODE]: {
      icon: <Code className="w-5 h-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      description: 'Generate and execute code'
    },
    [CanvasMode.GROWTH]: {
      icon: <Zap className="w-5 h-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      description: 'Animate organic growth'
    }
  }

  return (
    <div className={`relative h-full bg-gray-900 text-white overflow-hidden ${className}`}>
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0"
        style={{ 
          background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000000 100%)'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            imageRendering: 'crisp-edges',
            touchAction: 'none',
            cursor: currentMode === CanvasMode.DRAW ? 'crosshair' : 'pointer'
          }}
        />
      </div>

      {/* Demo Control Panel */}
      <div className="absolute top-4 left-4 z-50 max-w-md">
        {/* Title and Status */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Unified Editing System Demo
            </h2>
            <div className={`text-xs px-2 py-1 rounded ${isInitialized ? 'bg-green-600' : 'bg-red-600'}`}>
              {isInitialized ? '● Live' : '○ Loading'}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(modeInfo).map(([mode, info]) => (
              <button
                key={mode}
                onClick={() => selectMode(mode as CanvasMode)}
                className={`
                  relative p-3 rounded-lg transition-all
                  ${currentMode === mode 
                    ? 'bg-white/20 ring-2 ring-white/50' 
                    : 'bg-white/10 hover:bg-white/15'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={info.color}>{info.icon}</div>
                  <span className="text-sm font-medium">
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </span>
                </div>
                {currentMode === mode && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Current Mode Info */}
          <div className="text-xs text-gray-400 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Active:</span>
              <span className={modeInfo[currentMode].color}>
                {modeInfo[currentMode].description}
              </span>
            </div>
          </div>

          {/* Demo Scenarios */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-300 mb-1">Demo Scenarios:</div>
            {UnifiedEditingSystemDemo.DEMO_SCENARIOS.map((scenario, index) => (
              <button
                key={index}
                onClick={() => runDemoScenario(scenario)}
                disabled={isDemoRunning}
                className={`
                  w-full text-left p-2 rounded bg-white/5 hover:bg-white/10 
                  transition-colors text-xs
                  ${isDemoRunning ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3 h-3" />
                  <span className="font-medium">{scenario.name}</span>
                </div>
                <div className="text-gray-400 mt-1">{scenario.description}</div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
            <button
              onClick={toggleDemoMode}
              className="flex-1 px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
            >
              Demo Mode
            </button>
            <button
              onClick={clearCanvas}
              className="flex-1 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span className="font-medium">Quick Guide</span>
            </div>
            <ul className="space-y-1 text-gray-300">
              <li>• Press 1-4 to switch modes quickly</li>
              <li>• Draw mode: Click and drag to create strokes</li>
              <li>• Parametric: Click to adjust pattern parameters</li>
              <li>• Code: Click to generate code at position</li>
              <li>• Growth: Click to add growth seeds</li>
              <li>• Cmd/Ctrl+D: Toggle demo mode</li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-2 text-gray-500 hover:text-white"
            >
              Hide
            </button>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs font-mono">
        <div className="text-gray-400 mb-1">Performance</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">FPS:</span>
            <span className="text-green-400">{metrics.fps}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Entities:</span>
            <span className="text-blue-400">{metrics.entities}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Sync:</span>
            <span className="text-purple-400">{metrics.syncLatency.toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      {/* Mode Indicators */}
      <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3">
        <span className="text-xs text-gray-400">All modes active:</span>
        <div className="flex gap-2">
          {Object.entries(modeInfo).map(([mode, info]) => (
            <div
              key={mode}
              className={`w-3 h-3 rounded-full ${info.bgColor} ${
                currentMode === mode ? 'ring-2 ring-white' : ''
              }`}
              title={`${mode} mode`}
            />
          ))}
        </div>
      </div>

      {/* Revolutionary Features Banner */}
      <div className="absolute bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-lg p-3 max-w-sm">
        <div className="flex items-center gap-2 text-xs">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="font-medium">Revolutionary Features Active</span>
        </div>
        <ul className="text-xs text-gray-300 mt-1 space-y-0.5">
          <li>✓ Real-time bidirectional translation</li>
          <li>✓ All modes synchronized simultaneously</li>
          <li>✓ Pattern recognition from drawings</li>
          <li>✓ Live code generation and execution</li>
        </ul>
      </div>

      {/* Demo Running Indicator */}
      {isDemoRunning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <div className="text-lg font-medium">Demo Running</div>
            <div className="text-sm text-gray-400 mt-1">Watch the magic happen!</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedEditingDemo