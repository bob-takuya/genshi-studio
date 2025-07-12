/**
 * Interaction Manager - Smart conflict resolution for multi-mode canvas
 * Handles simultaneous interactions across Draw, Parametric, Code, and Growth modes
 */

import { CanvasMode } from './UnifiedCanvas';
import { Point } from '../../types/graphics';

export interface InteractionEvent {
  id: string;
  mode: CanvasMode;
  type: 'pointer' | 'keyboard' | 'touch' | 'gesture';
  phase: 'start' | 'move' | 'end' | 'cancel';
  point: Point;
  pressure?: number;
  velocity?: Point;
  timestamp: number;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  deviceType: 'mouse' | 'pen' | 'touch' | 'stylus';
  pointerType?: string;
  buttons?: number;
}

export interface InteractionRule {
  priority: number;
  modes: CanvasMode[];
  condition: (event: InteractionEvent, context: InteractionContext) => boolean;
  action: 'allow' | 'block' | 'transform' | 'defer';
  transform?: (event: InteractionEvent) => InteractionEvent;
}

export interface InteractionContext {
  activeModes: Set<CanvasMode>;
  primaryMode: CanvasMode;
  activeInteractions: Map<string, InteractionEvent>;
  regionMap: Map<string, CanvasMode>; // Spatial regions for mode precedence
  toolStates: Map<CanvasMode, any>;
  lastEvents: Map<CanvasMode, InteractionEvent>;
}

export interface ModeInteractionHandler {
  mode: CanvasMode;
  priority: number;
  canHandle: (event: InteractionEvent, context: InteractionContext) => boolean;
  handle: (event: InteractionEvent, context: InteractionContext) => Promise<void>;
  cleanup?: () => void;
}

export enum ConflictResolution {
  PRIMARY_WINS = 'primary_wins',
  PRIORITY_ORDER = 'priority_order',
  SPATIAL_REGIONS = 'spatial_regions',
  TOOL_CONTEXT = 'tool_context',
  TEMPORAL_SEQUENCE = 'temporal_sequence',
  USER_SELECTION = 'user_selection'
}

export class InteractionManager {
  private context: InteractionContext;
  private handlers: Map<CanvasMode, ModeInteractionHandler> = new Map();
  private rules: InteractionRule[] = [];
  private conflictStrategy: ConflictResolution = ConflictResolution.PRIORITY_ORDER;
  private eventQueue: InteractionEvent[] = [];
  private processingQueue: boolean = false;
  
  // Performance tracking
  private metrics = {
    eventsProcessed: 0,
    conflictsResolved: 0,
    averageProcessingTime: 0,
    lastProcessingTime: 0
  };

  constructor(initialContext: Partial<InteractionContext> = {}) {
    this.context = {
      activeModes: new Set(),
      primaryMode: CanvasMode.DRAW,
      activeInteractions: new Map(),
      regionMap: new Map(),
      toolStates: new Map(),
      lastEvents: new Map(),
      ...initialContext
    };

    this.setupDefaultRules();
    this.setupDefaultHandlers();
  }

  private setupDefaultRules(): void {
    // High priority: Code mode execution should not be interrupted
    this.rules.push({
      priority: 100,
      modes: [CanvasMode.CODE],
      condition: (event, context) => {
        return context.toolStates.get(CanvasMode.CODE)?.executing === true;
      },
      action: 'block'
    });

    // Medium priority: Draw mode with pressure should take precedence
    this.rules.push({
      priority: 80,
      modes: [CanvasMode.DRAW],
      condition: (event, context) => {
        return event.deviceType === 'pen' || event.deviceType === 'stylus' && 
               (event.pressure || 0) > 0.1;
      },
      action: 'allow'
    });

    // Medium priority: Parametric mode with modifier keys
    this.rules.push({
      priority: 70,
      modes: [CanvasMode.PARAMETRIC],
      condition: (event, context) => {
        return event.modifiers.shift || event.modifiers.ctrl;
      },
      action: 'allow'
    });

    // Lower priority: Growth mode should not interfere with active drawing
    this.rules.push({
      priority: 60,
      modes: [CanvasMode.GROWTH],
      condition: (event, context) => {
        const drawInteraction = context.lastEvents.get(CanvasMode.DRAW);
        return !drawInteraction || 
               (event.timestamp - drawInteraction.timestamp) > 1000;
      },
      action: 'allow'
    });

    // Fallback: Allow primary mode
    this.rules.push({
      priority: 10,
      modes: Object.values(CanvasMode),
      condition: (event, context) => {
        return event.mode === context.primaryMode;
      },
      action: 'allow'
    });
  }

