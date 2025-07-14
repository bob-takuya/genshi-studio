/**
 * Demo: Real-time Synchronization System
 * Showcases <100ms latency, CRDT, and OT capabilities
 */

import { 
  initializeSyncEngine,
  enhancedSyncEngine,
  ModeType,
  ChangeType,
  SyncPriority,
  EnhancedSyncChange,
  getSyncEngineStatus
} from '../src/core/sync'

// Performance monitoring
let frameCount = 0
let lastFpsUpdate = Date.now()
let currentFps = 0

function updateFps() {
  frameCount++
  const now = Date.now()
  if (now - lastFpsUpdate >= 1000) {
    currentFps = frameCount
    frameCount = 0
    lastFpsUpdate = now
  }
}

// Demo scenarios
async function demoBasicSync() {
  console.log('\n🎯 Demo 1: Basic Synchronization (<100ms latency)')
  console.log('================================================')
  
  const startTime = performance.now()
  
  // Simulate user drawing a stroke
  const drawChange: EnhancedSyncChange = {
    id: 'demo-stroke-1',
    timestamp: Date.now(),
    sourceMode: ModeType.DRAW,
    changeType: ChangeType.STROKE_ADDED,
    priority: SyncPriority.USER_ACTION,
    data: {
      id: 'user-stroke-1',
      points: [
        { x: 100, y: 100 },
        { x: 150, y: 120 },
        { x: 200, y: 100 }
      ],
      color: '#FF5733',
      width: 3
    }
  }
  
  await enhancedSyncEngine.applyChange(drawChange)
  
  const latency = performance.now() - startTime
  console.log(`✅ Stroke synchronized in ${latency.toFixed(2)}ms`)
  
  // Check if it propagated to other modes
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const status = getSyncEngineStatus()
  console.log(`📊 Current FPS: ${status.enhanced.fps.toFixed(1)}`)
  console.log(`📈 Total operations: ${status.enhanced.totalOperations}`)
}

async function demoConcurrentEditing() {
  console.log('\n🔗 Demo 2: Concurrent Editing with CRDT')
  console.log('=======================================')
  
  // Simulate two users editing simultaneously
  const user1Changes: EnhancedSyncChange[] = []
  const user2Changes: EnhancedSyncChange[] = []
  
  // User 1 draws a circle pattern
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    user1Changes.push({
      id: `user1-point-${i}`,
      timestamp: Date.now() + i,
      sourceMode: ModeType.DRAW,
      changeType: ChangeType.STROKE_ADDED,
      priority: SyncPriority.USER_ACTION,
      data: {
        id: `circle-stroke-${i}`,
        points: [{
          x: 200 + Math.cos(angle) * 50,
          y: 200 + Math.sin(angle) * 50
        }],
        color: '#3498DB'
      }
    })
  }
  
  // User 2 modifies parameters
  for (let i = 0; i < 5; i++) {
    user2Changes.push({
      id: `user2-param-${i}`,
      timestamp: Date.now() + i * 2,
      sourceMode: ModeType.PARAMETRIC,
      changeType: ChangeType.PARAMETER_CHANGED,
      priority: SyncPriority.USER_ACTION,
      data: {
        parameter: `param-${i}`,
        value: Math.random() * 100
      }
    })
  }
  
  // Apply changes concurrently
  console.log('👥 Simulating concurrent edits from 2 users...')
  
  const applyPromises: Promise<void>[] = []
  
  // Interleave the changes
  const maxChanges = Math.max(user1Changes.length, user2Changes.length)
  for (let i = 0; i < maxChanges; i++) {
    if (i < user1Changes.length) {
      applyPromises.push(enhancedSyncEngine.applyChange(user1Changes[i]))
    }
    if (i < user2Changes.length) {
      applyPromises.push(enhancedSyncEngine.applyChange(user2Changes[i]))
    }
  }
  
  await Promise.all(applyPromises)
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const metrics = enhancedSyncEngine.getEnhancedMetrics()
  console.log(`✅ Processed ${user1Changes.length + user2Changes.length} concurrent operations`)
  console.log(`⚡ Average latency: ${metrics.syncLatency.toFixed(2)}ms`)
  console.log(`🔄 CRDT conflicts resolved: ${metrics.crdtStats.conflicts}`)
  console.log(`📊 CRDT merges performed: ${metrics.crdtStats.merges}`)
}

