import React, { useState, useEffect } from 'react'
import { X, Sliders, Grid3x3, Wand2, Layers, Share2, Download, Upload, Plus, Settings, Search, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomPattern } from '../../types/graphics'
import { PatternBuilder } from './PatternBuilder'
import { PatternCombiner } from './PatternCombiner'
import { PatternStorageService } from '../../services/PatternStorageService'

interface Pattern {
  id: string
  name: string
  category: string
  description: string
  preview: string
  parameters: PatternParameter[]
}

interface PatternParameter {
  name: string
  type: 'range' | 'color' | 'select'
  min?: number
  max?: number
  value: number | string
  options?: string[]
}

const patterns: Pattern[] = [
  // E2E Test Required Patterns (9 types)
  {
    id: 'flow-fields',
    name: 'Flow Fields',
    category: 'generative',
    description: 'Dynamic flow field patterns with particle movement',
    preview: '🌀',
    parameters: [
      { name: 'Particle Count', type: 'range', min: 100, max: 2000, value: 500 },
      { name: 'Flow Strength', type: 'range', min: 0.1, max: 2, value: 1 },
      { name: 'Speed', type: 'range', min: 0.5, max: 5, value: 2 }
    ]
  },
  {
    id: 'waves',
    name: 'Waves',
    category: 'natural',
    description: 'Flowing wave patterns with customizable amplitude and frequency',
    preview: '〰️',
    parameters: [
      { name: 'Amplitude', type: 'range', min: 10, max: 100, value: 50 },
      { name: 'Frequency', type: 'range', min: 0.1, max: 2, value: 0.5 },
      { name: 'Phase', type: 'range', min: 0, max: 360, value: 0 }
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    category: 'organic',
    description: 'Organic growth patterns inspired by natural systems',
    preview: '🌱',
    parameters: [
      { name: 'Iterations', type: 'range', min: 3, max: 10, value: 6 },
      { name: 'Branching Factor', type: 'range', min: 2, max: 5, value: 3 },
      { name: 'Growth Rate', type: 'range', min: 0.5, max: 2, value: 1.2 }
    ]
  },
  {
    id: 'truchet',
    name: 'Truchet',
    category: 'geometric',
    description: 'Truchet tile patterns with random rotation',
    preview: '◐',
    parameters: [
      { name: 'Tile Size', type: 'range', min: 20, max: 100, value: 50 },
      { name: 'Randomness', type: 'range', min: 0, max: 1, value: 0.5 },
      { name: 'Style', type: 'select', value: 'curved', options: ['curved', 'straight', 'diagonal'] }
    ]
  },
  {
    id: 'reaction',
    name: 'Reaction',
    category: 'simulation',
    description: 'Reaction-diffusion patterns mimicking chemical processes',
    preview: '🧬',
    parameters: [
      { name: 'Diffusion Rate A', type: 'range', min: 0.5, max: 2, value: 1 },
      { name: 'Diffusion Rate B', type: 'range', min: 0.1, max: 1, value: 0.5 },
      { name: 'Feed Rate', type: 'range', min: 0.01, max: 0.1, value: 0.055 }
    ]
  },
  {
    id: 'voronoi',
    name: 'Voronoi',
    category: 'mathematical',
    description: 'Voronoi diagrams with customizable seed points',
    preview: '🔷',
    parameters: [
      { name: 'Point Count', type: 'range', min: 10, max: 200, value: 50 },
      { name: 'Cell Style', type: 'select', value: 'filled', options: ['filled', 'outlined', 'gradient'] },
      { name: 'Relaxation', type: 'range', min: 0, max: 5, value: 2 }
    ]
  },
  {
    id: 'maze',
    name: 'Maze',
    category: 'algorithmic',
    description: 'Procedural maze generation with various algorithms',
    preview: '🗺️',
    parameters: [
      { name: 'Cell Size', type: 'range', min: 10, max: 50, value: 20 },
      { name: 'Algorithm', type: 'select', value: 'recursive', options: ['recursive', 'prim', 'kruskal'] },
      { name: 'Complexity', type: 'range', min: 0.1, max: 1, value: 0.6 }
    ]
  },
  {
    id: 'l-systems',
    name: 'L-Systems',
    category: 'fractal',
    description: 'Lindenmayer systems for fractal plant-like structures',
    preview: '🌿',
    parameters: [
      { name: 'Iterations', type: 'range', min: 3, max: 8, value: 5 },
      { name: 'Angle', type: 'range', min: 15, max: 90, value: 25 },
      { name: 'Length', type: 'range', min: 5, max: 20, value: 10 }
    ]
  },
  {
    id: 'circles',
    name: 'Circles',
    category: 'geometric',
    description: 'Circle packing and arrangements with various sizes',
    preview: '⭕',
    parameters: [
      { name: 'Circle Count', type: 'range', min: 10, max: 500, value: 100 },
      { name: 'Size Variation', type: 'range', min: 0.1, max: 2, value: 1 },
      { name: 'Packing', type: 'select', value: 'random', options: ['random', 'grid', 'hexagonal'] }
    ]
  },
  // Original Cultural Patterns
  {
    id: 'seigaiha',
    name: 'Seigaiha (Blue Sea Waves)',
    category: 'japanese',
    description: 'Traditional Japanese pattern representing waves and good fortune',
    preview: '🌊',
    parameters: [
      { name: 'Scale', type: 'range', min: 0.5, max: 3, value: 1 },
      { name: 'Wave Height', type: 'range', min: 0.5, max: 2, value: 1 },
      { name: 'Primary Color', type: 'color', value: '#1e40af' },
      { name: 'Secondary Color', type: 'color', value: '#60a5fa' }
    ]
  },
  {
    id: 'asanoha',
    name: 'Asanoha (Hemp Leaf)',
    category: 'japanese',
    description: 'Geometric pattern symbolizing growth and protection',
    preview: '⬡',
    parameters: [
      { name: 'Size', type: 'range', min: 10, max: 100, value: 40 },
      { name: 'Line Width', type: 'range', min: 1, max: 5, value: 2 },
      { name: 'Color', type: 'color', value: '#059669' }
    ]
  },
  {
    id: 'celtic-knot',
    name: 'Celtic Knot',
    category: 'celtic',
    description: 'Interwoven patterns representing eternity and interconnection',
    preview: '🔗',
    parameters: [
      { name: 'Complexity', type: 'range', min: 3, max: 8, value: 5 },
      { name: 'Thickness', type: 'range', min: 2, max: 10, value: 4 },
      { name: 'Style', type: 'select', value: 'traditional', options: ['traditional', 'modern', 'rounded'] }
    ]
  },
  {
    id: 'islamic-geometric',
    name: 'Islamic Geometric',
    category: 'islamic',
    description: 'Mathematical patterns reflecting divine perfection',
    preview: '✦',
    parameters: [
      { name: 'Sides', type: 'range', min: 6, max: 12, value: 8 },
      { name: 'Layers', type: 'range', min: 1, max: 5, value: 3 },
      { name: 'Rotation', type: 'range', min: 0, max: 360, value: 0 }
    ]
  },
  {
    id: 'aztec-step',
    name: 'Aztec Step Pattern',
    category: 'aztec',
    description: 'Stepped geometric patterns from Mesoamerican culture',
    preview: '▨',
    parameters: [
      { name: 'Steps', type: 'range', min: 3, max: 10, value: 5 },
      { name: 'Width', type: 'range', min: 20, max: 100, value: 50 }
    ]
  }
]

export function PatternSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'browse' | 'custom' | 'combine'>('browse')
  const [customPatterns, setCustomPatterns] = useState<CustomPattern[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [showCombiner, setShowCombiner] = useState(false)
  const [builderPattern, setBuilderPattern] = useState<CustomPattern | null>(null)
  const [recentPatterns, setRecentPatterns] = useState<CustomPattern[]>([])
  const [storageStats, setStorageStats] = useState<any>(null)

  const categories = [
    { id: 'all', name: 'All Patterns' },
    { id: 'generative', name: 'Generative' },
    { id: 'natural', name: 'Natural' },
    { id: 'organic', name: 'Organic' },
    { id: 'geometric', name: 'Geometric' },
    { id: 'simulation', name: 'Simulation' },
    { id: 'mathematical', name: 'Mathematical' },
    { id: 'algorithmic', name: 'Algorithmic' },
    { id: 'fractal', name: 'Fractal' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'celtic', name: 'Celtic' },
    { id: 'islamic', name: 'Islamic' },
    { id: 'aztec', name: 'Aztec' },
    { id: 'custom', name: 'Custom' }
  ]

  const filteredPatterns = activeCategory === 'all' 
    ? patterns 
    : patterns.filter(p => p.category === activeCategory)

  // Load custom patterns and stats
  useEffect(() => {
    loadCustomPatterns()
    loadRecentPatterns()
    loadStorageStats()
  }, [])

  // Handle URL sharing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shareId = urlParams.get('share')
    
    if (shareId) {
      const sharedPattern = PatternStorageService.loadPatternFromShare(shareId)
      if (sharedPattern) {
        setCustomPatterns(prev => [sharedPattern, ...prev])
        setActiveTab('custom')
        setIsOpen(true)
      }
    }
  }, [])

  const loadCustomPatterns = () => {
    const patterns = PatternStorageService.getAllPatterns()
    setCustomPatterns(patterns)
  }

  const loadRecentPatterns = () => {
    const recent = PatternStorageService.getRecentPatterns(5)
    setRecentPatterns(recent)
  }

  const loadStorageStats = () => {
    const stats = PatternStorageService.getStorageStats()
    setStorageStats(stats)
  }

  const filterCustomPatterns = () => {
    let filtered = customPatterns

    if (searchQuery) {
      filtered = PatternStorageService.searchPatterns(searchQuery)
    }

    if (selectedTags.length > 0) {
      filtered = PatternStorageService.getPatternsByTags(selectedTags)
    }

    return filtered
  }

  const applyPattern = () => {
    if (!selectedPattern) return
    
    // TODO: Apply pattern to canvas with current parameters
    console.log('Applying pattern:', selectedPattern)
    setIsOpen(false)
  }

  const handlePatternSave = (pattern: CustomPattern) => {
    loadCustomPatterns()
    loadRecentPatterns()
    loadStorageStats()
    setShowBuilder(false)
    setActiveTab('custom')
  }

  const handlePatternEdit = (pattern: CustomPattern) => {
    setBuilderPattern(pattern)
    setShowBuilder(true)
  }

  const handlePatternShare = (pattern: CustomPattern) => {
    const shareUrl = PatternStorageService.generateShareableUrl(pattern)
    navigator.clipboard.writeText(shareUrl)
    // Show success message
    console.log('Pattern shared:', shareUrl)
  }

  const handlePatternDelete = (patternId: string) => {
    PatternStorageService.deletePattern(patternId)
    loadCustomPatterns()
    loadRecentPatterns()
    loadStorageStats()
  }

  const exportPatterns = () => {
    const data = PatternStorageService.exportPatterns()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'genshi-patterns.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importPatterns = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = PatternStorageService.importPatterns(content)
      
      if (result.success) {
        loadCustomPatterns()
        loadRecentPatterns()
        loadStorageStats()
        console.log(`Imported ${result.imported} patterns`)
      } else {
        console.error('Import failed:', result.errors)
      }
    }
    reader.readAsText(file)
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    customPatterns.forEach(pattern => {
      pattern.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <>
      {/* Pattern button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        data-testid="pattern-selector"
      >
        <Grid3x3 className="h-5 w-5" />
        <span>Patterns</span>
      </button>

      {/* Pattern selector modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
              data-testid="pattern-library"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pattern Library</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBuilder(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Create
                  </button>
                  <button
                    onClick={() => setShowCombiner(true)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Combine
                  </button>
                  <button
                    onClick={exportPatterns}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title="Export Patterns"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <label className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer" title="Import Patterns">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={importPatterns}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {[
                  { id: 'browse', label: 'Browse', icon: Grid3x3 },
                  { id: 'custom', label: 'Custom', icon: Wand2 },
                  { id: 'combine', label: 'Combine', icon: Layers }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-border p-6 overflow-y-auto">
                  {activeTab === 'browse' && (
                    <>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Categories</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.slice(0, -1).map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setActiveCategory(cat.id)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeCategory === cat.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {filteredPatterns.map((pattern) => (
                          <button
                            key={pattern.id}
                            onClick={() => setSelectedPattern(pattern)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              selectedPattern?.id === pattern.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                            data-pattern={pattern.name}
                          >
                            <div className="text-4xl mb-2">{pattern.preview}</div>
                            <h3 className="font-semibold text-sm">{pattern.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {pattern.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {activeTab === 'custom' && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Search className="h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search patterns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 p-2 rounded border border-border bg-background"
                          />
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {getAllTags().map(tag => (
                              <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-2 py-1 rounded-full text-xs transition-colors ${
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

                        {recentPatterns.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Recent
                            </h4>
                            <div className="space-y-2">
                              {recentPatterns.map(pattern => (
                                <button
                                  key={pattern.id}
                                  onClick={() => handlePatternEdit(pattern)}
                                  className="w-full p-2 text-left rounded border border-border hover:border-primary/50 transition-colors"
                                >
                                  <div className="font-medium text-sm">{pattern.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {pattern.modifiedAt.toLocaleDateString()}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {filterCustomPatterns().map((pattern) => (
                          <div
                            key={pattern.id}
                            className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-sm">{pattern.name}</h3>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handlePatternEdit(pattern)}
                                  className="p-1 hover:bg-accent rounded"
                                  title="Edit"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handlePatternShare(pattern)}
                                  className="p-1 hover:bg-accent rounded"
                                  title="Share"
                                >
                                  <Share2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handlePatternDelete(pattern.id)}
                                  className="p-1 hover:bg-accent rounded text-red-500"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {pattern.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-secondary rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {customPatterns.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No custom patterns yet.</p>
                          <p className="text-sm">Create your first pattern!</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeTab === 'browse' && selectedPattern && (
                    <>
                      <h3 className="text-lg font-semibold mb-4">
                        Customize {selectedPattern.name}
                      </h3>
                      
                      <div className="space-y-4">
                        {selectedPattern.parameters.map((param) => (
                          <div key={param.name}>
                            <label className="text-sm font-medium mb-2 block">
                              {param.name}
                            </label>
                            
                            {param.type === 'range' && (
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={param.min}
                                  max={param.max}
                                  value={param.value as number}
                                  className="flex-1"
                                />
                                <span className="text-sm w-12 text-right">
                                  {param.value}
                                </span>
                              </div>
                            )}
                            
                            {param.type === 'color' && (
                              <input
                                type="color"
                                value={param.value as string}
                                className="w-full h-10 rounded cursor-pointer"
                              />
                            )}
                            
                            {param.type === 'select' && (
                              <select
                                value={param.value as string}
                                className="w-full p-2 rounded border border-border bg-background"
                              >
                                {param.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-6xl">{selectedPattern.preview}</div>
                      </div>

                      <button
                        onClick={applyPattern}
                        className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Apply Pattern
                      </button>
                    </>
                  )}

                  {activeTab === 'browse' && !selectedPattern && (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Sliders className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Select a pattern to customize</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'custom' && (
                    <div className="space-y-6">
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Storage Usage</h4>
                        {storageStats && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Patterns: {storageStats.patterns}</span>
                              <span>Variations: {storageStats.variations}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(storageStats.percentUsed, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(storageStats.totalSize / 1024).toFixed(1)}KB used
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => setShowBuilder(true)}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          Create New Pattern
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pattern Builder Modal */}
      {showBuilder && (
        <PatternBuilder
          isOpen={showBuilder}
          onClose={() => {
            setShowBuilder(false)
            setBuilderPattern(null)
          }}
          initialPattern={builderPattern || undefined}
          onSave={handlePatternSave}
        />
      )}

      {/* Pattern Combiner Modal */}
      {showCombiner && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold">Pattern Combiner</h2>
              <button
                onClick={() => setShowCombiner(false)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <PatternCombiner
                onCombinationChange={(combination) => {
                  console.log('Combination changed:', combination)
                }}
                width={400}
                height={400}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}