# Unified Editing Architecture Redesign
## ARCHITECT_003 - Comprehensive Specification

### Executive Summary
This document presents a revolutionary redesign of Genshi Studio's four modes (Draw, Parametric, Code, Growth) to operate on a shared data architecture enabling true unified editing. All modes will simultaneously edit the same artwork through real-time bidirectional synchronization.

### Current State Analysis
After examining the existing codebase:
- **Strengths**: Excellent individual mode implementations with specialized engines
- **Gap**: Modes operate independently with post-hoc synchronization
- **Opportunity**: Redesign for shared state with reactive propagation

### Core Design Principles

#### 1. Single Source of Truth
```typescript
// Unified Entity Store - The heart of the system
class UnifiedEntityStore {
  private entities: Map<string, CanvasEntity> = new Map();
  private entityIndex: SpatialIndex; // For efficient spatial queries
  private changeStream: Subject<EntityChange>; // RxJS for reactive updates
  
  // All modes read/write through this interface
  getEntity(id: string): CanvasEntity | undefined
  updateEntity(id: string, changes: Partial<CanvasEntity>): void
  queryEntities(bounds: Rectangle): CanvasEntity[]
}
```

#### 2. Mode Adapters Pattern
Each mode gets an adapter that translates between the unified data model and mode-specific representations:

```typescript
interface ModeAdapter<T> {
  // Convert unified entity to mode representation
  fromEntity(entity: CanvasEntity): T;
  
  // Convert mode changes to entity updates
  toEntityUpdate(modeData: T): Partial<CanvasEntity>;
  
  // Subscribe to relevant entity changes
  subscribeToChanges(entityId: string, callback: (change: EntityChange) => void): void;
}
```

### Detailed Architecture Components

#### A. Shared Data Model Enhancement
```typescript
// Enhanced CanvasEntity with versioning and locks
interface CanvasEntity {
  id: string;
  type: EntityType;
  
  // Unified geometric representation
  geometry: GeometryData;
  
  // Mode-specific data stored efficiently
  modeData: {
    draw?: DrawData;       // Stroke information
    parametric?: ParamData; // Parameter values
    code?: CodeData;       // Generated/manual code
    growth?: GrowthData;   // Growth rules/state
  };
  
  // Metadata for synchronization
  version: number;
  lastModified: number;
  modeLocks: Set<CreativeMode>; // Which modes are editing
  dirtyFlags: Set<CreativeMode>; // Which representations need update
}
```

#### B. Event-Driven Synchronization System
```typescript
class UnifiedSyncEngine {
  private eventBus: EventEmitter;
  private updateQueue: PriorityQueue<EntityUpdate>;
  private conflictResolver: ConflictResolver;
  
  // Real-time change propagation
  propagateChange(change: EntityChange): void {
    // 1. Validate change
    if (!this.validateChange(change)) return;
    
    // 2. Check for conflicts
    const conflicts = this.detectConflicts(change);
    if (conflicts.length > 0) {
      change = this.conflictResolver.resolve(change, conflicts);
    }
    
    // 3. Apply to entity store
    this.entityStore.applyChange(change);
    
    // 4. Notify all mode adapters
    this.eventBus.emit('entity:changed', change);
    
    // 5. Schedule translations
    this.scheduleTranslations(change);
  }
  
  // Intelligent batching for performance
  private scheduleTranslations(change: EntityChange): void {
    // Group related changes
    this.updateQueue.add({
      priority: change.priority,
      entityId: change.entityId,
      sourceModes: [change.sourceMode],
      targetModes: this.getAffectedModes(change),
      deadline: performance.now() + 16 // Next frame
    });
  }
}
```

#### C. Mode-Specific Adapters

##### Draw Mode Adapter
```typescript
class DrawModeAdapter implements ModeAdapter<StrokeData> {
  private brushEngine: EnhancedBrushEngine;
  
  fromEntity(entity: CanvasEntity): StrokeData {
    // Extract stroke data from geometry primitives
    if (entity.modeData.draw) {
      return entity.modeData.draw;
    }
    
    // Generate strokes from geometry
    return this.vectorizeGeometry(entity.geometry);
  }
  
  toEntityUpdate(stroke: StrokeData): Partial<CanvasEntity> {
    return {
      geometry: {
        primitives: this.strokeToPrimitives(stroke),
        boundingBox: this.calculateBounds(stroke)
      },
      modeData: { draw: stroke },
      dirtyFlags: new Set(['parametric', 'code', 'growth'])
    };
  }
  
  // Real-time stroke vectorization
  private vectorizeGeometry(geometry: GeometryData): StrokeData {
    // Intelligent path fitting algorithm
    const paths = this.fitBezierPaths(geometry.primitives);
    return this.pathsToStrokes(paths);
  }
}
```

