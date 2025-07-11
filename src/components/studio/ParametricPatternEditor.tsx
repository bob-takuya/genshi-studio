import { useState, useRef, useEffect } from 'react'
import { Download, Shuffle } from 'lucide-react'

interface PatternSettings {
  type: 'ichimatsu' | 'seigaiha' | 'asanoha' | 'shippo' | 'yamaji'
  size: number
  density: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  rotation: number
  opacity: number
}

const COLOR_PALETTES = [
  { name: 'Traditional Blue', colors: ['#4a90e2', '#f5f5f5', '#feca57'] },
  { name: 'Sakura Spring', colors: ['#ffb7c5', '#fff0f5', '#ff69b4'] },
  { name: 'Autumn Maple', colors: ['#dc143c', '#fff8dc', '#ff8c00'] },
  { name: 'Zen Garden', colors: ['#228b22', '#f0fff0', '#8b4513'] },
  { name: 'Night Sky', colors: ['#191970', '#f8f8ff', '#ffd700'] },
]

export function ParametricPatternEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [settings, setSettings] = useState<PatternSettings>({
    type: 'ichimatsu',
    size: 30,
    density: 1.0,
    primaryColor: '#4a90e2',
    secondaryColor: '#f5f5f5',
    accentColor: '#feca57',
    rotation: 0,
    opacity: 100
  })

  // Update pattern whenever settings change
  useEffect(() => {
    updatePattern()
  }, [settings])

  const updatePattern = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Save context for transformations
    ctx.save()
    
    // Apply rotation
    if (settings.rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(settings.rotation * Math.PI / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    }
    
    // Apply global opacity
    ctx.globalAlpha = settings.opacity / 100
    
    // Draw pattern based on type
    switch(settings.type) {
      case 'ichimatsu':
        drawIchimatsu(ctx, canvas, settings)
        break
      case 'seigaiha':
        drawSeigaiha(ctx, canvas, settings)
        break
      case 'asanoha':
        drawAsanoha(ctx, canvas, settings)
        break
      case 'shippo':
        drawShippo(ctx, canvas, settings)
        break
      case 'yamaji':
        drawYamaji(ctx, canvas, settings)
        break
    }
    
    // Restore context
    ctx.restore()
  }

  const drawIchimatsu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PatternSettings) => {
    const size = settings.size * settings.density
    const colors = [settings.primaryColor, settings.secondaryColor]
    
    for (let x = -size; x < canvas.width + size; x += size) {
      for (let y = -size; y < canvas.height + size; y += size) {
        const colorIndex = (Math.floor(x / size) + Math.floor(y / size)) % 2
        ctx.fillStyle = colors[colorIndex]
        ctx.fillRect(x, y, size, size)
      }
    }
  }

  const drawSeigaiha = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PatternSettings) => {
    const radius = settings.size * settings.density
    const spacing = radius * 2
    
    ctx.strokeStyle = settings.primaryColor
    ctx.lineWidth = 2
    
    for (let x = -radius; x < canvas.width + radius; x += spacing) {
      for (let y = -radius; y < canvas.height + radius; y += spacing) {
        for (let r = 5; r < radius; r += radius / 3) {
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI)
          ctx.stroke()
        }
      }
    }
  }

  const drawAsanoha = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PatternSettings) => {
    const size = settings.size * settings.density
    
    ctx.strokeStyle = settings.primaryColor
    ctx.lineWidth = 2
    
    for (let x = -size; x < canvas.width + size; x += size) {
      for (let y = -size; y < canvas.height + size; y += size) {
        // Draw hexagon
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const px = x + size/2 + Math.cos(angle) * size/3
          const py = y + size/2 + Math.sin(angle) * size/3
          
          if (i === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.closePath()
        ctx.stroke()
        
        // Draw inner lines
        ctx.beginPath()
        ctx.moveTo(x + size/2, y)
        ctx.lineTo(x + size/2, y + size)
        ctx.moveTo(x, y + size/2)
        ctx.lineTo(x + size, y + size/2)
        ctx.stroke()
      }
    }
  }

  const drawShippo = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PatternSettings) => {
    const size = settings.size * settings.density
    const radius = size / 2
    
    ctx.strokeStyle = settings.primaryColor
    ctx.lineWidth = 2
    
    for (let x = -size; x < canvas.width + size; x += size) {
      for (let y = -size; y < canvas.height + size; y += size) {
        // Draw overlapping circles
        ctx.beginPath()
        ctx.arc(x + size/2, y + size/2, radius, 0, 2 * Math.PI)
        ctx.stroke()
        
        // Fill intersection with accent color
        ctx.fillStyle = settings.accentColor
        ctx.beginPath()
        ctx.arc(x + size/2, y + size/2, radius / 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  const drawYamaji = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PatternSettings) => {
    const size = settings.size * settings.density
    
    ctx.strokeStyle = settings.primaryColor
    ctx.lineWidth = 2
    
    for (let x = -size; x < canvas.width + size; x += size) {
      for (let y = -size; y < canvas.height + size; y += size) {
        // Draw diagonal lines creating mountain path pattern
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + size, y + size)
        ctx.moveTo(x + size, y)
        ctx.lineTo(x, y + size)
        ctx.stroke()
        
        // Add accent points
        ctx.fillStyle = settings.accentColor
        ctx.beginPath()
        ctx.arc(x + size/2, y + size/2, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  const exportPattern = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (format === 'png') {
      const link = document.createElement('a')
      link.download = `genshi-pattern-${settings.type}-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } else if (format === 'svg') {
      // Create SVG representation
      const svg = createSVGPattern()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `genshi-pattern-${settings.type}-${Date.now()}.svg`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const createSVGPattern = () => {
    const width = 600
    const height = 600
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${settings.secondaryColor}"/>
    <g opacity="${settings.opacity / 100}" transform="rotate(${settings.rotation} ${width/2} ${height/2})">
        <!-- Pattern elements would be generated here based on pattern type -->
        <rect x="0" y="0" width="${width}" height="${height}" fill="${settings.primaryColor}" opacity="0.5"/>
    </g>
</svg>`
  }

  const randomizePattern = () => {
    const patterns: PatternSettings['type'][] = ['ichimatsu', 'seigaiha', 'asanoha', 'shippo', 'yamaji']
    const colors = [
      '#4a90e2', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12',
      '#1abc9c', '#34495e', '#e67e22', '#3498db', '#95a5a6'
    ]
    
    setSettings({
      type: patterns[Math.floor(Math.random() * patterns.length)],
      size: Math.floor(Math.random() * 80) + 20,
      density: Math.random() * 2.5 + 0.5,
      primaryColor: colors[Math.floor(Math.random() * colors.length)],
      secondaryColor: colors[Math.floor(Math.random() * colors.length)],
      accentColor: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.floor(Math.random() * 360),
      opacity: Math.floor(Math.random() * 90) + 10
    })
  }

  const applyPalette = (palette: typeof COLOR_PALETTES[0]) => {
    setSettings(prev => ({
      ...prev,
      primaryColor: palette.colors[0],
      secondaryColor: palette.colors[1],
      accentColor: palette.colors[2]
    }))
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8 drop-shadow-lg">
          源始 Genshi Studio - Parametric Pattern Editor
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Pattern Controls</h2>
              
              <div className="space-y-6">
                {/* Pattern Type */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Pattern Type</label>
                  <select 
                    value={settings.type} 
                    onChange={(e) => setSettings(prev => ({ ...prev, type: e.target.value as PatternSettings['type'] }))}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="ichimatsu" className="bg-gray-800">Ichimatsu (市松)</option>
                    <option value="seigaiha" className="bg-gray-800">Seigaiha (青海波)</option>
                    <option value="asanoha" className="bg-gray-800">Asanoha (麻の葉)</option>
                    <option value="shippo" className="bg-gray-800">Shippo (七宝)</option>
                    <option value="yamaji" className="bg-gray-800">Yamaji (山路)</option>
                  </select>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Size: <span className="text-yellow-300 font-bold">{settings.size}</span></label>
                  <input
                    type="range"
                    value={settings.size}
                    onChange={(e) => setSettings(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    min={10}
                    max={100}
                    step={1}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Density */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Density: <span className="text-yellow-300 font-bold">{settings.density.toFixed(1)}</span></label>
                  <input
                    type="range"
                    value={settings.density}
                    onChange={(e) => setSettings(prev => ({ ...prev, density: parseFloat(e.target.value) }))}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Rotation: <span className="text-yellow-300 font-bold">{settings.rotation}°</span></label>
                  <input
                    type="range"
                    value={settings.rotation}
                    onChange={(e) => setSettings(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Opacity: <span className="text-yellow-300 font-bold">{settings.opacity}%</span></label>
                  <input
                    type="range"
                    value={settings.opacity}
                    onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                    min={10}
                    max={100}
                    step={1}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Colors */}
                <div className="space-y-3">
                  <label className="text-white font-medium">Colors</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-white/70">Primary</label>
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/70">Secondary</label>
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/70">Accent</label>
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Palettes */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Color Palettes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PALETTES.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => applyPalette(palette)}
                        className="flex gap-1 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        title={palette.name}
                      >
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-full h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={randomizePattern}
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium rounded-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    Randomize Pattern
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportPattern('png')}
                      className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </button>
                    <button
                      onClick={() => exportPattern('svg')}
                      className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      SVG
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Pattern Preview</h2>
              <div className="flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="max-w-full h-auto"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
