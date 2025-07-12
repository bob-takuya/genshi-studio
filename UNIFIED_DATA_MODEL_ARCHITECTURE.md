# Unified Data Model & Architecture for Genshi Studio
*Multi-Mode Simultaneous Editing System*

**Architect:** ARCHITECT_002  
**Date:** 2025-07-12  
**Status:** Design Phase  

## Executive Summary

This document outlines a comprehensive unified data model and architecture that enables Draw, Parametric, Code, and Growth modes to edit the same artwork simultaneously with real-time synchronization and cross-mode compatibility.

## 1. Core Architectural Principles

### 1.1 Universal Canvas Entity System
Every element in the canvas is represented as a **Canvas Entity** with multiple representations:

```typescript
interface CanvasEntity {
  id: string;
  type: EntityType;
  
  // Core geometric representation
  geometry: GeometryData;
  
  // Multi-modal representations
  representations: {
    vector: VectorRepresentation;      // For Draw mode
    parametric: ParametricRepresentation; // For Parametric mode
    procedural: ProceduralRepresentation; // For Code mode
    organic: OrganicRepresentation;    // For Growth mode
  };
  
  // Metadata and state
  metadata: EntityMetadata;
  transform: Transform;
  style: StyleProperties;
  
  // Synchronization state
  lastModified: {
    timestamp: number;
    mode: CreativeMode;
    operation: string;
  };
  
  // Conflict resolution
  lockState?: EntityLock;
  versionHistory: EntityVersion[];
}
```

### 1.2 Layered Architecture Design

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │ ← 4 Creative Mode UIs
├─────────────────────────────────────────┤
│        Synchronization Engine          │ ← Real-time sync
├─────────────────────────────────────────┤
│         Translation Layer              │ ← Mode conversion
├─────────────────────────────────────────┤
│       Unified Data Model              │ ← Core entity system
├─────────────────────────────────────────┤
│        Rendering Engine               │ ← WebGL rendering
└─────────────────────────────────────────┘
```

## 2. Unified Data Model

### 2.1 Core Entity Types

```typescript
enum EntityType {
  STROKE = 'stroke',           // Hand-drawn strokes
  PATTERN = 'pattern',         // Parametric patterns
  PROCEDURE = 'procedure',     // Code-generated graphics
  GROWTH = 'growth',          // Algorithmic growth
  COMPOSITE = 'composite',     // Multi-mode combination
  GROUP = 'group'             // Entity grouping
}

enum CreativeMode {
  DRAW = 'draw',
  PARAMETRIC = 'parametric', 
  CODE = 'code',
  GROWTH = 'growth'
}
```

### 2.2 Geometry Data Structure

```typescript
interface GeometryData {
  // Universal geometric primitives
  primitives: GeometricPrimitive[];
  
  // Spatial indexing for performance
  boundingBox: Rectangle;
  spatialHash: string;
  
  // Level-of-detail for scalability
  lodLevels: {
    high: GeometricPrimitive[];    // Full detail
    medium: GeometricPrimitive[];  // Simplified
    low: GeometricPrimitive[];     // Coarse
  };
}

interface GeometricPrimitive {
  type: 'path' | 'circle' | 'polygon' | 'bezier' | 'mesh';
  points: Point[];
  controlPoints?: Point[];
  properties: PrimitiveProperties;
}
```

### 2.3 Multi-Modal Representations

#### Vector Representation (Draw Mode)
```typescript
interface VectorRepresentation {
  strokes: DrawStroke[];
  pressure: PressureData[];
  brushSettings: BrushConfiguration;
  
  // Real-time drawing state
  activeStroke?: DrawStroke;
  inputDevice: InputDeviceState;
}

interface DrawStroke {
  id: string;
  points: StrokePoint[];
  style: StrokeStyle;
  timestamp: number;
  
  // Pressure and velocity data
  pressureProfile: number[];
  velocityProfile: Vector2[];
}
```

#### Parametric Representation (Parametric Mode)
```typescript
interface ParametricRepresentation {
  patternType: string;
  parameters: Map<string, ParameterValue>;
  
