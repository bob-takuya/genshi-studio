# Unified Editing System - Code Examples
## ARCHITECT_003 - Practical Implementation Examples

### 1. UnifiedEntityStore Implementation

```typescript
// src/core/unified/UnifiedEntityStore.ts
import { Subject, Observable } from 'rxjs';
import { CanvasEntity, EntityChange, EntityType } from '../../types/unified';
import { SpatialIndex } from './SpatialIndex';

export class UnifiedEntityStore {
  private entities: Map<string, CanvasEntity> = new Map();
  private spatialIndex: SpatialIndex;
  private changeStream: Subject<EntityChange> = new Subject();
  private entityVersion: Map<string, number> = new Map();
  
  constructor() {
    this.spatialIndex = new SpatialIndex();
  }
  
  // Core CRUD operations
  createEntity(entity: Partial<CanvasEntity>): CanvasEntity {
    const id = entity.id || this.generateId();
    const fullEntity: CanvasEntity = {
      id,
      type: entity.type || EntityType.COMPOSITE,
      geometry: entity.geometry || this.createEmptyGeometry(),
      modeData: entity.modeData || {},
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        createdBy: entity.metadata?.createdBy || 'system',
        tags: entity.metadata?.tags || [],
        ...entity.metadata
      },
      version: 1,
      dirtyFlags: new Set()
    };
    
    this.entities.set(id, fullEntity);
    this.entityVersion.set(id, 1);
    this.spatialIndex.insert(id, fullEntity.geometry.boundingBox);
    
    this.emitChange({
      type: 'create',
      entityId: id,
      entity: fullEntity,
      timestamp: Date.now()
    });
    
    return fullEntity;
  }
  
  updateEntity(id: string, updates: Partial<CanvasEntity>): CanvasEntity | null {
    const entity = this.entities.get(id);
    if (!entity) return null;
    
    // Version check for optimistic concurrency
    const currentVersion = this.entityVersion.get(id) || 0;
    if (updates.version && updates.version !== currentVersion) {
      throw new Error(`Version conflict: expected ${currentVersion}, got ${updates.version}`);
    }
    
    // Apply updates
    const updatedEntity: CanvasEntity = {
      ...entity,
      ...updates,
      metadata: {
        ...entity.metadata,
        ...updates.metadata,
        modified: Date.now()
      },
      version: currentVersion + 1
    };
    
    // Update spatial index if geometry changed
    if (updates.geometry) {
      this.spatialIndex.update(id, updatedEntity.geometry.boundingBox);
    }
    
    this.entities.set(id, updatedEntity);
    this.entityVersion.set(id, updatedEntity.version);
    
    this.emitChange({
      type: 'update',
      entityId: id,
      entity: updatedEntity,
      previousEntity: entity,
      timestamp: Date.now()
    });
    
    return updatedEntity;
  }
  
  // Reactive change stream
  getChangeStream(): Observable<EntityChange> {
    return this.changeStream.asObservable();
  }
  
  // Spatial queries
  queryByBounds(bounds: Rectangle): CanvasEntity[] {
    const ids = this.spatialIndex.query(bounds);
    return ids.map(id => this.entities.get(id)).filter(Boolean) as CanvasEntity[];
  }
  
  // Batch operations for performance
  batchUpdate(updates: Array<{id: string, changes: Partial<CanvasEntity>}>): void {
    const changes: EntityChange[] = [];
    
    for (const {id, changes: entityChanges} of updates) {
      const entity = this.updateEntity(id, entityChanges);
      if (entity) {
        changes.push({
          type: 'update',
          entityId: id,
          entity,
          timestamp: Date.now()
        });
      }
    }
    
    // Emit batch change event
    this.emitChange({
      type: 'batch',
      changes,
      timestamp: Date.now()
    });
  }
  
  private emitChange(change: EntityChange): void {
    this.changeStream.next(change);
  }
  
  private generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2. DrawModeAdapter Example

```typescript
// src/core/adapters/DrawModeAdapter.ts
import { ModeAdapter } from './ModeAdapter';
import { CanvasEntity, DrawData, GeometryData } from '../../types/unified';
import { StrokeVectorizer } from '../algorithms/StrokeVectorizer';
import { EnhancedBrushEngine } from '../../graphics/tools/EnhancedBrushEngine';

