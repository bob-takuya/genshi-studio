import React, { useState, useRef } from 'react'
import { useColorPalette } from '../../hooks/useColorPalette'
import { Palette, Plus, X, RefreshCw } from 'lucide-react'

interface ColorPickerProps {
  onColorChange?: (color: string) => void
  showPalette?: boolean
  className?: string
}

export function ColorPicker({ 
  onColorChange, 
  showPalette = true,
  className = ''
}: ColorPickerProps) {
  const { 
    colors, 
    activeColor, 
    selectColor, 
    addToPalette, 
    removeFromPalette,
    resetPalette,
    isPaletteEmpty
  } = useColorPalette()
  
  const [showColorInput, setShowColorInput] = useState(false)
  const [customColor, setCustomColor] = useState(activeColor)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const handleColorSelect = (color: string) => {
    // Use the safe selectColor method that preserves palette
    selectColor(color)
    setCustomColor(color)
    if (onColorChange) {
      onColorChange(color)
    }
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    selectColor(newColor)
    if (onColorChange) {
      onColorChange(newColor)
    }
  }

  const addColorToPalette = () => {
    addToPalette(customColor)
    setShowColorInput(false)
  }

  const removeColorFromPalette = (colorToRemove: string) => {
    removeFromPalette(colorToRemove)
  }

  return (
    <div className={`color-picker ${className}`}>
      {/* Current Color Display */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Color</span>
        </label>
        <div className="flex items-center gap-2">
          <div 
            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: activeColor }}
            onClick={() => setShowColorInput(true)}
            title="Click to change color"
          />
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-full h-10 rounded cursor-pointer"
            title="Pick a color"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange({ target: { value: e.target.value } } as any)}
            className="w-24 px-2 py-1 text-sm bg-background border border-border rounded"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Color Palette */}
      {showPalette && (colors.length > 0 || isPaletteEmpty) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium block">Quick Colors</label>
            {isPaletteEmpty && (
              <button
                onClick={resetPalette}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Reset palette to defaults"
              >
                <RefreshCw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {colors.map((color, index) => (
              <div key={`${color}-${index}`} className="relative group">
                <button
                  onClick={() => handleColorSelect(color)}
                  className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-110 ${
                    activeColor === color 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
                {/* Remove button - only show for custom colors (after first 15 default colors) */}
                {index >= 15 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeColorFromPalette(color)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Remove color"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Add new color button */}
            <button
              onClick={() => setShowColorInput(true)}
              className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              title="Add custom color"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Color Input Dialog */}
      {showColorInput && (
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              ref={colorInputRef}
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-16 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
              placeholder="#000000"
            />
            <button
              onClick={addColorToPalette}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Add
            </button>
            <button
              onClick={() => setShowColorInput(false)}
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}