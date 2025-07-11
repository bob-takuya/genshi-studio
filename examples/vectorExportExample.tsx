import React, { useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  SVGExporter, 
  PDFExporter, 
  EPSExporter,
  downloadFile 
} from '../src/utils/vectorExport';
import { 
  vectorExportComm, 
  validateSVGExport, 
  validatePDFExport, 
  validateEPSExport 
} from '../src/integration/vectorExportIntegration';

// Example: Creating a complex pattern and exporting it
export function VectorExportExample() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [exportStatus, setExportStatus] = useState('');

  // Initialize canvas with a mathematical pattern
  const initializeCanvas = () => {
    const canvas = new fabric.Canvas('patternCanvas', {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });

    // Create a geometric pattern
    createGeometricPattern(canvas);
    
    canvasRef.current = canvas;
  };

  const createGeometricPattern = (canvas: fabric.Canvas) => {
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    const numCircles = 12;
    const baseRadius = 150;

    // Create radial pattern
    for (let i = 0; i < numCircles; i++) {
      const angle = (i / numCircles) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * baseRadius;
      const y = centerY + Math.sin(angle) * baseRadius;

      // Create gradient circles
      const gradient = new fabric.Gradient({
        type: 'radial',
        coords: {
          x1: 0,
          y1: 0,
          r1: 0,
          x2: 0,
          y2: 0,
          r2: 50
        },
        colorStops: [
          { offset: 0, color: `hsl(${(i * 30) % 360}, 70%, 50%)` },
          { offset: 1, color: `hsl(${(i * 30 + 180) % 360}, 70%, 30%)` }
        ]
      });

      const circle = new fabric.Circle({
        left: x - 50,
        top: y - 50,
        radius: 50,
        fill: gradient,
        stroke: '#000000',
        strokeWidth: 1,
        opacity: 0.8
      });

      canvas.add(circle);
    }

    // Add connecting lines
    const objects = canvas.getObjects();
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];
        
        const line = new fabric.Line([
          obj1.left! + obj1.width! / 2,
          obj1.top! + obj1.height! / 2,
          obj2.left! + obj2.width! / 2,
          obj2.top! + obj2.height! / 2
        ], {
          stroke: 'rgba(0, 0, 0, 0.1)',
          strokeWidth: 1,
          selectable: false
        });
        
        canvas.add(line);
        canvas.sendToBack(line);
      }
    }

    canvas.renderAll();
  };

  // Export as optimized SVG
  const exportAsSVG = async () => {
    if (!canvasRef.current) return;

    setExportStatus('Exporting SVG...');
    await vectorExportComm.updateProgress('svg_export', 0, 'Starting SVG export');

    try {
      const svgContent = await SVGExporter.exportFromCanvas(canvasRef.current, {
        optimize: true,
        embedStyles: true,
        includeLayers: true,
        preservePatterns: true,
        precision: 2,
        includeMetadata: true,
        title: 'Geometric Radial Pattern',
        description: 'A mathematical pattern with radial symmetry',
        creator: 'Genshi Studio Professional',
        license: 'https://creativecommons.org/licenses/by/4.0/'
      });

      await vectorExportComm.updateProgress('svg_export', 50, 'SVG generated, validating...');
      
      const isValid = await validateSVGExport(svgContent);
      if (isValid) {
        downloadFile(svgContent, 'geometric-pattern.svg', 'image/svg+xml');
        setExportStatus('SVG exported successfully!');
        await vectorExportComm.updateProgress('svg_export', 100, 'SVG export completed');
      } else {
        setExportStatus('SVG validation failed');
      }
    } catch (error) {
      console.error('SVG export error:', error);
      setExportStatus('SVG export failed');
    }
  };

  // Export as print-ready PDF
  const exportAsPDF = async () => {
    if (!canvasRef.current) return;

    setExportStatus('Exporting PDF...');
    await vectorExportComm.updateProgress('pdf_export', 0, 'Starting PDF export');

    try {
      const pdfBlob = await PDFExporter.exportFromCanvas(canvasRef.current, {
        format: 'a4',
        orientation: 'landscape',
        colorSpace: 'CMYK',
        compression: true,
        embedFonts: true,
        dpi: 300,
        includeMetadata: true,
        title: 'Geometric Radial Pattern - Print Ready',
        subject: 'Mathematical art pattern for professional printing',
        author: 'Genshi Studio User',
        keywords: ['pattern', 'geometric', 'radial', 'mathematical', 'art']
      });

      await vectorExportComm.updateProgress('pdf_export', 50, 'PDF generated, validating...');

      const isValid = await validatePDFExport(pdfBlob);
      if (isValid) {
        downloadFile(pdfBlob, 'geometric-pattern-print.pdf', 'application/pdf');
        setExportStatus('PDF exported successfully!');
        await vectorExportComm.updateProgress('pdf_export', 100, 'PDF export completed');
      } else {
        setExportStatus('PDF validation failed');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus('PDF export failed');
    }
  };

  // Export as EPS for professional printing
  const exportAsEPS = async () => {
    if (!canvasRef.current) return;

    setExportStatus('Exporting EPS...');
    await vectorExportComm.updateProgress('eps_export', 0, 'Starting EPS export');

    try {
      const epsContent = await EPSExporter.exportFromCanvas(canvasRef.current, {
        level: 3,
        colorSpace: 'CMYK',
        includePreview: false,
        resolution: 300,
        boundingBox: 'tight',
        includeMetadata: true,
        title: 'Geometric Pattern - EPS',
        creator: 'Genshi Studio Professional Export',
        creationDate: new Date()
      });

      await vectorExportComm.updateProgress('eps_export', 50, 'EPS generated, validating...');

      const isValid = await validateEPSExport(epsContent);
      if (isValid) {
        downloadFile(epsContent, 'geometric-pattern.eps', 'application/postscript');
        setExportStatus('EPS exported successfully!');
        await vectorExportComm.updateProgress('eps_export', 100, 'EPS export completed');
      } else {
        setExportStatus('EPS validation failed');
      }
    } catch (error) {
      console.error('EPS export error:', error);
      setExportStatus('EPS export failed');
    }
  };

  // Batch export all formats
  const batchExport = async () => {
    setExportStatus('Starting batch export...');
    
    await exportAsSVG();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await exportAsPDF();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await exportAsEPS();
    
    setExportStatus('Batch export completed!');
    
    // Notify completion
    await vectorExportComm.sendMessage({
      sender_id: 'DEVELOPER_004',
      recipient_id: null,
      message_type: 'STATUS_UPDATE',
      content: {
        status: 'Batch export completed',
        formats_exported: ['SVG', 'PDF', 'EPS'],
        pattern_type: 'geometric_radial'
      },
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vector Export Example</h1>
      
      <div className="mb-4">
        <button 
          onClick={initializeCanvas}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Initialize Pattern
        </button>
      </div>

      <canvas id="patternCanvas" className="border border-gray-300 mb-4" />

      <div className="flex gap-2 mb-4">
        <button 
          onClick={exportAsSVG}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Export SVG
        </button>
        <button 
          onClick={exportAsPDF}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Export PDF
        </button>
        <button 
          onClick={exportAsEPS}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Export EPS
        </button>
        <button 
          onClick={batchExport}
          className="px-4 py-2 bg-indigo-500 text-white rounded"
        >
          Batch Export All
        </button>
      </div>

      {exportStatus && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm">{exportStatus}</p>
        </div>
      )}

      <div className="mt-8 prose">
        <h2>Export Features Demonstrated:</h2>
        <ul>
          <li>SVG with path optimization and metadata</li>
          <li>PDF with CMYK color space for printing</li>
          <li>EPS with PostScript Level 3</li>
          <li>Communication hub integration</li>
          <li>Export validation</li>
          <li>Batch export capability</li>
        </ul>
      </div>
    </div>
  );
}