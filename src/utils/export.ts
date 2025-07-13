/**
 * Simple Export Utilities for Genshi Studio
 * Focused on PNG export functionality for UnifiedCanvas
 */

import { UnifiedCanvas } from '../graphics/canvas/UnifiedCanvas';

export interface ExportOptions {
  format: 'png' | 'svg' | 'json';
  quality: number;
  resolution: 'web' | 'print' | 'custom';
  customWidth?: number;
  customHeight?: number;
  backgroundColor: string;
  includeBackground: boolean;
}

export interface ExportDimensions {
  width: number;
  height: number;
}

const PRESET_RESOLUTIONS = {
  web: { width: 1920, height: 1080 },
  print: { width: 3508, height: 2480 }, // A4 at 300 DPI
  custom: { width: 1920, height: 1080 } // fallback
};

export function getExportDimensions(
  resolution: string, 
  customWidth?: number, 
  customHeight?: number
): ExportDimensions {
  if (resolution === 'custom' && customWidth && customHeight) {
    return { width: customWidth, height: customHeight };
  }
  
  const preset = PRESET_RESOLUTIONS[resolution as keyof typeof PRESET_RESOLUTIONS];
  return preset || PRESET_RESOLUTIONS.web;
}

export function exportCanvasToPNG(
  canvas: UnifiedCanvas, 
  options: ExportOptions
): string {
  const { width, height } = getExportDimensions(
    options.resolution,
    options.customWidth,
    options.customHeight
  );
  
  // Calculate multiplier for scaling
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const multiplier = options.resolution === 'print' ? 2 : 1;
  
  return canvas.toDataURL({
    format: 'png',
    quality: options.quality,
    multiplier,
    backgroundColor: options.includeBackground ? options.backgroundColor : 'transparent'
  });
}

export function exportCanvasToSVG(canvas: UnifiedCanvas, options: ExportOptions): string {
  return canvas.toSVG();
}

export function exportCanvasToJSON(canvas: UnifiedCanvas): string {
  // Basic JSON export with canvas information
  const exportData = {
    type: 'genshi-studio-export',
    version: '1.0',
    timestamp: new Date().toISOString(),
    canvas: {
      width: canvas.width,
      height: canvas.height,
      activeModes: canvas.getActiveModes(),
      primaryMode: canvas.getPrimaryMode()
    },
    metadata: {
      exportedBy: 'Genshi Studio',
      format: 'json'
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  // Handle data URLs
  if (content.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = content;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  
  // Handle regular content
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(format: string, prefix: string = 'genshi-pattern'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}.${format}`;
}

// Export handler for the unified system
export function handleExport(
  canvas: UnifiedCanvas | null,
  options: ExportOptions
): void {
  if (!canvas) {
    console.error('No canvas available for export');
    return;
  }

  try {
    let content: string;
    let mimeType: string;
    
    switch (options.format) {
      case 'png':
        content = exportCanvasToPNG(canvas, options);
        mimeType = 'image/png';
        break;
      case 'svg':
        content = exportCanvasToSVG(canvas, options);
        mimeType = 'image/svg+xml';
        break;
      case 'json':
        content = exportCanvasToJSON(canvas);
        mimeType = 'application/json';
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
    
    const filename = generateFilename(options.format);
    downloadFile(content, filename, mimeType);
    
    console.log(`✅ Export completed: ${filename}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}