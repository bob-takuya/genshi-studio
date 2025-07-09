import React, { useRef, useEffect, useState } from 'react'
import * as monaco from 'monaco-editor'
import { Play, Save, Copy, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'

// TypeScript definitions for the Genshi API
const GENSHI_TYPES = `
declare namespace Genshi {
  interface Canvas {
    width: number
    height: number
    background(color: string): void
    clear(): void
  }
  
  interface Drawing {
    fill(color: string): void
    stroke(color: string): void
    strokeWidth(width: number): void
    noFill(): void
    noStroke(): void
  }
  
  interface Shapes {
    rect(x: number, y: number, width: number, height: number): void
    circle(x: number, y: number, radius: number): void
    ellipse(x: number, y: number, width: number, height: number): void
    line(x1: number, y1: number, x2: number, y2: number): void
    triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void
    polygon(...points: number[]): void
  }
  
  interface Patterns {
    japanese: {
      seigaiha(scale?: number): Pattern
      asanoha(scale?: number): Pattern
      shippo(scale?: number): Pattern
    }
    celtic: {
      knot(complexity?: number): Pattern
      spiral(turns?: number): Pattern
    }
    islamic: {
      geometric(sides?: number): Pattern
      arabesque(complexity?: number): Pattern
    }
  }
  
  interface Pattern {
    apply(): void
    scale(factor: number): Pattern
    rotate(angle: number): Pattern
    translate(x: number, y: number): Pattern
  }
}

declare const canvas: Genshi.Canvas
declare const draw: Genshi.Drawing
declare const shapes: Genshi.Shapes
declare const patterns: Genshi.Patterns
`

const DEFAULT_CODE = `// Welcome to Genshi Studio Code Editor
// Use the Genshi API to create graphics programmatically

// Set up the canvas
canvas.background('#f0f0f0')

// Draw a simple pattern
draw.fill('#3b82f6')
draw.noStroke()

for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    const x = i * 60 + 30
    const y = j * 60 + 30
    shapes.circle(x, y, 20)
  }
}

// Apply a Japanese pattern
const pattern = patterns.japanese.seigaiha(2)
pattern.apply()
`

export function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!editorRef.current || monacoRef.current) return

    // Configure Monaco Editor
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true
    })

    // Add Genshi type definitions
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      GENSHI_TYPES,
      'genshi.d.ts'
    )

    // Create editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value: DEFAULT_CODE,
      language: 'typescript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true
    })

    monacoRef.current = editor

    return () => {
      editor.dispose()
      monacoRef.current = null
    }
  }, [])

  // Run code
  const runCode = async () => {
    if (!monacoRef.current) return
    
    setIsRunning(true)
    setOutput('Running code...')
    
    try {
      const code = monacoRef.current.getValue()
      
      // Here you would integrate with your actual execution engine
      // For now, we'll simulate execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setOutput('Code executed successfully!')
      
      // TODO: Send code to canvas rendering engine
      console.log('Executing code:', code)
      
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Save code
  const saveCode = () => {
    if (!monacoRef.current) return
    
    const code = monacoRef.current.getValue()
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'genshi-code.ts'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy code
  const copyCode = async () => {
    if (!monacoRef.current) return
    
    const code = monacoRef.current.getValue()
    await navigator.clipboard.writeText(code)
    setOutput('Code copied to clipboard!')
    setTimeout(() => setOutput(''), 2000)
  }

  // Reset code
  const resetCode = () => {
    if (!monacoRef.current) return
    monacoRef.current.setValue(DEFAULT_CODE)
  }

  return (
    <div className="flex h-full">
      {/* Code editor panel */}
      <div className="flex-1 flex flex-col">
        {/* Editor toolbar */}
        <div className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>Run</span>
            </button>
            
            <button
              onClick={saveCode}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Save code"
            >
              <Save className="h-4 w-4" />
            </button>
            
            <button
              onClick={copyCode}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={resetCode}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Reset code"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            TypeScript • Genshi API
          </div>
        </div>
        
        {/* Monaco editor */}
        <div ref={editorRef} className="flex-1" />
        
        {/* Output panel */}
        {output && (
          <div className="h-24 border-t border-border bg-muted p-4 font-mono text-sm">
            {output}
          </div>
        )}
      </div>
      
      {/* Preview panel */}
      <div className="w-1/2 border-l border-border bg-gray-50">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Preview</p>
            <p className="text-sm">Run your code to see the result</p>
          </div>
        </div>
      </div>
    </div>
  )
}