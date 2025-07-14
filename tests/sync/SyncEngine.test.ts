/**
 * Tests for Enhanced Synchronization Engine
 * Validates <100ms latency, CRDT functionality, and OT correctness
 */

import { 
  enhancedSyncEngine,
  ModeType,
  ChangeType,
  SyncPriority,
  EnhancedSyncChange
} from '../../src/core/sync'

describe('Enhanced Synchronization Engine', () => {
  beforeEach(() => {
    enhancedSyncEngine.start()
  })
  
  afterEach(() => {
    enhancedSyncEngine.destroy()
  })
  
  describe('Performance Requirements', () => {
    test('achieves <100ms sync latency', async () => {
      const startTime = performance.now()
      
      const change: EnhancedSyncChange = {
        id: 'test-1',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-1',
          points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
          color: '#000000',
          width: 2
        }
      }
      
      await enhancedSyncEngine.applyChange(change)
      
      const endTime = performance.now()
      const latency = endTime - startTime
      
      expect(latency).toBeLessThan(100) // <100ms requirement
    })
    
    test('maintains 60fps update rate', async () => {
      const changes: EnhancedSyncChange[] = []
      
      // Generate 100 changes
      for (let i = 0; i < 100; i++) {
        changes.push({
          id: `test-${i}`,
          timestamp: Date.now(),
          sourceMode: ModeType.DRAW,
          changeType: ChangeType.STROKE_MODIFIED,
          priority: SyncPriority.USER_ACTION,
          data: { id: `stroke-${i}`, x: i, y: i }
        })
      }
      
      // Apply all changes
      const startTime = performance.now()
      
      for (const change of changes) {
        await enhancedSyncEngine.applyChange(change)
      }
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      const fps = metrics.frameTime > 0 ? 1000 / metrics.frameTime : 0
      
      expect(fps).toBeGreaterThanOrEqual(55) // Allow slight variance from 60fps
      expect(metrics.droppedFrames).toBeLessThan(5) // Minimal dropped frames
    })
  })
  
  describe('CRDT Functionality', () => {
    test('handles concurrent stroke additions without conflicts', async () => {
      // Simulate two users adding strokes simultaneously
      const change1: EnhancedSyncChange = {
        id: 'user1-stroke',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-user1',
          points: [{ x: 0, y: 0 }, { x: 50, y: 50 }],
          color: '#FF0000'
        }
      }
      
      const change2: EnhancedSyncChange = {
        id: 'user2-stroke',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-user2',
          points: [{ x: 100, y: 100 }, { x: 150, y: 150 }],
          color: '#00FF00'
        }
      }
      
      // Apply both changes
      await enhancedSyncEngine.applyChange(change1)
      await enhancedSyncEngine.applyChange(change2)
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      
      // Both strokes should be added without conflicts
      expect(metrics.crdtStats.conflicts).toBe(0)
      expect(metrics.totalOperations).toBe(2)
    })
    
    test('merges concurrent parameter changes correctly', async () => {
      // Two users changing different parameters
      const change1: EnhancedSyncChange = {
        id: 'param-1',
        timestamp: Date.now(),
        sourceMode: ModeType.PARAMETRIC,
        changeType: ChangeType.PARAMETER_CHANGED,
        priority: SyncPriority.USER_ACTION,
        data: {
          parameter: 'radius',
          value: 50
        }
      }
      
      const change2: EnhancedSyncChange = {
        id: 'param-2',
        timestamp: Date.now() + 1,
        sourceMode: ModeType.PARAMETRIC,
        changeType: ChangeType.PARAMETER_CHANGED,
        priority: SyncPriority.USER_ACTION,
        data: {
          parameter: 'segments',
          value: 8
        }
      }
      
      await enhancedSyncEngine.applyChange(change1)
      await enhancedSyncEngine.applyChange(change2)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const state = enhancedSyncEngine.getModeState(ModeType.PARAMETRIC)
      
      // Both parameters should be applied
      expect(state?.data.radius).toBe(50)
      expect(state?.data.segments).toBe(8)
    })
  })
  
  describe('Operational Transform', () => {
    test('transforms overlapping text insertions', async () => {
      // Two users inserting text at the same position
      const change1: EnhancedSyncChange = {
        id: 'insert-1',
        timestamp: Date.now(),
        sourceMode: ModeType.CODE,
        changeType: ChangeType.CODE_EXECUTED,
        priority: SyncPriority.USER_ACTION,
        data: {
          position: 10,
          length: 5,
          text: 'hello'
        }
      }
      
      const change2: EnhancedSyncChange = {
        id: 'insert-2',
        timestamp: Date.now() + 1,
        sourceMode: ModeType.CODE,
        changeType: ChangeType.CODE_EXECUTED,
        priority: SyncPriority.USER_ACTION,
        data: {
          position: 10,
          length: 5,
          text: 'world'
        }
      }
      
      await enhancedSyncEngine.applyChange(change1)
      await enhancedSyncEngine.applyChange(change2)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      
      // Should transform second insert to position 15
      expect(metrics.otStats.transforms).toBeGreaterThan(0)
      expect(metrics.otStats.conflicts).toBeGreaterThan(0)
    })
    
    test('handles stroke movement conflicts', async () => {
      // Two users moving the same stroke
      const change1: EnhancedSyncChange = {
        id: 'move-1',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_MODIFIED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-shared',
          x: 100,
          y: 100
        }
      }
      
      const change2: EnhancedSyncChange = {
        id: 'move-2',
        timestamp: Date.now() + 1,
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_MODIFIED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-shared',
          x: 200,
          y: 200
        }
      }
      
      await enhancedSyncEngine.applyChange(change1)
      await enhancedSyncEngine.applyChange(change2)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      
      // Should detect and resolve conflict
      expect(metrics.otStats.conflicts).toBeGreaterThan(0)
    })
  })
  
  describe('Undo/Redo Support', () => {
    test('supports undo of stroke additions', async () => {
      const change: EnhancedSyncChange = {
        id: 'undo-test-1',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: {
          id: 'stroke-undo',
          points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
        }
      }
      
      await enhancedSyncEngine.applyChange(change)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Perform undo
      await enhancedSyncEngine.undo()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      expect(metrics.crdtStats.inversions).toBeGreaterThan(0)
    })
    
    test('supports redo after undo', async () => {
      const change: EnhancedSyncChange = {
        id: 'redo-test-1',
        timestamp: Date.now(),
        sourceMode: ModeType.PARAMETRIC,
        changeType: ChangeType.PARAMETER_CHANGED,
        priority: SyncPriority.USER_ACTION,
        data: {
          parameter: 'size',
          value: 100
        }
      }
      
      await enhancedSyncEngine.applyChange(change)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Undo then redo
      await enhancedSyncEngine.undo()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      await enhancedSyncEngine.redo()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const state = enhancedSyncEngine.getModeState(ModeType.PARAMETRIC)
      expect(state?.data.size).toBe(100)
    })
  })
  
  describe('Dirty Region Tracking', () => {
    test('tracks dirty regions for optimized rendering', async () => {
      const changes: EnhancedSyncChange[] = [
        {
          id: 'region-1',
          timestamp: Date.now(),
          sourceMode: ModeType.DRAW,
          changeType: ChangeType.STROKE_ADDED,
          priority: SyncPriority.USER_ACTION,
          data: { id: 'stroke-1' }
        },
        {
          id: 'region-2',
          timestamp: Date.now() + 1,
          sourceMode: ModeType.DRAW,
          changeType: ChangeType.STROKE_MODIFIED,
          priority: SyncPriority.USER_ACTION,
          data: { id: 'stroke-2' }
        }
      ]
      
      for (const change of changes) {
        await enhancedSyncEngine.applyChange(change)
      }
      
      const dirtyRegions = enhancedSyncEngine.getDirtyRegions()
      
      expect(dirtyRegions).toContain('stroke-stroke-1')
      expect(dirtyRegions).toContain('stroke-stroke-2')
      
      // Clear specific regions
      enhancedSyncEngine.clearDirtyRegions(['stroke-stroke-1'])
      
      const remainingRegions = enhancedSyncEngine.getDirtyRegions()
      expect(remainingRegions).not.toContain('stroke-stroke-1')
      expect(remainingRegions).toContain('stroke-stroke-2')
    })
  })
  
  describe('Batch Processing', () => {
    test('efficiently batches multiple operations', async () => {
      const batchSize = 100
      const changes: EnhancedSyncChange[] = []
      
      for (let i = 0; i < batchSize; i++) {
        changes.push({
          id: `batch-${i}`,
          timestamp: Date.now() + i,
          sourceMode: ModeType.GROWTH,
          changeType: ChangeType.GROWTH_UPDATED,
          priority: SyncPriority.ALGORITHM_UPDATE,
          data: {
            point: { x: i, y: i },
            growth: Math.random()
          }
        })
      }
      
      const startTime = performance.now()
      
      // Apply all changes rapidly
      for (const change of changes) {
        await enhancedSyncEngine.applyChange(change)
      }
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      const metrics = enhancedSyncEngine.getEnhancedMetrics()
      
      // Should process efficiently in batches
      expect(totalTime).toBeLessThan(500) // Process 100 operations in <500ms
      expect(metrics.compressionRatio).toBeGreaterThan(1) // Some compression should occur
    })
  })
})