  private setupDefaultHandlers(): void {
    // Draw mode handler
    this.registerHandler({
      mode: CanvasMode.DRAW,
      priority: 80,
      canHandle: (event, context) => {
        return event.type === 'pointer' && 
               (event.deviceType === 'pen' || event.deviceType === 'stylus' || event.deviceType === 'mouse');
      },
      handle: async (event, context) => {
        await this.handleDrawInteraction(event, context);
      }
    });

    // Parametric mode handler
    this.registerHandler({
      mode: CanvasMode.PARAMETRIC,
      priority: 70,
      canHandle: (event, context) => {
        return event.type === 'pointer' && event.modifiers.shift;
      },
      handle: async (event, context) => {
        await this.handleParametricInteraction(event, context);
      }
    });

    // Code mode handler
    this.registerHandler({
      mode: CanvasMode.CODE,
      priority: 90,
      canHandle: (event, context) => {
        return event.type === 'keyboard' || 
               (event.type === 'pointer' && event.modifiers.ctrl);
      },
      handle: async (event, context) => {
        await this.handleCodeInteraction(event, context);
      }
    });

    // Growth mode handler
    this.registerHandler({
      mode: CanvasMode.GROWTH,
      priority: 60,
      canHandle: (event, context) => {
        return event.type === 'pointer' && event.modifiers.alt;
      },
      handle: async (event, context) => {
        await this.handleGrowthInteraction(event, context);
      }
    });
  }

  public async processEvent(event: InteractionEvent): Promise<void> {
    const startTime = performance.now();
    
    this.eventQueue.push(event);
    this.metrics.eventsProcessed++;
    
    if (!this.processingQueue) {
      await this.processEventQueue();
    }
    
    this.metrics.lastProcessingTime = performance.now() - startTime;
    this.updateAverageProcessingTime();
  }

  private async processEventQueue(): Promise<void> {
    this.processingQueue = true;
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      await this.processEventInternal(event);
    }
    
