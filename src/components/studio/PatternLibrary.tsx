import React from 'react'
import { fabric } from 'fabric'
import { 
  Grid, 
  Waves, 
  Hexagon, 
  Triangle, 
  Circle, 
  Zap,
  Star,
  X
} from 'lucide-react'

interface PatternLibraryProps {
  canvas: any | null
  onClose: () => void
}

interface PatternDefinition {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  generate: (canvas: any) => void
}

export function PatternLibrary({ canvas, onClose }: PatternLibraryProps) {
  const patterns: PatternDefinition[] = [
    {
      id: 'checkerboard',
      name: 'Checkerboard',
      icon: Grid,
      description: 'Classic checkerboard pattern',
      generate: (canvas) => {
        const size = 40
        const rows = Math.ceil(canvas.height! / size)
        const cols = Math.ceil(canvas.width! / size)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if ((row + col) % 2 === 0) {
              const rect = new fabric.Rect({
                left: col * size,
                top: row * size,
                width: size,
                height: size,
                fill: '#000000',
                selectable: false
              })
              canvas.add(rect)
            }
          }
        }
      }
    },
    {
      id: 'circles',
      name: 'Circle Grid',
      icon: Circle,
      description: 'Grid of circles',
      generate: (canvas) => {
        const spacing = 60
        const radius = 20
        const rows = Math.ceil(canvas.height! / spacing)
        const cols = Math.ceil(canvas.width! / spacing)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const circle = new fabric.Circle({
              left: col * spacing + spacing/2,
              top: row * spacing + spacing/2,
              radius: radius,
              fill: '#3b82f6',
              originX: 'center',
              originY: 'center',
              selectable: false
            })
            canvas.add(circle)
          }
        }
      }
    },
    {
      id: 'triangles',
      name: 'Triangle Pattern',
      icon: Triangle,
      description: 'Repeating triangle pattern',
      generate: (canvas) => {
        const spacing = 50
        const size = 30
        const rows = Math.ceil(canvas.height! / spacing)
        const cols = Math.ceil(canvas.width! / spacing)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const triangle = new fabric.Triangle({
              left: col * spacing + spacing/2,
              top: row * spacing + spacing/2,
              width: size,
              height: size,
              fill: '#ef4444',
              originX: 'center',
              originY: 'center',
              selectable: false
            })
            canvas.add(triangle)
          }
        }
      }
    },
    {
      id: 'hexagons',
      name: 'Hexagon Pattern',
      icon: Hexagon,
      description: 'Honeycomb hexagon pattern',
      generate: (canvas) => {
        const size = 30
        const spacing = size * 1.5
        const rows = Math.ceil(canvas.height! / spacing)
        const cols = Math.ceil(canvas.width! / spacing)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const offsetX = row % 2 === 0 ? 0 : spacing / 2
            const hexagon = new fabric.Polygon([
              { x: 0, y: -size },
              { x: size * 0.866, y: -size/2 },
              { x: size * 0.866, y: size/2 },
              { x: 0, y: size },
              { x: -size * 0.866, y: size/2 },
              { x: -size * 0.866, y: -size/2 }
            ], {
              left: col * spacing + offsetX + spacing/2,
              top: row * spacing + spacing/2,
              fill: '#10b981',
              originX: 'center',
              originY: 'center',
              selectable: false
            })
            canvas.add(hexagon)
          }
        }
      }
    },
    {
      id: 'waves',
      name: 'Wave Pattern',
      icon: Waves,
      description: 'Flowing wave pattern',
      generate: (canvas) => {
        const amplitude = 30
        const frequency = 0.02
        const lineSpacing = 40
        const lines = Math.ceil(canvas.height! / lineSpacing)
        
        for (let i = 0; i < lines; i++) {
          const points = []
          const y = i * lineSpacing
          
          for (let x = 0; x <= canvas.width!; x += 5) {
            const waveY = y + Math.sin(x * frequency) * amplitude
            points.push({ x, y: waveY })
          }
          
          const path = new fabric.Path(
            `M ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`,
            {
              fill: '',
              stroke: '#8b5cf6',
              strokeWidth: 2,
              selectable: false
            }
          )
          canvas.add(path)
        }
      }
    },
    {
      id: 'dots',
      name: 'Dot Pattern',
      icon: Circle,
      description: 'Simple dot pattern',
      generate: (canvas) => {
        const spacing = 40
        const radius = 8
        const rows = Math.ceil(canvas.height! / spacing)
        const cols = Math.ceil(canvas.width! / spacing)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const dot = new fabric.Circle({
              left: col * spacing + spacing/2,
              top: row * spacing + spacing/2,
              radius: radius,
              fill: '#f59e0b',
              originX: 'center',
              originY: 'center',
              selectable: false
            })
            canvas.add(dot)
          }
        }
      }
    },
    {
      id: 'stars',
      name: 'Star Pattern',
      icon: Star,
      description: 'Decorative star pattern',
      generate: (canvas) => {
        const spacing = 80
        const size = 20
        const rows = Math.ceil(canvas.height! / spacing)
        const cols = Math.ceil(canvas.width! / spacing)
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const star = new fabric.Polygon([
              { x: 0, y: -size },
              { x: size * 0.3, y: -size * 0.3 },
              { x: size, y: 0 },
              { x: size * 0.3, y: size * 0.3 },
              { x: 0, y: size },
              { x: -size * 0.3, y: size * 0.3 },
              { x: -size, y: 0 },
              { x: -size * 0.3, y: -size * 0.3 }
            ], {
              left: col * spacing + spacing/2,
              top: row * spacing + spacing/2,
              fill: '#ec4899',
              originX: 'center',
              originY: 'center',
              selectable: false
            })
            canvas.add(star)
          }
        }
      }
    },
    {
      id: 'stripes',
      name: 'Stripe Pattern',
      icon: Zap,
      description: 'Diagonal stripe pattern',
      generate: (canvas) => {
        const stripeWidth = 20
        const angle = 45
        const diagonal = Math.sqrt(canvas.width! ** 2 + canvas.height! ** 2)
        const stripeCount = Math.ceil(diagonal / (stripeWidth * 2))
        
        for (let i = 0; i < stripeCount; i++) {
          const stripe = new fabric.Rect({
            left: -diagonal/2 + i * stripeWidth * 2,
            top: -diagonal/2,
            width: stripeWidth,
            height: diagonal,
            fill: '#6366f1',
            selectable: false,
            angle: angle,
            originX: 'center',
            originY: 'center'
          })
          
          stripe.left = canvas.width! / 2
          stripe.top = canvas.height! / 2
          canvas.add(stripe)
        }
      }
    }
  ]

  const generatePattern = (pattern: PatternDefinition) => {
    if (!canvas) return
    
    // Clear canvas first
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    
    // Generate the pattern
    pattern.generate(canvas)
    
    // Render the canvas
    canvas.renderAll()
    
    // Close the pattern library
    onClose()
  }

  return (
    <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Pattern Library</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-accent rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {patterns.map((pattern) => {
          const Icon = pattern.icon
          return (
            <button
              key={pattern.id}
              onClick={() => generatePattern(pattern)}
              className="w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-1">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{pattern.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{pattern.description}</p>
            </button>
          )
        })}
      </div>
      
      <div className="mt-6 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Click any pattern to generate it on the canvas. You can then modify, combine, or export the pattern.
        </p>
      </div>
    </div>
  )
}