  // Pattern generation rules
  generator: PatternGenerator;
  constraints: ParameterConstraint[];
  
  // Animation and interpolation
  animations: ParameterAnimation[];
  keyframes: ParameterKeyframe[];
}

interface ParameterValue {
  value: any;
  type: ParameterType;
  lastModified: number;
  mode: CreativeMode; // Which mode last modified this
}
```

#### Procedural Representation (Code Mode)
```typescript
interface ProceduralRepresentation {
  sourceCode: string;
  compiledFunction: CompiledFunction;
  
  // Execution context
  inputs: CodeInput[];
  outputs: CodeOutput[];
  dependencies: string[];
  
  // Performance tracking
  executionTime: number;
  memoryUsage: number;
}

interface CompiledFunction {
  bytecode: Uint8Array;
  symbols: SymbolTable;
  entryPoint: number;
}
```

#### Organic Representation (Growth Mode)
```typescript
interface OrganicRepresentation {
  algorithm: GrowthAlgorithm;
  seeds: GrowthSeed[];
  
  // Growth state
  generations: GrowthGeneration[];
  currentGeneration: number;
  
  // Rules and constraints
  growthRules: GrowthRule[];
  environmentalFactors: EnvironmentalData;
}

interface GrowthSeed {
  position: Point;
  energy: number;
  type: SeedType;
  properties: SeedProperties;
}
```

## 3. Real-Time Synchronization Architecture

### 3.1 Event-Driven Synchronization System

```typescript
class UnifiedSynchronizationEngine {
  private eventBus: EventBus;
  private translationLayer: TranslationLayer;
  private conflictResolver: ConflictResolver;
  private performanceMonitor: PerformanceMonitor;
  
  // Real-time sync at 60fps
  private syncInterval: number = 16.67; // ~60fps
  
  startSynchronization(): void {
    // High-frequency sync loop for real-time updates
    setInterval(() => {
      this.syncAll();
    }, this.syncInterval);
  }
  
  private syncAll(): void {
    const entities = EntityStore.getModifiedEntities();
    
    for (const entity of entities) {
      this.syncEntity(entity);
    }
  }
  
  private async syncEntity(entity: CanvasEntity): Promise<void> {
    // 1. Detect what mode modified the entity
    const modifyingMode = entity.lastModified.mode;
    
    // 2. Translate to other representations
    const translations = await this.translationLayer
      .translateFromMode(entity, modifyingMode);
    
    // 3. Check for conflicts
    const conflicts = this.conflictResolver
      .detectConflicts(entity, translations);
    
    // 4. Resolve conflicts if any
    if (conflicts.length > 0) {
      await this.conflictResolver.resolveConflicts(conflicts);
    }
    
    // 5. Update all mode representations
    this.updateAllModeRepresentations(entity, translations);
    
    // 6. Trigger UI updates
    this.eventBus.emit('entity:updated', entity);
  }
}
```

### 3.2 Translation Layer System

```typescript
class TranslationLayer {
  private translators: Map<string, ModeTranslator> = new Map();
  
  constructor() {
    this.registerTranslators();
  }
  
  async translateFromMode(
    entity: CanvasEntity, 
    sourceMode: CreativeMode
  ): Promise<TranslationResult> {
    const results: TranslationResult = {
      vector: null,
      parametric: null,
      procedural: null,
      organic: null
    };
    
    // Translate to all other modes
    for (const targetMode of Object.values(CreativeMode)) {
      if (targetMode === sourceMode) continue;
      
      const translator = this.getTranslator(sourceMode, targetMode);
      if (translator) {
        results[targetMode] = await translator.translate(entity);
      }
    }
    
    return results;
  }
  
