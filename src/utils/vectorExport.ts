import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

// SVG optimization utilities
export interface SVGExportOptions {
  optimize: boolean;
  embedStyles: boolean;
  includeLayers: boolean;
  preservePatterns: boolean;
  precision: number;
  includeMetadata: boolean;
  title?: string;
  description?: string;
  creator?: string;
  license?: string;
}

export interface PDFExportOptions {
  format: 'a4' | 'a3' | 'letter' | 'custom';
  orientation: 'portrait' | 'landscape';
  colorSpace: 'RGB' | 'CMYK';
  compression: boolean;
  embedFonts: boolean;
  dpi: number;
  customWidth?: number;
  customHeight?: number;
  includeMetadata: boolean;
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string[];
}

export interface EPSExportOptions {
  level: 2 | 3; // PostScript level
  colorSpace: 'RGB' | 'CMYK' | 'Grayscale';
  includePreview: boolean;
  resolution: number;
  boundingBox: 'tight' | 'artboard';
  includeMetadata: boolean;
  title?: string;
  creator?: string;
  creationDate?: Date;
}

// Professional SVG Export
export class SVGExporter {
  private static optimizePath(pathData: string, precision: number): string {
    // Optimize path data by reducing precision and removing redundant commands
    const precisionFactor = Math.pow(10, precision);
    
    return pathData.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      return (Math.round(num * precisionFactor) / precisionFactor).toString();
    });
  }

  private static createSVGElement(width: number, height: number, options: SVGExportOptions): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    if (options.includeMetadata) {
      const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
      const rdf = `
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:dc="http://purl.org/dc/elements/1.1/"
                 xmlns:cc="http://creativecommons.org/ns#">
          <cc:Work rdf:about="">
            ${options.title ? `<dc:title>${options.title}</dc:title>` : ''}
            ${options.creator ? `<dc:creator><cc:Agent><dc:title>${options.creator}</dc:title></cc:Agent></dc:creator>` : ''}
            ${options.description ? `<dc:description>${options.description}</dc:description>` : ''}
            ${options.license ? `<cc:license rdf:resource="${options.license}"/>` : ''}
            <dc:date>${new Date().toISOString()}</dc:date>
            <dc:format>image/svg+xml</dc:format>
            <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
          </cc:Work>
        </rdf:RDF>
      `;
      metadata.innerHTML = rdf;
      svg.appendChild(metadata);
    }
    
    return svg;
  }

  static async exportFromCanvas(canvas: any, options: SVGExportOptions): Promise<string> {
    const defaultOptions: SVGExportOptions = {
      ...options,
      optimize: options.optimize ?? true,
      embedStyles: options.embedStyles ?? true,
      includeLayers: options.includeLayers ?? true,
      preservePatterns: options.preservePatterns ?? true,
      precision: options.precision ?? 2,
      includeMetadata: options.includeMetadata ?? true
    };

    // Get SVG from fabric canvas
    let svgString = canvas.toSVG({
      suppressPreamble: true,
      viewBox: {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      },
      encoding: 'UTF-8'
    });

    // Create proper SVG structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const fabricSvg = doc.documentElement;
    
    // Create new SVG with proper structure
    const svg = this.createSVGElement(canvas.width, canvas.height, defaultOptions);
    
    // Add defs for patterns and gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    
    // Extract and organize patterns
    if (defaultOptions.preservePatterns) {
      const patterns = fabricSvg.querySelectorAll('pattern');
      patterns.forEach(pattern => {
        defs.appendChild(pattern.cloneNode(true));
      });
    }
    
    // Create main group for layers
    if (defaultOptions.includeLayers) {
      const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      mainGroup.setAttribute('id', 'main-layer');
      
      // Copy all elements from fabric SVG
      Array.from(fabricSvg.children).forEach(child => {
        if (child.tagName !== 'defs' && child.tagName !== 'metadata') {
          mainGroup.appendChild(child.cloneNode(true));
        }
      });
      
      svg.appendChild(mainGroup);
    } else {
      // Copy elements directly
      Array.from(fabricSvg.children).forEach(child => {
        if (child.tagName !== 'defs' && child.tagName !== 'metadata') {
          svg.appendChild(child.cloneNode(true));
        }
      });
    }
    
    // Optimize if requested
    if (defaultOptions.optimize) {
      // Optimize paths
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => {
        const d = path.getAttribute('d');
        if (d) {
          path.setAttribute('d', this.optimizePath(d, defaultOptions.precision));
        }
      });
      
      // Remove unnecessary attributes
      const allElements = svg.querySelectorAll('*');
      allElements.forEach(element => {
        // Remove default values
        if (element.getAttribute('opacity') === '1') {
          element.removeAttribute('opacity');
        }
        if (element.getAttribute('fill-opacity') === '1') {
          element.removeAttribute('fill-opacity');
        }
        if (element.getAttribute('stroke-opacity') === '1') {
          element.removeAttribute('stroke-opacity');
        }
      });
    }
    
    // Embed styles if requested
    if (defaultOptions.embedStyles) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `
        .pattern-fill { fill: currentColor; }
        .pattern-stroke { stroke: currentColor; fill: none; }
        .genshi-pattern { transform-origin: center; }
      `;
      defs.appendChild(style);
    }
    
    return new XMLSerializer().serializeToString(svg);
  }
}

