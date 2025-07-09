import { useEffect } from 'react'
import { useAppStore } from './useAppStore'

export function useKeyboardShortcuts() {
  const { 
    setCanvasMode,
    canvasMode,
    zoom,
    setZoom
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Command/Ctrl + key combinations
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            // Open command palette (to be implemented)
            console.log('Open command palette')
            break
          case 's':
            e.preventDefault()
            // Save project
            console.log('Save project')
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              // Redo
              console.log('Redo')
            } else {
              // Undo
              console.log('Undo')
            }
            break
          case '=':
          case '+':
            e.preventDefault()
            // Zoom in
            setZoom(Math.min(5, zoom * 1.2))
            break
          case '-':
            e.preventDefault()
            // Zoom out
            setZoom(Math.max(0.1, zoom * 0.8))
            break
          case '0':
            e.preventDefault()
            // Reset zoom
            setZoom(1)
            break
        }
      } else {
        // Single key shortcuts
        switch (e.key.toLowerCase()) {
          case 'v':
            // Select tool
            console.log('Select tool')
            break
          case 'p':
            // Pencil tool
            console.log('Pencil tool')
            break
          case 'r':
            // Rectangle tool
            console.log('Rectangle tool')
            break
          case 't':
            // Text tool
            console.log('Text tool')
            break
          case 'c':
            // Toggle code mode
            setCanvasMode(canvasMode === 'draw' ? 'code' : 'draw')
            break
          case ' ':
            // Space for pan (handled in canvas)
            break
          case 'escape':
            // Deselect
            console.log('Deselect all')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasMode, setCanvasMode, zoom, setZoom])
}