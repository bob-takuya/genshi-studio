/**
 * Sync Engine Demonstration and Testing
 * Shows how the real-time synchronization engine works between all modes
 */

import { 
  initializeSyncEngine,
  syncIntegration,
  ModeType,
  ChangeType,
  SyncPriority,
  conflictResolver,
  webglOptimization,
  type SyncChange,
  type DrawData,
  type ParametricData,
  type CodeData,
  type GrowthData
} from './index'

/**
 * Demo class showing sync engine capabilities
 */
export class SyncEngineDemo {
  private canvas: HTMLCanvasElement | null = null
  private demoRunning = false
  
  constructor() {
    console.log('🎮 SyncEngineDemo initialized')
  }
  
  /**
   * Initialize the demo with a canvas element
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas
    
    console.log('🚀 Starting Sync Engine Demo...')
    
    // Initialize the sync engine
    await initializeSyncEngine()
    
    // Initialize WebGL optimization
    await webglOptimization.initialize(canvas)
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('✅ Demo initialized successfully!')
  }
  
  /**
   * Start the demo simulation
   */
  public async startDemo(): Promise<void> {
    if (this.demoRunning) return
    
    this.demoRunning = true
    console.log('🎬 Starting sync engine demonstration...')
    
    // Run demo scenarios
    await this.runDrawModeDemo()
    await this.wait(2000)
    
    await this.runParametricModeDemo()
    await this.wait(2000)
    
    await this.runCodeModeDemo()
    await this.wait(2000)
    
    await this.runGrowthModeDemo()
    await this.wait(2000)
    
    await this.runConflictDemo()
    await this.wait(2000)
    
    await this.runPerformanceDemo()
    
    console.log('🏁 Demo completed!')
    this.demoRunning = false
  }
  
  /**
   * Stop the demo
   */
  public stopDemo(): void {
    this.demoRunning = false
    console.log('⏹️ Demo stopped')
  }
  
  /**
   * Get demo status and metrics
   */
  public getStatus() {
    return {
      running: this.demoRunning,
      syncEngine: syncIntegration.getStatus(),
      webgl: webglOptimization.getPerformanceMetrics(),
      conflicts: conflictResolver.getConflictStats()
    }
  }
  
  // Demo scenarios
  
