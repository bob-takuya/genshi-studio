import { useState, useEffect } from 'react'
import { 
  Download, 
  FileImage, 
  FileText, 
  Code, 
  Eye,
  X,
  Check,
  FileType,
  Printer
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  SVGExporter, 
  PDFExporter, 
  EPSExporter,
  SVGExportOptions,
  PDFExportOptions,
  EPSExportOptions,
  downloadFile
} from '../../utils/vectorExport'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  canvas: any | null
}

interface ExportOptions {
  format: 'png' | 'svg' | 'css' | 'pdf' | 'eps'
  quality: number
  resolution: 'web' | 'print' | 'custom'
  customWidth: number
  customHeight: number
  backgroundColor: string
  includeBackground: boolean
  cssType: 'background' | 'pattern' | 'mask'
  cssUnits: 'px' | '%' | 'em' | 'rem'
  cssRepeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
  // SVG specific options
  svgOptimize: boolean
  svgPrecision: number
  svgIncludeLayers: boolean
  // PDF specific options
  pdfFormat: 'a4' | 'a3' | 'letter' | 'custom'
  pdfOrientation: 'portrait' | 'landscape'
  pdfColorSpace: 'RGB' | 'CMYK'
  // EPS specific options
  epsLevel: 2 | 3
  epsColorSpace: 'RGB' | 'CMYK' | 'Grayscale'
  // Metadata options
  includeMetadata: boolean
  title: string
  author: string
  description: string
  keywords: string[]
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
    includeBackground: true,
    cssType: 'background',
    cssUnits: 'px',
    cssRepeat: 'repeat',
    // SVG options
    svgOptimize: true,
    svgPrecision: 2,
    svgIncludeLayers: true,
    // PDF options
    pdfFormat: 'a4',
    pdfOrientation: 'portrait',
    pdfColorSpace: 'RGB',
    // EPS options
    epsLevel: 3,
    epsColorSpace: 'RGB',
    // Metadata
    includeMetadata: true,
    title: 'Genshi Pattern',
    author: 'Genshi Studio',
    description: '',
    keywords: ['pattern', 'generative', 'art']
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
        case 'pdf':
          generatePDFPreview()
          break
        case 'eps':
          generateEPSPreview()
          break
        case 'css':
          generateCSSPreview()
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
    
    const { width, height } = getExportDimensions()
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
    
    const svgOptions: SVGExportOptions = {
      optimize: options.svgOptimize,
      embedStyles: true,
      includeLayers: options.svgIncludeLayers,
      preservePatterns: true,
      precision: options.svgPrecision,
      includeMetadata: options.includeMetadata,
      title: options.title,
      description: options.description,
      creator: options.author
    }
    
