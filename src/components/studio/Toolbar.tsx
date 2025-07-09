import React from 'react'
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle, 
  Triangle,
  Type,
  Eraser,
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  Code2
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function Toolbar() {
  const { 
    canvasMode, 
    setCanvasMode,
    zoom,
    setZoom
  } = useAppStore()

  const tools = [
    { id: 'select', icon: MousePointer, name: 'Select' },
    { id: 'draw', icon: Pencil, name: 'Draw' },
    { id: 'rect', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Circle' },
    { id: 'triangle', icon: Triangle, name: 'Triangle' },
    { id: 'text', icon: Type, name: 'Text' },
    { id: 'eraser', icon: Eraser, name: 'Eraser' }
  ]

  const actions = [
    { id: 'undo', icon: Undo, name: 'Undo', shortcut: '⌘Z' },
    { id: 'redo', icon: Redo, name: 'Redo', shortcut: '⌘⇧Z' },
    { id: 'upload', icon: Upload, name: 'Import' },
    { id: 'download', icon: Download, name: 'Export' }
  ]

  const viewOptions = [
    { id: 'grid', icon: Grid, name: 'Toggle Grid' },
    { id: 'preview', icon: Eye, name: 'Preview' }
  ]

  return (
    <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
      {/* Left side - Drawing tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              className="p-2 hover:bg-accent rounded-md transition-colors group relative"
              aria-label={tool.name}
            >
              <Icon className="h-5 w-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tool.name}
              </span>
            </button>
          )
        })}
        
        <div className="w-px h-8 bg-border mx-2" />
        
        {/* Canvas/Code mode toggle */}
        <button
          onClick={() => setCanvasMode(canvasMode === 'draw' ? 'code' : 'draw')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            canvasMode === 'code' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span className="text-sm">Code</span>
        </button>
      </div>

      {/* Center - Actions */}
      <div className="flex items-center gap-1">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              className="p-2 hover:bg-accent rounded-md transition-colors group relative"
              aria-label={action.name}
            >
              <Icon className="h-5 w-5" />
              {action.shortcut && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {action.shortcut}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Right side - View options and zoom */}
      <div className="flex items-center gap-2">
        {viewOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.id}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label={option.name}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
        
        <div className="w-px h-8 bg-border mx-2" />
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(zoom * 0.8)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <div className="px-3 py-1 min-w-[60px] text-center text-sm">
            {Math.round(zoom * 100)}%
          </div>
          
          <button
            onClick={() => setZoom(zoom * 1.2)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}