##### Parametric Mode Adapter
```typescript
class ParametricModeAdapter implements ModeAdapter<ParametricData> {
  private patternEngine: ParametricPatternEngine;
  private patternRecognizer: PatternRecognitionEngine;
  
  fromEntity(entity: CanvasEntity): ParametricData {
    if (entity.modeData.parametric) {
      return entity.modeData.parametric;
    }
    
    // Analyze geometry for patterns
    return this.extractParameters(entity.geometry);
  }
  
  toEntityUpdate(params: ParametricData): Partial<CanvasEntity> {
    // Generate geometry from parameters
    const geometry = this.patternEngine.generate(params);
    
    return {
      geometry,
      modeData: { parametric: params },
      dirtyFlags: new Set(['draw', 'code', 'growth'])
    };
  }
  
  // ML-based pattern extraction
  private extractParameters(geometry: GeometryData): ParametricData {
    const patterns = this.patternRecognizer.analyze(geometry);
    return this.patternsToParameters(patterns);
  }
}
```

##### Code Mode Adapter
```typescript
class CodeModeAdapter implements ModeAdapter<CodeData> {
  private codeEngine: CodeExecutionEngine;
  private codeGenerator: CodeGenerationEngine;
  
  fromEntity(entity: CanvasEntity): CodeData {
    if (entity.modeData.code) {
      return entity.modeData.code;
    }
    
    // Generate code from entity
    return this.generateCode(entity);
  }
  
  toEntityUpdate(code: CodeData): Partial<CanvasEntity> {
    // Execute code to generate geometry
    const result = this.codeEngine.execute(code);
    
    return {
      geometry: result.geometry,
      modeData: { code },
      dirtyFlags: new Set(['draw', 'parametric', 'growth'])
    };
  }
  
  // AI-powered code generation
  private generateCode(entity: CanvasEntity): CodeData {
    const template = this.selectTemplate(entity.type);
    return this.codeGenerator.generate(entity, template);
  }
}
```

##### Growth Mode Adapter
```typescript
class GrowthModeAdapter implements ModeAdapter<GrowthData> {
  private growthEngine: OrganicPatternGenerator;
  private ruleInferencer: GrowthRuleInferencer;
  
  fromEntity(entity: CanvasEntity): GrowthData {
    if (entity.modeData.growth) {
      return entity.modeData.growth;
    }
    
    // Infer growth rules from geometry
    return this.inferGrowthRules(entity.geometry);
  }
  
  toEntityUpdate(growth: GrowthData): Partial<CanvasEntity> {
    // Simulate growth to current generation
    const geometry = this.growthEngine.simulate(growth);
    
    return {
      geometry,
      modeData: { growth },
      dirtyFlags: new Set(['draw', 'parametric', 'code'])
    };
  }
  
  // Pattern-based rule inference
  private inferGrowthRules(geometry: GeometryData): GrowthData {
    const patterns = this.analyzeGrowthPatterns(geometry);
    return this.patternsToRules(patterns);
  }
}
```

#### D. Unified Rendering Pipeline
```typescript
class UnifiedRenderingPipeline {
  private webglContext: WebGLRenderingContext;
  private renderTargets: Map<CanvasMode, RenderTarget>;
  private compositor: LayerCompositor;
  
  render(entities: CanvasEntity[], modeStates: Map<CanvasMode, ModeState>): void {
    // 1. Clear render targets
    this.clearTargets();
    
    // 2. Render each mode to its target
    for (const [mode, state] of modeStates) {
      if (state.visible) {
        const target = this.renderTargets.get(mode)!;
        this.renderMode(mode, entities, target, state);
      }
    }
    
    // 3. Composite layers with opacity
    this.compositor.composite(
      Array.from(this.renderTargets.entries())
        .filter(([mode]) => modeStates.get(mode)?.visible)
        .map(([mode, target]) => ({
          texture: target.texture,
          opacity: modeStates.get(mode)!.opacity,
          blendMode: this.getBlendMode(mode)
        }))
    );
  }
  
  private renderMode(mode: CanvasMode, entities: CanvasEntity[], target: RenderTarget, state: ModeState): void {
    // Mode-specific rendering with shared geometry
    switch (mode) {
      case CanvasMode.DRAW:
        this.renderStrokes(entities, target);
        break;
      case CanvasMode.PARAMETRIC:
        this.renderPatterns(entities, target);
        break;
      case CanvasMode.CODE:
        this.renderProcedural(entities, target);
        break;
      case CanvasMode.GROWTH:
        this.renderOrganic(entities, target);
        break;
    }
  }
}
```

