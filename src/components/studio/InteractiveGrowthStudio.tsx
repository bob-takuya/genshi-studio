import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Play, Pause, RotateCcw, Download, Settings, Zap, Palette, Maximize2, MousePointer
} from 'lucide-react'
import { OrganicPatternGenerator, OrganicPatternType } from '../../graphics/patterns/OrganicPatternGenerator'

// Enhanced growth algorithm types
export enum GrowthAlgorithm {
  OrganicGrowth = 'organic-growth',
  LSystem = 'l-system',
  CellularAutomata = 'cellular-automata',
  ReactionDiffusion = 'reaction-diffusion',
  DLA = 'diffusion-limited',
  FractalGrowth = 'fractal-growth',
  ConwayVariants = 'conway-variants',
  CrystalFormation = 'crystal-formation',
  VoronoiGrowth = 'voronoi-growth',
  NeuralGrowth = 'neural-growth'
}

// L-System rules for plant growth
interface LSystemRule {
  axiom: string
  rules: { [key: string]: string }
  angle: number
  iterations: number
}

// Cellular automata rule sets
interface CellularRule {
  birth: number[]
  survival: number[]
  neighborhoodType: 'moore' | 'vonNeumann'
}

// Reaction-diffusion parameters
interface ReactionDiffusionParams {
  feedRate: number
  killRate: number
  diffusionRateA: number
  diffusionRateB: number
}

interface GrowthSettings {
  type: OrganicPatternType
  algorithm: GrowthAlgorithm
  growthRate: number
  density: number
  particleCount: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  speed: number
  interactive: boolean
  autoGrowth: boolean
  // Advanced parameters
  lSystem?: LSystemRule
  cellularRule?: CellularRule
  reactionDiffusion?: ReactionDiffusionParams
  // Multi-layer support
  layersEnabled: boolean
  currentLayer: number
  maxLayers: number
}

