import React, { useRef, useEffect, useState } from 'react'
import { Canvas } from '../components/studio/Canvas'
import { Toolbar } from '../components/studio/Toolbar'
import { CodeEditor } from '../components/studio/CodeEditor'
import { PatternSelector } from '../components/studio/PatternSelector'
import { useAppStore } from '../hooks/useAppStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function StudioPage() {
  const { canvasMode } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  
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
            <Canvas />
            
            {/* Pattern selector overlay */}
            <PatternSelector />
          </>
        ) : (
          /* Code editor mode */
          <CodeEditor />
        )}
      </div>
    </div>
  )
}