import { useState, useEffect } from 'react'
import { 
  Download, 
  FileImage, 
  FileText, 
  Code, 
  Eye,
  X,
  Check
} from 'lucide-react'
import { motion } from 'framer-motion'
import { UnifiedCanvas } from '../../graphics/canvas/UnifiedCanvas'
import { 
  ExportOptions as SimpleExportOptions,
  getExportDimensions,
  exportCanvasToPNG,
  exportCanvasToSVG,
  exportCanvasToJSON,
  downloadFile,
  generateFilename,
  handleExport
} from '../../utils/export'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  canvas: UnifiedCanvas | null
}

interface ExportOptions {
  format: 'png' | 'svg' | 'json'
  quality: number
  resolution: 'web' | 'print' | 'custom'
  customWidth: number
  customHeight: number
  backgroundColor: string
  includeBackground: boolean
}

const presetResolutions = {
  web: { width: 1920, height: 1080, label: 'Web HD (1920x1080)' },
  print: { width: 3508, height: 2480, label: 'Print A4 (300 DPI)' },
  mobile: { width: 375, height: 667, label: 'Mobile (375x667)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768x1024)' }
}

export function ExportDialog({ isOpen, onClose, canvas }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1,
    resolution: 'web',
    customWidth: 1920,
    customHeight: 1080,
    backgroundColor: '#ffffff',
    includeBackground: true
  })
  
  const [preview, setPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportCode, setExportCode] = useState<string>('')

  // Generate preview when options change
  useEffect(() => {
    if (isOpen && canvas) {
      generatePreview()
    }
  }, [isOpen, canvas, options])

  const generatePreview = async () => {
    if (!canvas) return
    
    setIsGenerating(true)
    
    try {
      switch (options.format) {
        case 'png':
          generatePNGPreview()
          break
        case 'svg':
          generateSVGPreview()
          break
        case 'json':
          generateJSONPreview()
          break
      }
    } catch (error) {
      console.error('Preview generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePNGPreview = () => {
    if (!canvas) return
    
    const { width, height } = getCurrentExportDimensions()
    const multiplier = Math.min(300 / width, 200 / height, 1)
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: options.quality,
      multiplier,
      backgroundColor: options.includeBackground ? options.backgroundColor : 'transparent'
    })
    
    setPreview(dataURL)
  }

  const generateSVGPreview = async () => {
    if (!canvas) return
    
    const svgString = canvas.toSVG()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const svgURL = URL.createObjectURL(svgBlob)
    setPreview(svgURL)
  }

  const generateJSONPreview = () => {
    if (!canvas) return
    
    const jsonCode = exportCanvasToJSON(canvas)
    setExportCode(jsonCode)
    
    // For JSON preview, show the canvas as PNG
    generatePNGPreview()
  }

  const getCurrentExportDimensions = () => {
    return getExportDimensions(options.resolution, options.customWidth, options.customHeight)
  }


  const handleExportClick = async () => {
    if (!canvas) return
    
    setIsGenerating(true)
    
    try {
      handleExport(canvas, options)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Download file function is now imported from vectorExport.ts

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="export-dialog">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Export Pattern</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            data-testid="export-dialog-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Options Panel */}
          <div className="w-80 border-r border-border p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'png', icon: FileImage, label: 'PNG' },
                    { id: 'svg', icon: FileText, label: 'SVG' },
                    { id: 'json', icon: Code, label: 'JSON' }
                  ].map((format) => {
                    const Icon = format.icon
                    return (
                      <button
                        key={format.id}
                        onClick={() => setOptions({ ...options, format: format.id as any })}
                        className={`p-3 rounded-lg border transition-colors ${
                          options.format === format.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <div className="text-xs">{format.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PNG/SVG Quality Options */}
              {(options.format === 'png' || options.format === 'svg') && (
                <>
                  {/* Quality */}
                  {options.format === 'png' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Quality: {Math.round(options.quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={options.quality}
                        onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Resolution</label>
                    <select
                      value={options.resolution}
                      onChange={(e) => setOptions({ ...options, resolution: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="web">Web (1920x1080)</option>
                      <option value="print">Print (300 DPI)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Custom Dimensions */}
                  {options.resolution === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Width</label>
                        <input
                          type="number"
                          value={options.customWidth}
                          onChange={(e) => setOptions({ ...options, customWidth: parseInt(e.target.value) })}
                          className="w-full p-2 border border-border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Height</label>
                        <input
                          type="number"
                          value={options.customHeight}
                          onChange={(e) => setOptions({ ...options, customHeight: parseInt(e.target.value) })}
                          className="w-full p-2 border border-border rounded-md bg-background"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Background option for PNG and SVG */}
              {(options.format === 'png' || options.format === 'svg') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="includeBackground"
                      checked={options.includeBackground}
                      onChange={(e) => setOptions({ ...options, includeBackground: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="includeBackground" className="text-sm font-medium">
                      Include background
                    </label>
                  </div>
                  {options.includeBackground && (
                    <input
                      type="color"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                      className="w-full h-10 rounded-md border border-border"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 p-6">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={generatePreview}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-md hover:bg-accent/80 transition-colors disabled:opacity-50"
                    data-testid="export-refresh-preview"
                  >
                    <Eye className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-accent/20 rounded-lg p-4 overflow-auto">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    {options.format === 'json' ? (
                      <div className="w-full h-full space-y-4">
                        <div className="bg-card rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">JSON Export Data</span>
                            <button
                              onClick={() => copyToClipboard(exportCode)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                          <pre className="text-xs bg-accent/50 p-3 rounded overflow-x-auto max-h-48">
                            <code>{exportCode}</code>
                          </pre>
                        </div>
                        {preview && (
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <div className="text-sm font-medium mb-2">Canvas Preview</div>
                            <img 
                              src={preview} 
                              alt="Canvas preview" 
                              className="max-w-full h-48 object-contain border border-border rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      preview && (
                        <img 
                          src={preview} 
                          alt="Export preview" 
                          className="max-w-full max-h-full object-contain border border-border rounded"
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {options.format === 'png' && `${getCurrentExportDimensions().width}x${getCurrentExportDimensions().height} pixels`}
            {options.format === 'svg' && 'Scalable vector format'}
            {options.format === 'json' && 'Canvas data and metadata'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              data-testid="export-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleExportClick}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="export-button"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}