/**
 * Unified Editing System Integration
 * DEVELOPER_009 - Main integration module that connects all unified editing components
 * 
 * Integrates:
 * - Unified Data Model (ARCHITECT_002)
 * - Real-time Synchronization Engine (DEVELOPER_006)
 * - Bidirectional Translation Engine (DEVELOPER_007)
 * - Unified Canvas System (DEVELOPER_008)
 */

import { UnifiedCanvas, CanvasMode } from '../graphics/canvas/UnifiedCanvas';
import { syncEngine, SynchronizationEngine, ModeType, ChangeType, SyncPriority } from './sync/SynchronizationEngine';
import { BidirectionalTranslationEngine, TranslationOptions } from './BidirectionalTranslationEngine';
import { ParametricPatternEngine } from '../graphics/patterns/ParametricPatternEngine';
import { CodeExecutionEngine } from './execution/CodeExecutionEngine';
import { CanvasEntity, CreativeMode, EntityType, TranslationResult } from '../unified/UnifiedDataModel';

// Map between different mode type enums
const MODE_MAPPING = {
  [CanvasMode.DRAW]: ModeType.DRAW,
  [CanvasMode.PARAMETRIC]: ModeType.PARAMETRIC,
  [CanvasMode.CODE]: ModeType.CODE,
  [CanvasMode.GROWTH]: ModeType.GROWTH
};

const CREATIVE_MODE_MAPPING = {
  [ModeType.DRAW]: CreativeMode.DRAW,
  [ModeType.PARAMETRIC]: CreativeMode.PARAMETRIC,
  [ModeType.CODE]: CreativeMode.CODE,
  [ModeType.GROWTH]: CreativeMode.GROWTH
};

export interface UnifiedEditingConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  performanceTarget?: {
    fps: number;
    maxSyncLatency: number;
  };
  translation?: {
    quality: 'fast' | 'balanced' | 'accurate';
    enableCache: boolean;
  };
}

export interface SystemMetrics {
  performance: {
    fps: number;
    frameTime: number;
    syncLatency: number;
    translationTime: number;
  };
  modes: {
    [key in CanvasMode]: {
      active: boolean;
      lastUpdate: number;
      changeCount: number;
    };
  };
  entities: {
    total: number;
    byType: Record<string, number>;
  };
}

export class UnifiedEditingSystem {
  private unifiedCanvas: UnifiedCanvas;
  private syncEngine: SynchronizationEngine;
  private translationEngine: BidirectionalTranslationEngine;
  private parametricEngine: ParametricPatternEngine;
  private codeEngine: CodeExecutionEngine;

