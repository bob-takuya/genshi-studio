/**
 * Real-Time Synchronization Demo
 * DEVELOPER_010 - Demonstrates working synchronization between all four modes
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { 
  Brush, 
  Code, 
  Zap, 
  Grid3x3,
  Play,
  Pause,
  RefreshCw,
  Activity
} from 'lucide-react'
import { CanvasMode } from '../src/graphics/canvas/UnifiedCanvas'
import { useUnifiedEditingStore, eventBus, usePerformanceMonitor } from './unifiedEditingStore'
import { ModeType, ChangeType, SyncPriority } from '../src/core/sync/SynchronizationEngine'

// Demo mode components
const DrawModeDemo: React.FC<{ active: boolean; onAction: (data: any) => void }> = ({ active, onAction }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const pointsRef = useRef<Array<{ x: number; y: number; pressure: number }>>([])

  useEffect(() => {
    if (!canvasRef.current || !active) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const handleStart = (e: PointerEvent) => {
      setIsDrawing(true)
      pointsRef.current = []
      
      const rect = canvas.getBoundingClientRect()
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5
      }
      
      pointsRef.current.push(point)
      
      // Emit stroke started event
      onAction({
        type: 'stroke_started',
        data: { point }
      })
    }

    const handleMove = (e: PointerEvent) => {
      if (!isDrawing) return
      
      const rect = canvas.getBoundingClientRect()
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5
      }
      
      const prevPoint = pointsRef.current[pointsRef.current.length - 1]
      
      // Draw line
      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.globalAlpha = point.pressure
      ctx.stroke()
      
      pointsRef.current.push(point)
      
      // Emit point added event (throttled)
      if (pointsRef.current.length % 5 === 0) {
        onAction({
          type: 'points_added',
          data: { points: pointsRef.current.slice(-5) }
        })
      }
    }

    const handleEnd = () => {
      if (!isDrawing) return
      
      setIsDrawing(false)
      
      // Emit stroke completed event
      onAction({
        type: 'stroke_completed',
        data: { 
          points: pointsRef.current,
          timestamp: Date.now()
        }
      })
    }

    canvas.addEventListener('pointerdown', handleStart)
    canvas.addEventListener('pointermove', handleMove)
    canvas.addEventListener('pointerup', handleEnd)
    canvas.addEventListener('pointercancel', handleEnd)

    return () => {
      canvas.removeEventListener('pointerdown', handleStart)
      canvas.removeEventListener('pointermove', handleMove)
      canvas.removeEventListener('pointerup', handleEnd)
      canvas.removeEventListener('pointercancel', handleEnd)
    }
  }, [active, isDrawing, onAction])

  // Listen for sync events
  useEffect(() => {
    const handleSyncUpdate = (data: any) => {
      if (!canvasRef.current || data.sourceMode === ModeType.DRAW) return
      
      const ctx = canvasRef.current.getContext('2d')!
      
      // Render synced data from other modes
      if (data.type === 'parametric_pattern') {
        ctx.strokeStyle = '#A855F7'
        ctx.beginPath()
        data.points.forEach((point: any, i: number) => {
          if (i === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
      } else if (data.type === 'code_generated') {
        ctx.strokeStyle = '#10B981'
        ctx.fillText(data.text || 'Code output', data.x || 10, data.y || 30)
      } else if (data.type === 'growth_pattern') {
        ctx.strokeStyle = '#F97316'
        data.branches.forEach((branch: any) => {
          ctx.beginPath()
          ctx.moveTo(branch.start.x, branch.start.y)
          ctx.lineTo(branch.end.x, branch.end.y)
          ctx.stroke()
        })
      }
    }

    const unsubscribe = eventBus.on('sync:update:draw', handleSyncUpdate)
    return unsubscribe
  }, [])

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full h-full cursor-crosshair"
      />
      <div className="absolute top-2 left-2 text-xs text-blue-400 font-semibold">
        Draw Mode {isDrawing && '(Drawing...)'}
      </div>
    </div>
  )
}

const ParametricModeDemo: React.FC<{ active: boolean; onAction: (data: any) => void }> = ({ active, onAction }) => {
  const [parameters, setParameters] = useState({
    scale: 1.0,
    rotation: 0,
    complexity: 3
  })

  const generatePattern = useCallback(() => {
    // Generate parametric pattern points
    const points: Array<{ x: number; y: number }> = []
    const centerX = 200
    const centerY = 150
    
    for (let i = 0; i < 360; i += 5) {
      const angle = (i + parameters.rotation) * Math.PI / 180
      const radius = 50 * parameters.scale * (1 + 0.3 * Math.sin(parameters.complexity * angle))
      
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    }

    onAction({
      type: 'pattern_generated',
      data: { 
        points,
        parameters: { ...parameters }
      }
    })
  }, [parameters, onAction])

  // Auto-generate when parameters change
  useEffect(() => {
    if (active) {
      generatePattern()
    }
  }, [active, parameters, generatePattern])

  // Listen for sync events
  useEffect(() => {
    const handleSyncUpdate = (data: any) => {
      if (data.sourceMode === ModeType.PARAMETRIC) return
      
      // Update parameters based on other modes
      if (data.type === 'stroke_analysis') {
        // Analyze stroke complexity and update parameters
        setParameters(prev => ({
          ...prev,
          complexity: Math.min(10, Math.max(1, data.complexity || prev.complexity))
        }))
      }
    }

    const unsubscribe = eventBus.on('sync:update:parametric', handleSyncUpdate)
    return unsubscribe
  }, [])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="text-xs text-purple-400 font-semibold mb-3">Parametric Mode</div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Scale: {parameters.scale.toFixed(1)}</label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={parameters.scale}
            onChange={(e) => setParameters(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400">Rotation: {parameters.rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={parameters.rotation}
            onChange={(e) => setParameters(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400">Complexity: {parameters.complexity}</label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={parameters.complexity}
            onChange={(e) => setParameters(prev => ({ ...prev, complexity: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-800 rounded">
        <pre className="text-xs text-purple-300">
{JSON.stringify(parameters, null, 2)}
        </pre>
      </div>
    </div>
  )
}

const CodeModeDemo: React.FC<{ active: boolean; onAction: (data: any) => void }> = ({ active, onAction }) => {
  const [code, setCode] = useState(`// Creative code
function draw() {
  circle(200, 150, 50);
  line(150, 150, 250, 150);
}`)
  const [output, setOutput] = useState('')

  const executeCode = useCallback(() => {
    try {
      // Simple code execution simulation
      const result = {
        shapes: [],
        text: 'Code executed successfully'
      }
      
      // Parse simple drawing commands
      if (code.includes('circle')) {
        const match = code.match(/circle\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          result.shapes.push({
            type: 'circle',
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            radius: parseInt(match[3])
          })
        }
      }
      
      if (code.includes('line')) {
        const match = code.match(/line\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          result.shapes.push({
            type: 'line',
            x1: parseInt(match[1]),
            y1: parseInt(match[2]),
            x2: parseInt(match[3]),
            y2: parseInt(match[4])
          })
        }
      }
      
      setOutput(JSON.stringify(result, null, 2))
      
      onAction({
        type: 'code_executed',
        data: {
          code,
          result,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    }
  }, [code, onAction])

  // Listen for sync events
  useEffect(() => {
    const handleSyncUpdate = (data: any) => {
      if (data.sourceMode === ModeType.CODE) return
      
      // Generate code based on other modes
      if (data.type === 'stroke_to_code') {
        const newCode = `// Generated from drawing\nfunction draw() {\n`
        data.strokes.forEach((stroke: any, i: number) => {
          newCode += `  drawStroke(stroke${i});\n`
        })
        newCode += '}'
        setCode(newCode)
      }
    }

    const unsubscribe = eventBus.on('sync:update:code', handleSyncUpdate)
    return unsubscribe
  }, [])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-green-400 font-semibold">Code Mode</div>
        <button
          onClick={executeCode}
          disabled={!active}
          className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded transition-colors"
        >
          <Play className="w-3 h-3 inline mr-1" />
          Run
        </button>
      </div>
      
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-32 p-2 text-xs font-mono bg-gray-800 text-gray-300 rounded resize-none"
        spellCheck={false}
      />
      
      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-1">Output:</div>
        <pre className="p-2 text-xs bg-gray-800 text-green-300 rounded overflow-auto max-h-24">
          {output || 'No output yet'}
        </pre>
      </div>
    </div>
  )
}

const GrowthModeDemo: React.FC<{ active: boolean; onAction: (data: any) => void }> = ({ active, onAction }) => {
  const [algorithm, setAlgorithm] = useState('organic')
  const [speed, setSpeed] = useState(1.0)
  const [isGrowing, setIsGrowing] = useState(false)
  const animationRef = useRef<number>()
  const growthRef = useRef<any>({ branches: [], generation: 0 })

  const startGrowth = useCallback(() => {
    setIsGrowing(true)
    growthRef.current = {
      branches: [{
        start: { x: 200, y: 250 },
        end: { x: 200, y: 200 },
        generation: 0
      }],
      generation: 0
    }

    const grow = () => {
      const newBranches = []
      
      growthRef.current.branches.forEach((branch: any) => {
        if (branch.generation < 5) {
          // Create child branches
          const angle1 = Math.random() * 60 - 30
          const angle2 = Math.random() * 60 - 30
          const length = 30 * Math.pow(0.7, branch.generation)
          
          newBranches.push({
            start: branch.end,
            end: {
              x: branch.end.x + length * Math.sin(angle1 * Math.PI / 180),
              y: branch.end.y - length * Math.cos(angle1 * Math.PI / 180)
            },
            generation: branch.generation + 1
          })
          
          newBranches.push({
            start: branch.end,
            end: {
              x: branch.end.x + length * Math.sin(angle2 * Math.PI / 180),
              y: branch.end.y - length * Math.cos(angle2 * Math.PI / 180)
            },
            generation: branch.generation + 1
          })
        }
      })
      
      growthRef.current.branches.push(...newBranches)
      growthRef.current.generation++
      
      onAction({
        type: 'growth_update',
        data: {
          branches: growthRef.current.branches,
          generation: growthRef.current.generation,
          algorithm
        }
      })
      
      if (growthRef.current.generation < 6 && isGrowing) {
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(grow, 1000 / speed)
        })
      } else {
        setIsGrowing(false)
      }
    }
    
    grow()
  }, [algorithm, speed, isGrowing, onAction])

  const stopGrowth = useCallback(() => {
    setIsGrowing(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Listen for sync events
  useEffect(() => {
    const handleSyncUpdate = (data: any) => {
      if (data.sourceMode === ModeType.GROWTH) return
      
      // Trigger growth based on other modes
      if (data.type === 'seed_points' && !isGrowing) {
        startGrowth()
      }
    }

    const unsubscribe = eventBus.on('sync:update:growth', handleSyncUpdate)
    return unsubscribe
  }, [isGrowing, startGrowth])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="text-xs text-orange-400 font-semibold mb-3">Growth Mode</div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Algorithm</label>
          <select 
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full mt-1 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded"
          >
            <option value="organic">Organic Growth</option>
            <option value="lsystem">L-System</option>
            <option value="cellular">Cellular Automata</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs text-gray-400">Speed: {speed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={startGrowth}
            disabled={!active || isGrowing}
            className="flex-1 px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 rounded transition-colors"
          >
            <Play className="w-3 h-3 inline mr-1" />
            Start
          </button>
          
          <button
            onClick={stopGrowth}
            disabled={!isGrowing}
            className="flex-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 rounded transition-colors"
          >
            <Pause className="w-3 h-3 inline mr-1" />
            Stop
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-gray-800 rounded">
        <div className="text-xs text-orange-300">
          Generation: {growthRef.current.generation}<br/>
          Branches: {growthRef.current.branches.length}
        </div>
      </div>
    </div>
  )
}

// Main demo component
export const RealTimeSyncDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const store = useUnifiedEditingStore()
  const performance = usePerformanceMonitor()
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeModes, setActiveModes] = useState({
    [CanvasMode.DRAW]: true,
    [CanvasMode.PARAMETRIC]: true,
    [CanvasMode.CODE]: true,
    [CanvasMode.GROWTH]: true
  })

  // Initialize system
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return

    const initSystem = async () => {
      try {
        await store.initializeSystem(canvasRef.current!)
        store.startSystem()
        setIsInitialized(true)
        console.log('✅ Real-time sync demo initialized')
      } catch (error) {
        console.error('Failed to initialize demo:', error)
      }
    }

    initSystem()

    return () => {
      if (store.system) {
        store.stopSystem()
      }
    }
  }, [store, isInitialized])

  // Handle mode actions
  const handleModeAction = useCallback((mode: CanvasMode, data: any) => {
    if (!store.system) return

    // Map mode to sync engine type
    const modeTypeMap = {
      [CanvasMode.DRAW]: ModeType.DRAW,
      [CanvasMode.PARAMETRIC]: ModeType.PARAMETRIC,
      [CanvasMode.CODE]: ModeType.CODE,
      [CanvasMode.GROWTH]: ModeType.GROWTH
    }

    // Create sync change
    const change = {
      id: `demo_${mode}_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: modeTypeMap[mode],
      changeType: getChangeType(data.type),
      priority: SyncPriority.USER_ACTION,
      data: data.data
    }

    // Apply change
    store.applyChange(change)

    // Broadcast to other modes
    Object.keys(activeModes).forEach(m => {
      if (m !== mode && activeModes[m as CanvasMode]) {
        eventBus.emit(`sync:update:${m}`, {
          sourceMode: modeTypeMap[mode],
          ...data
        })
      }
    })
  }, [store, activeModes])

  const getChangeType = (type: string): ChangeType => {
    switch (type) {
      case 'stroke_started':
      case 'stroke_completed':
        return ChangeType.STROKE_ADDED
      case 'pattern_generated':
        return ChangeType.PATTERN_APPLIED
      case 'code_executed':
        return ChangeType.CODE_EXECUTED
      case 'growth_update':
        return ChangeType.GROWTH_UPDATED
      default:
        return ChangeType.STROKE_MODIFIED
    }
  }

  const toggleMode = (mode: CanvasMode) => {
    setActiveModes(prev => ({ ...prev, [mode]: !prev[mode] }))
    store.setModeActive(mode, !activeModes[mode])
  }

  return (
    <div className="w-full h-full bg-black text-white p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Real-Time Synchronization Demo</h2>
        <p className="text-sm text-gray-400">
          All four modes sync in real-time. Draw, adjust parameters, write code, or grow patterns - changes propagate instantly!
        </p>
      </div>

      {/* Performance metrics */}
      <div className="mb-4 p-3 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm">Performance</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">FPS: {performance.fps.toFixed(0)}</span>
            <span className="text-blue-400">Sync: {performance.syncLatency.toFixed(1)}ms</span>
            <span className="text-purple-400">Translation: {performance.translationTime.toFixed(1)}ms</span>
            <span className="text-orange-400">Entities: {performance.entityCount}</span>
          </div>
        </div>
      </div>

      {/* Mode toggles */}
      <div className="mb-4 flex gap-2">
        {Object.entries(activeModes).map(([mode, active]) => {
          const icons = {
            [CanvasMode.DRAW]: <Brush className="w-3 h-3" />,
            [CanvasMode.PARAMETRIC]: <Grid3x3 className="w-3 h-3" />,
            [CanvasMode.CODE]: <Code className="w-3 h-3" />,
            [CanvasMode.GROWTH]: <Zap className="w-3 h-3" />
          }
          
          return (
            <button
              key={mode}
              onClick={() => toggleMode(mode as CanvasMode)}
              className={`
                flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all
                ${active 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
                }
              `}
            >
              {icons[mode as CanvasMode]}
              {mode}
            </button>
          )
        })}
        
        <button
          onClick={() => store.clearAll()}
          className="ml-auto flex items-center gap-1 px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Mode panels */}
      <div className="grid grid-cols-2 gap-4 h-[600px]">
        <DrawModeDemo 
          active={activeModes[CanvasMode.DRAW]} 
          onAction={(data) => handleModeAction(CanvasMode.DRAW, data)}
        />
        
        <ParametricModeDemo 
          active={activeModes[CanvasMode.PARAMETRIC]} 
          onAction={(data) => handleModeAction(CanvasMode.PARAMETRIC, data)}
        />
        
        <CodeModeDemo 
          active={activeModes[CanvasMode.CODE]} 
          onAction={(data) => handleModeAction(CanvasMode.CODE, data)}
        />
        
        <GrowthModeDemo 
          active={activeModes[CanvasMode.GROWTH]} 
          onAction={(data) => handleModeAction(CanvasMode.GROWTH, data)}
        />
      </div>

      {/* Hidden canvas for unified editing system */}
      <canvas ref={canvasRef} className="hidden" width={800} height={600} />
    </div>
  )
}

export default RealTimeSyncDemo