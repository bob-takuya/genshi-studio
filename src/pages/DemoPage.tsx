import React from 'react'
import { UnifiedEditingDemo } from '../components/studio/UnifiedEditingDemo'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'

export function DemoPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Demo Header */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Studio</span>
            </Link>
            
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h1 className="text-lg font-bold">Revolutionary Unified Editing Demo</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Experience the future of creative tools
            </div>
            <a
              href="https://github.com/genshi-studio/unified-editing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors text-white"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
      
      {/* Demo Content */}
      <div className="flex-1 relative overflow-hidden">
        <UnifiedEditingDemo className="h-full" />
      </div>
      
      {/* Demo Footer */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-gray-800">
        <div className="px-4 py-2 text-center text-xs text-gray-400">
          <span>Genshi Studio - Unified Editing System v0.1.0</span>
          <span className="mx-2">•</span>
          <span>All four editing modes working simultaneously in real-time</span>
        </div>
      </div>
    </div>
  )
}

export default DemoPage