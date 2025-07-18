import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas as FabricCanvas, Point, Rect, Circle, Triangle, FabricObject } from 'fabric'
import type { TEvent } from 'fabric'
import { useAppStore } from '../../hooks/useAppStore'
import { CanvasControls } from './CanvasControls'
import { ExportDialog } from './ExportDialog'
import { PatternLibrary } from './PatternLibrary'

export const Canvas = React.forwardRef<any, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showPatternLibrary, setShowPatternLibrary] = useState(true)
  
  const { 
    activeColor, 
    activeLayerId, 
    zoom,
    setZoom 
  } = useAppStore()

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new FabricCanvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      allowTouchScrolling: false // Disable default touch scrolling
    })

    fabricRef.current = canvas
    
    // Forward ref to parent component
    if (ref) {
      if (typeof ref === 'function') {
        ref(canvas)
      } else {
        ref.current = canvas
      }
    }

    // Set initial size
    const handleResize = () => {
      if (!fabricRef.current || !containerRef.current) return
      
      const { width, height } = containerRef.current.getBoundingClientRect()
      fabricRef.current.setDimensions({ width, height })
      fabricRef.current.renderAll()
    }
    
    handleResize()

    // Event listeners
    canvas.on('mouse:wheel', handleWheel)
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:cleared', handleSelectionCleared)

    // Touch event listeners
    canvas.on('touch:gesture', handleTouchGesture)
    canvas.on('touch:drag', handleTouchDrag)

    // Add touch event handlers to canvas element
    if (canvasRef.current) {
      canvasRef.current.addEventListener('touchstart', handleTouchStart, { passive: false })
      canvasRef.current.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvasRef.current.addEventListener('touchend', handleTouchEnd, { passive: false })
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleTouchStart)
        canvasRef.current.removeEventListener('touchmove', handleTouchMove)
        canvasRef.current.removeEventListener('touchend', handleTouchEnd)
      }
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (!fabricRef.current || !containerRef.current) return
      
      const { width, height } = containerRef.current.getBoundingClientRect()
      fabricRef.current.setDimensions({ width, height })
      fabricRef.current.renderAll()
    }

    window.addEventListener('resize', handleWindowResize)
    handleWindowResize()

    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  // Update active color for drawing
  useEffect(() => {
    if (!fabricRef.current) return
    
    // Ensure freeDrawingBrush exists before setting properties
    if (fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = activeColor
      fabricRef.current.freeDrawingBrush.width = 2
    }
  }, [activeColor])

  // Handle zoom changes
  useEffect(() => {
    if (!fabricRef.current) return
    fabricRef.current.setZoom(zoom)
    fabricRef.current.renderAll()
  }, [zoom])

  // Mouse wheel zoom
  const handleWheel = useCallback((opt: TEvent<WheelEvent>) => {
    const delta = opt.e.deltaY
    let newZoom = zoom * (0.999 ** delta)
    newZoom = Math.max(0.1, Math.min(5, newZoom))
    
    setZoom(newZoom)
    
    if (fabricRef.current) {
      const point = new Point(opt.e.offsetX, opt.e.offsetY)
      fabricRef.current.zoomToPoint(point, newZoom)
    }
    
    opt.e.preventDefault()
    opt.e.stopPropagation()
  }, [zoom, setZoom])

  // Handle object events
  const handleObjectAdded = useCallback((e: any) => {
    // Add object to active layer
    console.log('Object added:', e.target)
  }, [activeLayerId])

  const handleObjectModified = useCallback((e: any) => {
    // Update layer data
    console.log('Object modified:', e.target)
  }, [])

  const handleSelection = useCallback((e: any) => {
    console.log('Selection created:', e.selected)
  }, [])

  const handleSelectionCleared = useCallback(() => {
    console.log('Selection cleared')
  }, [])

  // Touch event handlers
  const [touchData, setTouchData] = useState<{
    lastTouches: TouchList | null;
    lastDistance: number;
    lastCenter: { x: number; y: number } | null;
    isPinching: boolean;
    isPanning: boolean;
  }>({
    lastTouches: null,
    lastDistance: 0,
    lastCenter: null,
    isPinching: false,
    isPanning: false
  })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touches = e.touches
    
    if (touches.length === 1) {
      // Single touch - potential drawing
      setTouchData(prev => ({
        ...prev,
        lastTouches: touches,
        isPanning: false,
        isPinching: false
      }))
    } else if (touches.length === 2) {
      // Two fingers - pinch to zoom or pan
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
      
      setTouchData(prev => ({
        ...prev,
        lastTouches: touches,
        lastDistance: distance,
        lastCenter: center,
        isPinching: true,
        isPanning: false
      }))
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touches = e.touches
    
    if (!touchData.lastTouches) return
    
    if (touches.length === 2 && touchData.isPinching) {
      // Handle pinch zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
      
      if (touchData.lastDistance > 0) {
        const scale = distance / touchData.lastDistance
        const newZoom = Math.max(0.1, Math.min(5, zoom * scale))
        setZoom(newZoom)
        
        if (fabricRef.current && touchData.lastCenter) {
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const point = new Point(center.x - rect.left, center.y - rect.top)
            fabricRef.current.zoomToPoint(point, newZoom)
          }
        }
      }
      
      setTouchData(prev => ({
        ...prev,
        lastDistance: distance,
        lastCenter: center
      }))
    } else if (touches.length === 1) {
      // Handle single touch drawing or panning
      const touch = touches[0]
      const lastTouch = touchData.lastTouches?.[0]
      
      if (lastTouch && fabricRef.current) {
        const deltaX = touch.clientX - lastTouch.clientX
        const deltaY = touch.clientY - lastTouch.clientY
        
        // If movement is significant, treat as pan
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          if (!fabricRef.current.isDrawingMode) {
            // Pan the canvas
            const vpt = fabricRef.current.viewportTransform!
            vpt[4] += deltaX
            vpt[5] += deltaY
            fabricRef.current.requestRenderAll()
          }
        }
      }
      
      setTouchData(prev => ({
        ...prev,
        lastTouches: touches
      }))
    }
  }, [touchData, zoom, setZoom])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    setTouchData({
      lastTouches: null,
      lastDistance: 0,
      lastCenter: null,
      isPinching: false,
      isPanning: false
    })
  }, [])

  const handleTouchGesture = useCallback((e: any) => {
    // Handle Fabric.js touch gestures
    e.e.preventDefault()
  }, [])

  const handleTouchDrag = useCallback((e: any) => {
    // Handle Fabric.js touch drag
    e.e.preventDefault()
  }, [])

  // Drawing tools
  const setDrawingMode = useCallback((mode: 'select' | 'draw' | 'shape' | 'text') => {
    if (!fabricRef.current) return

    switch (mode) {
      case 'select':
        fabricRef.current.isDrawingMode = false
        fabricRef.current.selection = true
        break
      case 'draw':
        fabricRef.current.isDrawingMode = true
        fabricRef.current.selection = false
        break
      case 'shape':
        fabricRef.current.isDrawingMode = false
        // Add shape drawing logic
        break
      case 'text':
        fabricRef.current.isDrawingMode = false
        // Add text tool logic
        break
    }
  }, [])

  // Add shape to canvas
  const addShape = useCallback((type: 'rect' | 'circle' | 'triangle') => {
    if (!fabricRef.current) return

    let shape: FabricObject

    switch (type) {
      case 'rect':
        shape = new Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: activeColor,
          strokeWidth: 0
        })
        break
      case 'circle':
        shape = new Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: activeColor,
          strokeWidth: 0
        })
        break
      case 'triangle':
        shape = new Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: activeColor,
          strokeWidth: 0
        })
        break
    }

    fabricRef.current.add(shape)
    fabricRef.current.setActiveObject(shape)
    fabricRef.current.renderAll()
  }, [activeColor])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = '#ffffff'
    fabricRef.current.renderAll()
  }, [])

  // Open export dialog
  const openExportDialog = useCallback(() => {
    setShowExportDialog(true)
  }, [])
  
  // Generate test pattern
  const generateTestPattern = useCallback(() => {
    if (!fabricRef.current) return
    
    // Clear canvas
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = '#ffffff'
    
    // Create a simple geometric pattern
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7']
    const size = 40
    const rows = Math.ceil(fabricRef.current.height! / size)
    const cols = Math.ceil(fabricRef.current.width! / size)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const colorIndex = (row + col) % colors.length
        const shape = (row + col) % 3
        
        let element
        if (shape === 0) {
          element = new Circle({
            left: col * size + size/2,
            top: row * size + size/2,
            radius: size/3,
            fill: colors[colorIndex],
            originX: 'center',
            originY: 'center',
            selectable: false
          })
        } else if (shape === 1) {
          element = new Rect({
            left: col * size + size/2,
            top: row * size + size/2,
            width: size * 0.8,
            height: size * 0.8,
            fill: colors[colorIndex],
            originX: 'center',
            originY: 'center',
            selectable: false
          })
        } else {
          element = new Triangle({
            left: col * size + size/2,
            top: row * size + size/2,
            width: size * 0.8,
            height: size * 0.8,
            fill: colors[colorIndex],
            originX: 'center',
            originY: 'center',
            selectable: false
          })
        }
        
        fabricRef.current.add(element)
      }
    }
    
    fabricRef.current.renderAll()
  }, [])


  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-50 flex canvas-container-mobile md:canvas-container" data-testid="main-canvas">
      {/* Canvas container */}
      <div className="flex-1 relative">
        {/* Canvas element */}
        <canvas 
          ref={canvasRef} 
          id="drawing-canvas" 
          data-testid="drawing-canvas"
          className="canvas-touch"
          style={{ touchAction: 'none' }}
        />
        
        {/* Canvas controls */}
        <CanvasControls
          onModeChange={setDrawingMode}
          onAddShape={addShape}
          onClear={clearCanvas}
          onExport={openExportDialog}
          onTogglePatterns={() => setShowPatternLibrary(!showPatternLibrary)}
          showPatternLibrary={showPatternLibrary}
          onGenerateTestPattern={generateTestPattern}
        />
        
        {/* Export dialog */}
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          canvas={fabricRef.current}
        />
      </div>
      
      {/* Pattern library */}
      {showPatternLibrary && (
        <PatternLibrary
          canvas={fabricRef.current}
          onClose={() => setShowPatternLibrary(false)}
        />
      )}
    </div>
  )
})

Canvas.displayName = 'Canvas'