export function InteractiveGrowthStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const patternGeneratorRef = useRef<OrganicPatternGenerator>()
  const lastFrameTime = useRef<number>(0)
  const mousePos = useRef({ x: 0, y: 0 })
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GrowthSettings>({
    type: OrganicPatternType.GrowthPattern,
    algorithm: GrowthAlgorithm.OrganicGrowth,
    growthRate: 0.02,
    density: 0.3,
    particleCount: 1000,
    primaryColor: '#000000',
    secondaryColor: '#00ff88',
    accentColor: '#ff0088',
    speed: 1,
    interactive: true,
    autoGrowth: true,
    layersEnabled: false,
    currentLayer: 0,
    maxLayers: 5,
    // Default L-System for tree-like growth
    lSystem: {
      axiom: 'F',
      rules: { 'F': 'F[+F]F[-F]F' },
      angle: 25,
      iterations: 4
    },
    // Default cellular automata rule (Conway's Game of Life)
    cellularRule: {
      birth: [3],
      survival: [2, 3],
      neighborhoodType: 'moore'
    },
    // Default reaction-diffusion parameters (Gray-Scott model)
    reactionDiffusion: {
      feedRate: 0.055,
      killRate: 0.062,
      diffusionRateA: 1.0,
      diffusionRateB: 0.5
    }
  })
  
  // Growth state
  const growthStateRef = useRef<{
    points: Set<string>
    generation: number
    centerX: number
    centerY: number
  }>({
    points: new Set(),
    generation: 0,
    centerX: 0,
    centerY: 0
  })

  // Initialize pattern generator
  useEffect(() => {
    patternGeneratorRef.current = new OrganicPatternGenerator()
    return () => {
      patternGeneratorRef.current?.destroy()
    }
  }, [])

  // Initialize canvas and growth
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Initialize growth center
    growthStateRef.current.centerX = canvas.width / 2
    growthStateRef.current.centerY = canvas.height / 2
    growthStateRef.current.points.clear()
    growthStateRef.current.points.add(`${Math.floor(canvas.width / 2)},${Math.floor(canvas.height / 2)}`)
    growthStateRef.current.generation = 0
    
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      reset()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mouse interaction
  useEffect(() => {
    if (!canvasRef.current || !settings.interactive) return
    
    const canvas = canvasRef.current
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
    
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor(e.clientX - rect.left)
      const y = Math.floor(e.clientY - rect.top)
      
      // Add new growth seed at click position
      growthStateRef.current.points.add(`${x},${y}`)
    }
    
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [settings.interactive])

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime.current
    lastFrameTime.current = timestamp
    
    // Clear canvas with trail effect
    ctx.fillStyle = `rgba(${parseInt(settings.primaryColor.slice(1, 3), 16)}, ${parseInt(settings.primaryColor.slice(3, 5), 16)}, ${parseInt(settings.primaryColor.slice(5, 7), 16)}, 0.02)`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Growth simulation
    if (settings.autoGrowth && growthStateRef.current.generation % Math.max(1, Math.floor(10 / settings.speed)) === 0) {
      const newPoints = new Set<string>()
      
      growthStateRef.current.points.forEach(pos => {
        const [x, y] = pos.split(',').map(Number)
        
        // Try to grow in all directions
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue
            
            const nx = x + dx
            const ny = y + dy
            
            if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
              if (!growthStateRef.current.points.has(`${nx},${ny}`) && Math.random() < settings.growthRate) {
                newPoints.add(`${nx},${ny}`)
              }
            }
          }
        }
      })
      
      // Add new points
      newPoints.forEach(point => growthStateRef.current.points.add(point))
    }
    
    // Interactive growth from mouse position
    if (settings.interactive) {
      const mouseX = Math.floor(mousePos.current.x)
      const mouseY = Math.floor(mousePos.current.y)
      
      // Add growth around mouse with higher probability
      for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
          const nx = mouseX + dx
          const ny = mouseY + dy
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
            if (!growthStateRef.current.points.has(`${nx},${ny}`) && 
                Math.random() < settings.growthRate * 2 / (distance + 1)) {
              growthStateRef.current.points.add(`${nx},${ny}`)
            }
          }
        }
      }
    }
    
    // Render growth pattern
    switch (settings.type) {
      case OrganicPatternType.GrowthPattern:
        renderGrowthPattern(ctx, canvas)
        break
      case OrganicPatternType.DiffusionLimited:
        renderDiffusionPattern(ctx, canvas)
        break
      case OrganicPatternType.CrystalGrowth:
        renderCrystalPattern(ctx, canvas)
        break
      case OrganicPatternType.FlowField:
        renderFlowField(ctx, canvas)
        break
      default:
        renderGrowthPattern(ctx, canvas)
    }
    
    growthStateRef.current.generation++
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [settings, isPlaying])

  const renderGrowthPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Create gradient effect based on distance from center
    growthStateRef.current.points.forEach(pos => {
      const [x, y] = pos.split(',').map(Number)
      
      const dx = x - growthStateRef.current.centerX
      const dy = y - growthStateRef.current.centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = Math.min(canvas.width, canvas.height) / 2
      
      const t = Math.min(1, distance / maxDistance)
      
      // Interpolate colors
      const r1 = parseInt(settings.secondaryColor.slice(1, 3), 16)
      const g1 = parseInt(settings.secondaryColor.slice(3, 5), 16)
      const b1 = parseInt(settings.secondaryColor.slice(5, 7), 16)
      
      const r2 = parseInt(settings.accentColor.slice(1, 3), 16)
      const g2 = parseInt(settings.accentColor.slice(3, 5), 16)
      const b2 = parseInt(settings.accentColor.slice(5, 7), 16)
      
      const r = Math.floor(r1 * (1 - t) + r2 * t)
      const g = Math.floor(g1 * (1 - t) + g2 * t)
      const b = Math.floor(b1 * (1 - t) + b2 * t)
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(x, y, 1, 1)
    })
  }

  const renderDiffusionPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = settings.secondaryColor
    ctx.lineWidth = 0.5
    
    // Draw connections between nearby points
    const pointArray = Array.from(growthStateRef.current.points)
    
    pointArray.forEach((pos1, i) => {
      const [x1, y1] = pos1.split(',').map(Number)
      
      for (let j = i + 1; j < Math.min(i + 20, pointArray.length); j++) {
        const pos2 = pointArray[j]
        const [x2, y2] = pos2.split(',').map(Number)
        
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        
        if (distance < 50) {
          ctx.globalAlpha = 1 - distance / 50
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }
    })
    
    ctx.globalAlpha = 1
  }

  const renderCrystalPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Render as hexagonal crystals
    ctx.strokeStyle = settings.secondaryColor
    ctx.fillStyle = settings.accentColor + '20'
    ctx.lineWidth = 1
    
    growthStateRef.current.points.forEach(pos => {
      const [x, y] = pos.split(',').map(Number)
      
      // Check if this point should be rendered as a crystal center
      if ((x + y) % 10 === 0) {
        const size = 3
        
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const px = x + Math.cos(angle) * size
          const py = y + Math.sin(angle) * size
          
          if (i === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      } else {
        // Regular points
        ctx.fillStyle = settings.secondaryColor
        ctx.fillRect(x, y, 1, 1)
      }
    })
  }

  const renderFlowField = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = settings.secondaryColor + '40'
    ctx.lineWidth = 1
    
    // Create flow lines from growth points
    growthStateRef.current.points.forEach(pos => {
      const [x, y] = pos.split(',').map(Number)
      
      if (Math.random() < 0.1) { // Only trace some points
        ctx.beginPath()
        ctx.moveTo(x, y)
        
        let currentX = x
        let currentY = y
        
        // Trace flow line
        for (let step = 0; step < 50; step++) {
          const noise = (Math.sin(currentX * 0.01) + Math.cos(currentY * 0.01)) * Math.PI
          const dx = Math.cos(noise) * 2
          const dy = Math.sin(noise) * 2
          
          currentX += dx
          currentY += dy
          
          if (currentX < 0 || currentX >= canvas.width || currentY < 0 || currentY >= canvas.height) break
          
          ctx.lineTo(currentX, currentY)
        }
        
        ctx.stroke()
      }
    })
  }

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      lastFrameTime.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animate])

  const reset = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = settings.primaryColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Reset growth
    growthStateRef.current.points.clear()
    growthStateRef.current.centerX = canvas.width / 2
    growthStateRef.current.centerY = canvas.height / 2
    growthStateRef.current.points.add(`${Math.floor(canvas.width / 2)},${Math.floor(canvas.height / 2)}`)
    growthStateRef.current.generation = 0
  }

  const exportImage = () => {
    if (!canvasRef.current) return
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `growth-pattern-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  const colorPalettes = [
    { name: 'Matrix', primary: '#000000', secondary: '#00ff00', accent: '#00aa00' },
    { name: 'Coral Reef', primary: '#001a33', secondary: '#ff6b6b', accent: '#4ecdc4' },
    { name: 'Bioluminescent', primary: '#000033', secondary: '#00ffff', accent: '#0088ff' },
    { name: 'Plasma', primary: '#0a0014', secondary: '#ff00ff', accent: '#00ffff' },
    { name: 'Golden Hour', primary: '#1a0f00', secondary: '#ffaa00', accent: '#ff6600' },
    { name: 'Aurora', primary: '#000022', secondary: '#00ff88', accent: '#ff0088' }
  ]

  const patternTypes = [
    { value: OrganicPatternType.GrowthPattern, label: 'Organic Growth' },
    { value: OrganicPatternType.DiffusionLimited, label: 'Diffusion Limited' },
    { value: OrganicPatternType.CrystalGrowth, label: 'Crystal Growth' },
    { value: OrganicPatternType.FlowField, label: 'Flow Field' }
  ]

  return (
    <div className="fixed inset-0 bg-black">
      {/* Full-pane canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors text-white"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        
        <button
          onClick={reset}
          className="p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors text-white"
          title="Reset"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        
        <button
          onClick={exportImage}
          className="p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors text-white"
          title="Export Image"
        >
          <Download className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors text-white"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-4 right-4 text-white/60 text-sm">
        <div>Generation: {growthStateRef.current.generation}</div>
        <div>Points: {growthStateRef.current.points.size}</div>
        {settings.interactive && <div>Click to add growth seeds</div>}
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-20 left-4 w-80 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Growth Settings
          </h3>
          
          {/* Pattern Type */}
          <div className="mb-4">
            <label className="text-sm mb-1 block">Pattern Type</label>
            <select
              value={settings.type}
              onChange={(e) => setSettings({ ...settings, type: e.target.value as OrganicPatternType })}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
            >
              {patternTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          {/* Growth Rate */}
          <div className="mb-4">
            <label className="text-sm mb-1 block">Growth Rate</label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={settings.growthRate}
              onChange={(e) => setSettings({ ...settings, growthRate: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs">{(settings.growthRate * 100).toFixed(1)}%</span>
          </div>
          
          {/* Speed */}
          <div className="mb-4">
            <label className="text-sm mb-1 block">Animation Speed</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={settings.speed}
              onChange={(e) => setSettings({ ...settings, speed: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs">{settings.speed.toFixed(1)}x</span>
          </div>
          
          {/* Interactive Mode */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.interactive}
                onChange={(e) => setSettings({ ...settings, interactive: e.target.checked })}
                className="rounded"
              />
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Interactive Mode</span>
            </label>
          </div>
          
          {/* Auto Growth */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoGrowth}
                onChange={(e) => setSettings({ ...settings, autoGrowth: e.target.checked })}
                className="rounded"
              />
              <Maximize2 className="h-4 w-4" />
              <span className="text-sm">Auto Growth</span>
            </label>
          </div>
          
          {/* Color Palettes */}
          <div className="mb-4">
            <label className="text-sm mb-2 block flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Palettes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {colorPalettes.map(palette => (
                <button
                  key={palette.name}
                  onClick={() => setSettings({
                    ...settings,
                    primaryColor: palette.primary,
                    secondaryColor: palette.secondary,
                    accentColor: palette.accent
                  })}
                  className="p-2 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs"
                >
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.primary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.secondary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.accent }} />
                  </div>
                  {palette.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Colors */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm flex-1">Background</label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-20 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm flex-1">Primary</label>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="w-20 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm flex-1">Accent</label>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="w-20 h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}