  // System state
  private entities: Map<string, CanvasEntity> = new Map();
  private activeModes: Set<CanvasMode> = new Set();
  private isRunning: boolean = false;
  private performanceTarget: { fps: number; maxSyncLatency: number };

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: UnifiedEditingConfig) {
    console.log('🔧 UnifiedEditingSystem constructor called with config:', config);
    this.performanceTarget = config.performanceTarget || { fps: 60, maxSyncLatency: 16 };

    try {
      // Initialize engines
      console.log('🔧 Initializing engines...');
      this.initializeEngines(config);

      // Setup translation connections
      console.log('🔧 Setting up translation pipeline...');
      this.setupTranslationPipeline();

      // Setup synchronization handlers
      console.log('🔧 Setting up synchronization handlers...');
      this.setupSynchronizationHandlers();

      // Setup canvas integration
      console.log('🔧 Setting up canvas integration...');
      this.setupCanvasIntegration();

      console.log('🚀 Unified Editing System initialized');
    } catch (error) {
      console.error('❌ Error in UnifiedEditingSystem constructor:', error);
      throw error;
    }
  }

  private initializeEngines(config: UnifiedEditingConfig): void {
    // Initialize parametric engine
    this.parametricEngine = new ParametricPatternEngine();

    // Initialize code execution engine
    this.codeEngine = new CodeExecutionEngine();

    // Initialize translation engine
    this.translationEngine = new BidirectionalTranslationEngine(
      this.parametricEngine,
      this.codeEngine
    );

    // Initialize unified canvas
    const canvasConfig = {
      canvas: config.canvas,
      width: config.width,
      height: config.height,
      pixelRatio: config.pixelRatio,
      modes: {
        [CanvasMode.DRAW]: { active: true, opacity: 1.0, locked: false, visible: true },
        [CanvasMode.PARAMETRIC]: { active: true, opacity: 0.8, locked: false, visible: true },
        [CanvasMode.CODE]: { active: true, opacity: 0.9, locked: false, visible: true },
        [CanvasMode.GROWTH]: { active: true, opacity: 0.7, locked: false, visible: true }
      }
    };

    this.unifiedCanvas = new UnifiedCanvas(canvasConfig);

    // Use existing sync engine instance
    this.syncEngine = syncEngine;
  }

  private setupTranslationPipeline(): void {
    // Register translation layers between all modes
    const modes = [ModeType.DRAW, ModeType.PARAMETRIC, ModeType.CODE, ModeType.GROWTH];

    for (const fromMode of modes) {
      for (const toMode of modes) {
        if (fromMode !== toMode) {
          this.syncEngine.registerTranslator(
            fromMode,
            toMode,
            this.createTranslator(fromMode, toMode)
          );
        }
      }
    }

    console.log('🔄 Translation pipeline configured for all mode pairs');
  }

  private createTranslator(fromMode: ModeType, toMode: ModeType) {
    return async (change: any) => {
      try {
        // Get the entity being changed
        const entityId = change.data.entityId || change.id;
        const entity = this.entities.get(entityId);

        if (!entity) {
          // Create new entity if it doesn't exist
          return await this.createEntityFromChange(change, toMode);
        }

        // Translate using the bidirectional translation engine
        const translationResult = await this.translationEngine.translate(
          change.data,
          CREATIVE_MODE_MAPPING[fromMode],
          CREATIVE_MODE_MAPPING[toMode]
        );

        if (translationResult.success) {
          // Create sync change for target mode
          const translatedChange = {
            id: `${change.id}_translated_${toMode}`,
            timestamp: Date.now(),
            sourceMode: toMode,
            changeType: this.mapChangeType(change.changeType, toMode),
            priority: SyncPriority.DERIVED_CHANGE,
            data: {
              entityId,
              translatedData: translationResult.data,
              confidence: translationResult.confidence,
              preservedIntent: translationResult.preservedIntent
            },
            metadata: {
              originalChangeId: change.id,
              translationQuality: translationResult.metadata.quality,
              translationTime: translationResult.metadata.translationTime
            }
          };

          return [translatedChange];
        }

        return [];
      } catch (error) {
        console.error(`Translation error ${fromMode} -> ${toMode}:`, error);
        return [];
      }
    };
  }

  private async createEntityFromChange(change: any, targetMode: ModeType) {
    // Create a new entity from a change when no existing entity is found
    const entityId = change.data.entityId || `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newEntity: CanvasEntity = {
      id: entityId,
      type: this.inferEntityType(change),
      geometry: {
        primitives: [],
        boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        spatialHash: '',
        lodLevels: { high: [], medium: [], low: [] }
      },
      representations: {
        vector: { strokes: [], pressure: [], brushSettings: {} as any, inputDevice: {} as any },
        parametric: { patternType: 'default', parameters: new Map(), generator: {} as any, constraints: [], animations: [], keyframes: [] },
        procedural: { sourceCode: '', compiledFunction: {} as any, inputs: [], outputs: [], dependencies: [], executionTime: 0, memoryUsage: 0 },
        organic: { algorithm: {} as any, seeds: [], generations: [], currentGeneration: 0, growthRules: [], environmentalFactors: {} as any }
      },
      metadata: {
        tags: [],
        createdAt: Date.now(),
        createdBy: CREATIVE_MODE_MAPPING[change.sourceMode],
        originalMode: CREATIVE_MODE_MAPPING[change.sourceMode]
      },
      transform: { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      style: { opacity: 1, blendMode: 'source-over', visible: true, layer: 0 },
      lastModified: {
        timestamp: change.timestamp,
        mode: CREATIVE_MODE_MAPPING[change.sourceMode],
        operation: change.changeType
      },
      versionHistory: []
    };

    this.entities.set(entityId, newEntity);
    return [];
  }

  private inferEntityType(change: any): EntityType {
    switch (change.changeType) {
      case ChangeType.STROKE_ADDED:
      case ChangeType.STROKE_MODIFIED:
        return EntityType.STROKE;
      case ChangeType.PATTERN_APPLIED:
        return EntityType.PATTERN;
      case ChangeType.CODE_EXECUTED:
        return EntityType.PROCEDURE;
      case ChangeType.GROWTH_UPDATED:
        return EntityType.GROWTH;
      default:
        return EntityType.COMPOSITE;
    }
  }

  private mapChangeType(originalType: ChangeType, targetMode: ModeType): ChangeType {
    // Map change types appropriately for target modes
    switch (targetMode) {
      case ModeType.DRAW:
        return ChangeType.STROKE_ADDED;
      case ModeType.PARAMETRIC:
        return ChangeType.PATTERN_APPLIED;
      case ModeType.CODE:
        return ChangeType.CODE_EXECUTED;
      case ModeType.GROWTH:
        return ChangeType.GROWTH_UPDATED;
      default:
        return originalType;
    }
  }

  private setupSynchronizationHandlers(): void {
    // Handle entity updates from sync engine
    this.syncEngine.on('change:applied', (change: any) => {
      this.handleEntityChange(change);
    });

    // Handle mode state updates
    this.syncEngine.on('mode:updated', (event: any) => {
      this.handleModeUpdate(event);
    });

    // Handle performance monitoring
    this.syncEngine.on('performance:updated', (metrics: any) => {
      this.checkPerformanceThresholds(metrics);
    });

    console.log('🔗 Synchronization handlers configured');
  }

  private setupCanvasIntegration(): void {
    // Connect canvas interactions to sync engine
    this.setupCanvasEventHandlers();

    // Start unified canvas
    this.unifiedCanvas.resize(
      this.unifiedCanvas['mainCanvas'].clientWidth,
      this.unifiedCanvas['mainCanvas'].clientHeight
    );

    console.log('🎨 Canvas integration setup complete');
  }

  private setupCanvasEventHandlers(): void {
    // This would be expanded with actual canvas event handling
    // For now, we'll implement basic integration hooks
    
    // Example: Handle canvas interaction
    const originalHandlePointerDown = this.unifiedCanvas['handlePointerDown'];
    if (originalHandlePointerDown) {
      this.unifiedCanvas['handlePointerDown'] = (event: PointerEvent) => {
        // Call original handler
        originalHandlePointerDown.call(this.unifiedCanvas, event);
        
        // Create sync change
        const change = {
          id: `interaction_${Date.now()}`,
          timestamp: Date.now(),
          sourceMode: MODE_MAPPING[this.unifiedCanvas.getPrimaryMode() || CanvasMode.DRAW],
          changeType: ChangeType.STROKE_ADDED,
          priority: SyncPriority.USER_ACTION,
          data: {
            point: { x: event.clientX, y: event.clientY },
            pressure: (event as any).pressure || 1.0
          }
        };
        
        this.syncEngine.applyChange(change);
      };
    }
  }

  private handleEntityChange(change: any): void {
    // Update entity in our registry
    const entityId = change.data.entityId;
    if (entityId && this.entities.has(entityId)) {
      const entity = this.entities.get(entityId)!;
      
      // Update entity based on change
      entity.lastModified = {
        timestamp: change.timestamp,
        mode: CREATIVE_MODE_MAPPING[change.sourceMode],
        operation: change.changeType
      };
      
      // Add to version history
      entity.versionHistory.push({
        id: change.id,
        timestamp: change.timestamp,
        mode: CREATIVE_MODE_MAPPING[change.sourceMode],
        operation: change.changeType,
        data: change.data,
        checksum: this.calculateEntityChecksum(entity)
      });

      this.entities.set(entityId, entity);
    }

    // Emit change event
    this.emit('entity:changed', { entityId, change });
  }

  private handleModeUpdate(event: any): void {
    // Update canvas mode state if needed
    const canvasMode = Object.keys(MODE_MAPPING).find(
      key => MODE_MAPPING[key as CanvasMode] === event.mode
    ) as CanvasMode;

    if (canvasMode) {
      // Update canvas mode state
      this.emit('mode:updated', { mode: canvasMode, state: event.state });
    }
  }

  private checkPerformanceThresholds(metrics: any): void {
    // Check if we're meeting performance targets
    if (metrics.fps < this.performanceTarget.fps * 0.8) {
      console.warn('⚠️ FPS below target:', metrics.fps, 'target:', this.performanceTarget.fps);
      this.emit('performance:warning', { type: 'fps', current: metrics.fps, target: this.performanceTarget.fps });
    }

    if (metrics.syncLatency > this.performanceTarget.maxSyncLatency) {
      console.warn('⚠️ Sync latency above target:', metrics.syncLatency, 'target:', this.performanceTarget.maxSyncLatency);
      this.emit('performance:warning', { type: 'latency', current: metrics.syncLatency, target: this.performanceTarget.maxSyncLatency });
    }
  }

  private calculateEntityChecksum(entity: CanvasEntity): string {
    // Simple checksum for entity versioning
    const dataString = JSON.stringify({
      geometry: entity.geometry,
      representations: entity.representations,
      transform: entity.transform,
      style: entity.style
    });
    
    return btoa(dataString).slice(0, 16);
  }

  // Public API methods

  public start(): void {
    console.log('🔧 UnifiedEditingSystem.start() called');
    if (this.isRunning) {
      console.log('⚠️ System already running');
      return;
    }

    try {
      // Start synchronization engine
      console.log('🔧 Starting sync engine...');
      this.syncEngine.start();

      // Register all active modes
      console.log('🔧 Registering active modes:', Array.from(this.activeModes));
      this.activeModes.forEach(mode => {
        const modeType = MODE_MAPPING[mode];
        this.syncEngine.registerMode(modeType, this.getDefaultModeData(modeType));
      });

      this.isRunning = true;
      console.log('🔧 About to emit system:started event');
      this.emit('system:started');
      console.log('🚀 Unified Editing System started');
    } catch (error) {
      console.error('❌ Error starting UnifiedEditingSystem:', error);
      throw error;
    }
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.syncEngine.stop();
    this.isRunning = false;
    this.emit('system:stopped');
    console.log('⏹️ Unified Editing System stopped');
  }

  public setModeActive(mode: CanvasMode, active: boolean): void {
    if (active) {
      this.activeModes.add(mode);
      this.unifiedCanvas.setMode(mode, true);
      
      if (this.isRunning) {
        const modeType = MODE_MAPPING[mode];
        this.syncEngine.registerMode(modeType, this.getDefaultModeData(modeType));
      }
    } else {
      this.activeModes.delete(mode);
      this.unifiedCanvas.setMode(mode, false);
    }

    this.emit('mode:toggled', { mode, active });
  }

  public setPrimaryMode(mode: CanvasMode): void {
    this.unifiedCanvas.setPrimaryMode(mode);
    this.emit('mode:primary', { mode });
  }

  public setModeOpacity(mode: CanvasMode, opacity: number): void {
    this.unifiedCanvas.setModeOpacity(mode, opacity);
    this.emit('mode:opacity', { mode, opacity });
  }

  public getCanvas(): UnifiedCanvas {
    return this.unifiedCanvas;
  }

  public getEntity(id: string): CanvasEntity | undefined {
    return this.entities.get(id);
  }

  public getAllEntities(): CanvasEntity[] {
    return Array.from(this.entities.values());
  }

  public getSystemMetrics(): SystemMetrics {
    const canvasMetrics = this.unifiedCanvas.getPerformanceMetrics();
    const syncMetrics = this.syncEngine.getPerformanceMetrics();

    return {
      performance: {
        fps: canvasMetrics.fps,
        frameTime: canvasMetrics.frameTime,
        syncLatency: syncMetrics.syncLatency,
        translationTime: syncMetrics.translationTime
      },
      modes: Object.fromEntries(
        Array.from(this.activeModes).map(mode => [
          mode,
          {
            active: true,
            lastUpdate: Date.now(),
            changeCount: 0 // Would track actual changes
          }
        ])
      ) as any,
      entities: {
        total: this.entities.size,
        byType: this.getEntityCountsByType()
      }
    };
  }

  public async translateEntity(entityId: string, fromMode: CreativeMode, toMode: CreativeMode): Promise<TranslationResult<any>> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    return this.translationEngine.translate(
      entity.representations,
      fromMode,
      toMode
    );
  }

  public clearAll(): void {
    this.entities.clear();
    this.syncEngine.clearAll();
    this.emit('system:cleared');
  }

  public destroy(): void {
    this.stop();
    this.unifiedCanvas.destroy();
    this.entities.clear();
    this.eventListeners.clear();
    console.log('🗑️ Unified Editing System destroyed');
  }

  // Event system
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public emit(event: string, data?: any): void {
    console.log(`🔔 Emitting event: ${event}`, data);
    const listeners = this.eventListeners.get(event);
    console.log(`🔔 Found ${listeners?.length || 0} listeners for event: ${event}`);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  private getDefaultModeData(modeType: ModeType): any {
    switch (modeType) {
      case ModeType.DRAW:
        return { strokes: [], layers: [] };
      case ModeType.PARAMETRIC:
        return { patterns: [], parameters: {} };
      case ModeType.CODE:
        return { code: '', executionResult: null };
      case ModeType.GROWTH:
        return { algorithm: 'organic', parameters: {}, seeds: [] };
      default:
        return {};
    }
  }

  private getEntityCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const entity of this.entities.values()) {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    }
    
    return counts;
  }
}