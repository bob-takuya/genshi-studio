import { fabric } from 'fabric'
import { useAppStore } from '@/store/appStore'
import {
  MousePointer,
  Square,
  Circle,
  Triangle,
  Type,
  Pen,
  Eraser,
  Image,
  Star,
  Heart,
  Hexagon,
} from 'lucide-react'

interface ToolbarProps {
  canvas: fabric.Canvas | null
}

export default function Toolbar({ canvas }: ToolbarProps) {
  const { toolbarMode, setToolbarMode } = useAppStore()

  const tools = [
    { id: 'select', icon: MousePointer, name: 'Select' },
    { id: 'draw', icon: Pen, name: 'Draw' },
    { id: 'shape', icon: Square, name: 'Shapes' },
    { id: 'text', icon: Type, name: 'Text' },
    { id: 'erase', icon: Eraser, name: 'Erase' },
  ]

  const shapes = [
    { id: 'rect', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Circle' },
    { id: 'triangle', icon: Triangle, name: 'Triangle' },
    { id: 'star', icon: Star, name: 'Star' },
    { id: 'heart', icon: Heart, name: 'Heart' },
    { id: 'hexagon', icon: Hexagon, name: 'Hexagon' },
  ]

  const handleToolSelect = (toolId: string) => {
    if (!canvas) return

    setToolbarMode(toolId as any)

    // Reset canvas mode
    canvas.isDrawingMode = false
    canvas.selection = true

    switch (toolId) {
      case 'select':
        // Default selection mode
        break

      case 'draw':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush.width = 2
        canvas.freeDrawingBrush.color = '#000000'
        break

      case 'text':
        handleAddText()
        break

      case 'erase':
        const activeObject = canvas.getActiveObject()
        if (activeObject) {
          canvas.remove(activeObject)
          canvas.discardActiveObject()
        }
        break
    }
  }

  const handleAddText = () => {
    if (!canvas) return

    const text = new fabric.IText('Click to edit', {
      left: canvas.width! / 2 - 50,
      top: canvas.height! / 2 - 20,
      fontFamily: 'Inter',
      fontSize: 24,
      fill: '#000000',
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const handleAddShape = (shapeId: string) => {
    if (!canvas) return

    let shape: fabric.Object | null = null
    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    switch (shapeId) {
      case 'rect':
        shape = new fabric.Rect({
          left: centerX - 50,
          top: centerY - 50,
          width: 100,
          height: 100,
          fill: '#6366f1',
        })
        break

      case 'circle':
        shape = new fabric.Circle({
          left: centerX - 50,
          top: centerY - 50,
          radius: 50,
          fill: '#f59e0b',
        })
        break

      case 'triangle':
        shape = new fabric.Triangle({
          left: centerX - 50,
          top: centerY - 50,
          width: 100,
          height: 100,
          fill: '#10b981',
        })
        break

      case 'star':
        const starPoints = []
        const outerRadius = 50
        const innerRadius = 25
        const numPoints = 5

        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / numPoints
          starPoints.push({
            x: centerX + radius * Math.sin(angle),
            y: centerY - radius * Math.cos(angle),
          })
        }

        shape = new fabric.Polygon(starPoints, {
          fill: '#ef4444',
        })
        break

      case 'heart':
        const heartPath = 'M 272.70141,238.71731 C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 C 152.70146,493.47282 288.63461,612.13682 381.28461,662.93682 L 381.28461,662.93682 C 474.03461,612.13682 609.96777,493.47282 609.96777,358.71731 C 609.96777,292.4773 556.20777,238.71731 489.96777,238.71731 C 446.36777,238.71731 407.17581,257.51981 381.28461,287.71731 C 355.39341,257.51981 316.20141,238.71731 272.70141,238.71731 z'
        shape = new fabric.Path(heartPath, {
          left: centerX - 50,
          top: centerY - 50,
          fill: '#ec4899',
          scaleX: 0.2,
          scaleY: 0.2,
        })
        break

      case 'hexagon':
        const hexPoints = []
        const hexRadius = 50
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6
          hexPoints.push({
            x: centerX + hexRadius * Math.cos(angle),
            y: centerY + hexRadius * Math.sin(angle),
          })
        }
        shape = new fabric.Polygon(hexPoints, {
          fill: '#8b5cf6',
        })
        break
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Main Tools */}
      <div className="flex items-center space-x-1 bg-background rounded-lg p-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={`p-2 rounded transition-all ${
              toolbarMode === tool.id
                ? 'bg-primary text-white'
                : 'hover:bg-gray-700'
            }`}
            title={tool.name}
          >
            <tool.icon size={20} />
          </button>
        ))}
      </div>

      {/* Shapes */}
      {toolbarMode === 'shape' && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleAddShape(shape.id)}
                className="p-2 rounded hover:bg-gray-700 transition-all"
                title={shape.name}
              >
                <shape.icon size={20} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}