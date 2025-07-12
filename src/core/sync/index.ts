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
export async function initializeSyncEngine(): Promise<void> {
  try {
    console.log('🚀 Initializing Genshi Studio Sync Engine...')
    
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
  return {
    integration: syncIntegration.getStatus(),
    performance: syncIntegration.getPerformanceMetrics(),
    conflicts: conflictResolver.getConflictStats()
  }
}

// Convenience function for quick mode synchronization
export async function quickSync(
  sourceMode: ModeType,
  changeType: ChangeType,
  data: any
): Promise<void> {
  await syncIntegration.triggerChange(sourceMode, changeType, data)
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