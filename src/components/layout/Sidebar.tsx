import { X, Layers, Palette, Code2, Grid3x3, Settings2 } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { activeTool, setActiveTool } = useAppStore()

  const tools = [
    { id: 'layers', name: 'Layers', icon: Layers },
    { id: 'palette', name: 'Color Palette', icon: Palette },
    { id: 'patterns', name: 'Patterns', icon: Grid3x3 },
    { id: 'code', name: 'Code Editor', icon: Code2 },
    { id: 'properties', name: 'Properties', icon: Settings2 }
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 md:w-64 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          sidebar-mobile md:sidebar-desktop
          ${isOpen ? 'translate-x-0 open' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="h-16 md:h-16 border-b border-border px-4 flex items-center justify-between">
            <h2 className="font-semibold text-base md:text-base">Tools</h2>
            <button
              onClick={onToggle}
              className="md:hidden p-3 min-h-[44px] min-w-[44px] hover:bg-accent rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tool panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 mobile-spacing">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = activeTool === tool.id
              
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    text-sm md:text-sm font-medium transition-colors
                    min-h-[48px] md:min-h-[44px]
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 md:h-5 md:w-5" />
                  <span>{tool.name}</span>
                </button>
              )
            })}
          </div>

          {/* Tool panel content */}
          <div className="border-t border-border p-4">
            {activeTool === 'layers' && <LayersPanel />}
            {activeTool === 'palette' && <PalettePanel />}
            {activeTool === 'patterns' && <PatternsPanel />}
            {activeTool === 'code' && <CodePanel />}
            {activeTool === 'properties' && <PropertiesPanel />}
          </div>
        </div>
      </aside>
    </>
  )
}

// Tool panel components
function LayersPanel() {
  const { layers } = useAppStore()
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2">Layers</h3>
      <div className="space-y-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => {}}
              className="rounded"
            />
            <span className="text-sm flex-1">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PalettePanel() {
  const { colors, setActiveColor } = useAppStore()
  
  return (
    <div className="space-y-2 mobile-compact">
      <h3 className="text-sm font-semibold mb-2">Colors</h3>
      <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className="w-12 h-12 md:w-10 md:h-10 min-h-[44px] md:min-h-[40px] min-w-[44px] md:min-w-[40px] rounded border-2 border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  )
}

function PatternsPanel() {
  return (
    <div className="space-y-2 mobile-compact">
      <h3 className="text-sm font-semibold mb-2">Cultural Patterns</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-2">
        {['japanese', 'celtic', 'islamic', 'aztec'].map((pattern) => (
          <button
            key={pattern}
            className="p-3 md:p-3 min-h-[48px] md:min-h-[44px] rounded border border-border hover:bg-accent capitalize text-sm transition-colors"
          >
            {pattern}
          </button>
        ))}
      </div>
    </div>
  )
}

function CodePanel() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2">Code Mode</h3>
      <p className="text-sm text-muted-foreground">
        Switch to code editor in the main canvas
      </p>
    </div>
  )
}

function PropertiesPanel() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2">Properties</h3>
      <p className="text-sm text-muted-foreground">
        Select an object to view properties
      </p>
    </div>
  )
}