    this.processingQueue = false;
  }

  private async processEventInternal(event: InteractionEvent): Promise<void> {
    // Update context
    this.updateContext(event);
    
    // Apply conflict resolution
    const resolution = await this.resolveConflicts(event);
    
    if (resolution.action === 'block') {
      console.log(`🚫 Interaction blocked for ${event.mode} mode:`, resolution.reason);
      return;
    }
    
    if (resolution.action === 'transform' && resolution.transformedEvent) {
      event = resolution.transformedEvent;
    }
    
    // Route to appropriate handlers
    await this.routeToHandlers(event);
    
    // Update interaction tracking
    this.trackInteraction(event);
  }

  private updateContext(event: InteractionEvent): void {
    // Update last event for mode
    this.context.lastEvents.set(event.mode, event);
    
    // Track active interactions
    if (event.phase === 'start') {
      this.context.activeInteractions.set(event.id, event);
    } else if (event.phase === 'end' || event.phase === 'cancel') {
      this.context.activeInteractions.delete(event.id);
    } else {
      // Update existing interaction
      const existing = this.context.activeInteractions.get(event.id);
      if (existing) {
        this.context.activeInteractions.set(event.id, event);
      }
    }
  }

  private async resolveConflicts(event: InteractionEvent): Promise<{
    action: 'allow' | 'block' | 'transform';
    reason?: string;
    transformedEvent?: InteractionEvent;
  }> {
    // Check if multiple modes are trying to handle the same event
    const competingModes = this.getCompetingModes(event);
    
    if (competingModes.length <= 1) {
      return { action: 'allow' };
    }
    
    this.metrics.conflictsResolved++;
    
    // Apply conflict resolution strategy
    switch (this.conflictStrategy) {
      case ConflictResolution.PRIMARY_WINS:
        return this.resolvePrimaryWins(event, competingModes);
      
      case ConflictResolution.PRIORITY_ORDER:
        return this.resolvePriorityOrder(event, competingModes);
      
      case ConflictResolution.SPATIAL_REGIONS:
        return this.resolveSpatialRegions(event, competingModes);
      
      case ConflictResolution.TOOL_CONTEXT:
        return this.resolveToolContext(event, competingModes);
      
      case ConflictResolution.TEMPORAL_SEQUENCE:
        return this.resolveTemporalSequence(event, competingModes);
      
      default:
        return this.resolvePriorityOrder(event, competingModes);
    }
  }

  private getCompetingModes(event: InteractionEvent): CanvasMode[] {
    const competing: CanvasMode[] = [];
    
    this.handlers.forEach((handler, mode) => {
      if (this.context.activeModes.has(mode) && handler.canHandle(event, this.context)) {
        competing.push(mode);
      }
    });
    
    return competing;
  }

  private resolvePrimaryWins(event: InteractionEvent, competing: CanvasMode[]): {
    action: 'allow' | 'block';
    reason?: string;
  } {
    if (competing.includes(this.context.primaryMode)) {
      return { action: 'allow' };
    }
    
    return { 
      action: 'block', 
      reason: `Non-primary mode ${event.mode} blocked by primary mode ${this.context.primaryMode}` 
    };
  }

  private resolvePriorityOrder(event: InteractionEvent, competing: CanvasMode[]): {
    action: 'allow' | 'block';
    reason?: string;
  } {
    // Apply rules in priority order
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      if (rule.modes.includes(event.mode) && rule.condition(event, this.context)) {
        if (rule.action === 'allow') {
          return { action: 'allow' };
        } else if (rule.action === 'block') {
          return { 
            action: 'block', 
            reason: `Blocked by rule priority ${rule.priority}` 
          };
        }
      }
    }
    
    return { action: 'allow' };
  }

  private resolveSpatialRegions(event: InteractionEvent, competing: CanvasMode[]): {
    action: 'allow' | 'block';
    reason?: string;
  } {
    // Check if event point falls in a mode-specific region
    const regionKey = `${Math.floor(event.point.x / 100)},${Math.floor(event.point.y / 100)}`;
    const regionMode = this.context.regionMap.get(regionKey);
    
    if (regionMode && competing.includes(regionMode)) {
      if (event.mode === regionMode) {
        return { action: 'allow' };
      } else {
        return { 
          action: 'block', 
          reason: `Spatial region belongs to ${regionMode} mode` 
        };
      }
    }
    
    return { action: 'allow' };
  }

  private resolveToolContext(event: InteractionEvent, competing: CanvasMode[]): {
    action: 'allow' | 'block';
    reason?: string;
  } {
    // Check tool-specific contexts
    if (event.deviceType === 'pen' || event.deviceType === 'stylus') {
      // Pen/stylus should prioritize draw mode
      if (competing.includes(CanvasMode.DRAW)) {
        return event.mode === CanvasMode.DRAW 
          ? { action: 'allow' }
          : { action: 'block', reason: 'Pen/stylus reserved for draw mode' };
      }
    }
    
    if (event.type === 'keyboard') {
      // Keyboard should prioritize code mode
      if (competing.includes(CanvasMode.CODE)) {
        return event.mode === CanvasMode.CODE
          ? { action: 'allow' }
          : { action: 'block', reason: 'Keyboard reserved for code mode' };
      }
    }
    
    return { action: 'allow' };
  }

  private resolveTemporalSequence(event: InteractionEvent, competing: CanvasMode[]): {
    action: 'allow' | 'block';
    reason?: string;
  } {
    // Allow mode that was most recently active
    let mostRecentMode: CanvasMode | null = null;
    let mostRecentTime = 0;
    
    competing.forEach(mode => {
      const lastEvent = this.context.lastEvents.get(mode);
      if (lastEvent && lastEvent.timestamp > mostRecentTime) {
        mostRecentTime = lastEvent.timestamp;
        mostRecentMode = mode;
      }
    });
    
    if (mostRecentMode && event.mode === mostRecentMode) {
      return { action: 'allow' };
    }
    
    return { 
      action: 'block', 
      reason: `Mode ${mostRecentMode} was more recently active` 
    };
  }

  private async routeToHandlers(event: InteractionEvent): Promise<void> {
    const handler = this.handlers.get(event.mode);
    
    if (handler && handler.canHandle(event, this.context)) {
      try {
        await handler.handle(event, this.context);
      } catch (error) {
        console.error(`❌ Error in ${event.mode} handler:`, error);
      }
    }
  }

  private trackInteraction(event: InteractionEvent): void {
    // Update tool states if needed
    this.updateToolStates(event);
    
    // Log interaction for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Interaction processed: ${event.mode} ${event.type} ${event.phase}`, event);
    }
  }

  private updateToolStates(event: InteractionEvent): void {
    const currentState = this.context.toolStates.get(event.mode) || {};
    
    switch (event.mode) {
      case CanvasMode.DRAW:
        this.context.toolStates.set(event.mode, {
          ...currentState,
          drawing: event.phase === 'start' || event.phase === 'move',
          lastPressure: event.pressure || 0
        });
        break;
      
      case CanvasMode.CODE:
        this.context.toolStates.set(event.mode, {
          ...currentState,
          lastKeyEvent: event.type === 'keyboard' ? event : currentState.lastKeyEvent
        });
        break;
      
      case CanvasMode.PARAMETRIC:
        this.context.toolStates.set(event.mode, {
          ...currentState,
          adjusting: event.phase === 'start' || event.phase === 'move'
        });
        break;
      
      case CanvasMode.GROWTH:
        this.context.toolStates.set(event.mode, {
          ...currentState,
          seeding: event.phase === 'start'
        });
        break;
    }
  }

  private updateAverageProcessingTime(): void {
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageProcessingTime = 
      alpha * this.metrics.lastProcessingTime + 
      (1 - alpha) * this.metrics.averageProcessingTime;
  }

  // Handler method implementations
  private async handleDrawInteraction(event: InteractionEvent, context: InteractionContext): Promise<void> {
    // Delegate to draw mode engine
    console.log(`🖌️ Processing draw interaction:`, event.phase);
  }

  private async handleParametricInteraction(event: InteractionEvent, context: InteractionContext): Promise<void> {
    // Delegate to parametric mode engine
    console.log(`📊 Processing parametric interaction:`, event.phase);
  }

  private async handleCodeInteraction(event: InteractionEvent, context: InteractionContext): Promise<void> {
    // Delegate to code mode engine
    console.log(`💻 Processing code interaction:`, event.phase);
  }

  private async handleGrowthInteraction(event: InteractionEvent, context: InteractionContext): Promise<void> {
    // Delegate to growth mode engine
    console.log(`🌱 Processing growth interaction:`, event.phase);
  }

  // Public API methods
  public registerHandler(handler: ModeInteractionHandler): void {
    this.handlers.set(handler.mode, handler);
  }

  public addRule(rule: InteractionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  public setConflictStrategy(strategy: ConflictResolution): void {
    this.conflictStrategy = strategy;
  }

  public updateContext(updates: Partial<InteractionContext>): void {
    Object.assign(this.context, updates);
  }

  public setActiveModes(modes: Set<CanvasMode>): void {
    this.context.activeModes = new Set(modes);
  }

  public setPrimaryMode(mode: CanvasMode): void {
    this.context.primaryMode = mode;
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  public destroy(): void {
    // Clean up handlers
    this.handlers.forEach(handler => {
      if (handler.cleanup) {
        handler.cleanup();
      }
    });
    
    this.handlers.clear();
    this.rules.length = 0;
    this.eventQueue.length = 0;
    this.context.activeInteractions.clear();
    this.context.lastEvents.clear();
    this.context.toolStates.clear();
    
    console.log('🗑️ Interaction Manager destroyed');
  }
}