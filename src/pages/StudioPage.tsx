import { useRef } from 'react'
import { Canvas } from '../components/studio/Canvas'
import { Toolbar } from '../components/studio/Toolbar'
import { CodeEditor } from '../components/studio/CodeEditor'
import { PatternSelector } from '../components/studio/PatternSelector'
import { ParametricPatternEditor } from '../components/studio/ParametricPatternEditor'
import { InteractiveGrowthStudio } from '../components/studio/InteractiveGrowthStudio'
import { ExportDialog } from '../components/studio/ExportDialog'
import { PresetDialog } from '../components/studio/PresetDialog'
import { BookmarkDialog } from '../components/studio/BookmarkDialog'
import { useAppStore } from '../hooks/useAppStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function StudioPage() {
  const { 
    canvasMode, 
    exportDialogOpen, 
    setExportDialogOpen,
    presetDialogOpen,
    setPresetDialogOpen,
    bookmarkDialogOpen,
    setBookmarkDialogOpen
  } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<any>(null)
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main studio area */}
      <div className="flex-1 relative overflow-hidden">
        {canvasMode === 'draw' ? (
          <>
            {/* Drawing canvas */}
            <Canvas ref={canvasRef} />
            
            {/* Pattern selector overlay */}
            <PatternSelector />
          </>
        ) : canvasMode === 'code' ? (
          /* Code editor mode */
          <CodeEditor />
        ) : canvasMode === 'parametric' ? (
          /* Parametric pattern editor mode */
          <ParametricPatternEditor />
        ) : (
          /* Interactive growth studio mode */
          <InteractiveGrowthStudio />
        )}
      </div>
      
      {/* Dialogs */}
      <ExportDialog 
        isOpen={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        canvas={canvasRef.current}
      />
      
      <PresetDialog 
        isOpen={presetDialogOpen} 
        onClose={() => setPresetDialogOpen(false)}
      />
      
      <BookmarkDialog 
        isOpen={bookmarkDialogOpen} 
        onClose={() => setBookmarkDialogOpen(false)}
      />
    </div>
  )
}