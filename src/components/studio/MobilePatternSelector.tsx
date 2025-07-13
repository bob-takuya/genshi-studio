import { useState } from 'react'
import { X, Grid3x3, Palette, Star, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

interface MobilePatternSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function MobilePatternSelector({ isOpen, onClose }: MobilePatternSelectorProps) {
  const { colors, setActiveColor, activeColor } = useAppStore()
  const [activeTab, setActiveTab] = useState<'patterns' | 'colors' | 'shapes'>('patterns')

  const patterns = [
    { id: 'ichimatsu', name: 'Ichimatsu', preview: '◼◻◼◻' },
    { id: 'seigaiha', name: 'Seigaiha', preview: '︶︶︶︶' },
    { id: 'asanoha', name: 'Asanoha', preview: '✱✱✱✱' },
    { id: 'shippo', name: 'Shippo', preview: '○○○○' },
    { id: 'hanabishi', name: 'Hanabishi', preview: '◆◆◆◆' },
    { id: 'kumiko', name: 'Kumiko', preview: '╋╋╋╋' },
    { id: 'yabane', name: 'Yabane', preview: '＞＞＞＞' },
    { id: 'kanoko', name: 'Kanoko', preview: '●●●●' }
  ]

  const shapes = [
    { id: 'circle', name: 'Circle', icon: '●' },
    { id: 'square', name: 'Square', icon: '■' },
    { id: 'triangle', name: 'Triangle', icon: '▲' },
    { id: 'diamond', name: 'Diamond', icon: '♦' },
    { id: 'star', name: 'Star', icon: '★' },
    { id: 'hexagon', name: 'Hexagon', icon: '⬡' }
  ]

  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-card rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Pattern Library</h2>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] hover:bg-accent rounded-lg transition-colors"
            aria-label="Close pattern selector"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 min-h-[56px] transition-colors ${
              activeTab === 'patterns'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Grid3x3 className="h-5 w-5" />
            <span>Patterns</span>
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 min-h-[56px] transition-colors ${
              activeTab === 'colors'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Palette className="h-5 w-5" />
            <span>Colors</span>
          </button>
          <button
            onClick={() => setActiveTab('shapes')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 min-h-[56px] transition-colors ${
              activeTab === 'shapes'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Star className="h-5 w-5" />
            <span>Shapes</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'patterns' && (
            <div className="grid grid-cols-2 gap-3">
              {patterns.map((pattern) => (
                <button
                  key={pattern.id}
                  className="flex flex-col items-center gap-2 p-4 min-h-[80px] bg-accent/50 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="text-2xl font-mono">{pattern.preview}</div>
                  <span className="text-sm font-medium">{pattern.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="grid grid-cols-6 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`aspect-square min-h-[52px] rounded-lg border-2 transition-all ${
                    activeColor === color
                      ? 'border-primary scale-110'
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          )}

          {activeTab === 'shapes' && (
            <div className="grid grid-cols-3 gap-3">
              {shapes.map((shape) => (
                <button
                  key={shape.id}
                  className="flex flex-col items-center gap-2 p-4 min-h-[80px] bg-accent/50 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="text-2xl">{shape.icon}</div>
                  <span className="text-sm font-medium">{shape.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-accent hover:bg-accent/80 rounded-lg transition-colors">
              Apply Pattern
            </button>
            <button className="p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors">
              Save Custom
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}