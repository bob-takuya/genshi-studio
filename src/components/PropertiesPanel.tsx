import { useEffect, useState } from 'react'
import { Canvas, FabricObject } from 'fabric'
import { 
  Palette, 
  Move, 
  RotateCw, 
  Square, 
  Type,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react'

interface PropertiesPanelProps {
  canvas: Canvas | null
  selectedObject: FabricObject | null
}

export default function PropertiesPanel({ canvas, selectedObject }: PropertiesPanelProps) {
  const [properties, setProperties] = useState({
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    angle: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    textAlign: 'left',
  })

  useEffect(() => {
    if (!selectedObject) return

    setProperties({
      fill: (typeof selectedObject.fill === 'string' ? selectedObject.fill : '#000000') || '#000000',
      stroke: selectedObject.stroke || '#000000',
      strokeWidth: selectedObject.strokeWidth || 1,
      opacity: selectedObject.opacity || 1,
      angle: selectedObject.angle || 0,
      left: Math.round(selectedObject.left || 0),
      top: Math.round(selectedObject.top || 0),
      width: Math.round(selectedObject.width || 0),
      height: Math.round(selectedObject.height || 0),
      fontSize: (selectedObject as any).fontSize || 16,
      fontFamily: (selectedObject as any).fontFamily || 'Inter',
      fontWeight: (selectedObject as any).fontWeight || 'normal',
      textAlign: (selectedObject as any).textAlign || 'left',
    })
  }, [selectedObject])

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return

    selectedObject.set(key as any, value)
    canvas.renderAll()

    setProperties(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleColorChange = (key: string, value: string) => {
    updateProperty(key, value)
  }

  const handleNumberChange = (key: string, value: number) => {
    updateProperty(key, value)
  }

  if (!selectedObject) {
    return (
      <div className="p-4 text-center text-text-secondary">
        <div className="mb-4">
          <Square className="w-12 h-12 mx-auto opacity-20" />
        </div>
        <p className="text-sm">Select an object to edit its properties</p>
      </div>
    )
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'text'

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center space-x-2">
          <Layers size={16} />
          <span>Properties</span>
        </h3>
      </div>

      {/* Object Controls */}
      <div className="p-4 space-y-4">
        {/* Visibility & Lock */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => updateProperty('visible', !selectedObject.visible)}
            className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
          >
            {selectedObject.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{selectedObject.visible ? 'Visible' : 'Hidden'}</span>
          </button>
          <button
            onClick={() => updateProperty('lockMovementX', !selectedObject.lockMovementX)}
            className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
          >
            {selectedObject.lockMovementX ? <Lock size={16} /> : <Unlock size={16} />}
            <span>{selectedObject.lockMovementX ? 'Locked' : 'Unlocked'}</span>
          </button>
        </div>

        {/* Fill Color */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium mb-2">
            <Palette size={16} />
            <span>Fill Color</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={properties.fill}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={properties.fill}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="w-20 px-2 py-1 text-sm bg-background border border-border rounded"
            />
          </div>
        </div>

        {/* Stroke */}
        <div>
          <label className="text-sm font-medium mb-2 block">Stroke</label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="color"
              value={properties.stroke}
              onChange={(e) => handleColorChange('stroke', e.target.value)}
              className="flex-1 h-8 rounded cursor-pointer"
            />
            <input
              type="number"
              value={properties.strokeWidth}
              onChange={(e) => handleNumberChange('strokeWidth', parseFloat(e.target.value))}
              min="0"
              max="50"
              className="w-16 px-2 py-1 text-sm bg-background border border-border rounded"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Opacity: {Math.round(properties.opacity * 100)}%
          </label>
          <input
            type="range"
            value={properties.opacity}
            onChange={(e) => handleNumberChange('opacity', parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.01"
            className="w-full"
          />
        </div>

        {/* Position */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium mb-2">
            <Move size={16} />
            <span>Position</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-secondary">X</label>
              <input
                type="number"
                value={properties.left}
                onChange={(e) => handleNumberChange('left', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Y</label>
              <input
                type="number"
                value={properties.top}
                onChange={(e) => handleNumberChange('top', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium mb-2">
            <Square size={16} />
            <span>Size</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-secondary">Width</label>
              <input
                type="number"
                value={properties.width}
                onChange={(e) => handleNumberChange('width', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Height</label>
              <input
                type="number"
                value={properties.height}
                onChange={(e) => handleNumberChange('height', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium mb-2">
            <RotateCw size={16} />
            <span>Rotation: {Math.round(properties.angle)}°</span>
          </label>
          <input
            type="range"
            value={properties.angle}
            onChange={(e) => handleNumberChange('angle', parseFloat(e.target.value))}
            min="0"
            max="360"
            className="w-full"
          />
        </div>

        {/* Text Properties */}
        {isText && (
          <>
            <div className="border-t border-border pt-4">
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Type size={16} />
                <span>Text Properties</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Font Family</label>
              <select
                value={properties.fontFamily}
                onChange={(e) => updateProperty('fontFamily', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Font Size</label>
              <input
                type="number"
                value={properties.fontSize}
                onChange={(e) => handleNumberChange('fontSize', parseFloat(e.target.value))}
                min="8"
                max="200"
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Font Weight</label>
              <select
                value={properties.fontWeight}
                onChange={(e) => updateProperty('fontWeight', e.target.value)}
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="300">Light</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="700">Bold</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Text Align</label>
              <div className="grid grid-cols-3 gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateProperty('textAlign', align)}
                    className={`px-2 py-1 text-sm rounded ${
                      properties.textAlign === align
                        ? 'bg-primary text-white'
                        : 'bg-background hover:bg-gray-700'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}