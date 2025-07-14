# Genshi Studio Real-time Synchronization System

## Overview

The Genshi Studio synchronization system provides real-time, conflict-free synchronization between all four creative modes (Draw, Parametric, Code, Growth) with sub-100ms latency and 60fps update rates. It combines CRDT (Conflict-free Replicated Data Types) and Operational Transform (OT) technologies to ensure smooth, concurrent multi-user editing capabilities.

## Key Features

### 🚀 Performance
- **<100ms latency**: Optimized for real-time responsiveness
- **60fps updates**: Smooth visual updates across all modes
- **Batch processing**: Intelligent operation batching for efficiency
- **Compression**: Automatic operation compression for reduced overhead
- **Dirty region tracking**: Optimized rendering with partial updates

### 🔗 CRDT Support
- **Grow-Only Sets**: For additive operations like stroke collections
- **Observed-Remove Sets**: For collections that support deletion
- **Last-Write-Wins Registers**: For simple value synchronization
- **Replicated Growable Arrays**: For ordered sequences
- **JSON CRDT**: For complex nested data structures

### 🔄 Operational Transform
- **Text transformations**: For code mode editing
- **Vector transformations**: For draw mode graphics
- **Conflict resolution**: Automatic handling of concurrent edits
- **Operation composition**: Efficient merging of related operations
- **Inversion support**: For undo/redo functionality

### 🌐 WebSocket Support
- **Real-time multiplayer**: Built-in WebSocket client
- **Automatic reconnection**: Resilient network handling
- **Heartbeat mechanism**: Connection health monitoring
- **Message compression**: Efficient network usage

### ↩️ Undo/Redo
- **Full history tracking**: Complete operation history
- **CRDT-based inversion**: Conflict-free undo operations
- **Bounded history**: Configurable history size limits
- **Selective undo**: Mode-specific undo capabilities

## Architecture

```
SyncEngine (Enhanced)
├── CRDTManager
│   ├── GrowOnlySet
│   ├── ObservedRemoveSet
│   ├── LWWRegister
│   ├── RGA
│   └── JsonCRDT
├── OperationalTransform
│   ├── TextOT
│   └── VectorOT
├── Performance Optimizer
│   ├── Batch Processor
│   ├── Compression Engine
│   └── Dirty Region Tracker
├── History Manager
│   ├── Undo Stack
│   └── Redo Stack
└── WebSocket Client
    ├── Connection Manager
    └── Message Handler
```

## Usage

### Basic Initialization

```typescript
import { initializeSyncEngine, enhancedSyncEngine } from '@/core/sync'

// Initialize with enhanced features
await initializeSyncEngine(true)

// The engine is now running and ready for synchronization
```

### Applying Changes

```typescript
import { 
  enhancedSyncEngine,
  ModeType,
  ChangeType,
  SyncPriority,
  EnhancedSyncChange
} from '@/core/sync'

// Create a change
const change: EnhancedSyncChange = {
  id: 'unique-change-id',
  timestamp: Date.now(),
  sourceMode: ModeType.DRAW,
  changeType: ChangeType.STROKE_ADDED,
  priority: SyncPriority.USER_ACTION,
  data: {
    id: 'stroke-123',
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    color: '#FF0000',
    width: 2
  }
}

// Apply the change (automatically syncs to other modes)
await enhancedSyncEngine.applyChange(change)
```

### Quick Sync Helper

```typescript
import { quickSync, ModeType, ChangeType } from '@/core/sync'

// Simplified synchronization
await quickSync(
  ModeType.PARAMETRIC,
  ChangeType.PARAMETER_CHANGED,
  { parameter: 'radius', value: 50 }
)
```

### Monitoring Performance

```typescript
// Get real-time metrics
const metrics = enhancedSyncEngine.getEnhancedMetrics()

console.log(`Latency: ${metrics.syncLatency}ms`)
console.log(`FPS: ${metrics.frameTime > 0 ? 1000 / metrics.frameTime : 0}`)
console.log(`Operations: ${metrics.totalOperations}`)
console.log(`CRDT Conflicts: ${metrics.crdtStats.conflicts}`)
console.log(`OT Transforms: ${metrics.otStats.transforms}`)
```

### Undo/Redo Operations

```typescript
// Undo last operation
await enhancedSyncEngine.undo()

// Redo operation
await enhancedSyncEngine.redo()
```

