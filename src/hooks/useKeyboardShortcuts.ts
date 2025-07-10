import { useEffect } from 'react'
import { useAppStore } from './useAppStore'

export function useKeyboardShortcuts() {
  const { 
    setCanvasMode,
    canvasMode,
    zoom,
    setZoom,
    setToolbarMode,
    toolbarMode,
    saveProject,
    currentProject,
    setExportDialogOpen,
    setPresetDialogOpen,
    setBookmarkDialogOpen,
    resetCanvas
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
            if (currentProject) {
              saveProject({})
              console.log('Project saved!')
            }
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
          case ' ':
            // Select tool - Space also activates pan/select mode
            e.preventDefault()
            setToolbarMode('select')
            console.log('Select tool activated')
            break
          case 'p':
            // Pencil/Draw tool
            e.preventDefault()
            setToolbarMode('draw')
            console.log('Draw tool activated')
            break
          case 'r':
            // Rectangle tool
            e.preventDefault()
            setToolbarMode('shape')
            console.log('Rectangle tool activated')
            break
          case 'e':
            // Export functionality
            e.preventDefault()
            setExportDialogOpen?.(true)
            console.log('Export dialog opened')
            break
          case 'f':
            // Load preset (F for favorites/presets)
            e.preventDefault()
            setPresetDialogOpen?.(true)
            console.log('Preset dialog opened')
            break
          case 's':
            // Open bookmarks dialog (S for save)
            e.preventDefault()
            setBookmarkDialogOpen?.(true)
            console.log('Bookmark dialog opened')
            break
          case 't':
            // Text tool
            e.preventDefault()
            setToolbarMode('text')
            console.log('Text tool activated')
            break
          case 'c':
            // Toggle code mode
            setCanvasMode(canvasMode === 'draw' ? 'code' : 'draw')
            break
          case 'escape':
            // Reset/Deselect all
            e.preventDefault()
            setToolbarMode('select')
            resetCanvas?.()
            console.log('Reset and deselect all')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasMode, setCanvasMode, zoom, setZoom, toolbarMode, setToolbarMode, currentProject, saveProject, setExportDialogOpen, setPresetDialogOpen, setBookmarkDialogOpen, resetCanvas])
}