# Unified Editing Architecture - Quick Reference
## ARCHITECT_003 - Implementation Team Guide

### Core Concept in One Sentence
**All four modes (Draw, Parametric, Code, Growth) edit the same shared data through adapters that translate between mode-specific representations and a unified entity model.**

### Key Files to Modify

#### Phase 1: Foundation (Start Here)
```
src/core/unified/
├── UnifiedEntityStore.ts      // Single source of truth
├── ChangeStream.ts           // Reactive updates
└── SpatialIndex.ts          // Efficient queries

src/core/adapters/
└── ModeAdapter.ts           // Base interface
```

#### Phase 2: Mode Adapters
```
src/core/adapters/
├── DrawModeAdapter.ts       // Stroke ↔ Geometry
├── ParametricModeAdapter.ts // Parameters ↔ Geometry  
├── CodeModeAdapter.ts       // Code ↔ Geometry
└── GrowthModeAdapter.ts     // Rules ↔ Geometry
```

#### Phase 3: Synchronization
```
src/core/sync/
├── UnifiedSyncEngine.ts     // Orchestration
├── ConflictResolver.ts      // Merge conflicts
└── TranslationScheduler.ts  // Performance
```

#### Phase 4: UI Integration
```
src/components/studio/
└── UnifiedCanvasStudio.tsx  // Main UI update

src/graphics/
└── UnifiedRenderingPipeline.ts // Shared rendering
```

### Quick Start Code

#### 1. Create an Entity
```typescript
const entity = entityStore.createEntity({
  type: EntityType.COMPOSITE,
  metadata: { createdBy: CanvasMode.DRAW }
});
```

#### 2. Update from Draw Mode
```typescript
const drawAdapter = adapters.get(CanvasMode.DRAW);
const update = drawAdapter.toEntityUpdate(strokeData);
entityStore.updateEntity(entity.id, update);
```

#### 3. Get Parametric Representation
```typescript
const paramAdapter = adapters.get(CanvasMode.PARAMETRIC);
const parameters = paramAdapter.fromEntity(entity);
```

#### 4. Subscribe to Changes
```typescript
entityStore.getChangeStream()
  .pipe(filter(change => change.entityId === myEntityId))
  .subscribe(change => updateUI(change));
```

### Data Flow Cheat Sheet

```
User draws stroke
    ↓
DrawModeAdapter.toEntityUpdate()
    ↓
UnifiedEntityStore.updateEntity()
    ↓
ChangeStream.emit()
    ↓
UnifiedSyncEngine.handleChange()
    ↓
Schedule translations to other modes
    ↓
[Parametric, Code, Growth]Adapter.fromEntity()
    ↓
Update UI for all modes
```

### Common Patterns

#### Pattern 1: Mode Change Handler
```typescript
handleModeChange(mode: CanvasMode, data: any) {
  const adapter = this.adapters.get(mode);
  const update = adapter.toEntityUpdate(data);
  this.entityStore.updateEntity(entityId, update);
}
```

#### Pattern 2: Batch Updates
```typescript
const updates = strokes.map(stroke => ({
  id: stroke.entityId,
  changes: drawAdapter.toEntityUpdate(stroke)
}));
entityStore.batchUpdate(updates);
```

#### Pattern 3: Conflict Resolution
```typescript
if (entity.version !== expectedVersion) {
  const resolved = conflictResolver.resolve(
    entity, 
    newChanges,
    ConflictStrategy.MERGE
  );
  entityStore.updateEntity(id, resolved);
}
```

### Performance Tips

1. **Use Batching**: Group updates within 16ms windows
2. **Cache Translations**: Store recent mode conversions
3. **Defer Non-Critical**: Use priority queue for updates
4. **Web Workers**: Offload heavy translations
5. **Differential Updates**: Only send changed fields

### Testing Checklist

- [ ] Entity CRUD operations
- [ ] Each adapter's fromEntity/toEntityUpdate
- [ ] Conflict resolution scenarios
- [ ] Performance under load (1000+ entities)
- [ ] Mode synchronization accuracy
- [ ] Undo/redo functionality
- [ ] E2E user workflows

### Debugging Commands

```typescript
// Log all changes
entityStore.getChangeStream().subscribe(console.log);

// Check entity state
console.log(entityStore.debugEntity(id));

// Performance metrics
console.log(syncEngine.getMetrics());

// Adapter health
console.log(adapter.validateTranslation(entity));
```

### Migration Path

1. **Week 1-2**: Implement foundation without breaking existing
2. **Week 3-4**: Add adapters, test in parallel
3. **Week 5-6**: Switch to unified system behind flag
4. **Week 7-8**: Remove old system, optimize

### Remember

- **Single Source of Truth**: Only UnifiedEntityStore holds state
- **Adapters Transform**: They don't store data
- **Events Drive Updates**: Reactive, not polling
- **Conflicts Happen**: Design for resolution
- **Performance Matters**: Measure everything

---
*Start with UnifiedEntityStore.ts and work outward!*