export class DrawModeAdapter implements ModeAdapter<DrawData> {
  private vectorizer: StrokeVectorizer;
  private brushEngine: EnhancedBrushEngine;
  
  constructor(brushEngine: EnhancedBrushEngine) {
    this.brushEngine = brushEngine;
    this.vectorizer = new StrokeVectorizer();
  }
  
  // Convert entity to draw representation
  fromEntity(entity: CanvasEntity): DrawData {
    // If entity already has draw data, return it
    if (entity.modeData.draw) {
      return entity.modeData.draw;
    }
    
    // Otherwise, convert geometry to strokes
    return this.geometryToStrokes(entity.geometry);
  }
  
  // Convert draw data to entity update
  toEntityUpdate(drawData: DrawData): Partial<CanvasEntity> {
    const geometry = this.strokesToGeometry(drawData);
    
    return {
      geometry,
      modeData: {
        draw: drawData
      },
      dirtyFlags: new Set(['parametric', 'code', 'growth'])
    };
  }
  
  // Handle real-time drawing
  handleDrawing(points: Point[], pressure: number[]): DrawData {
    const stroke = this.brushEngine.createStroke(points, pressure);
    
    return {
      strokes: [stroke],
      activeStroke: stroke,
      brushSettings: this.brushEngine.getCurrentSettings()
    };
  }
  
  // Convert strokes to unified geometry
  private strokesToGeometry(drawData: DrawData): GeometryData {
    const primitives = [];
    
    for (const stroke of drawData.strokes) {
      // Fit bezier curves to stroke points
      const curves = this.vectorizer.fitBezierCurves(
        stroke.points,
        stroke.pressures
      );
      
      primitives.push({
        type: 'path',
        curves,
        style: {
          strokeColor: stroke.color,
          strokeWidth: stroke.width,
          opacity: stroke.opacity
        }
      });
    }
    
    return {
      primitives,
      boundingBox: this.calculateBounds(primitives),
      spatialHash: this.generateSpatialHash(primitives)
    };
  }
  
  // Convert geometry back to strokes (for editing)
  private geometryToStrokes(geometry: GeometryData): DrawData {
    const strokes = [];
    
    for (const primitive of geometry.primitives) {
      if (primitive.type === 'path') {
        const points = this.vectorizer.sampleCurves(primitive.curves);
        const pressures = this.inferPressures(points, primitive.style);
        
        strokes.push({
          points,
          pressures,
          timestamps: this.generateTimestamps(points.length),
          color: primitive.style.strokeColor,
          width: primitive.style.strokeWidth,
          opacity: primitive.style.opacity
        });
      }
    }
    
    return {
      strokes,
      brushSettings: this.brushEngine.getDefaultSettings()
    };
  }
}
```

### 3. Real-time Synchronization Example

```typescript
// src/core/sync/UnifiedSyncEngine.ts
import { Subject, merge, interval } from 'rxjs';
import { 
  buffer, 
  debounceTime, 
  filter, 
  groupBy, 
  mergeMap 
} from 'rxjs/operators';

export class UnifiedSyncEngine {
  private eventBus: EventEmitter = new EventEmitter();
  private entityStore: UnifiedEntityStore;
  private adapters: Map<CanvasMode, ModeAdapter<any>> = new Map();
  private updateQueue: PriorityQueue<EntityUpdate> = new PriorityQueue();
  private conflictResolver: ConflictResolver;
  
  constructor(entityStore: UnifiedEntityStore) {
    this.entityStore = entityStore;
    this.conflictResolver = new ConflictResolver();
    this.setupChangeHandling();
  }
  
  // Register mode adapters
  registerAdapter(mode: CanvasMode, adapter: ModeAdapter<any>): void {
    this.adapters.set(mode, adapter);
    
    // Setup adapter listeners
    adapter.on('change', (change) => this.handleModeChange(mode, change));
  }
  