  private registerTranslators(): void {
    // Vector (Draw) to Parametric
    this.translators.set('draw->parametric', new VectorToParametricTranslator());
    
    // Vector (Draw) to Code
    this.translators.set('draw->code', new VectorToCodeTranslator());
    
    // Vector (Draw) to Growth
    this.translators.set('draw->growth', new VectorToGrowthTranslator());
    
    // Parametric to Vector
    this.translators.set('parametric->draw', new ParametricToVectorTranslator());
    
    // ... additional translators for all mode combinations
  }
}
```

### 3.3 Mode Translators

#### Vector to Parametric Translator
```typescript
class VectorToParametricTranslator implements ModeTranslator {
  async translate(entity: CanvasEntity): Promise<ParametricRepresentation> {
    const vectorRep = entity.representations.vector;
    
    // Analyze stroke patterns
    const analysis = this.analyzeStrokes(vectorRep.strokes);
    
    // Detect repeating patterns
    const patterns = this.detectPatterns(analysis);
    
    // Generate parametric representation
    return {
      patternType: patterns.dominantType,
      parameters: this.extractParameters(patterns),
      generator: this.createGenerator(patterns),
      constraints: this.deriveConstraints(analysis),
      animations: [],
      keyframes: []
    };
  }
  
  private analyzeStrokes(strokes: DrawStroke[]): StrokeAnalysis {
    return {
      symmetries: this.detectSymmetries(strokes),
      repetitions: this.detectRepetitions(strokes),
      curvature: this.analyzeCurvature(strokes),
      density: this.calculateDensity(strokes)
    };
  }
}
```

#### Parametric to Code Translator
```typescript
class ParametricToCodeTranslator implements ModeTranslator {
  async translate(entity: CanvasEntity): Promise<ProceduralRepresentation> {
    const parametricRep = entity.representations.parametric;
    
    // Generate procedural code from parameters
    const code = this.generateCodeFromParameters(
      parametricRep.patternType,
      parametricRep.parameters
    );
    
    // Compile the generated code
    const compiled = await this.compileCode(code);
    
    return {
      sourceCode: code,
      compiledFunction: compiled,
      inputs: this.extractInputs(parametricRep.parameters),
      outputs: [],
      dependencies: [],
      executionTime: 0,
      memoryUsage: 0
    };
  }
  
  private generateCodeFromParameters(
    patternType: string, 
    parameters: Map<string, ParameterValue>
  ): string {
    const generator = CodeGenerators.get(patternType);
    return generator.generate(parameters);
  }
}
```

## 4. Conflict Resolution System

### 4.1 Conflict Detection

```typescript
class ConflictResolver {
  detectConflicts(
    entity: CanvasEntity, 
    translations: TranslationResult
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Temporal conflicts (simultaneous edits)
    if (this.hasSimultaneousEdits(entity)) {
      conflicts.push(new TemporalConflict(entity));
    }
    
    // Semantic conflicts (incompatible changes)
    const semanticConflicts = this.detectSemanticConflicts(entity, translations);
    conflicts.push(...semanticConflicts);
    
    // Geometric conflicts (overlapping modifications)
    const geometricConflicts = this.detectGeometricConflicts(entity);
    conflicts.push(...geometricConflicts);
    
    return conflicts;
  }
  
  async resolveConflicts(conflicts: Conflict[]): Promise<void> {
    for (const conflict of conflicts) {
      switch (conflict.type) {
        case ConflictType.TEMPORAL:
          await this.resolveTemporalConflict(conflict);
          break;
        case ConflictType.SEMANTIC:
          await this.resolveSemanticConflict(conflict);
          break;
        case ConflictType.GEOMETRIC:
          await this.resolveGeometricConflict(conflict);
          break;
      }
    }
  }
  
  private async resolveTemporalConflict(conflict: TemporalConflict): Promise<void> {
    // Use operation-based resolution
    const winner = this.selectWinningOperation(conflict.operations);
    await this.applyOperation(winner);
    
    // Merge non-conflicting aspects
    await this.mergeCompatibleChanges(conflict);
  }
}
```

### 4.2 Entity Locking System

```typescript
interface EntityLock {
  mode: CreativeMode;
  operation: string;
  timestamp: number;
  userId?: string;
  