// Professional PDF Export
export class PDFExporter {
  private static getPDFDimensions(format: string, orientation: string, customWidth?: number, customHeight?: number) {
    const formats = {
      'a4': { width: 210, height: 297 },
      'a3': { width: 297, height: 420 },
      'letter': { width: 215.9, height: 279.4 }
    };
    
    if (format === 'custom' && customWidth && customHeight) {
      return { width: customWidth, height: customHeight };
    }
    
    const dims = formats[format as keyof typeof formats] || formats.a4;
    return orientation === 'landscape' 
      ? { width: dims.height, height: dims.width }
      : dims;
  }

  static async exportFromCanvas(canvas: any, options: PDFExportOptions): Promise<Blob> {
    const defaultOptions: PDFExportOptions = {
      ...options,
      format: options.format ?? 'a4',
      orientation: options.orientation ?? 'portrait',
      colorSpace: options.colorSpace ?? 'RGB',
      compression: options.compression ?? true,
      embedFonts: options.embedFonts ?? true,
      dpi: options.dpi ?? 300,
      includeMetadata: options.includeMetadata ?? true
    };

    const { width, height } = this.getPDFDimensions(
      defaultOptions.format,
      defaultOptions.orientation,
      defaultOptions.customWidth,
      defaultOptions.customHeight
    );

    // Create PDF document
    const pdf = new jsPDF({
      orientation: defaultOptions.orientation,
      unit: 'mm',
      format: defaultOptions.format === 'custom' ? [width, height] : defaultOptions.format,
      compress: defaultOptions.compression
    });

    // Set metadata
    if (defaultOptions.includeMetadata) {
      pdf.setProperties({
        title: defaultOptions.title || 'Genshi Studio Pattern',
        subject: defaultOptions.subject || 'Generative Pattern Design',
        author: defaultOptions.author || 'Genshi Studio',
        keywords: defaultOptions.keywords?.join(', ') || 'pattern,generative,design,art',
        creator: 'Genshi Studio Professional Export'
      });
    }

    // Get SVG from canvas
    const svgString = await SVGExporter.exportFromCanvas(canvas, {
      optimize: true,
      embedStyles: true,
      includeLayers: false,
      preservePatterns: true,
      precision: 3,
      includeMetadata: false
    });

    // Convert SVG to PDF
    const svgElement = new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement;
    
    // Calculate scaling to fit page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const scale = Math.min(
      (pageWidth - 20) / canvasWidth * 2.83465, // Convert mm to px (assuming 72 DPI)
      (pageHeight - 20) / canvasHeight * 2.83465
    );

    // Center on page
    const xOffset = (pageWidth - (canvasWidth * scale / 2.83465)) / 2;
    const yOffset = (pageHeight - (canvasHeight * scale / 2.83465)) / 2;

    // Add SVG to PDF using svg2pdf
    await pdf.svg(svgElement, {
      x: xOffset,
      y: yOffset,
      width: canvasWidth * scale / 2.83465,
      height: canvasHeight * scale / 2.83465
    });

    // Add color profile information if CMYK
    if (defaultOptions.colorSpace === 'CMYK') {
      // Note: Full CMYK conversion would require additional libraries
      // This is a placeholder for CMYK metadata
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text('Color Space: CMYK', 10, pageHeight - 10);
    }

    return pdf.output('blob');
  }
}

