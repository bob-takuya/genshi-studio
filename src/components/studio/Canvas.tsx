import React, { useRef, useEffect, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { useAppStore } from '../../hooks/useAppStore'
import { CanvasControls } from './CanvasControls'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { 
    activeColor, 
    activeLayerId, 
    layers,
    zoom,
    setZoom 
  } = useAppStore()

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    })

    fabricRef.current = canvas

    // Set initial size
    handleResize()

    // Event listeners
    canvas.on('mouse:wheel', handleWheel)
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:cleared', handleSelectionCleared)

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!fabricRef.current || !containerRef.current) return
      
      const { width, height } = containerRef.current.getBoundingClientRect()
      fabricRef.current.setDimensions({ width, height })
      fabricRef.current.renderAll()
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update active color for drawing
  useEffect(() => {
    if (!fabricRef.current) return
    
    fabricRef.current.freeDrawingBrush.color = activeColor
    fabricRef.current.freeDrawingBrush.width = 2
  }, [activeColor])

  // Handle zoom changes
  useEffect(() => {
    if (!fabricRef.current) return
    fabricRef.current.setZoom(zoom)
    fabricRef.current.renderAll()
  }, [zoom])

  // Mouse wheel zoom
  const handleWheel = useCallback((opt: fabric.IEvent<WheelEvent>) => {
    const delta = opt.e.deltaY
    let newZoom = zoom * (0.999 ** delta)
    newZoom = Math.max(0.1, Math.min(5, newZoom))
    
    setZoom(newZoom)
    
    if (fabricRef.current) {
      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY)
      fabricRef.current.zoomToPoint(point, newZoom)
    }
    
    opt.e.preventDefault()
    opt.e.stopPropagation()
  }, [zoom, setZoom])

  // Handle object events
  const handleObjectAdded = useCallback((e: fabric.IEvent) => {
    // Add object to active layer
    console.log('Object added:', e.target)
  }, [activeLayerId])

  const handleObjectModified = useCallback((e: fabric.IEvent) => {
    // Update layer data
    console.log('Object modified:', e.target)
  }, [])

  const handleSelection = useCallback((e: fabric.IEvent) => {
    console.log('Selection created:', e.selected)
  }, [])

  const handleSelectionCleared = useCallback(() => {
    console.log('Selection cleared')
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

    let shape: fabric.Object

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: activeColor,
          strokeWidth: 0
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: activeColor,
          strokeWidth: 0
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
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

  // Export canvas
  const exportCanvas = useCallback((format: 'png' | 'svg' | 'json') => {
    if (!fabricRef.current) return

    switch (format) {
      case 'png':
        const dataURL = fabricRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2
        })
        downloadFile(dataURL, 'canvas.png')
        break
      case 'svg':
        const svg = fabricRef.current.toSVG()
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        downloadFile(url, 'canvas.svg')
        break
      case 'json':
        const json = JSON.stringify(fabricRef.current.toJSON())
        const blob2 = new Blob([json], { type: 'application/json' })
        const url2 = URL.createObjectURL(blob2)
        downloadFile(url2, 'canvas.json')
        break
    }
  }, [])

  // Helper function to download files
  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-50">
      {/* Canvas element */}
      <canvas ref={canvasRef} />
      
      {/* Canvas controls */}
      <CanvasControls
        onModeChange={setDrawingMode}
        onAddShape={addShape}
        onClear={clearCanvas}
        onExport={exportCanvas}
      />
    </div>
  )
}