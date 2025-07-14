/**
 * Genshi Studio Real-time Synchronization Engine
 * Main export file for the synchronization system
 */

// Core engine
export { 
  SynchronizationEngine, 
  syncEngine,
  ModeType,
  ChangeType,
  SyncPriority,
  type SyncChange,
  type ModeState,
  type ConflictResolution,
  type PerformanceMetrics
} from './SynchronizationEngine'

// Enhanced sync engine with CRDT/OT support
export {
  SyncEngine,
  enhancedSyncEngine,
  type EnhancedSyncChange,
  type WebSocketConfig
} from './SyncEngine'

// CRDT Manager
export {
  CRDTManager,
  CRDTType,
  type CRDTOperation,
  type VectorClock,
  type CRDTStats
} from './CRDTManager'

// Operational Transform
export {
  OperationalTransform,
  OTOpType,
  type OTOperation,
  type TransformResult,
  type OTStats
} from './OperationalTransform'

// Translation layers
export { 
  TranslationLayers,
  type DrawData,
  type ParametricData,
  type CodeData,
  type GrowthData,
  type DrawStroke,
  type ParametricPattern
} from './TranslationLayers'

// Conflict resolution
export { 
  ConflictResolutionEngine,
  conflictResolver,
  ConflictType,
  type ConflictContext,
  type ConflictStrategy
} from './ConflictResolution'

// Integration layer
export { 
  SyncIntegration,
  syncIntegration,
  useSyncIntegration,
  useModeSync
} from './SyncIntegration'

// WebGL optimization
export { 
  WebGLOptimization,
  webglOptimization
} from './WebGLOptimization'

// Convenience function to initialize the entire sync system
export async function initializeSyncEngine(useEnhanced: boolean = true): Promise<void> {
  try {
    console.log('🚀 Initializing Genshi Studio Sync Engine...')
    
    if (useEnhanced) {
      // Start the enhanced sync engine with CRDT/OT support
      enhancedSyncEngine.start()
      console.log('⚡ Enhanced sync engine started with CRDT/OT support')
      console.log('🎯 <100ms latency target active')
      console.log('🔗 CRDT conflict resolution enabled')
      console.log('🔄 Operational Transform ready')
    }
    
    // Initialize the integration layer (which starts the engine)
    await syncIntegration.initialize()
    
    console.log('✅ Sync Engine initialized successfully!')
    console.log('📊 Available modes:', Object.values(ModeType))
    console.log('🔄 Translation layers active')
    console.log('⚖️ Conflict resolution ready')
    console.log('🎯 Target performance: 60fps real-time sync')
    
  } catch (error) {
    console.error('❌ Failed to initialize Sync Engine:', error)
    throw error
  }
}

// Convenience function to get sync engine status
export function getSyncEngineStatus() {
  const enhanced = enhancedSyncEngine.getEnhancedMetrics()
  
  return {
    integration: syncIntegration.getStatus(),
    performance: syncIntegration.getPerformanceMetrics(),
    conflicts: conflictResolver.getConflictStats(),
    enhanced: {
      latency: enhanced.syncLatency,
      fps: enhanced.frameTime > 0 ? 1000 / enhanced.frameTime : 0,
      crdt: enhanced.crdtStats,
      ot: enhanced.otStats,
      websocket: enhanced.wsStatus,
      droppedFrames: enhanced.droppedFrames,
      totalOperations: enhanced.totalOperations
    }
  }
}

// Convenience function for quick mode synchronization
export async function quickSync(
  sourceMode: ModeType,
  changeType: ChangeType,
  data: any,
  priority: SyncPriority = SyncPriority.USER_ACTION
): Promise<void> {
  // Use enhanced sync engine for better performance
  const change: EnhancedSyncChange = {
    id: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    sourceMode,
    changeType,
    priority,
    data
  }
  
  await enhancedSyncEngine.applyChange(change)
}

// Export types for external use
export type {
  SyncChange,
  ModeState,
  ConflictResolution,
  PerformanceMetrics,
  DrawData,
  ParametricData,
  CodeData,
  GrowthData,
  DrawStroke,
  ParametricPattern,
  ConflictContext,
  ConflictStrategy
}