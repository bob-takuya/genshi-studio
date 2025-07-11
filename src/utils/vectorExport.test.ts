import { SVGExporter, PDFExporter, EPSExporter } from './vectorExport';

// Mock Fabric.js canvas for testing
const createMockCanvas = () => {
  return {
    width: 800,
    height: 600,
    getObjects: () => [
      {
        type: 'rect',
        left: 100,
        top: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2
      },
      {
        type: 'circle',
        left: 400,
        top: 200,
        radius: 50,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1
      },
      {
        type: 'path',
        path: 'M100,200 L200,100 L300,200 Z',
        fill: '#0000ff',
        stroke: null
      }
    ],
    toSVG: (options: any) => {
      return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect x="100" y="100" width="200" height="150" fill="#ff0000" stroke="#000000" stroke-width="2"/>
        <circle cx="450" cy="250" r="50" fill="#00ff00" stroke="#000000" stroke-width="1"/>
        <path d="M100,200 L200,100 L300,200 Z" fill="#0000ff"/>
      </svg>`;
    },
    getElement: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw mock pattern
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 800, 600);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(100, 100, 200, 150);
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(450, 250, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      return canvas;
    },
    toDataURL: (options: any) => {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };
};

describe('Vector Export Utilities', () => {
  describe('SVGExporter', () => {
    test('exports SVG with metadata', async () => {
      const canvas = createMockCanvas();
      const options = {
        optimize: true,
        embedStyles: true,
        includeLayers: true,
        preservePatterns: true,
        precision: 2,
        includeMetadata: true,
        title: 'Test Pattern',
        creator: 'Test User',
        description: 'A test pattern for export'
      };
      
      const result = await SVGExporter.exportFromCanvas(canvas, options);
      
      expect(result).toContain('<svg');
      expect(result).toContain('width="800"');
      expect(result).toContain('height="600"');
      expect(result).toContain('<metadata>');
      expect(result).toContain('<dc:title>Test Pattern</dc:title>');
      expect(result).toContain('<dc:creator>');
      expect(result).toContain('Test User');
    });
    
    test('optimizes SVG paths when enabled', async () => {
      const canvas = createMockCanvas();
      const options = {
        optimize: true,
        precision: 1,
        embedStyles: false,
        includeLayers: false,
        preservePatterns: false,
        includeMetadata: false
      };
      
      const result = await SVGExporter.exportFromCanvas(canvas, options);
      
      // Check that decimal precision is reduced
      expect(result).not.toMatch(/\d+\.\d{3,}/); // No more than 2 decimal places
    });
  });
  
  describe('PDFExporter', () => {
    test('creates PDF blob with correct format', async () => {
      const canvas = createMockCanvas();
      const options = {
        format: 'a4' as const,
        orientation: 'portrait' as const,
        colorSpace: 'RGB' as const,
        compression: true,
        embedFonts: true,
        dpi: 300,
        includeMetadata: true,
        title: 'Test PDF Pattern',
        author: 'Test Author'
      };
      
      const result = await PDFExporter.exportFromCanvas(canvas, options);
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
    
    test('handles custom dimensions', async () => {
      const canvas = createMockCanvas();
      const options = {
        format: 'custom' as const,
        orientation: 'portrait' as const,
        customWidth: 250,
        customHeight: 350,
        colorSpace: 'RGB' as const,
        compression: true,
        embedFonts: true,
        dpi: 300,
        includeMetadata: false
      };
      
      const result = await PDFExporter.exportFromCanvas(canvas, options);
      expect(result).toBeInstanceOf(Blob);
    });
  });
  
  describe('EPSExporter', () => {
    test('exports EPS with PostScript Level 3', async () => {
      const canvas = createMockCanvas();
      const options = {
        level: 3 as const,
        colorSpace: 'RGB' as const,
        includePreview: false,
        resolution: 300,
        boundingBox: 'tight' as const,
        includeMetadata: true,
        title: 'Test EPS Pattern',
        creator: 'Test Creator'
      };
      
      const result = await EPSExporter.exportFromCanvas(canvas, options);
      
      expect(result).toContain('%!PS-Adobe-3.0 EPSF-3.0');
      expect(result).toContain('%%BoundingBox:');
      expect(result).toContain('%%Title: Test EPS Pattern');
      expect(result).toContain('%%Creator: Test Creator');
      expect(result).toContain('%%LanguageLevel: 3');
    });
    
    test('converts to CMYK color space', async () => {
      const canvas = createMockCanvas();
      const options = {
        level: 3 as const,
        colorSpace: 'CMYK' as const,
        includePreview: false,
        resolution: 300,
        boundingBox: 'tight' as const,
        includeMetadata: false
      };
      
      const result = await EPSExporter.exportFromCanvas(canvas, options);
      
      expect(result).toContain('setcmykcolor');
      expect(result).not.toContain('setrgbcolor');
    });
    
    test('handles grayscale color space', async () => {
      const canvas = createMockCanvas();
      const options = {
        level: 2 as const,
        colorSpace: 'Grayscale' as const,
        includePreview: false,
        resolution: 300,
        boundingBox: 'tight' as const,
        includeMetadata: false
      };
      
      const result = await EPSExporter.exportFromCanvas(canvas, options);
      
      expect(result).toContain('setgray');
      expect(result).toContain('%%LanguageLevel: 2');
    });
  });
});