  // Granular locking
  lockedAspects: LockAspect[];
}

enum LockAspect {
  GEOMETRY = 'geometry',
  STYLE = 'style', 
  PARAMETERS = 'parameters',
  TRANSFORM = 'transform'
}

class EntityLockManager {
  private locks: Map<string, EntityLock> = new Map();
  
  acquireLock(
    entityId: string, 
    mode: CreativeMode, 
    aspects: LockAspect[]
  ): boolean {
    const existingLock = this.locks.get(entityId);
    
    if (existingLock && this.hasConflictingLock(existingLock, aspects)) {
      return false; // Lock denied
    }
    
    // Grant partial or full lock
    this.locks.set(entityId, {
      mode,
      operation: 'edit',
      timestamp: Date.now(),
      lockedAspects: aspects
    });
    
    return true;
  }
}
```

## 5. Performance Optimization

### 5.1 Spatial Indexing & Culling

```typescript
class SpatialIndex {
  private quadTree: QuadTree<CanvasEntity>;
  private entityIndex: Map<string, SpatialNode>;
  
  // Fast spatial queries for visible entities
  getVisibleEntities(viewport: Rectangle): CanvasEntity[] {
    return this.quadTree.query(viewport);
  }
  
  // Incremental updates for modified entities
  updateEntity(entity: CanvasEntity): void {
    const node = this.entityIndex.get(entity.id);
    if (node) {
      this.quadTree.remove(node);
    }
    
    const newNode = this.quadTree.insert(entity, entity.geometry.boundingBox);
    this.entityIndex.set(entity.id, newNode);
  }
}
```

### 5.2 Level-of-Detail System

```typescript
class LODManager {
  private currentViewport: Rectangle;
  private zoomLevel: number;
  
  selectLOD(entity: CanvasEntity): GeometricPrimitive[] {
    const distance = this.calculateDistance(entity, this.currentViewport);
    const screenSize = this.calculateScreenSize(entity);
    
    if (screenSize < 2) {
      return entity.geometry.lodLevels.low;
    } else if (screenSize < 10) {
      return entity.geometry.lodLevels.medium;
    } else {
      return entity.geometry.lodLevels.high;
    }
  }
}
```

### 5.3 Incremental Synchronization

```typescript
class IncrementalSync {
  private dirtyEntities: Set<string> = new Set();
  private lastSyncTimestamp: number = 0;
  
  markDirty(entityId: string): void {
    this.dirtyEntities.add(entityId);
  }
  
  sync(): void {
    if (this.dirtyEntities.size === 0) return;
    
    // Only sync modified entities
    const entitiesToSync = Array.from(this.dirtyEntities)
      .map(id => EntityStore.getEntity(id))
      .filter(entity => entity.lastModified.timestamp > this.lastSyncTimestamp);
    
    this.syncEntities(entitiesToSync);
    
    this.dirtyEntities.clear();
    this.lastSyncTimestamp = Date.now();
  }
}
```

## 6. Implementation Roadmap

### Phase 1: Core Data Model (Week 1-2)
- [ ] Implement `CanvasEntity` base structure
- [ ] Create multi-modal representation interfaces  
- [ ] Build entity storage and indexing system
- [ ] Implement basic geometric primitives

### Phase 2: Translation Layer (Week 3-4)
- [ ] Build mode translator framework
- [ ] Implement Vector↔Parametric translators
- [ ] Implement Parametric↔Code translators  
- [ ] Implement Code↔Growth translators
- [ ] Add Vector↔Growth translators

### Phase 3: Synchronization Engine (Week 5-6)
- [ ] Build event-driven sync system
- [ ] Implement real-time entity updates
- [ ] Add performance monitoring
- [ ] Create spatial indexing system

### Phase 4: Conflict Resolution (Week 7-8)
- [ ] Implement conflict detection algorithms
- [ ] Build temporal conflict resolution
- [ ] Add semantic conflict handling
- [ ] Create entity locking system

### Phase 5: Performance & Polish (Week 9-10)
- [ ] Optimize sync performance to 60fps
- [ ] Implement LOD system
- [ ] Add memory management
- [ ] Performance testing & tuning

### Phase 6: Integration & Testing (Week 11-12)
- [ ] Integrate with existing UI components
- [ ] Build mode switching system
- [ ] Comprehensive testing
- [ ] Documentation and examples

## 7. Technical Specifications

### 7.1 Performance Targets
- **Sync Frequency**: 60fps (16.67ms intervals)
- **Entity Limit**: 10,000+ entities with smooth performance
- **Memory Usage**: <500MB for typical artwork
- **Translation Time**: <5ms per entity per mode
- **Conflict Resolution**: <10ms for typical conflicts

### 7.2 Browser Compatibility
- **WebGL 2.0**: Required for rendering engine
- **WebAssembly**: For performance-critical translation algorithms
- **SharedArrayBuffer**: For multi-threaded sync (where available)
- **OffscreenCanvas**: For background rendering tasks

### 7.3 Data Persistence
```typescript
interface ArtworkDocument {
  id: string;
  version: string;
  metadata: ArtworkMetadata;
  