#### E. Conflict Resolution System
```typescript
class ConflictResolver {
  // Resolve concurrent edits
  resolve(incoming: EntityChange, conflicts: Conflict[]): EntityChange {
    // Strategy based on change types
    if (this.isGeometricConflict(conflicts)) {
      return this.mergeGeometry(incoming, conflicts);
    }
    
    if (this.isParametricConflict(conflicts)) {
      return this.mergeParameters(incoming, conflicts);
    }
    
    // Default: Last write wins with merge
    return this.lastWriteWinsMerge(incoming, conflicts);
  }
  
  private mergeGeometry(incoming: EntityChange, conflicts: Conflict[]): EntityChange {
    // Spatial merge - combine non-overlapping changes
    const merged = {
      ...incoming,
      geometry: this.spatialMerge(
        incoming.geometry,
        conflicts.map(c => c.geometry)
      )
    };
    
    return merged;
  }
}
```

### Implementation Strategy

#### Phase 1: Foundation (Week 1-2)
1. Implement UnifiedEntityStore with reactive change stream
2. Create base ModeAdapter interface and registry
3. Set up EventBus for change propagation
4. Implement basic conflict detection

#### Phase 2: Mode Adapters (Week 3-4)
1. Implement DrawModeAdapter with stroke vectorization
2. Create ParametricModeAdapter with pattern recognition
3. Build CodeModeAdapter with code generation
4. Develop GrowthModeAdapter with rule inference

#### Phase 3: Synchronization (Week 5-6)
1. Implement UnifiedSyncEngine with batching
2. Create ConflictResolver with merge strategies
3. Add performance optimizations (debouncing, throttling)
4. Implement undo/redo system

#### Phase 4: Integration (Week 7-8)
1. Update UI components to use adapters
2. Migrate existing mode engines
3. Implement unified rendering pipeline
4. Add comprehensive testing

### Performance Optimizations

#### 1. Intelligent Caching
```typescript
class AdapterCache {
  private cache: LRUCache<string, any>;
  private invalidationRules: Map<ChangeType, Set<string>>;
  
  get(key: string): any | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
  
  invalidate(change: EntityChange): void {
    const keys = this.getAffectedKeys(change);
    keys.forEach(key => this.cache.delete(key));
  }
}
```

#### 2. Differential Updates
```typescript
class DifferentialUpdater {
  // Only translate changed portions
  computeDiff(oldEntity: CanvasEntity, newEntity: CanvasEntity): EntityDiff {
    return {
      geometry: this.geometryDiff(oldEntity.geometry, newEntity.geometry),
      modeData: this.modeDataDiff(oldEntity.modeData, newEntity.modeData),
      metadata: this.metadataDiff(oldEntity.metadata, newEntity.metadata)
    };
  }
  
  applyDiff(entity: CanvasEntity, diff: EntityDiff): CanvasEntity {
    // Efficiently apply only changes
    return this.merge(entity, diff);
  }
}
```

#### 3. Web Worker Translation
```typescript
class WorkerTranslationPool {
  private workers: Worker[] = [];
  private taskQueue: TranslationTask[] = [];
  
  async translate(task: TranslationTask): Promise<TranslationResult> {
    const worker = this.getAvailableWorker();
    return this.executeOnWorker(worker, task);
  }
}
```

### Quality Assurance

#### Testing Strategy
1. **Unit Tests**: Each adapter thoroughly tested
2. **Integration Tests**: Mode interactions validated
3. **Performance Tests**: Frame rate and latency benchmarks
4. **E2E Tests**: Complete user workflows

#### Metrics to Track
- Synchronization latency (target: <16ms)
- Translation accuracy (target: >95%)
- Frame rate stability (target: 60fps)
- Memory usage (target: <500MB)

### Benefits of This Architecture

1. **True Unified Editing**: All modes edit the same data simultaneously
2. **Predictable State**: Single source of truth eliminates inconsistencies
3. **Performance**: Shared resources and intelligent caching
4. **Extensibility**: Easy to add new modes with adapters
5. **Collaboration Ready**: Foundation for multi-user editing

### Migration Path

1. **Compatibility Layer**: Temporary adapters for existing code
2. **Gradual Migration**: One mode at a time
3. **Feature Parity**: Ensure no functionality lost
4. **Performance Testing**: Validate improvements

### Conclusion

This redesign transforms Genshi Studio from a collection of independent modes to a truly unified creative environment. The shared data architecture with reactive propagation enables revolutionary workflows where artists can seamlessly blend drawing, parametric design, coding, and organic growth in real-time.

The implementation leverages existing mode engines while fundamentally changing how they interact, creating a system that is both familiar to users and dramatically more powerful.

---
*ARCHITECT_003 - Unified Editing Architecture Redesign Complete*