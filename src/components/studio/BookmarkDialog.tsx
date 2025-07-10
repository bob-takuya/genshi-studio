import React, { useState } from 'react'
import { 
  X,
  Bookmark,
  Star,
  Clock,
  Trash2,
  Download,
  Plus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../hooks/useAppStore'

interface BookmarkDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function BookmarkDialog({ isOpen, onClose }: BookmarkDialogProps) {
  const { 
    bookmarks, 
    loadBookmark, 
    deleteBookmark, 
    saveBookmark,
    currentProject 
  } = useAppStore()
  
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [bookmarkName, setBookmarkName] = useState('')

  const handleLoadBookmark = (bookmarkId: string) => {
    loadBookmark(bookmarkId)
    onClose()
  }

  const handleDeleteBookmark = (bookmarkId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this bookmark?')) {
      deleteBookmark(bookmarkId)
    }
  }

  const handleSaveBookmark = () => {
    if (!currentProject || !bookmarkName.trim()) return
    
    const newBookmark = {
      id: Date.now().toString(),
      name: bookmarkName.trim(),
      projectData: currentProject.data,
      timestamp: new Date()
    }
    
    saveBookmark(newBookmark)
    setBookmarkName('')
    setShowSaveForm(false)
  }

  const handleExportBookmark = (bookmark: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const dataStr = JSON.stringify(bookmark, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${bookmark.name.toLowerCase().replace(/\s+/g, '-')}-bookmark.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl border border-border w-full max-w-3xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Bookmarks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save and load your favorite pattern states
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Save New Bookmark Form */}
        {showSaveForm && (
          <div className="p-6 border-b border-border bg-accent/10">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={bookmarkName}
                onChange={(e) => setBookmarkName(e.target.value)}
                placeholder="Enter bookmark name..."
                className="flex-1 p-2 border border-border rounded-md bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveBookmark()
                  if (e.key === 'Escape') setShowSaveForm(false)
                }}
              />
              <button
                onClick={handleSaveBookmark}
                disabled={!bookmarkName.trim() || !currentProject}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                className="px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bookmarks Saved</h3>
              <p className="text-muted-foreground mb-4">
                Save your current pattern state to quickly return to it later.
              </p>
              <button
                onClick={() => setShowSaveForm(true)}
                disabled={!currentProject}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Save Current State
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <motion.div
                  key={bookmark.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-accent/20 rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/30 transition-colors group"
                  onClick={() => handleLoadBookmark(bookmark.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{bookmark.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(bookmark.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleExportBookmark(bookmark, e)}
                        className="p-1.5 hover:bg-accent rounded transition-colors"
                        title="Export bookmark"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBookmark(bookmark.id, e)}
                        className="p-1.5 hover:bg-destructive/20 text-destructive rounded transition-colors"
                        title="Delete bookmark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
          </div>
          <div className="flex gap-2">
            {!showSaveForm && bookmarks.length > 0 && (
              <button
                onClick={() => setShowSaveForm(true)}
                disabled={!currentProject}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Save Current
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}