describe('Integration Tests', () => {
  test('synchronizes all four modes seamlessly', async () => {
    enhancedSyncEngine.start()
    
    // Apply changes from all modes
    const changes: EnhancedSyncChange[] = [
      {
        id: 'draw-1',
        timestamp: Date.now(),
        sourceMode: ModeType.DRAW,
        changeType: ChangeType.STROKE_ADDED,
        priority: SyncPriority.USER_ACTION,
        data: { id: 'stroke-1', points: [{ x: 0, y: 0 }] }
      },
      {
        id: 'param-1',
        timestamp: Date.now() + 10,
        sourceMode: ModeType.PARAMETRIC,
        changeType: ChangeType.PATTERN_APPLIED,
        priority: SyncPriority.USER_ACTION,
        data: { pattern: 'spiral', parameters: { turns: 5 } }
      },
      {
        id: 'code-1',
        timestamp: Date.now() + 20,
        sourceMode: ModeType.CODE,
        changeType: ChangeType.CODE_EXECUTED,
        priority: SyncPriority.USER_ACTION,
        data: { code: 'circle(50)', result: 'success' }
      },
      {
        id: 'growth-1',
        timestamp: Date.now() + 30,
        sourceMode: ModeType.GROWTH,
        changeType: ChangeType.GROWTH_UPDATED,
        priority: SyncPriority.ALGORITHM_UPDATE,
        data: { algorithm: 'organic', step: 1 }
      }
    ]
    
    for (const change of changes) {
      await enhancedSyncEngine.applyChange(change)
    }
    
    // Wait for full synchronization
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const metrics = enhancedSyncEngine.getEnhancedMetrics()
    
    // All operations should be processed
    expect(metrics.totalOperations).toBe(4)
    
    // Verify all modes have state
    const modes = [ModeType.DRAW, ModeType.PARAMETRIC, ModeType.CODE, ModeType.GROWTH]
    for (const mode of modes) {
      const state = enhancedSyncEngine.getModeState(mode)
      expect(state).toBeDefined()
      expect(state?.version).toBeGreaterThan(0)
    }
    
    enhancedSyncEngine.destroy()
  })
})