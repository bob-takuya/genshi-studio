import React from 'react'
import { Wifi, WifiOff, Save, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

export function StatusBar() {
  const { isOnline, isSaving, currentProject, zoom } = useAppStore()

  return (
    <footer className="h-8 border-t border-border bg-card px-4 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Save status */}
        {isSaving && (
          <div className="flex items-center gap-1">
            <Save className="h-3 w-3 animate-pulse" />
            <span>Saving...</span>
          </div>
        )}

        {/* Current project */}
        {currentProject && (
          <div className="flex items-center gap-1">
            <span>Project:</span>
            <span className="font-medium">{currentProject.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Zoom level */}
        <div className="flex items-center gap-1">
          <span>Zoom:</span>
          <span className="font-medium">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘K</kbd>
          <span>Commands</span>
        </div>
      </div>
    </footer>
  )
}