async function demoOperationalTransform() {
  console.log('\n🔄 Demo 3: Operational Transform for Code Mode')
  console.log('==============================================')
  
  // Simulate collaborative coding
  const codeBase = 'function draw() {\n  // Draw something\n}'
  
  // User 1 adds a circle call
  const user1Insert: EnhancedSyncChange = {
    id: 'code-insert-1',
    timestamp: Date.now(),
    sourceMode: ModeType.CODE,
    changeType: ChangeType.CODE_EXECUTED,
    priority: SyncPriority.USER_ACTION,
    data: {
      position: 18, // After opening brace
      length: 22,
      text: '\n  circle(100, 100, 50);'
    }
  }
  
  // User 2 adds a rectangle call at the same position
  const user2Insert: EnhancedSyncChange = {
    id: 'code-insert-2',
    timestamp: Date.now() + 1,
    sourceMode: ModeType.CODE,
    changeType: ChangeType.CODE_EXECUTED,
    priority: SyncPriority.USER_ACTION,
    data: {
      position: 18,
      length: 24,
      text: '\n  rect(200, 200, 80, 60);'
    }
  }
  
  console.log('📝 Two users inserting code at the same position...')
  
  await enhancedSyncEngine.applyChange(user1Insert)
  await enhancedSyncEngine.applyChange(user2Insert)
  
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const metrics = enhancedSyncEngine.getEnhancedMetrics()
  console.log(`✅ OT transforms applied: ${metrics.otStats.transforms}`)
  console.log(`⚠️  OT conflicts detected: ${metrics.otStats.conflicts}`)
  console.log(`🔧 OT compositions: ${metrics.otStats.compositions}`)
}

async function demoGrowthAlgorithm() {
  console.log('\n🌱 Demo 4: Growth Algorithm Synchronization')
  console.log('==========================================')
  
  // Simulate organic growth pattern
  const growthSteps = 20
  const changes: EnhancedSyncChange[] = []
  
  console.log('🌿 Simulating organic growth pattern...')
  
  for (let step = 0; step < growthSteps; step++) {
    // Generate growth points in a spiral pattern
    const angle = step * 0.5
    const radius = step * 5
    
    changes.push({
      id: `growth-${step}`,
      timestamp: Date.now() + step * 10,
      sourceMode: ModeType.GROWTH,
      changeType: ChangeType.GROWTH_UPDATED,
      priority: SyncPriority.ALGORITHM_UPDATE,
      data: {
        algorithm: 'organic-spiral',
        step,
        points: [{
          x: 300 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          size: 5 + Math.sin(step * 0.2) * 3,
          color: `hsl(${step * 10}, 70%, 50%)`
        }],
        parameters: {
          growthRate: 0.1,
          branching: Math.random() > 0.7
        }
      }
    })
  }
  
  // Apply growth updates with animation timing
  for (const change of changes) {
    await enhancedSyncEngine.applyChange(change)
    updateFps()
    
    // Small delay to simulate animation
    await new Promise(resolve => setTimeout(resolve, 16)) // ~60fps
  }
  
  const metrics = enhancedSyncEngine.getEnhancedMetrics()
  console.log(`✅ Growth steps synchronized: ${growthSteps}`)
  console.log(`📊 Current FPS: ${currentFps}`)
  console.log(`⚡ Batch processing efficiency: ${metrics.compressionRatio.toFixed(2)}x`)
}

async function demoUndoRedo() {
  console.log('\n↩️  Demo 5: Undo/Redo with CRDT')
  console.log('================================')
  
  // Create a series of operations
  const operations = [
    {
      id: 'undo-demo-1',
      sourceMode: ModeType.DRAW,
      changeType: ChangeType.STROKE_ADDED,
      data: { id: 'stroke-1', color: '#E74C3C' }
    },
    {
      id: 'undo-demo-2',
      sourceMode: ModeType.PARAMETRIC,
      changeType: ChangeType.PARAMETER_CHANGED,
      data: { parameter: 'size', value: 100 }
    },
    {
      id: 'undo-demo-3',
      sourceMode: ModeType.DRAW,
      changeType: ChangeType.STROKE_MODIFIED,
      data: { id: 'stroke-1', color: '#2ECC71' }
    }
  ]
  
  console.log('📝 Applying operations...')
  for (const op of operations) {
    const change: EnhancedSyncChange = {
      ...op,
      timestamp: Date.now(),
      priority: SyncPriority.USER_ACTION
    }
    await enhancedSyncEngine.applyChange(change)
    console.log(`  ✓ ${op.changeType}: ${JSON.stringify(op.data)}`)
  }
  
  await new Promise(resolve => setTimeout(resolve, 50))
  
  console.log('\n↩️  Undoing last 2 operations...')
  await enhancedSyncEngine.undo()
  console.log('  ✓ Undid stroke color modification')
  
  await enhancedSyncEngine.undo()
  console.log('  ✓ Undid parameter change')
  
  console.log('\n↪️  Redoing 1 operation...')
  await enhancedSyncEngine.redo()
  console.log('  ✓ Redid parameter change')
  
  const metrics = enhancedSyncEngine.getEnhancedMetrics()
  console.log(`\n📊 CRDT inversions performed: ${metrics.crdtStats.inversions || 0}`)
}

