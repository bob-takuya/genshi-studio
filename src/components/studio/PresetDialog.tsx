import React from 'react'
import { 
  X,
  Star,
  Grid,
  Waves,
  TreePine,
  Zap,
  Eye,
  Download,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../hooks/useAppStore'

interface PresetDialogProps {
  isOpen: boolean
  onClose: () => void
}

const patternIcons = {
  waves: Waves,
  flow: TreePine,
  maze: Grid,
  geometric: Star,
  organic: TreePine,
  default: Zap
}

export function PresetDialog({ isOpen, onClose }: PresetDialogProps) {
  const { 
    presets, 
    loadPreset, 
    deletePreset 
  } = useAppStore()

  const handleLoadPreset = (presetId: string) => {
    loadPreset(presetId)
    onClose()
  }

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this preset?')) {
      deletePreset(presetId)
    }
  }

  const handleExportPreset = (preset: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const dataStr = JSON.stringify(preset, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name.toLowerCase().replace(/\s+/g, '-')}-preset.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl border border-border w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Load Preset</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose from saved pattern presets to quickly start creating
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {presets.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Presets Available</h3>
              <p className="text-muted-foreground">
                Create some patterns and save them as presets to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => {
                const IconComponent = patternIcons[preset.patternType as keyof typeof patternIcons] || patternIcons.default
                
                return (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-accent/20 rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/30 transition-colors group"
                    onClick={() => handleLoadPreset(preset.id)}
                  >
                    {/* Preset Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleExportPreset(preset, e)}
                          className="p-1.5 hover:bg-accent rounded transition-colors"
                          title="Export preset"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          className="p-1.5 hover:bg-destructive/20 text-destructive rounded transition-colors"
                          title="Delete preset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preset Info */}
                    <div>
                      <h3 className="font-medium mb-1">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {preset.description || 'No description available'}
                      </p>
                      
                      {/* Pattern Type Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {preset.patternType}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          Load
                        </div>
                      </div>
                    </div>

                    {/* Preview placeholder */}
                    {preset.preview && (
                      <div className="mt-3 h-20 bg-accent/30 rounded border border-border flex items-center justify-center">
                        <img 
                          src={preset.preview} 
                          alt={`${preset.name} preview`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {presets.length} preset{presets.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}