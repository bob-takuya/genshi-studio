/**
 * VectorExportService - Professional vector export capabilities for Genshi Studio
 * Handles SVG, PDF, and EPS export with pattern support and print quality
 */

import { Canvas, FabricObject, Rect, Circle, Path, SVGOptions } from 'fabric'
import jsPDF from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'

export interface ExportOptions {
  format?: 'svg' | 'pdf' | 'eps'
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
  includeBackground?: boolean
  colorSpace?: 'RGB' | 'CMYK'
  dpi?: number
  embedFonts?: boolean
  preservePatterns?: boolean
  pageSize?: 'A4' | 'Letter' | 'Custom'
  orientation?: 'portrait' | 'landscape'
  bleedMarks?: boolean
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
  }
}

export interface BatchExportOptions extends ExportOptions {
  formats: ('svg' | 'pdf' | 'eps')[]
  fileNamePattern?: string
  outputDirectory?: string
}

export class VectorExportService {
  private canvas: Canvas
  
  constructor(canvas: Canvas) {
    this.canvas = canvas
  }

  /**
   * Export canvas to SVG with enhanced pattern and gradient support
   */
  async exportToSVG(options: ExportOptions = {}): Promise<string> {
    const {
      width = this.canvas.width!,
      height = this.canvas.height!,
      backgroundColor,
      includeBackground = true,
      preservePatterns = true
    } = options

    // Create SVG with enhanced options
    const svgOptions: SVGOptions = {
      suppressPreamble: false,
      viewBox: {
        x: 0,
        y: 0,
        width,
        height
      },
      encoding: 'UTF-8'
    }

    // Generate base SVG
    let svgString = this.canvas.toSVG(svgOptions)

    // Enhance SVG with patterns and gradients
    if (preservePatterns) {
      svgString = this.enhanceSVGPatterns(svgString)
    }

    // Add background if needed
    if (includeBackground && backgroundColor) {
      svgString = this.addSVGBackground(svgString, backgroundColor, width, height)
    }

    // Optimize SVG
    svgString = this.optimizeSVG(svgString)

    return svgString
  }