async function demoStressTest() {
  console.log('\n💪 Demo 6: Stress Test - 1000 Operations')
  console.log('========================================')
  
  const operationCount = 1000
  const startTime = performance.now()
  let droppedFrames = 0
  
  console.log(`🚀 Applying ${operationCount} random operations...`)
  
  for (let i = 0; i < operationCount; i++) {
    const frameStart = performance.now()
    
    // Random operation type
    const opType = Math.floor(Math.random() * 4)
    let change: EnhancedSyncChange
    
    switch (opType) {
      case 0: // Draw operation
        change = {
          id: `stress-draw-${i}`,
          timestamp: Date.now(),
          sourceMode: ModeType.DRAW,
          changeType: ChangeType.STROKE_ADDED,
          priority: SyncPriority.USER_ACTION,
          data: {
            id: `stress-stroke-${i}`,
            points: [{ x: Math.random() * 500, y: Math.random() * 500 }]
          }
        }
        break
        
      case 1: // Parameter change
        change = {
          id: `stress-param-${i}`,
          timestamp: Date.now(),
          sourceMode: ModeType.PARAMETRIC,
          changeType: ChangeType.PARAMETER_CHANGED,
          priority: SyncPriority.USER_ACTION,
          data: {
            parameter: `param-${i % 10}`,
            value: Math.random() * 100
          }
        }
        break
        
      case 2: // Code execution
        change = {
          id: `stress-code-${i}`,
          timestamp: Date.now(),
          sourceMode: ModeType.CODE,
          changeType: ChangeType.CODE_EXECUTED,
          priority: SyncPriority.ALGORITHM_UPDATE,
          data: {
            code: `operation${i}()`,
            result: 'success'
          }
        }
        break
        
      default: // Growth update
        change = {
          id: `stress-growth-${i}`,
          timestamp: Date.now(),
          sourceMode: ModeType.GROWTH,
          changeType: ChangeType.GROWTH_UPDATED,
          priority: SyncPriority.ALGORITHM_UPDATE,
          data: {
            point: { x: Math.random() * 500, y: Math.random() * 500 },
            growth: Math.random()
          }
        }
    }
    
    await enhancedSyncEngine.applyChange(change)
    
    const frameTime = performance.now() - frameStart
    if (frameTime > 16.67) { // Missed 60fps target
      droppedFrames++
    }
    
    // Progress update every 100 operations
    if ((i + 1) % 100 === 0) {
      const elapsed = performance.now() - startTime
      const opsPerSec = (i + 1) / (elapsed / 1000)
      process.stdout.write(`\r  Progress: ${i + 1}/${operationCount} (${opsPerSec.toFixed(0)} ops/sec)`)
    }
  }
  
  const totalTime = performance.now() - startTime
  const metrics = enhancedSyncEngine.getEnhancedMetrics()
  
  console.log('\n\n📊 Stress Test Results:')
  console.log(`  ✓ Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`  ✓ Operations per second: ${(operationCount / (totalTime / 1000)).toFixed(0)}`)
  console.log(`  ✓ Average latency: ${metrics.syncLatency.toFixed(2)}ms`)
  console.log(`  ✓ Dropped frames: ${metrics.droppedFrames} (${(metrics.droppedFrames / operationCount * 100).toFixed(1)}%)`)
  console.log(`  ✓ Compression ratio: ${metrics.compressionRatio.toFixed(2)}x`)
  console.log(`  ✓ Total operations processed: ${metrics.totalOperations}`)
}

// Main demo runner
async function runDemo() {
  console.log('🎨 Genshi Studio - Real-time Synchronization Demo')
  console.log('================================================\n')
  
  console.log('Initializing enhanced sync engine...')
  await initializeSyncEngine(true)
  
  await demoBasicSync()
  await demoConcurrentEditing()
  await demoOperationalTransform()
  await demoGrowthAlgorithm()
  await demoUndoRedo()
  await demoStressTest()
  
  console.log('\n\n✅ All demos completed!')
  
  const finalStatus = getSyncEngineStatus()
  console.log('\n📊 Final System Status:')
  console.log(`  • Total operations: ${finalStatus.enhanced.totalOperations}`)
  console.log(`  • WebSocket status: ${finalStatus.enhanced.websocket}`)
  console.log(`  • CRDT sites active: ${finalStatus.enhanced.crdt.sites}`)
  console.log(`  • OT average complexity: ${finalStatus.enhanced.ot.averageComplexity?.toFixed(2) || 'N/A'}`)
  
  // Cleanup
  enhancedSyncEngine.destroy()
  console.log('\n👋 Sync engine cleaned up. Demo complete!')
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error)
}

export { runDemo }