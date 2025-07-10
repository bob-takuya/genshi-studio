# Genshi Studio User Guide

*A comprehensive guide to creating beautiful cultural patterns*

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Pattern Creation](#pattern-creation)
4. [Animation & Morphing](#animation--morphing)
5. [Exporting & Sharing](#exporting--sharing)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

**Minimum Requirements:**
- Modern web browser (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+)
- 2GB RAM
- Hardware-accelerated graphics
- Internet connection for initial load

**Recommended:**
- Chrome 100+ or Firefox 100+
- 4GB+ RAM
- Dedicated graphics card
- High-resolution display for best visual experience

### First Launch

1. **Visit Genshi Studio**: Navigate to https://bob-takuya.github.io/genshi-studio/
2. **Wait for Loading**: The application loads all pattern generators and graphics engine
3. **Choose Your Mode**: Select between Visual Mode or Hybrid Programming Mode
4. **Start Creating**: Begin with a traditional pattern or start from scratch

### Basic Navigation

- **Mouse/Trackpad**: Pan around the canvas
- **Scroll Wheel**: Zoom in and out
- **Keyboard Shortcuts**: Press `Cmd/Ctrl + K` for full shortcuts list
- **Touch Devices**: Pinch to zoom, drag to pan

## Interface Overview

### Main Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Header: Navigation, Theme Toggle, Export          │
├──────────────────────────────────────────────────────────────────────────┤
│          │                                      │
│ Sidebar │         Canvas Area               │
│ - Tools │     (Pattern Rendering)          │
│ - Layers│                                      │
│ - Props │                                      │
│ - Code  │                                      │
│         │                                      │
└─────────┼──────────────────────────────────────────────────────────────┘
          Status Bar: Zoom, Connection, Save Status
```

### Sidebar Panels

#### 1. Tools Panel
- **Select Tool**: Move and modify existing elements
- **Pencil Tool**: Freehand drawing
- **Shape Tools**: Rectangle, circle, triangle, polygon
- **Text Tool**: Add typography elements
- **Pattern Tool**: Apply cultural patterns

#### 2. Layers Panel
- **Layer Management**: Add, delete, reorder layers
- **Opacity Control**: Adjust layer transparency
- **Blend Modes**: Normal, multiply, screen, overlay, etc.
- **Lock/Unlock**: Prevent accidental modifications

#### 3. Properties Panel
- **Pattern Parameters**: Scale, rotation, density, complexity
- **Color Controls**: Hue, saturation, brightness
- **Animation Settings**: Timeline, keyframes, easing
- **Export Options**: Format, resolution, quality

#### 4. Code Panel
- **Monaco Editor**: Full TypeScript support
- **Live Preview**: Real-time code execution
- **Pattern API**: Access to all pattern generators
- **Snippet Library**: Pre-built pattern examples

## Pattern Creation

### Traditional Japanese Patterns

#### Seigaiha (青海波) - Blue Ocean Waves
**Cultural Significance**: Represents tranquility and good fortune

**Parameters:**
- **Wave Height**: Controls the amplitude of waves (0.5-3.0)
- **Wave Frequency**: Number of waves per unit (1-20)
- **Color Gradient**: From deep blue to light cyan
- **Line Thickness**: Outline weight (0.1-2.0)

**Usage Example:**
```typescript
const seigaiha = patternGenerator.create(PatternType.Seigaiha, {
  waveHeight: 1.5,
  frequency: 8,
  colors: ['#0066cc', '#66ccff'],
  lineThickness: 0.8
});
```

#### Asanoha (麻の葉) - Hemp Leaf
**Cultural Significance**: Symbolizes growth and protection

**Parameters:**
- **Leaf Size**: Base size of each hemp leaf (10-100px)
- **Spacing**: Distance between leaf centers (1.0-3.0)
- **Rotation**: Global pattern rotation (0-360°)
- **Line Style**: Solid, dashed, or dotted lines

**Creating Custom Variations:**
1. Select Asanoha from the pattern library
2. Adjust parameters in the Properties panel
3. Use the color picker to customize colors
4. Click "Save Variation" to store your custom pattern

### Celtic Patterns

#### Celtic Knot
**Features:**
- **Complexity Levels**: Simple (4 strands) to Complex (16+ strands)
- **Interlacing Control**: Over/under weave patterns
- **Symmetry Options**: 2-fold, 4-fold, 8-fold symmetry
- **Border Styles**: Circular, square, or freeform boundaries

### Islamic Geometric Patterns

#### Features:
- **Tessellation Types**: Regular and semi-regular tilings
- **Star Patterns**: 8-point, 12-point, 16-point stars
- **Geometric Precision**: Mathematically accurate constructions
- **Color Schemes**: Traditional and contemporary palettes

## Animation & Morphing

### Animation Types

#### 1. Parameter Animation
**Breathing Effect:**
```typescript
animationEngine.addBreathing('scale', {
  inhaleTime: 2.0,    // Seconds to scale up
  exhaleTime: 2.5,    // Seconds to scale down
  amplitude: 0.2,     // Amount of scaling (20%)
  restTime: 0.5       // Pause between breaths
});
```

**Rotating Patterns:**
```typescript
animationEngine.animate('rotation', {
  from: 0,
  to: 360,
  duration: 10.0,
  easing: 'linear',
  loop: true
});
```

#### 2. Pattern Morphing
**Seamless Transitions:**
- Morph from Seigaiha to Asanoha over 3 seconds
- Blend geometric patterns with organic curves
- Maintain visual continuity during transitions

**Morphing Controls:**
- **Duration**: 0.5-10.0 seconds
- **Easing**: Linear, ease-in, ease-out, bounce, elastic
- **Direction**: Forward, reverse, alternate
- **Loop**: Once, infinite, or custom count

#### 3. Gesture-Driven Animation
**Touch Interactions:**
- **Pinch**: Scale patterns dynamically
- **Rotate**: Two-finger rotation gestures
- **Drag**: Pan and translate patterns
- **Long Press**: Access context menus

### Animation Timeline

**Keyframe Editor:**
1. Click the "Animation" tab in the Properties panel
2. Add keyframes by clicking on the timeline
3. Adjust parameter values at each keyframe
4. Set easing curves between keyframes
5. Preview with play/pause controls

**Timeline Controls:**
- **Play/Pause**: Space bar or click play button
- **Step Forward/Back**: Left/Right arrow keys
- **Jump to Start/End**: Home/End keys
- **Scrub**: Click and drag on timeline

## Exporting & Sharing

### Export Formats

#### Static Exports
- **PNG**: High-quality raster images (up to 8K resolution)
- **SVG**: Scalable vector graphics with full fidelity
- **PDF**: Print-ready documents with embedded fonts
- **JPG**: Compressed format for web sharing

#### Animated Exports
- **GIF**: Animated loops (up to 10 seconds)
- **WebM**: High-quality video format
- **MP4**: Universal video compatibility
- **APNG**: Animated PNG with transparency

#### Data Exports
- **JSON**: Complete pattern definitions
- **JavaScript**: Standalone pattern generators
- **CSS**: Custom properties and animations

### Export Settings

**Resolution Options:**
- **Screen**: Match current canvas size
- **Print**: 300 DPI for physical printing
- **Web**: Optimized file sizes
- **Custom**: User-defined dimensions

**Quality Settings:**
- **Maximum**: Highest quality, larger files
- **Balanced**: Good quality, reasonable file size
- **Optimized**: Smallest files, acceptable quality

### Sharing Features

#### Share Links
1. Click "Share" in the header
2. Choose sharing options:
   - **View Only**: Others can view but not edit
   - **Editable**: Others can make changes
   - **Embed**: Get iframe code for websites
3. Copy the generated URL
4. Share via email, social media, or messaging

#### Social Media Integration
- **Direct Sharing**: Twitter, Facebook, Instagram
- **Optimized Formats**: Platform-specific sizing
- **Hashtag Suggestions**: #GenshiStudio #TraditionalPatterns

## Advanced Features

### Hybrid Programming Interface

#### Code Editor Features
- **TypeScript Support**: Full type checking and IntelliSense
- **Live Compilation**: Real-time error checking
- **Auto-completion**: Pattern API suggestions
- **Syntax Highlighting**: Color-coded code structure

#### Pattern API Examples

**Creating Custom Patterns:**
```typescript
// Define a custom geometric pattern
class CustomStarPattern extends PatternGenerator {
  generate(params: StarPatternParams): PatternData {
    const { points, radius, innerRadius, rotation } = params;
    
    // Generate star vertices
    const vertices = this.createStarVertices(points, radius, innerRadius);
    
    // Apply rotation
    const rotatedVertices = this.rotateVertices(vertices, rotation);
    
    // Create path data
    return this.createPatternFromVertices(rotatedVertices);
  }
}

// Use the custom pattern
const starPattern = new CustomStarPattern();
canvas.render(starPattern.generate({
  points: 8,
  radius: 50,
  innerRadius: 25,
  rotation: 22.5
}));
```

**Combining Patterns:**
```typescript
// Layer multiple patterns
const combination = new PatternCombination([
  { pattern: seigaihaPattern, opacity: 0.7, blendMode: 'multiply' },
  { pattern: asanohaPattern, opacity: 0.5, blendMode: 'overlay' },
  { pattern: customStarPattern, opacity: 0.8, blendMode: 'normal' }
]);

canvas.render(combination);
```

### Pattern DNA System

**Genetic Algorithms:**
- **Mutation**: Random parameter variations
- **Crossover**: Blend characteristics from two patterns
- **Selection**: Choose most aesthetically pleasing results
- **Evolution**: Iterative improvement over generations

**DNA Editor:**
1. Open the "Pattern DNA" panel
2. View the genetic code of current pattern
3. Manually edit genes or use mutation tools
4. Generate offspring patterns
5. Select favorites for further evolution

### Performance Optimization

#### Graphics Settings
- **Render Quality**: Adaptive quality based on device performance
- **Frame Rate Target**: 60fps, 30fps, or adaptive
- **Memory Usage**: Automatic cleanup and optimization
- **GPU Acceleration**: WebGL when available, Canvas 2D fallback

#### User Preferences
- **Reduced Motion**: Disable animations for accessibility
- **High Contrast**: Enhanced visibility options
- **Color Blindness**: Alternative color schemes
- **Battery Saving**: Reduced effects on mobile devices

## Troubleshooting

### Common Issues

#### Performance Problems
**Symptoms**: Slow rendering, choppy animations, high memory usage

**Solutions:**
1. **Reduce Complexity**: Lower pattern detail levels
2. **Close Other Tabs**: Free up browser memory
3. **Update Browser**: Ensure latest version
4. **Hardware Acceleration**: Enable in browser settings
5. **Simplify Patterns**: Use fewer layers and effects

#### Rendering Issues
**Symptoms**: Incorrect colors, missing patterns, visual artifacts

**Solutions:**
1. **Clear Cache**: Refresh page with Cmd/Ctrl+Shift+R
2. **Check WebGL**: Visit about:gpu in Chrome for WebGL status
3. **Update Graphics Drivers**: Ensure latest drivers installed
4. **Try Different Browser**: Test in Chrome, Firefox, or Safari
5. **Disable Extensions**: Browser extensions may interfere

#### Export Problems
**Symptoms**: Failed exports, incorrect file formats, low quality

**Solutions:**
1. **Check File Size**: Large exports may time out
2. **Reduce Resolution**: Try lower DPI settings
3. **Simplify Animation**: Shorter duration or fewer frames
4. **Browser Permissions**: Allow file downloads
5. **Available Storage**: Ensure sufficient disk space

### Getting Help

#### Built-in Help
- **Tooltip System**: Hover over any control for instant help
- **Keyboard Shortcuts**: Press `Cmd/Ctrl+K` for complete list
- **Pattern Guide**: Click the "?" icon in pattern selector
- **Code Examples**: Access via Help menu in code editor

#### Community Support
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Share patterns and get help
- **Discord Channel**: Real-time chat with other users
- **Video Tutorials**: Step-by-step guided learning

### Error Messages

#### "WebGL Not Supported"
**Cause**: Browser or device doesn't support WebGL
**Solution**: 
1. Enable hardware acceleration in browser
2. Update graphics drivers
3. Use a different browser
4. Canvas 2D fallback will be used automatically

#### "Pattern Generation Failed"
**Cause**: Invalid parameters or corrupted pattern data
**Solution**:
1. Reset pattern parameters to defaults
2. Reload the page to clear corrupted state
3. Check browser console for detailed error messages
4. Report the issue if problem persists

#### "Export Timeout"
**Cause**: Export taking too long, usually due to high resolution or complexity
**Solution**:
1. Reduce export resolution
2. Simplify the pattern or animation
3. Try exporting in smaller segments
4. Use a more powerful device if available

---

## Next Steps

### Learning Resources
1. **Pattern Gallery**: Explore community creations for inspiration
2. **Video Tutorials**: Watch guided walkthroughs of advanced features
3. **Code Examples**: Study the pattern library implementations
4. **Cultural Context**: Learn about the history of traditional patterns

### Advanced Workflows
1. **Pattern Evolution**: Use genetic algorithms to discover new patterns
2. **Animation Choreography**: Create complex multi-layer animations
3. **Interactive Installations**: Export patterns for digital displays
4. **Print Production**: High-resolution exports for physical media

*For more detailed information, see the specific documentation sections linked throughout this guide.*