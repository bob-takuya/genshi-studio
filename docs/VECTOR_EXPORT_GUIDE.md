# Professional Vector Export Guide

## Overview

Genshi Studio now supports professional-grade vector export capabilities for commercial use, including SVG, PDF, and EPS formats. These exports maintain mathematical accuracy and provide various options for different use cases.

## Supported Export Formats

### 1. SVG (Scalable Vector Graphics)
- **Use Cases**: Web graphics, icons, logos, scalable illustrations
- **Features**:
  - Optimized path data with configurable precision
  - Layer structure preservation
  - Embedded styles option
  - Pattern definitions preservation
  - Comprehensive metadata support

### 2. PDF (Portable Document Format)
- **Use Cases**: Print documents, presentations, archival
- **Features**:
  - Multiple page formats (A4, A3, Letter, Custom)
  - Portrait/Landscape orientation
  - RGB and CMYK color spaces
  - Vector preservation (no rasterization)
  - Embedded metadata and keywords

### 3. EPS (Encapsulated PostScript)
- **Use Cases**: Professional printing, legacy systems, prepress
- **Features**:
  - PostScript Level 2 and 3 support
  - RGB, CMYK, and Grayscale color spaces
  - Professional print standards compliance
  - Tight bounding box calculation

## Export Options

### SVG Export Options
```typescript
{
  optimize: boolean,          // Optimize paths and remove redundancy
  precision: number,          // Decimal precision (0-6)
  includeLayers: boolean,     // Preserve layer structure
  includeMetadata: boolean    // Include creator, title, license info
}
```

### PDF Export Options
```typescript
{
  format: 'a4' | 'a3' | 'letter' | 'custom',
  orientation: 'portrait' | 'landscape',
  colorSpace: 'RGB' | 'CMYK',
  compression: boolean,       // Enable PDF compression
  dpi: number                 // Resolution for rasterized elements
}
```

### EPS Export Options
```typescript
{
  level: 2 | 3,              // PostScript level
  colorSpace: 'RGB' | 'CMYK' | 'Grayscale',
  resolution: number,         // Output resolution
  boundingBox: 'tight' | 'artboard'
}
```

## Usage Instructions

### Basic Export

1. Click the **Export** button in the toolbar
2. Select your desired format (PNG, SVG, PDF, EPS, CSS)
3. Configure format-specific options
4. Add metadata if desired (title, author, description)
5. Click **Export** to download

### Advanced SVG Export

For web developers requiring clean, optimized SVG:

1. Select **SVG** format
2. Enable **Optimize paths** for smaller file size
3. Set **Precision** to 2-3 decimals for web use
4. Disable **Include layers** if not needed
5. Export and use directly in HTML/CSS

### Professional PDF Export

For print-ready documents:

1. Select **PDF** format
2. Choose **CMYK** color space for professional printing
3. Select appropriate page size (A4, A3, etc.)
4. Set orientation based on your pattern
5. Include metadata for documentation

### Print Shop EPS Export

For compatibility with older print systems:

1. Select **EPS** format
2. Choose **PostScript Level 2** for maximum compatibility
3. Select **CMYK** for offset printing
4. Use **Grayscale** for single-color prints
5. Export with tight bounding box

## Color Space Considerations

### RGB (Screen Display)
- Best for: Web, digital displays, presentations
- Color range: Wider gamut, vibrant colors
- File size: Smaller

### CMYK (Print Production)
- Best for: Commercial printing, offset press
- Color range: Limited to printable colors
- Conversion: Automatic from RGB values

### Grayscale (Monochrome)
- Best for: Single-color printing, newspapers
- Conversion: Weighted luminance calculation
- File size: Smallest

## Metadata Best Practices

Including metadata enhances file professionalism:

- **Title**: Descriptive pattern name
- **Author**: Your name or organization
- **Description**: Brief pattern description
- **Keywords**: Searchable terms (PDF only)
- **License**: Copyright or Creative Commons

## Quality Guidelines

### For Web Use
- SVG with optimization enabled
- Precision: 2-3 decimal places
- RGB color space
- Minimal metadata

### For Print Production
- PDF or EPS format
- CMYK color space
- High resolution (300 DPI)
- Complete metadata

### For Archival
- PDF with compression
- Include all metadata
- Embed fonts
- Use standard page sizes

## File Size Optimization

### SVG Optimization
- Enable path optimization
- Reduce precision for smaller files
- Remove unnecessary layers
- Use CSS classes instead of inline styles

### PDF Compression
- Automatic compression enabled
- Vector data preserved
- No quality loss
- Suitable for email/web distribution

## Troubleshooting

### Large File Sizes
- Enable optimization options
- Reduce precision for SVG
- Use compression for PDF
- Consider PNG for complex patterns

### Color Accuracy
- Use CMYK for print matching
- Calibrate monitor for RGB work
- Test print before production
- Consider color profiles

### Compatibility Issues
- Use PostScript Level 2 for older systems
- Export as PDF for universal support
- Test in target application
- Keep original project files

## Integration Examples

### Web Integration (SVG)
```html
<!-- Inline SVG -->
<div class="pattern-container">
  <!-- Paste exported SVG directly -->
</div>

<!-- External SVG -->
<img src="pattern.svg" alt="Genshi Pattern">

<!-- CSS Background -->
<style>
  .pattern-bg {
    background-image: url('pattern.svg');
    background-size: cover;
  }
</style>
```

### Print Workflow (PDF/EPS)
1. Export as CMYK PDF/EPS
2. Import into InDesign/Illustrator
3. Check color separations
4. Adjust if necessary
5. Send to print provider

## Performance Tips

- Export at final size when possible
- Use appropriate format for use case
- Batch export variations efficiently
- Keep source files for re-export
- Test exports in target applications

## Future Enhancements

Planned improvements:
- AI file format support
- Advanced color profile embedding
- Multi-page PDF exports
- Pattern tiling options
- Batch processing UI