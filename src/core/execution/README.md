# Code Execution Engine

This module implements the code execution pipeline for Genshi Studio, enabling users to write TypeScript code that generates graphics in real-time.

## Features

- **TypeScript Transpilation**: Converts TypeScript code to JavaScript on-the-fly
- **Sandboxed Execution**: Runs user code in a secure Web Worker environment
- **Real-time Preview**: Instantly see the results of your code on the canvas
- **Performance Monitoring**: Track transpilation and execution times
- **Error Handling**: Clear error messages with line numbers
- **Console Logging**: Capture and display console output from user code

## Architecture

### Components

1. **CodeExecutionEngine**: Main orchestrator that handles:
   - TypeScript transpilation using the TypeScript compiler
   - Web Worker management for sandboxed execution
   - Command queue processing
   - Error handling and reporting

2. **GraphicsBridge**: Connects executed code to the graphics engine:
   - Translates drawing commands to graphics engine calls
   - Manages drawing state (colors, stroke width, etc.)
   - Handles canvas operations
   - Supports pattern generation

3. **Web Worker**: Sandboxed execution environment:
   - Isolated from main thread
   - 5-second execution timeout
   - Limited API access (only Genshi API)
   - No access to DOM or window objects

## Genshi API

The following API is available in the code editor:

### Canvas Operations
```typescript
canvas.width: number         // Canvas width in pixels
canvas.height: number        // Canvas height in pixels
canvas.background(color)     // Set background color
canvas.clear()              // Clear the canvas
```

### Drawing State
```typescript
draw.fill(color)            // Set fill color
draw.stroke(color)          // Set stroke color
draw.strokeWidth(width)     // Set stroke width
draw.noFill()              // Disable fill
draw.noStroke()            // Disable stroke
```

### Shape Drawing
```typescript
shapes.rect(x, y, width, height)                    // Draw rectangle
shapes.circle(x, y, radius)                         // Draw circle
shapes.ellipse(x, y, width, height)                 // Draw ellipse
shapes.line(x1, y1, x2, y2)                        // Draw line
shapes.triangle(x1, y1, x2, y2, x3, y3)            // Draw triangle
shapes.polygon(...points)                           // Draw polygon
```

### Pattern Generation
```typescript
patterns.japanese.seigaiha(scale)    // Japanese wave pattern
patterns.japanese.asanoha(scale)     // Japanese hemp leaf pattern
patterns.japanese.shippo(scale)      // Japanese seven treasures pattern
patterns.celtic.knot(complexity)     // Celtic knot pattern
patterns.celtic.spiral(turns)        // Celtic spiral pattern
patterns.islamic.geometric(sides)    // Islamic geometric pattern
patterns.islamic.arabesque(complexity) // Islamic arabesque pattern
```

## Usage Example

```typescript
// Set canvas background
canvas.background('#f0f0f0')

// Configure drawing style
draw.fill('#3b82f6')
draw.stroke('#1e40af')
draw.strokeWidth(2)

// Draw shapes
for (let i = 0; i < 10; i++) {
  const x = i * 60 + 30
  const y = 100
  shapes.circle(x, y, 25)
}

// Apply a pattern
const pattern = patterns.japanese.seigaiha(2)
pattern.apply()
```

## Security Features

- **Execution Timeout**: Code execution is limited to 5 seconds
- **Memory Constraints**: Web Worker has limited memory access
- **API Restrictions**: Only Genshi API functions are available
- **No Network Access**: Cannot make HTTP requests
- **No File System**: Cannot access local files
- **No DOM Access**: Cannot manipulate page elements

## Performance Considerations

- TypeScript transpilation typically takes 10-50ms
- Code execution overhead is minimal (<5ms)
- Complex drawings may take longer to render
- Pattern generation is optimized for real-time preview

## Error Handling

Errors are categorized as:
- **TypeScript Errors**: Syntax and type errors during transpilation
- **Runtime Errors**: Errors during code execution
- **Timeout Errors**: Code execution exceeding 5 seconds
- **API Errors**: Invalid API usage

All errors include:
- Error message
- Line number (when available)
- Stack trace (for debugging)
- Console output up to the error point