import React, { useState } from 'react'
import { Search, Filter, Grid, List, Heart, Share2, Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface GalleryItem {
  id: string
  title: string
  author: string
  date: string
  likes: number
  thumbnail: string
  tags: string[]
  pattern: string
}

// Mock gallery data
const galleryItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Ocean Waves Pattern',
    author: 'Sarah Chen',
    date: '2024-01-15',
    likes: 234,
    thumbnail: '🌊',
    tags: ['japanese', 'seigaiha', 'blue'],
    pattern: 'seigaiha'
  },
  {
    id: '2',
    title: 'Celtic Heart Knot',
    author: 'Liam O\'Brien',
    date: '2024-01-14',
    likes: 189,
    thumbnail: '💚',
    tags: ['celtic', 'knot', 'love'],
    pattern: 'celtic-knot'
  },
  {
    id: '3',
    title: 'Islamic Star',
    author: 'Fatima Al-Hassan',
    date: '2024-01-13',
    likes: 312,
    thumbnail: '⭐',
    tags: ['islamic', 'geometric', 'gold'],
    pattern: 'islamic-geometric'
  },
  {
    id: '4',
    title: 'Aztec Sun',
    author: 'Carlos Mendoza',
    date: '2024-01-12',
    likes: 156,
    thumbnail: '☀️',
    tags: ['aztec', 'sun', 'orange'],
    pattern: 'aztec-step'
  }
]

export function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = Array.from(
    new Set(galleryItems.flatMap(item => item.tags))
  )

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => item.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pattern Gallery</h1>
        <p className="text-lg text-muted-foreground">
          Explore creations from the Genshi Studio community
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patterns..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* View mode toggle */}
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tag filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-6xl">
                {item.thumbnail}
              </div>
              
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  by {item.author}
                </p>
                
                {/* Tags */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-secondary text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{item.likes}</span>
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      className="p-1.5 hover:bg-accent rounded transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-accent rounded transition-colors"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-shadow flex gap-4"
            >
              {/* Thumbnail */}
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                {item.thumbnail}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {item.author} • {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
                      <Heart className="h-4 w-4" />
                      <span>{item.likes}</span>
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        className="p-1.5 hover:bg-accent rounded transition-colors"
                        aria-label="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-accent rounded transition-colors"
                        aria-label="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-secondary text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}