### Dirty Region Management

```typescript
// Get regions that need re-rendering
const dirtyRegions = enhancedSyncEngine.getDirtyRegions()

// Render only dirty regions
for (const region of dirtyRegions) {
  renderRegion(region)
}

// Clear regions after rendering
enhancedSyncEngine.clearDirtyRegions(dirtyRegions)
```

### WebSocket Configuration

```typescript
import { SyncEngine } from '@/core/sync'

// Create engine with WebSocket support
const syncEngine = new SyncEngine({
  url: 'ws://localhost:8080/sync',
  reconnectDelay: 5000,
  heartbeatInterval: 30000
})
```

## Change Types

### Draw Mode
- `STROKE_ADDED`: New stroke added to canvas
- `STROKE_MODIFIED`: Existing stroke modified
- `STROKE_REMOVED`: Stroke deleted

### Parametric Mode
- `PARAMETER_CHANGED`: Parameter value updated
- `PATTERN_APPLIED`: Pattern applied to canvas

### Code Mode
- `CODE_EXECUTED`: Code executed with results

### Growth Mode
- `GROWTH_UPDATED`: Growth algorithm step completed

### System
- `CANVAS_CLEARED`: Canvas cleared in any mode

## Priority Levels

1. `USER_ACTION`: Direct user interactions (highest priority)
2. `ALGORITHM_UPDATE`: Automatic algorithm updates
3. `DERIVED_CHANGE`: Changes derived from other modes
4. `BACKGROUND_SYNC`: Background synchronization (lowest priority)

## CRDT Types

### GrowOnlySet
- Use for collections that only grow (e.g., drawing history)
- No deletion support
- Automatic merge on conflicts

### ObservedRemoveSet (OR-Set)
- Use for collections that support both add and remove
- Tracks unique tags for each element
- Handles concurrent add/remove operations

### LWWRegister (Last-Write-Wins)
- Use for single values (e.g., parameters)
- Timestamp-based conflict resolution
- Site ID tiebreaker for true concurrency

### RGA (Replicated Growable Array)
- Use for ordered sequences (e.g., code lines)
- Supports insertion and deletion at any position
- Maintains consistent ordering across sites

### JsonCRDT
- Use for complex nested structures
- Combines multiple CRDT types
- Automatic type detection and handling

## Performance Optimization

### Batch Processing
Operations are automatically batched for efficiency:
- Maximum 50 operations per batch
- 16.67ms frame budget (60fps)
- Priority-based processing order

### Compression
Operations are compressed when threshold is exceeded:
- Compression after 100+ operations
- Adjacent similar operations merged
- Metadata preserved for debugging

### Dirty Regions
Only affected regions are marked for re-rendering:
- Stroke-level granularity for draw mode
- Parameter-specific updates
- Full canvas updates only when necessary

## Testing

Run the comprehensive test suite:

```bash
npm test -- tests/sync/SyncEngine.test.ts
```

Run the interactive demo:

```bash
npx ts-node demo/sync-demo.ts
```

## Troubleshooting

### High Latency
1. Check batch size configuration
2. Verify compression is working
3. Monitor operation complexity
4. Check for synchronous blocking operations

### Conflicts Not Resolving
1. Verify CRDT types are appropriate
2. Check vector clock synchronization
3. Ensure site IDs are unique
4. Review conflict resolution strategies

### Memory Usage
1. Monitor history size
2. Check operation cache limits
3. Clear old dirty regions
4. Review compression effectiveness

### WebSocket Issues
1. Check connection URL and port
2. Verify heartbeat configuration
3. Monitor reconnection attempts
4. Check firewall/proxy settings

## Future Enhancements

1. **Persistent Storage**: Save synchronization state
2. **Selective Sync**: Choose which changes to sync
3. **Conflict Visualization**: Show conflicts to users
4. **Performance Profiling**: Detailed performance analysis
5. **P2P Support**: Direct peer-to-peer synchronization
6. **Offline Support**: Queue changes when offline
7. **Compression Algorithms**: Advanced compression methods
8. **Security**: Encryption and authentication

## API Reference

See the TypeScript definitions in:
- `SyncEngine.ts`: Enhanced synchronization engine
- `CRDTManager.ts`: CRDT implementations
- `OperationalTransform.ts`: OT algorithms
- `index.ts`: Main exports and types