  // Handle changes from modes
  private handleModeChange(sourceMode: CanvasMode, change: any): void {
    const entityId = change.entityId;
    const entity = this.entityStore.getEntity(entityId);
    
    if (!entity) {
      console.warn(`Entity ${entityId} not found`);
      return;
    }
    
    // Get adapter for source mode
    const adapter = this.adapters.get(sourceMode);
    if (!adapter) return;
    
    // Convert mode change to entity update
    const entityUpdate = adapter.toEntityUpdate(change.data);
    
    // Check for conflicts
    const conflicts = this.detectConflicts(entity, entityUpdate, sourceMode);
    
    if (conflicts.length > 0) {
      // Resolve conflicts
      const resolved = this.conflictResolver.resolve(
        entity,
        entityUpdate,
        conflicts,
        sourceMode
      );
      
      // Apply resolved update
      this.entityStore.updateEntity(entityId, resolved);
    } else {
      // No conflicts, apply directly
      this.entityStore.updateEntity(entityId, entityUpdate);
    }
    
    // Schedule translations to other modes
    this.scheduleTranslations(entityId, sourceMode);
  }
  
  // Intelligent translation scheduling
  private scheduleTranslations(entityId: string, sourceMode: CanvasMode): void {
    const entity = this.entityStore.getEntity(entityId);
    if (!entity) return;
    
    // Determine which modes need updates
    const targetModes = Array.from(entity.dirtyFlags)
      .filter(mode => mode !== sourceMode);
    
    for (const targetMode of targetModes) {
      this.updateQueue.add({
        priority: this.calculatePriority(sourceMode, targetMode),
        entityId,
        sourceMode,
        targetMode,
        deadline: performance.now() + 16 // Next frame
      });
    }
    
    // Process queue efficiently
    this.processUpdateQueue();
  }
  
  // Batch processing for performance
  private setupChangeHandling(): void {
    // Buffer changes for batch processing
    this.entityStore.getChangeStream()
      .pipe(
        buffer(interval(16)), // Batch every frame
        filter(changes => changes.length > 0)
      )
      .subscribe(changes => this.processBatch(changes));
  }
  
  private processBatch(changes: EntityChange[]): void {
    // Group by entity for efficiency
    const byEntity = new Map<string, EntityChange[]>();
    
    for (const change of changes) {
      const list = byEntity.get(change.entityId) || [];
      list.push(change);
      byEntity.set(change.entityId, list);
    }
    
    // Process each entity's changes
    for (const [entityId, entityChanges] of byEntity) {
      this.processEntityChanges(entityId, entityChanges);
    }
  }
  
  // Example: User draws a stroke that should update parametric representation
  async handleUserStroke(stroke: StrokeData): Promise<void> {
    // 1. Create or update entity through draw adapter
    const drawAdapter = this.adapters.get(CanvasMode.DRAW)!;
    const entityUpdate = drawAdapter.toEntityUpdate({ strokes: [stroke] });
    
    // 2. Apply to entity store
    const entity = this.entityStore.createEntity({
      type: EntityType.STROKE,
      ...entityUpdate,
      metadata: { createdBy: CanvasMode.DRAW }
    });
    
    // 3. Trigger translations to other modes
    this.scheduleTranslations(entity.id, CanvasMode.DRAW);
    
    // 4. Wait for translations to complete
    await this.waitForTranslations(entity.id);
    
    // 5. Notify UI of updates
    this.eventBus.emit('entity:ready', entity);
  }
}
```

### 4. Conflict Resolution Example

```typescript
// src/core/sync/ConflictResolver.ts
export class ConflictResolver {
  // Resolve conflicts between concurrent edits
  resolve(
    entity: CanvasEntity,
    incoming: Partial<CanvasEntity>,
    conflicts: Conflict[],
    sourceMode: CanvasMode
  ): Partial<CanvasEntity> {
    // Classify conflict type
    const conflictType = this.classifyConflicts(conflicts);
    
    switch (conflictType) {
      case 'geometric':
        return this.resolveGeometricConflict(entity, incoming, conflicts);
      
      case 'parametric':
        return this.resolveParametricConflict(entity, incoming, conflicts);
      
      case 'temporal':
        return this.resolveTemporalConflict(entity, incoming, conflicts);
      
      default:
        // Last write wins with merge
        return this.mergeChanges(entity, incoming, conflicts);
    }
  }
  
