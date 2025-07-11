import { useRef, useEffect, useState } from 'react'
import * as monaco from 'monaco-editor'
import { Play, Save, Copy, RefreshCw, Loader2 } from 'lucide-react'
import { CodeExecutionEngine } from '../../core/execution/CodeExecutionEngine'
import { GraphicsBridge } from '../../core/execution/GraphicsBridge'
import { GraphicsEngine } from '../../graphics/engine/GraphicsEngine'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const graphicsEngineRef = useRef<GraphicsEngine | null>(null)
  const executionEngineRef = useRef<CodeExecutionEngine | null>(null)
  const graphicsBridgeRef = useRef<GraphicsBridge | null>(null)
  
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

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

  // Initialize graphics engine and execution engine
  useEffect(() => {
    if (!canvasRef.current) return

    // Create graphics engine
    const graphicsEngine = new GraphicsEngine({
      canvas: canvasRef.current,
      pixelRatio: window.devicePixelRatio
    })
    graphicsEngineRef.current = graphicsEngine

    // Create graphics bridge
    const graphicsBridge = new GraphicsBridge(graphicsEngine)
    graphicsBridgeRef.current = graphicsBridge

    // Create execution engine
    const executionEngine = new CodeExecutionEngine()
    executionEngineRef.current = executionEngine

    // Connect graphics bridge to execution engine
    executionEngine.connectGraphicsEngine(graphicsBridge)

    return () => {
      executionEngine.destroy()
      graphicsEngine.destroy()
    }
  }, [])

  // Run code
  const runCode = async () => {
    if (!monacoRef.current || !executionEngineRef.current) return
    
    setIsRunning(true)
    setOutput('Transpiling and executing code...')
    setExecutionTime(null)
    
    try {
      const code = monacoRef.current.getValue()
      
      // Execute code through the execution engine
      const result = await executionEngineRef.current.execute(code)
      
      if (result.success) {
        const totalTime = result.performance.transpileTime + result.performance.executionTime
        setExecutionTime(totalTime)
        
        let outputText = 'Code executed successfully!\n'
        outputText += `Transpilation: ${result.performance.transpileTime.toFixed(2)}ms\n`
        outputText += `Execution: ${result.performance.executionTime.toFixed(2)}ms\n`
        
        if (result.logs.length > 0) {
          outputText += '\n--- Console Output ---\n'
          outputText += result.logs.join('\n')
        }
        
        setOutput(outputText)
      } else {
        setOutput(`Error: ${result.error}\n${result.logs.join('\n')}`)
      }
      
    } catch (error) {
      setOutput(`Fatal Error: ${error instanceof Error ? error.message : String(error)}`)
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
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
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
          <div className="h-32 border-t border-border bg-muted p-4 font-mono text-sm overflow-y-auto">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
      
      {/* Preview panel */}
      <div className="w-1/2 border-l border-border bg-gray-50 relative">
        {/* Preview header */}
        <div className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview</span>
            {executionTime !== null && (
              <span className="text-xs text-muted-foreground">
                Executed in {executionTime.toFixed(2)}ms
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => graphicsBridgeRef.current?.clearExecutionLayer()}
              className="p-1.5 hover:bg-accent rounded-md transition-colors text-xs"
              title="Clear canvas"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Canvas container */}
        <div className="relative w-full h-[calc(100%-3rem)]">
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
          {!executionTime && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Run your code to see the result</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}