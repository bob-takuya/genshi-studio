import { useState } from 'react'
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle,
  Eraser,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function MobileToolbar() {
  const { 
    canvasMode, 
    setCanvasMode,
    zoom,
    setZoom,
    toolbarMode,
    setToolbarMode,
    setExportDialogOpen
  } = useAppStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  const primaryTools = [
    { id: 'select', icon: MousePointer, name: 'Select' },
    { id: 'pen', icon: Pencil, name: 'Pen' },
    { id: 'brush', icon: Circle, name: 'Brush' },
    { id: 'shapes', icon: Square, name: 'Shapes' },
    { id: 'eraser', icon: Eraser, name: 'Eraser' }
  ]

  const quickActions = [
    { id: 'undo', icon: Undo, name: 'Undo', onClick: () => console.log('Undo') },
    { id: 'redo', icon: Redo, name: 'Redo', onClick: () => console.log('Redo') },
    { id: 'export', icon: Download, name: 'Export', onClick: () => setExportDialogOpen(true) }
  ]

  const moreActions = [
    { id: 'zoom-in', icon: ZoomIn, name: 'Zoom In', onClick: () => setZoom(zoom * 1.2) },
    { id: 'zoom-out', icon: ZoomOut, name: 'Zoom Out', onClick: () => setZoom(zoom * 0.8) }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      {/* Expandable section */}
      {isExpanded && (
        <div className="p-3 border-b border-border">
          {/* Canvas mode toggles */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => setCanvasMode('draw')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                canvasMode === 'draw' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent/50'
              }`}
            >
              <Pencil className="h-5 w-5" />
              <span className="text-xs">Draw</span>
            </button>
            <button
              onClick={() => setCanvasMode('parametric')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                canvasMode === 'parametric' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent/50'
              }`}
            >
              <Square className="h-5 w-5" />
              <span className="text-xs">Parametric</span>
            </button>
            <button
              onClick={() => setCanvasMode('code')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                canvasMode === 'code' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent/50'
              }`}
            >
              <Square className="h-5 w-5" />
              <span className="text-xs">Code</span>
            </button>
            <button
              onClick={() => setCanvasMode('growth')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                canvasMode === 'growth' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent/50'
              }`}
            >
              <Circle className="h-5 w-5" />
              <span className="text-xs">Growth</span>
            </button>
          </div>

          {/* More actions */}
          {showMoreActions && (
            <div className="grid grid-cols-4 gap-2">
              {moreActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-1 p-3 bg-accent/50 rounded-lg"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{action.name}</span>
                  </button>
                )
              })}
              <div className="flex flex-col items-center gap-1 p-3 bg-accent/50 rounded-lg">
                <span className="text-xs font-semibold">Zoom</span>
                <span className="text-xs">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main toolbar */}
      <div className="flex items-center justify-between p-3">
        {/* Drawing tools */}
        <div className="flex items-center gap-1">
          {primaryTools.slice(0, 4).map((tool) => {
            const Icon = tool.icon
            const isActive = toolbarMode === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => setToolbarMode(tool.id as any)}
                className={`p-3 min-h-[48px] min-w-[48px] rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent/50'
                }`}
                aria-label={tool.name}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        {/* Center actions */}
        <div className="flex items-center gap-1">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="p-3 min-h-[48px] min-w-[48px] bg-accent/50 rounded-lg transition-colors"
                aria-label={action.name}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="p-3 min-h-[48px] min-w-[48px] bg-accent/50 rounded-lg transition-colors"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 min-h-[48px] min-w-[48px] bg-accent/50 rounded-lg transition-colors"
            aria-label={isExpanded ? "Collapse toolbar" : "Expand toolbar"}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}