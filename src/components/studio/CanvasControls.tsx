import React, { useState } from 'react'
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle, 
  Triangle,
  Type,
  Trash2,
  Download,
  Palette,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CanvasControlsProps {
  onModeChange: (mode: 'select' | 'draw' | 'shape' | 'text') => void
  onAddShape: (type: 'rect' | 'circle' | 'triangle') => void
  onClear: () => void
  onExport: () => void
  onTogglePatterns: () => void
  showPatternLibrary: boolean
  onGenerateTestPattern: () => void
}

export function CanvasControls({
  onModeChange,
  onAddShape,
  onClear,
  onExport,
  onTogglePatterns,
  showPatternLibrary,
  onGenerateTestPattern
}: CanvasControlsProps) {
  const [activeMode, setActiveMode] = useState<'select' | 'draw' | 'shape' | 'text'>('select')
  const [showShapeMenu, setShowShapeMenu] = useState(false)

  const handleModeChange = (mode: 'select' | 'draw' | 'shape' | 'text') => {
    setActiveMode(mode)
    onModeChange(mode)
    
    if (mode === 'shape') {
      setShowShapeMenu(true)
    } else {
      setShowShapeMenu(false)
    }
  }

  const tools = [
    { id: 'select', icon: MousePointer, name: 'Select', shortcut: 'V' },
    { id: 'draw', icon: Pencil, name: 'Draw', shortcut: 'P' },
    { id: 'shape', icon: Square, name: 'Shapes', shortcut: 'R' },
    { id: 'text', icon: Type, name: 'Text', shortcut: 'T' }
  ]

  const shapes = [
    { id: 'rect', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Circle' },
    { id: 'triangle', icon: Triangle, name: 'Triangle' }
  ]


  return (
    <>
      {/* Floating toolbar */}
      <div className="absolute top-4 left-4 bg-card rounded-lg shadow-lg border border-border p-1 flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeMode === tool.id
          
          return (
            <button
              key={tool.id}
              onClick={() => handleModeChange(tool.id as any)}
              className={`p-2.5 rounded-md transition-colors relative group ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
              aria-label={tool.name}
            >
              <Icon className="h-5 w-5" />
              
              {/* Tooltip */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tool.name} ({tool.shortcut})
              </div>
            </button>
          )
        })}
        
        <div className="w-px h-8 bg-border mx-1" />
        
        {/* Clear canvas */}
        <button
          onClick={onClear}
          className="p-2.5 hover:bg-accent rounded-md transition-colors group"
          aria-label="Clear canvas"
        >
          <Trash2 className="h-5 w-5" />
          
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Clear
          </div>
        </button>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        {/* Export */}
        <button
          onClick={onExport}
          className="p-2.5 hover:bg-accent rounded-md transition-colors group"
          aria-label="Export"
        >
          <Download className="h-5 w-5" />
          
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Export
          </div>
        </button>
        
        {/* Test Pattern */}
        <button
          onClick={onGenerateTestPattern}
          className="p-2.5 hover:bg-accent rounded-md transition-colors group"
          aria-label="Generate Test Pattern"
        >
          <Sparkles className="h-5 w-5" />
          
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Test Pattern
          </div>
        </button>
        
        {/* Pattern Library Toggle */}
        <button
          onClick={onTogglePatterns}
          className={`p-2.5 rounded-md transition-colors group ${
            showPatternLibrary 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
          aria-label="Toggle Pattern Library"
        >
          <Palette className="h-5 w-5" />
          
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Patterns
          </div>
        </button>
      </div>

      {/* Shape selection menu */}
      <AnimatePresence>
        {showShapeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 bg-card rounded-lg shadow-lg border border-border p-2"
          >
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Select Shape
            </div>
            {shapes.map((shape) => {
              const Icon = shape.icon
              return (
                <button
                  key={shape.id}
                  onClick={() => {
                    onAddShape(shape.id as any)
                    setShowShapeMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{shape.name}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur px-3 py-2 rounded-md">
        <span className="opacity-60">Press</span>{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd>{' '}
        <span className="opacity-60">to pan •</span>{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘/Ctrl</kbd>{' '}
        <span className="opacity-60">+ scroll to zoom</span>
      </div>
    </>
  )
}