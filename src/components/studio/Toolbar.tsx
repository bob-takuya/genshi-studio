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
  Code2,
  Star,
  Bookmark,
  Sparkles,
  Zap
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function Toolbar() {
  const { 
    canvasMode, 
    setCanvasMode,
    zoom,
    setZoom,
    toolbarMode,
    setToolbarMode,
    setExportDialogOpen,
    setPresetDialogOpen,
    setBookmarkDialogOpen
  } = useAppStore()

  const tools = [
    { id: 'select', icon: MousePointer, name: 'Select', shortcut: 'V' },
    { id: 'pen', icon: Pencil, name: 'Pen', shortcut: 'P' },
    { id: 'brush', icon: Circle, name: 'Brush', shortcut: 'B' },
    { id: 'shapes', icon: Square, name: 'Shapes', shortcut: 'R' },
    { id: 'text', icon: Type, name: 'Text', shortcut: 'T' },
    { id: 'eraser', icon: Eraser, name: 'Eraser', shortcut: 'E' },
    { id: 'pattern', icon: Star, name: 'Pattern', shortcut: 'Shift+P' }
  ]

  const actions = [
    { id: 'undo', icon: Undo, name: 'Undo', shortcut: '⌘Z', onClick: () => console.log('Undo') },
    { id: 'redo', icon: Redo, name: 'Redo', shortcut: '⌘⇧Z', onClick: () => console.log('Redo') },
    { id: 'presets', icon: Star, name: 'Presets', shortcut: 'F', onClick: () => setPresetDialogOpen(true) },
    { id: 'bookmarks', icon: Bookmark, name: 'Bookmarks', onClick: () => setBookmarkDialogOpen(true) },
    { id: 'upload', icon: Upload, name: 'Import', onClick: () => console.log('Import') },
    { id: 'download', icon: Download, name: 'Export', shortcut: 'E', onClick: () => setExportDialogOpen(true) }
  ]

  const viewOptions = [
    { id: 'grid', icon: Grid, name: 'Toggle Grid' },
    { id: 'preview', icon: Eye, name: 'Preview' }
  ]

  return (
    <div className="h-14 md:h-16 border-b border-border bg-card px-2 md:px-4 flex items-center justify-between overflow-x-auto toolbar-mobile md:toolbar-tablet" data-testid="tool-panel">
      {/* Left side - Drawing tools */}
      <div className="flex items-center gap-1 md:gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = toolbarMode === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => setToolbarMode(tool.id as any)}
              className={`tool-button p-2 md:p-2 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] rounded-md transition-colors group relative ${
                isActive 
                  ? 'bg-primary text-primary-foreground active' 
                  : 'hover:bg-accent'
              }`}
              aria-label={tool.name}
              data-testid={`tool-${tool.id}`}
            >
              <Icon className="h-5 w-5 md:h-5 md:w-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
                {tool.name} {tool.shortcut && `(${tool.shortcut})`}
              </span>
            </button>
          )
        })}
        
        <div className="w-px h-6 md:h-8 bg-border mx-1 md:mx-2" />
        
        {/* Canvas mode toggles */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setCanvasMode('draw')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 min-h-[44px] md:min-h-[36px] rounded-md transition-colors ${
              canvasMode === 'draw' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title="Drawing Canvas"
          >
            <Pencil className="h-4 w-4 md:h-4 md:w-4" />
            <span className="text-sm mobile-hide-text hidden md:inline">Draw</span>
          </button>
          <button
            onClick={() => setCanvasMode('parametric')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 min-h-[44px] md:min-h-[36px] rounded-md transition-colors ${
              canvasMode === 'parametric' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title="Parametric Pattern Editor"
          >
            <Sparkles className="h-4 w-4 md:h-4 md:w-4" />
            <span className="text-sm mobile-hide-text hidden md:inline">Parametric</span>
          </button>
          <button
            onClick={() => setCanvasMode('code')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 min-h-[44px] md:min-h-[36px] rounded-md transition-colors ${
              canvasMode === 'code' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title="Code Editor"
          >
            <Code2 className="h-4 w-4 md:h-4 md:w-4" />
            <span className="text-sm mobile-hide-text hidden md:inline">Code</span>
          </button>
          <button
            onClick={() => setCanvasMode('growth')}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 min-h-[44px] md:min-h-[36px] rounded-md transition-colors ${
              canvasMode === 'growth' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title="Interactive Growth Studio"
          >
            <Zap className="h-4 w-4 md:h-4 md:w-4" />
            <span className="text-sm mobile-hide-text hidden md:inline">Growth</span>
          </button>
        </div>
      </div>

      {/* Center - Actions (hide some on mobile) */}
      <div className="flex items-center gap-1 md:gap-2">
        {actions.slice(0, 3).map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="p-2 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] hover:bg-accent rounded-md transition-colors group relative"
              aria-label={action.name}
              data-testid={`${action.id === 'download' ? 'export' : action.id === 'upload' ? 'save' : action.id}-button`}
            >
              <Icon className="h-5 w-5 md:h-5 md:w-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
                {action.name} {action.shortcut && `(${action.shortcut})`}
              </span>
            </button>
          )
        })}
        {/* Show remaining actions on tablet and desktop */}
        <div className="hidden md:flex items-center gap-1">
          {actions.slice(3).map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="p-2 hover:bg-accent rounded-md transition-colors group relative"
                aria-label={action.name}
                data-testid={`${action.id === 'download' ? 'export' : action.id === 'upload' ? 'save' : action.id}-button`}
              >
                <Icon className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {action.name} {action.shortcut && `(${action.shortcut})`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right side - View options and zoom (simplified on mobile) */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Hide view options on mobile */}
        <div className="hidden md:flex items-center gap-1">
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
        </div>
        
        {/* Zoom controls - simplified on mobile */}
        <div className="flex items-center gap-1" data-testid="zoom-controls">
          <button
            onClick={() => setZoom(zoom * 0.8)}
            className="p-2 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] hover:bg-accent rounded-md transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5 md:h-5 md:w-5" />
          </button>
          
          <div className="px-2 md:px-3 py-1 min-w-[50px] md:min-w-[60px] text-center text-xs md:text-sm">
            {Math.round(zoom * 100)}%
          </div>
          
          <button
            onClick={() => setZoom(zoom * 1.2)}
            className="p-2 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] hover:bg-accent rounded-md transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5 md:h-5 md:w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}