  private resolveGeometricConflict(
    entity: CanvasEntity,
    incoming: Partial<CanvasEntity>,
    conflicts: Conflict[]
  ): Partial<CanvasEntity> {
    // Spatial merge - combine non-overlapping geometry
    const existingPrimitives = entity.geometry.primitives;
    const incomingPrimitives = incoming.geometry?.primitives || [];
    
    // Check for overlaps
    const overlaps = this.findOverlappingPrimitives(
      existingPrimitives,
      incomingPrimitives
    );
    
    if (overlaps.length === 0) {
      // No overlaps, merge all primitives
      return {
        ...incoming,
        geometry: {
          ...incoming.geometry!,
          primitives: [...existingPrimitives, ...incomingPrimitives]
        }
      };
    } else {
      // Handle overlaps based on mode priority
      const resolved = this.resolveOverlaps(overlaps, incoming.metadata?.createdBy);
      
      return {
        ...incoming,
        geometry: {
          ...incoming.geometry!,
          primitives: resolved
        }
      };
    }
  }
  
  private resolveParametricConflict(
    entity: CanvasEntity,
    incoming: Partial<CanvasEntity>,
    conflicts: Conflict[]
  ): Partial<CanvasEntity> {
    // Merge parameters intelligently
    const existingParams = entity.modeData.parametric?.parameters || new Map();
    const incomingParams = incoming.modeData?.parametric?.parameters || new Map();
    
    const mergedParams = new Map(existingParams);
    
    // Apply parameter changes with constraints
    for (const [key, value] of incomingParams) {
      const constraint = this.getParameterConstraint(key);
      
      if (constraint) {
        // Validate and constrain value
        const validValue = constraint.validate(value);
        mergedParams.set(key, validValue);
      } else {
        mergedParams.set(key, value);
      }
    }
    
    return {
      ...incoming,
      modeData: {
        ...incoming.modeData,
        parametric: {
          ...incoming.modeData?.parametric,
          parameters: mergedParams
        }
      }
    };
  }
}
```

### 5. Usage Example in React Component

```typescript
// src/components/studio/UnifiedEditingExample.tsx
import React, { useEffect, useRef } from 'react';
import { UnifiedEditingSystem } from '../../core/UnifiedEditingSystem';
import { CanvasMode } from '../../types/unified';

export const UnifiedEditingExample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<UnifiedEditingSystem | null>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize unified editing system
    const system = new UnifiedEditingSystem({
      canvas: canvasRef.current,
      performanceTarget: {
        fps: 60,
        maxSyncLatency: 16
      }
    });
    
    systemRef.current = system;
    
    // Example: Handle drawing that updates all modes
    system.on('stroke:complete', async (stroke) => {
      // This stroke will automatically:
      // 1. Update the entity store
      // 2. Trigger pattern recognition
      // 3. Generate equivalent code
      // 4. Infer growth rules
      // All in real-time!
      
      const entity = await system.handleUserStroke(stroke);
      
      // Access synchronized representations
      console.log('Draw data:', entity.modeData.draw);
      console.log('Parametric:', entity.modeData.parametric);
      console.log('Generated code:', entity.modeData.code);
      console.log('Growth rules:', entity.modeData.growth);
    });
    
    // Example: Changing parameters updates all modes
    system.on('parameter:change', async (param) => {
      const entity = await system.updateParameter(param.entityId, param.name, param.value);
      
      // All modes automatically updated
      // Draw mode shows new geometry
      // Code mode shows updated function calls
      // Growth mode adjusts rules
    });
    
    return () => {
      system.destroy();
    };
  }, []);
  
  return (
    <div className="unified-editing-container">
      <canvas 
        ref={canvasRef}
        className="unified-canvas"
      />
      
      {/* Mode controls automatically connected to unified system */}
      <ModeControls system={systemRef.current} />
    </div>
  );
};
```

### 6. Performance Monitoring

```typescript
// src/core/performance/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    
    return result;
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    
    return result;
  }
  
  getReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: {}
    };
    
    for (const [name, metric] of this.metrics) {
      report.metrics[name] = {
        count: metric.count,
        total: metric.total,
        average: metric.total / metric.count,
        min: metric.min,
        max: metric.max
      };
    }
    
    return report;
  }
}
```

---
*ARCHITECT_003 - Practical Implementation Examples Complete*