  private async runDrawModeDemo(): Promise<void> {
    console.log('🎨 Demo: Draw Mode → Other Modes')
    
    // Simulate user drawing strokes
    const drawData: DrawData = {
      strokes: [
        {
          id: 'stroke-1',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 200 },
            { x: 100, y: 200 },
            { x: 100, y: 100 }
          ],
          color: '#ff0000',
          width: 3,
          opacity: 1.0,
          timestamp: Date.now()
        },
        {
          id: 'stroke-2',
          points: [
            { x: 150, y: 50 },
            { x: 250, y: 150 },
            { x: 150, y: 250 },
            { x: 50, y: 150 },
            { x: 150, y: 50 }
          ],
          color: '#00ff00',
          width: 2,
          opacity: 0.8,
          timestamp: Date.now()
        }
      ],
      layers: [],
      canvas: {
        width: 800,
        height: 600,
        background: '#ffffff'
      }
    }
    
    // Trigger draw mode change
    await syncIntegration.triggerChange(
      ModeType.DRAW,
      ChangeType.STROKE_ADDED,
      drawData,
      SyncPriority.USER_ACTION,
      { demo: 'draw_mode', user: 'demo_user' }
    )
    
    console.log('✅ Draw strokes should now be translated to other modes')
  }
  
  private async runParametricModeDemo(): Promise<void> {
    console.log('📐 Demo: Parametric Mode → Other Modes')
    
    // Simulate parametric pattern change
    const parametricData: ParametricData = {
      patterns: [],
      parameters: {},
      activePattern: {
        type: 'seigaiha',
        size: 40,
        density: 1.2,
        rotation: 0,
        colors: {
          primary: '#0066cc',
          secondary: '#ffffff',
          accent: '#ff6600'
        },
        opacity: 0.9
      }
    }
    
    // Trigger parametric change
    await syncIntegration.triggerChange(
      ModeType.PARAMETRIC,
      ChangeType.PARAMETER_CHANGED,
      parametricData,
      SyncPriority.USER_ACTION,
      { demo: 'parametric_mode', pattern: 'seigaiha' }
    )
    
    console.log('✅ Parametric pattern should generate code and visual elements')
  }
  
  private async runCodeModeDemo(): Promise<void> {
    console.log('💻 Demo: Code Mode → Other Modes')
    
    // Simulate code execution
    const codeData: CodeData = {
      code: `// Auto-generated from demo
canvas.background('#f0f0f0')
draw.fill('#ff00ff')
draw.noStroke()

for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    const x = i * 80 + 50
    const y = j * 80 + 50
    shapes.circle(x, y, 20)
  }
}`,
      executionResult: {
        success: true,
        output: 'Generated 25 circles',
        errors: [],
        generatedShapes: [
          { type: 'circle', x: 50, y: 50, radius: 20, color: '#ff00ff' },
          { type: 'circle', x: 130, y: 50, radius: 20, color: '#ff00ff' },
          // ... more shapes would be here
        ]
      },
      lastExecution: Date.now()
    }
    
    // Trigger code execution
    await syncIntegration.triggerChange(
      ModeType.CODE,
      ChangeType.CODE_EXECUTED,
      codeData,
      SyncPriority.USER_ACTION,
      { demo: 'code_mode', generated_shapes: 25 }
    )
    
    console.log('✅ Code execution should create visual elements in other modes')
  }
  
  private async runGrowthModeDemo(): Promise<void> {
    console.log('🌱 Demo: Growth Mode → Other Modes')
    
    // Simulate growth algorithm update
    const growthData: GrowthData = {
      algorithm: 'organic',
      parameters: {
        complexity: 0.7,
        randomSeed: 12345,
        iterations: 50
      },
      points: [
        { x: 400, y: 300 },
        { x: 402, y: 301 },
        { x: 405, y: 303 },
        { x: 409, y: 306 },
        { x: 414, y: 310 },
        // ... growth would continue
      ],
      generation: 25,
      settings: {
        growthRate: 0.03,
        density: 0.6,
        colors: {
          primary: '#001122',
          secondary: '#00ff88',
          accent: '#ff8800'
        },
        interactive: true
      }
    }
    
    // Trigger growth update
    await syncIntegration.triggerChange(
      ModeType.GROWTH,
      ChangeType.GROWTH_UPDATED,
      growthData,
      SyncPriority.ALGORITHM_UPDATE,
      { demo: 'growth_mode', generation: 25 }
    )
    
    console.log('✅ Growth pattern should create organic elements in other modes')
  }
  
  private async runConflictDemo(): Promise<void> {
    console.log('⚔️ Demo: Conflict Resolution')
    
    // Create conflicting changes simultaneously
    const changes = [
      // User drawing
      syncIntegration.triggerChange(
        ModeType.DRAW,
        ChangeType.STROKE_ADDED,
        { strokes: [{ id: 'conflict-1', color: '#ff0000' }] },
        SyncPriority.USER_ACTION,
        { demo: 'conflict', source: 'user_drawing' }
      ),
      
      // Parametric update
      syncIntegration.triggerChange(
        ModeType.PARAMETRIC,
        ChangeType.PARAMETER_CHANGED,
        { activePattern: { type: 'ichimatsu', colors: { primary: '#0000ff' } } },
        SyncPriority.DERIVED_CHANGE,
        { demo: 'conflict', source: 'parametric_auto' }
      ),
      
      // Growth algorithm
      syncIntegration.triggerChange(
        ModeType.GROWTH,
        ChangeType.GROWTH_UPDATED,
        { generation: 30, settings: { colors: { secondary: '#00ff00' } } },
        SyncPriority.ALGORITHM_UPDATE,
        { demo: 'conflict', source: 'growth_algo' }
      )
    ]
    
    // Wait for conflicts to be resolved
    await Promise.all(changes)
    
    console.log('✅ Conflicts should be resolved with user action taking priority')
  }
  
  private async runPerformanceDemo(): Promise<void> {
    console.log('🚀 Demo: Performance Test')
    
    // Generate rapid changes to test performance
    const rapidChanges = []
    
    for (let i = 0; i < 100; i++) {
      rapidChanges.push(
        syncIntegration.triggerChange(
          ModeType.DRAW,
          ChangeType.STROKE_ADDED,
          {
            strokes: [{
              id: `perf-stroke-${i}`,
              points: [
                { x: Math.random() * 800, y: Math.random() * 600 },
                { x: Math.random() * 800, y: Math.random() * 600 }
              ],
              color: `hsl(${i * 3.6}, 70%, 50%)`,
              width: 2,
              opacity: 0.8,
              timestamp: Date.now()
            }]
          },
          SyncPriority.USER_ACTION,
          { demo: 'performance', batch: i }
        )
      )
      
      // Small delay between changes
      if (i % 10 === 0) {
        await this.wait(50)
      }
    }
    
    await Promise.all(rapidChanges)
    
    // Display performance metrics
    const metrics = syncIntegration.getPerformanceMetrics()
    console.log('📊 Performance Metrics:', metrics)
    
    console.log('✅ Performance test completed - check metrics for FPS and latency')
  }
  
  private setupEventListeners(): void {
    // Listen for sync events
    syncIntegration.on('performance:warning', (warning) => {
      console.warn('⚠️ Performance Warning:', warning)
    })
    
    syncIntegration.on('mode:draw:updated', (state, change) => {
      console.log('🎨 Draw mode updated:', { changeId: change.id, strokeCount: state.data.strokes?.length })
    })
    
    syncIntegration.on('mode:parametric:updated', (state, change) => {
      console.log('📐 Parametric mode updated:', { changeId: change.id, pattern: state.data.activePattern?.type })
    })
    
    syncIntegration.on('mode:code:updated', (state, change) => {
      console.log('💻 Code mode updated:', { changeId: change.id, codeLength: state.data.code?.length })
    })
    
    syncIntegration.on('mode:growth:updated', (state, change) => {
      console.log('🌱 Growth mode updated:', { changeId: change.id, generation: state.data.generation })
    })
    
    // Listen for conflicts
    syncIntegration.on('mode:draw:conflict', (resolution) => {
      console.log('⚔️ Draw conflict resolved:', resolution.strategy)
    })
    
    console.log('👂 Event listeners setup for demo monitoring')
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Quick demo function for testing
 */
export async function runQuickDemo(canvas: HTMLCanvasElement): Promise<void> {
  const demo = new SyncEngineDemo()
  await demo.initialize(canvas)
  await demo.startDemo()
  
  // Return status
  const status = demo.getStatus()
  console.log('📋 Final Demo Status:', status)
  
  return status
}

// Export demo instance
export const syncEngineDemo = new SyncEngineDemo()