  /**
   * Export canvas to PDF with professional print support
   */
  async exportToPDF(options: ExportOptions = {}): Promise<Blob> {
    const {
      pageSize = 'A4',
      orientation = 'portrait',
      dpi = 300,
      bleedMarks = false,
      metadata = {},
      backgroundColor,
      includeBackground = true
    } = options

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize.toLowerCase() as any,
      compress: true
    })

    // Set metadata
    if (metadata.title) pdf.setDocumentProperties({ title: metadata.title })
    if (metadata.author) pdf.setDocumentProperties({ author: metadata.author })
    if (metadata.subject) pdf.setDocumentProperties({ subject: metadata.subject })
    if (metadata.keywords) pdf.setDocumentProperties({ keywords: metadata.keywords.join(', ') })
    if (metadata.creator) pdf.setDocumentProperties({ creator: metadata.creator })

    // Get canvas dimensions
    const canvasWidth = this.canvas.width!
    const canvasHeight = this.canvas.height!

    // Calculate PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Calculate scale to fit
    const scale = Math.min(pageWidth / canvasWidth, pageHeight / canvasHeight) * (dpi / 72)

    // Center the content
    const xOffset = (pageWidth - (canvasWidth * scale / (dpi / 72))) / 2
    const yOffset = (pageHeight - (canvasHeight * scale / (dpi / 72))) / 2

    // Add background if needed
    if (includeBackground && backgroundColor) {
      pdf.setFillColor(backgroundColor)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    }

    // Convert canvas to SVG first for better quality
    const svgString = await this.exportToSVG({ ...options, includeBackground: false })
    
    // Create temporary element for svg2pdf
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = svgString
    const svgElement = tempDiv.querySelector('svg') as SVGElement

    // Convert SVG to PDF
    await svg2pdf(svgElement, pdf, {
      x: xOffset,
      y: yOffset,
      width: canvasWidth * scale / (dpi / 72),
      height: canvasHeight * scale / (dpi / 72),
      loadExternalStyleSheets: true
    })

    // Add bleed marks if requested
    if (bleedMarks) {
      this.addBleedMarks(pdf, pageWidth, pageHeight)
    }

    // Generate blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  }

  /**
   * Export canvas to EPS for Adobe Illustrator compatibility
   */
  async exportToEPS(options: ExportOptions = {}): Promise<string> {
    const {
      width = this.canvas.width!,
      height = this.canvas.height!,
      colorSpace = 'CMYK',
      backgroundColor,
      includeBackground = true
    } = options

    // EPS header
    let epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Genshi Studio Vector Export
%%Title: Pattern Export
%%CreationDate: ${new Date().toISOString()}
%%BoundingBox: 0 0 ${width} ${height}
%%HiResBoundingBox: 0 0 ${width} ${height}
%%DocumentData: Clean7Bit
%%LanguageLevel: 3
%%Pages: 1
%%EndComments
%%BeginProlog
`

    // Define color space
    if (colorSpace === 'CMYK') {
      epsContent += `/setcmykcolor { /DeviceCMYK setcolorspace 4 array astore setcolor } def\n`
    } else {
      epsContent += `/setrgbcolor { /DeviceRGB setcolorspace 3 array astore setcolor } def\n`
    }

    // Add pattern definitions
    epsContent += this.generateEPSPatternDefinitions()

    epsContent += `%%EndProlog
%%Page: 1 1
gsave
`

    // Add background if needed
    if (includeBackground && backgroundColor) {
      const bgColor = this.hexToColorValues(backgroundColor, colorSpace)
      epsContent += `${bgColor} ${colorSpace === 'CMYK' ? 'setcmykcolor' : 'setrgbcolor'}
0 0 ${width} ${height} rectfill
`
    }

    // Convert fabric objects to PostScript
    const objects = this.canvas.getObjects()
    for (const obj of objects) {
      epsContent += this.fabricObjectToEPS(obj, colorSpace)
    }

    epsContent += `grestore
%%Trailer
%%EOF`

    return epsContent
  }

  /**
   * Batch export to multiple formats
   */
  async batchExport(options: BatchExportOptions): Promise<Map<string, Blob | string>> {
    const results = new Map<string, Blob | string>()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFileName = options.fileNamePattern || `genshi-pattern-${timestamp}`

    for (const format of options.formats) {
      try {
        let result: Blob | string
        
        switch (format) {
          case 'svg':
            result = await this.exportToSVG(options)
            break
          case 'pdf':
            result = await this.exportToPDF(options)
            break
          case 'eps':
            result = await this.exportToEPS(options)
            break
          default:
            continue
        }

        results.set(`${baseFileName}.${format}`, result)
      } catch (error) {
        console.error(`Error exporting to ${format}:`, error)
      }
    }

    return results
  }

  /**
   * Enhance SVG with better pattern support
   */
  private enhanceSVGPatterns(svgString: string): string {
    // Parse SVG
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svg = doc.documentElement

    // Find and enhance patterns
    const patterns = svg.querySelectorAll('pattern')
    patterns.forEach(pattern => {
      // Ensure pattern units are correct
      if (!pattern.hasAttribute('patternUnits')) {
        pattern.setAttribute('patternUnits', 'userSpaceOnUse')
      }
      
      // Add pattern transform if needed
      const transform = pattern.getAttribute('patternTransform')
      if (!transform) {
        pattern.setAttribute('patternTransform', 'scale(1)')
      }
    })

    // Find and enhance gradients
    const gradients = svg.querySelectorAll('linearGradient, radialGradient')
    gradients.forEach(gradient => {
      // Ensure gradient units
      if (!gradient.hasAttribute('gradientUnits')) {
        gradient.setAttribute('gradientUnits', 'objectBoundingBox')
      }
    })

    // Serialize back to string
    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc)
  }

  /**
   * Add background to SVG
   */
  private addSVGBackground(svgString: string, backgroundColor: string, width: number, height: number): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svg = doc.documentElement

    // Create background rect
    const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bgRect.setAttribute('x', '0')
    bgRect.setAttribute('y', '0')
    bgRect.setAttribute('width', width.toString())
    bgRect.setAttribute('height', height.toString())
    bgRect.setAttribute('fill', backgroundColor)

    // Insert as first child
    if (svg.firstChild) {
      svg.insertBefore(bgRect, svg.firstChild)
    } else {
      svg.appendChild(bgRect)
    }

    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc)
  }

  /**
   * Optimize SVG for smaller file size
   */
  private optimizeSVG(svgString: string): string {
    // Remove unnecessary whitespace
    svgString = svgString.replace(/>\s+</g, '><')
    
    // Round numeric values to reduce precision
    svgString = svgString.replace(/(\d+\.\d{4,})/g, (match) => {
      return parseFloat(match).toFixed(3)
    })

    // Remove empty groups
    svgString = svgString.replace(/<g[^>]*>\s*<\/g>/g, '')

    return svgString
  }

  /**
   * Handle font embedding for PDF
   */
  private handleFontCallback(family: string, bold: boolean, italic: boolean): string {
    // Map common fonts to PDF standard fonts
    const fontMap: Record<string, string> = {
      'Arial': 'helvetica',
      'Times New Roman': 'times',
      'Courier': 'courier',
      'Georgia': 'times',
      'Verdana': 'helvetica'
    }

    const baseFont = fontMap[family] || 'helvetica'
    
    if (bold && italic) return `${baseFont}-bolditalic`
    if (bold) return `${baseFont}-bold`
    if (italic) return `${baseFont}-italic`
    return baseFont
  }

  /**
   * Add bleed marks to PDF
   */
  private addBleedMarks(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const markLength = 10 // 10mm mark length
    const markOffset = 5 // 5mm from edge

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.1)

    // Top-left marks
    pdf.line(0, markOffset, markLength, markOffset)
    pdf.line(markOffset, 0, markOffset, markLength)

    // Top-right marks
    pdf.line(pageWidth - markLength, markOffset, pageWidth, markOffset)
    pdf.line(pageWidth - markOffset, 0, pageWidth - markOffset, markLength)

    // Bottom-left marks
    pdf.line(0, pageHeight - markOffset, markLength, pageHeight - markOffset)
    pdf.line(markOffset, pageHeight - markLength, markOffset, pageHeight)

    // Bottom-right marks
    pdf.line(pageWidth - markLength, pageHeight - markOffset, pageWidth, pageHeight - markOffset)
    pdf.line(pageWidth - markOffset, pageHeight - markLength, pageWidth - markOffset, pageHeight)
  }

  /**
   * Generate EPS pattern definitions
   */
  private generateEPSPatternDefinitions(): string {
    return `
% Pattern definitions
/PatternType 1 def
/PaintType 1 def
/TilingType 1 def
/BBox [0 0 100 100] def
/XStep 100 def
/YStep 100 def
/PaintProc {
  pop
  % Pattern drawing commands here
} def
`
  }

  /**
   * Convert Fabric object to EPS commands
   */
  private fabricObjectToEPS(obj: FabricObject, colorSpace: 'RGB' | 'CMYK'): string {
    let epsCommands = ''
    
    // Save graphics state
    epsCommands += 'gsave\n'

    // Apply transformations
    const matrix = obj.calcTransformMatrix()
    epsCommands += `[${matrix[0]} ${matrix[1]} ${matrix[2]} ${matrix[3]} ${matrix[4]} ${matrix[5]}] concat\n`

    // Set color
    if (obj.fill && typeof obj.fill === 'string') {
      const color = this.hexToColorValues(obj.fill, colorSpace)
      epsCommands += `${color} ${colorSpace === 'CMYK' ? 'setcmykcolor' : 'setrgbcolor'}\n`
    }

    // Draw object based on type
    if (obj.type === 'rect') {
      const rect = obj as Rect
      epsCommands += `0 0 ${rect.width} ${rect.height} rectfill\n`
    } else if (obj.type === 'circle') {
      const circle = obj as Circle
      epsCommands += `${circle.radius} ${circle.radius} ${circle.radius} 0 360 arc fill\n`
    } else if (obj.type === 'path') {
      const path = obj as Path
      epsCommands += this.pathToEPS(path.path!)
    }

    // Restore graphics state
    epsCommands += 'grestore\n'

    return epsCommands
  }

  /**
   * Convert path data to EPS commands
   */
  private pathToEPS(pathData: any[]): string {
    let eps = 'newpath\n'
    
    for (const cmd of pathData) {
      switch (cmd[0]) {
        case 'M':
          eps += `${cmd[1]} ${cmd[2]} moveto\n`
          break
        case 'L':
          eps += `${cmd[1]} ${cmd[2]} lineto\n`
          break
        case 'C':
          eps += `${cmd[1]} ${cmd[2]} ${cmd[3]} ${cmd[4]} ${cmd[5]} ${cmd[6]} curveto\n`
          break
        case 'Z':
          eps += 'closepath\n'
          break
      }
    }
    
    eps += 'fill\n'
    return eps
  }

  /**
   * Convert hex color to RGB or CMYK values
   */
  private hexToColorValues(hex: string, colorSpace: 'RGB' | 'CMYK'): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    if (colorSpace === 'RGB') {
      return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
    } else {
      // Convert RGB to CMYK
      const k = 1 - Math.max(r, g, b)
      const c = (1 - r - k) / (1 - k) || 0
      const m = (1 - g - k) / (1 - k) || 0
      const y = (1 - b - k) / (1 - k) || 0
      
      return `${c.toFixed(3)} ${m.toFixed(3)} ${y.toFixed(3)} ${k.toFixed(3)}`
    }
  }

  /**
   * Validate export quality
   */
  async validateExportQuality(format: 'svg' | 'pdf' | 'eps', options: ExportOptions = {}): Promise<{
    valid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check canvas size
    const width = this.canvas.width!
    const height = this.canvas.height!
    
    if (width > 10000 || height > 10000) {
      issues.push('Canvas size exceeds recommended maximum (10000x10000)')
      recommendations.push('Consider reducing canvas size for better compatibility')
    }

    // Check object count
    const objectCount = this.canvas.getObjects().length
    if (objectCount > 1000) {
      issues.push(`High object count (${objectCount}) may impact export performance`)
      recommendations.push('Consider simplifying the pattern or using groups')
    }

    // Format-specific checks
    if (format === 'pdf' && options.dpi && options.dpi < 300) {
      recommendations.push('For print quality, use 300 DPI or higher')
    }

    if (format === 'eps' && options.colorSpace === 'RGB') {
      recommendations.push('Consider using CMYK color space for professional printing')
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    }
  }
}

export default VectorExportService