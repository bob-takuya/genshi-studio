import React from 'react'
import { useAppStore } from '../../hooks/useAppStore'
import { ColorPicker } from '../ui/ColorPicker'

interface DrawingPanelProps {
  onColorChange?: (color: string) => void
}

export function DrawingPanel({ onColorChange }: DrawingPanelProps) {
  const { activeColor } = useAppStore()

  const handleColorChange = (color: string) => {
    // Handle color change without clearing palette
    if (onColorChange) {
      onColorChange(color)
    }
  }

  return (
    <div className="drawing-panel p-4 bg-card rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Drawing Tools</h3>
      
      {/* Color Picker with Palette */}
      <ColorPicker 
        onColorChange={handleColorChange}
        showPalette={true}
        className="mb-6"
      />
      
      {/* Other drawing tools would go here */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Brush Size</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            defaultValue="5"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Opacity</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="100"
            className="w-full"
          />
        </div>
      </div>
      
      {/* Current color preview */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Current Color</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-16 h-16 rounded-lg border-2 border-border"
            style={{ backgroundColor: activeColor }}
          />
          <span className="font-mono text-sm">{activeColor}</span>
        </div>
      </div>
    </div>
  )
}