// Professional EPS Export
export class EPSExporter {
  private static createEPSHeader(options: EPSExportOptions, boundingBox: [number, number, number, number]): string {
    const now = new Date();
    const dateStr = now.toUTCString();
    
    return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: ${boundingBox.join(' ')}
%%HiResBoundingBox: ${boundingBox.map(n => n.toFixed(4)).join(' ')}
%%Creator: Genshi Studio Professional Export
%%Title: ${options.title || 'Genshi Pattern'}
%%CreationDate: ${dateStr}
%%DocumentData: Clean7Bit
%%LanguageLevel: ${options.level}
%%Pages: 1
%%EndComments
%%BeginProlog
/genshi_dict 100 dict def
genshi_dict begin
/s { stroke } bind def
/f { fill } bind def
/m { moveto } bind def
/l { lineto } bind def
/c { curveto } bind def
/cp { closepath } bind def
/gs { gsave } bind def
/gr { grestore } bind def
/np { newpath } bind def
/sc { setrgbcolor } bind def
/sw { setlinewidth } bind def
/sj { setlinejoin } bind def
/scap { setlinecap } bind def
end
%%EndProlog
%%Page: 1 1
genshi_dict begin
`;
  }

  private static createEPSFooter(): string {
    return `
end
showpage
%%Trailer
%%EOF`;
  }

  private static convertSVGPathToPS(pathData: string): string {
    // Convert SVG path commands to PostScript
    const commands: string[] = [];
    const pathRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
    let match;
    
    while ((match = pathRegex.exec(pathData)) !== null) {
      const cmd = match[1];
      const params = match[2].trim().split(/[\s,]+/).map(parseFloat);
      
      switch (cmd) {
        case 'M':
          commands.push(`${params[0]} ${params[1]} m`);
          break;
        case 'L':
          commands.push(`${params[0]} ${params[1]} l`);
          break;
        case 'C':
          commands.push(`${params[0]} ${params[1]} ${params[2]} ${params[3]} ${params[4]} ${params[5]} c`);
          break;
        case 'Z':
        case 'z':
          commands.push('cp');
          break;
        // Add more path commands as needed
      }
    }
    
    return commands.join(' ');
  }

  static async exportFromCanvas(canvas: any, options: EPSExportOptions): Promise<string> {
    const defaultOptions: EPSExportOptions = {
      ...options,
      level: options.level ?? 3,
      colorSpace: options.colorSpace ?? 'RGB',
      includePreview: options.includePreview ?? false,
      resolution: options.resolution ?? 300,
      boundingBox: options.boundingBox ?? 'tight',
      includeMetadata: options.includeMetadata ?? true
    };

    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    const boundingBox: [number, number, number, number] = [0, 0, width, height];

    // Start building EPS content
    let epsContent = this.createEPSHeader(defaultOptions, boundingBox);

    // Setup coordinate system (flip Y axis for PostScript)
    epsContent += `
0 ${height} translate
1 -1 scale
`;

    // Get canvas objects
    const objects = canvas.getObjects();
    
    for (const obj of objects) {
      epsContent += '\ngs\n';
      
      // Set color
      if (obj.fill && obj.fill !== 'transparent') {
        const color = this.parseColor(obj.fill);
        if (defaultOptions.colorSpace === 'RGB') {
          epsContent += `${color.r} ${color.g} ${color.b} sc\n`;
        } else if (defaultOptions.colorSpace === 'CMYK') {
          const cmyk = this.rgbToCmyk(color.r, color.g, color.b);
          epsContent += `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k} setcmykcolor\n`;
        } else if (defaultOptions.colorSpace === 'Grayscale') {
          const gray = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
          epsContent += `${gray} setgray\n`;
        }
      }
      
      // Set stroke
      if (obj.stroke && obj.stroke !== 'transparent') {
        epsContent += `${obj.strokeWidth || 1} sw\n`;
      }
      
      // Draw object based on type
      if (obj.type === 'rect') {
        epsContent += `np ${obj.left} ${obj.top} m\n`;
        epsContent += `${obj.left + obj.width} ${obj.top} l\n`;
        epsContent += `${obj.left + obj.width} ${obj.top + obj.height} l\n`;
        epsContent += `${obj.left} ${obj.top + obj.height} l\n`;
        epsContent += `cp\n`;
        if (obj.fill) epsContent += 'f\n';
        if (obj.stroke) epsContent += 's\n';
      } else if (obj.type === 'circle') {
        const centerX = obj.left + obj.radius;
        const centerY = obj.top + obj.radius;
        epsContent += `np ${centerX} ${centerY} ${obj.radius} 0 360 arc\n`;
        if (obj.fill) epsContent += 'f\n';
        if (obj.stroke) epsContent += 's\n';
      } else if (obj.type === 'path') {
        epsContent += 'np\n';
        epsContent += this.convertSVGPathToPS(obj.path);
        if (obj.fill) epsContent += ' f\n';
        if (obj.stroke) epsContent += ' s\n';
      }
      
      epsContent += 'gr\n';
    }

    epsContent += this.createEPSFooter();

    return epsContent;
  }

  private static parseColor(color: string): { r: number, g: number, b: number } {
    // Simple color parsing - extend as needed
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      return {
        r: parseInt(hex.substr(0, 2), 16) / 255,
        g: parseInt(hex.substr(2, 2), 16) / 255,
        b: parseInt(hex.substr(4, 2), 16) / 255
      };
    }
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }

  private static rgbToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    
    return { c, m, y, k };
  }
}

// Utility function to download files
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}