    const svgString = await SVGExporter.exportFromCanvas(canvas, svgOptions)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const svgURL = URL.createObjectURL(svgBlob)
    setPreview(svgURL)
  }

  const generatePDFPreview = () => {
    if (!canvas) return
    
    // For PDF preview, show the canvas as PNG
    generatePNGPreview()
    setExportCode('PDF Export Ready\nFormat: ' + options.pdfFormat.toUpperCase() + '\nOrientation: ' + options.pdfOrientation)
  }

  const generateEPSPreview = () => {
    if (!canvas) return
    
    // For EPS preview, show the canvas as PNG
    generatePNGPreview()
    setExportCode('EPS Export Ready\nLevel: PostScript Level ' + options.epsLevel + '\nColor Space: ' + options.epsColorSpace)
  }

  const generateCSSPreview = () => {
    if (!canvas) return
    
    const cssCode = generateCSSPattern()
    setExportCode(cssCode)
    
    // Create a preview using a temporary canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 300
    tempCanvas.height = 200
    const ctx = tempCanvas.getContext('2d')
    
    if (ctx) {
      // Apply the CSS pattern as a canvas pattern
      const patternCanvas = document.createElement('canvas')
      patternCanvas.width = canvas.width!
      patternCanvas.height = canvas.height!
      const patternCtx = patternCanvas.getContext('2d')
      
      if (patternCtx) {
        // Draw the fabric canvas content to pattern canvas
        const fabricCanvas = canvas.getElement()
        patternCtx.drawImage(fabricCanvas, 0, 0)
        
        // Create pattern and fill the preview
        const pattern = ctx.createPattern(patternCanvas, options.cssRepeat)
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, 300, 200)
        }
      }
    }
    
    setPreview(tempCanvas.toDataURL())
  }

  const getExportDimensions = () => {
    if (options.resolution === 'custom') {
      return { width: options.customWidth, height: options.customHeight }
    }
    
    const preset = presetResolutions[options.resolution as keyof typeof presetResolutions]
    return preset || presetResolutions.web
  }

  const generateCSSPattern = (): string => {
    if (!canvas) return ''
    
    const { width, height } = getExportDimensions()
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: options.quality,
      backgroundColor: options.includeBackground ? options.backgroundColor : 'transparent'
    })
    
    const sizeValue = options.cssUnits === '%' ? '100%' : `${width}${options.cssUnits}`
    
    switch (options.cssType) {
      case 'background':
        return `.pattern-background {
  background-image: url('${dataURL}');
  background-size: ${sizeValue};
  background-repeat: ${options.cssRepeat};
  background-position: center;
}`
      
      case 'pattern':
        return `.pattern-element {
  width: ${width}${options.cssUnits};
  height: ${height}${options.cssUnits};
  background: url('${dataURL}');
  background-size: cover;
  background-repeat: ${options.cssRepeat};
}`
      
      case 'mask':
        return `.pattern-mask {
  mask-image: url('${dataURL}');
  mask-size: ${sizeValue};
  mask-repeat: ${options.cssRepeat};
  mask-position: center;
  -webkit-mask-image: url('${dataURL}');
  -webkit-mask-size: ${sizeValue};
  -webkit-mask-repeat: ${options.cssRepeat};
  -webkit-mask-position: center;
}`
      
      default:
        return ''
    }
  }

  const handleExport = async () => {
    if (!canvas) return
    
    setIsGenerating(true)
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      
      switch (options.format) {
        case 'png':
          const pngDataURL = canvas.toDataURL({
            format: 'png',
            quality: options.quality,
            multiplier: options.resolution === 'print' ? 2 : 1,
            backgroundColor: options.includeBackground ? options.backgroundColor : 'transparent'
          })
          downloadFile(pngDataURL, `genshi-pattern-${timestamp}.png`)
          break
          
        case 'svg':
          const svgOptions: SVGExportOptions = {
            optimize: options.svgOptimize,
            embedStyles: true,
            includeLayers: options.svgIncludeLayers,
            preservePatterns: true,
            precision: options.svgPrecision,
            includeMetadata: options.includeMetadata,
            title: options.title,
            description: options.description,
            creator: options.author,
            license: 'Creative Commons BY 4.0'
          }
          const svgContent = await SVGExporter.exportFromCanvas(canvas, svgOptions)
          downloadFile(svgContent, `genshi-pattern-${timestamp}.svg`, 'image/svg+xml')
          break
          
        case 'pdf':
          const pdfOptions: PDFExportOptions = {
            format: options.pdfFormat,
            orientation: options.pdfOrientation,
            colorSpace: options.pdfColorSpace,
            compression: true,
            embedFonts: true,
            dpi: 300,
            customWidth: options.customWidth,
            customHeight: options.customHeight,
            includeMetadata: options.includeMetadata,
            title: options.title,
            subject: options.description,
            author: options.author,
            keywords: options.keywords
          }
          const pdfBlob = await PDFExporter.exportFromCanvas(canvas, pdfOptions)
          downloadFile(pdfBlob, `genshi-pattern-${timestamp}.pdf`, 'application/pdf')
          break
          
        case 'eps':
          const epsOptions: EPSExportOptions = {
            level: options.epsLevel,
            colorSpace: options.epsColorSpace,
            includePreview: false,
            resolution: 300,
            boundingBox: 'tight',
            includeMetadata: options.includeMetadata,
            title: options.title,
            creator: options.author,
            creationDate: new Date()
          }
          const epsContent = await EPSExporter.exportFromCanvas(canvas, epsOptions)
          downloadFile(epsContent, `genshi-pattern-${timestamp}.eps`, 'application/postscript')
          break
          
        case 'css':
          const cssCode = generateCSSPattern()
          const cssBlob = new Blob([cssCode], { type: 'text/css' })
          const cssURL = URL.createObjectURL(cssBlob)
          downloadFile(cssURL, `genshi-pattern-${timestamp}.css`)
          break
      }
      
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[
                    { id: 'png', icon: FileImage, label: 'PNG' },
                    { id: 'svg', icon: FileText, label: 'SVG' },
                    { id: 'pdf', icon: FileType, label: 'PDF' },
                    { id: 'eps', icon: Printer, label: 'EPS' },
                    { id: 'css', icon: Code, label: 'CSS' }
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

              {/* PNG Options */}
              {options.format === 'png' && (
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

              {/* SVG Options */}
              {options.format === 'svg' && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="svgOptimize"
                        checked={options.svgOptimize}
                        onChange={(e) => setOptions({ ...options, svgOptimize: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="svgOptimize" className="text-sm font-medium">
                        Optimize paths
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Precision: {options.svgPrecision} decimals
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={options.svgPrecision}
                      onChange={(e) => setOptions({ ...options, svgPrecision: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="svgIncludeLayers"
                        checked={options.svgIncludeLayers}
                        onChange={(e) => setOptions({ ...options, svgIncludeLayers: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="svgIncludeLayers" className="text-sm font-medium">
                        Include layer structure
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* PDF Options */}
              {options.format === 'pdf' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Page Format</label>
                    <select
                      value={options.pdfFormat}
                      onChange={(e) => setOptions({ ...options, pdfFormat: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="a4">A4</option>
                      <option value="a3">A3</option>
                      <option value="letter">Letter</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Orientation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions({ ...options, pdfOrientation: 'portrait' })}
                        className={`p-2 rounded-md border transition-colors ${
                          options.pdfOrientation === 'portrait'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, pdfOrientation: 'landscape' })}
                        className={`p-2 rounded-md border transition-colors ${
                          options.pdfOrientation === 'landscape'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Space</label>
                    <select
                      value={options.pdfColorSpace}
                      onChange={(e) => setOptions({ ...options, pdfColorSpace: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="RGB">RGB (Screen)</option>
                      <option value="CMYK">CMYK (Print)</option>
                    </select>
                  </div>
                </>
              )}

              {/* EPS Options */}
              {options.format === 'eps' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">PostScript Level</label>
                    <select
                      value={options.epsLevel}
                      onChange={(e) => setOptions({ ...options, epsLevel: parseInt(e.target.value) as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Space</label>
                    <select
                      value={options.epsColorSpace}
                      onChange={(e) => setOptions({ ...options, epsColorSpace: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="RGB">RGB</option>
                      <option value="CMYK">CMYK</option>
                      <option value="Grayscale">Grayscale</option>
                    </select>
                  </div>
                </>
              )}

              {/* Background option for all formats except CSS */}
              {options.format !== 'css' && (
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

              {/* Metadata Options for SVG, PDF, EPS */}
              {(options.format === 'svg' || options.format === 'pdf' || options.format === 'eps') && (
                <>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="includeMetadata"
                        checked={options.includeMetadata}
                        onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="includeMetadata" className="text-sm font-medium">
                        Include metadata
                      </label>
                    </div>
                    
                    {options.includeMetadata && (
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium mb-1">Title</label>
                          <input
                            type="text"
                            value={options.title}
                            onChange={(e) => setOptions({ ...options, title: e.target.value })}
                            className="w-full p-1.5 text-sm border border-border rounded-md bg-background"
                            placeholder="Pattern title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Author</label>
                          <input
                            type="text"
                            value={options.author}
                            onChange={(e) => setOptions({ ...options, author: e.target.value })}
                            className="w-full p-1.5 text-sm border border-border rounded-md bg-background"
                            placeholder="Your name or organization"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">Description</label>
                          <textarea
                            value={options.description}
                            onChange={(e) => setOptions({ ...options, description: e.target.value })}
                            className="w-full p-1.5 text-sm border border-border rounded-md bg-background h-16 resize-none"
                            placeholder="Pattern description"
                          />
                        </div>
                        
                        {options.format === 'pdf' && (
                          <div>
                            <label className="block text-xs font-medium mb-1">Keywords</label>
                            <input
                              type="text"
                              value={options.keywords.join(', ')}
                              onChange={(e) => setOptions({ ...options, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
                              className="w-full p-1.5 text-sm border border-border rounded-md bg-background"
                              placeholder="pattern, generative, art"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* CSS Options */}
              {options.format === 'css' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">CSS Type</label>
                    <select
                      value={options.cssType}
                      onChange={(e) => setOptions({ ...options, cssType: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="background">Background Pattern</option>
                      <option value="pattern">Pattern Element</option>
                      <option value="mask">CSS Mask</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Units</label>
                    <select
                      value={options.cssUnits}
                      onChange={(e) => setOptions({ ...options, cssUnits: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="px">Pixels (px)</option>
                      <option value="%">Percentage (%)</option>
                      <option value="em">Em units (em)</option>
                      <option value="rem">Rem units (rem)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Repeat</label>
                    <select
                      value={options.cssRepeat}
                      onChange={(e) => setOptions({ ...options, cssRepeat: e.target.value as any })}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="repeat">Repeat</option>
                      <option value="repeat-x">Repeat X</option>
                      <option value="repeat-y">Repeat Y</option>
                      <option value="no-repeat">No Repeat</option>
                    </select>
                  </div>
                </>
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
                    {(options.format === 'pdf' || options.format === 'eps') ? (
                      <div className="text-center space-y-4">
                        {preview && (
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-w-full max-h-48 object-contain border border-border rounded mx-auto"
                          />
                        )}
                        <div className="bg-card rounded-lg p-4 border border-border">
                          <pre className="text-xs text-muted-foreground">
                            <code>{exportCode}</code>
                          </pre>
                        </div>
                      </div>
                    ) : options.format === 'css' ? (
                      <div className="w-full h-full space-y-4">
                        <div className="bg-card rounded-lg p-4 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Generated CSS</span>
                            <button
                              onClick={() => copyToClipboard(exportCode)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                          <pre className="text-xs bg-accent/50 p-3 rounded overflow-x-auto">
                            <code>{exportCode}</code>
                          </pre>
                        </div>
                        {preview && (
                          <div className="bg-card rounded-lg p-4 border border-border">
                            <div className="text-sm font-medium mb-2">Pattern Preview</div>
                            <img 
                              src={preview} 
                              alt="Pattern preview" 
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
            {options.format === 'png' && `${getExportDimensions().width}x${getExportDimensions().height} pixels`}
            {options.format === 'svg' && 'Scalable vector format (optimized)'}
            {options.format === 'pdf' && `PDF ${options.pdfFormat.toUpperCase()} ${options.pdfOrientation}`}
            {options.format === 'eps' && `EPS Level ${options.epsLevel} - ${options.epsColorSpace}`}
            {options.format === 'css' && 'CSS pattern code'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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