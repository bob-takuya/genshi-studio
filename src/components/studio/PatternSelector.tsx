import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Sliders } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const categories = [
    { id: 'all', name: 'All Patterns' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'celtic', name: 'Celtic' },
    { id: 'islamic', name: 'Islamic' },
    { id: 'aztec', name: 'Aztec' }
  ]

  const filteredPatterns = activeCategory === 'all' 
    ? patterns 
    : patterns.filter(p => p.category === activeCategory)

  const applyPattern = () => {
    if (!selectedPattern) return
    
    // TODO: Apply pattern to canvas with current parameters
    console.log('Applying pattern:', selectedPattern)
    setIsOpen(false)
  }

  return (
    <>
      {/* Pattern button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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
              className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">Cultural Patterns</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Pattern list */}
                <div className="w-1/2 border-r border-border p-6 overflow-y-auto">
                  {/* Category tabs */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Pattern grid */}
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
                      >
                        <div className="text-4xl mb-2">{pattern.preview}</div>
                        <h3 className="font-semibold text-sm">{pattern.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pattern.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pattern customization */}
                <div className="w-1/2 p-6 overflow-y-auto">
                  {selectedPattern ? (
                    <>
                      <h3 className="text-lg font-semibold mb-4">
                        Customize {selectedPattern.name}
                      </h3>
                      
                      {/* Parameters */}
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

                      {/* Preview */}
                      <div className="mt-6 p-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-6xl">{selectedPattern.preview}</div>
                      </div>

                      {/* Apply button */}
                      <button
                        onClick={applyPattern}
                        className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Apply Pattern
                      </button>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Sliders className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Select a pattern to customize</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}