  // Complete entity graph
  entities: CanvasEntity[];
  relationships: EntityRelationship[];
  
  // Global settings
  canvas: CanvasSettings;
  environment: EnvironmentSettings;
  
  // History for undo/redo
  history: HistoryEntry[];
}
```

## 8. Integration Points

### 8.1 Existing System Integration

```typescript
// GraphicsEngine integration
class UnifiedGraphicsEngine extends GraphicsEngine {
  private unifiedDataModel: UnifiedDataModel;
  private syncEngine: UnifiedSynchronizationEngine;
  
  render(): void {
    // Get entities from unified model
    const entities = this.unifiedDataModel.getVisibleEntities(this.viewport);
    
    // Render each entity using appropriate representation
    for (const entity of entities) {
      this.renderEntity(entity);
    }
  }
  
  private renderEntity(entity: CanvasEntity): void {
    // Use most appropriate representation for current context
    const representation = this.selectOptimalRepresentation(entity);
    
    switch (representation.type) {
      case 'vector':
        this.renderVectorRepresentation(representation);
        break;
      case 'parametric':
        this.renderParametricRepresentation(representation);
        break;
      // ... other representations
    }
  }
}
```

### 8.2 UI Mode Integration

```typescript
// StudioPage integration
class UnifiedStudioPage extends StudioPage {
  private unifiedEngine: UnifiedGraphicsEngine;
  private currentMode: CreativeMode = CreativeMode.DRAW;
  
  // Enable simultaneous mode editing
  enableSimultaneousMode(): void {
    // Show all mode UIs simultaneously
    this.showDrawToolbar();
    this.showParametricPanel();
    this.showCodeEditor();
    this.showGrowthControls();
    
    // Enable real-time sync
    this.unifiedEngine.startSynchronization();
  }
  
  onModeSwitch(newMode: CreativeMode): void {
    this.currentMode = newMode;
    
    // Focus new mode UI while keeping others visible
    this.focusModeUI(newMode);
    
    // Maintain sync across all modes
    this.unifiedEngine.syncAll();
  }
}
```

## 9. Future Extensions

### 9.1 AI-Assisted Translation
- Machine learning models for better mode translation
- Context-aware parameter mapping
- Intelligent conflict resolution

### 9.2 Collaborative Editing
- Multi-user simultaneous editing
- Distributed conflict resolution
- Real-time collaboration protocol

### 9.3 Advanced Representations
- Physics-based simulations
- Neural network generated patterns
- VR/AR spatial representations

---

**Document Status**: Complete  
**Next Action**: Begin Phase 1 implementation  
**Team Dependencies**: DEVELOPER agents for implementation, TESTER agents for validation

This architecture enables true multi-mode simultaneous editing while maintaining performance and consistency across all creative modes in Genshi Studio.