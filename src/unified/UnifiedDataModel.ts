/**
 * Unified Data Model - Core Implementation Starter
 * ARCHITECT_002 Design Implementation
 * 
 * This file provides the foundational types and interfaces for the
 * unified multi-mode editing system described in UNIFIED_DATA_MODEL_ARCHITECTURE.md
 */

import { Point, Color, Rectangle, Transform } from '../types/graphics';

// Core enums
export enum EntityType {
  STROKE = 'stroke',
  PATTERN = 'pattern',
  PROCEDURE = 'procedure',
  GROWTH = 'growth',
  COMPOSITE = 'composite',
  GROUP = 'group'
}

export enum CreativeMode {
  DRAW = 'draw',
  PARAMETRIC = 'parametric',
  CODE = 'code',
  GROWTH = 'growth'
}

export enum ConflictType {
  TEMPORAL = 'temporal',
  SEMANTIC = 'semantic',
  GEOMETRIC = 'geometric'
}

export enum LockAspect {
  GEOMETRY = 'geometry',
  STYLE = 'style',
  PARAMETERS = 'parameters',
  TRANSFORM = 'transform'
}

// Core geometric primitives
export interface GeometricPrimitive {
  type: 'path' | 'circle' | 'polygon' | 'bezier' | 'mesh';
  points: Point[];
  controlPoints?: Point[];
  properties: PrimitiveProperties;
}

export interface PrimitiveProperties {
  fillColor?: Color;
  strokeColor?: Color;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: any;
}

export interface GeometryData {
  primitives: GeometricPrimitive[];
  boundingBox: Rectangle;
  spatialHash: string;
  
  // Level-of-detail for performance
  lodLevels: {
    high: GeometricPrimitive[];
    medium: GeometricPrimitive[];
    low: GeometricPrimitive[];
  };
}

// Multi-modal representations
export interface VectorRepresentation {
  strokes: DrawStroke[];
  pressure: PressureData[];
  brushSettings: BrushConfiguration;
  activeStroke?: DrawStroke;
  inputDevice: InputDeviceState;
}

export interface ParametricRepresentation {
  patternType: string;
  parameters: Map<string, ParameterValue>;
  generator: PatternGenerator;
  constraints: ParameterConstraint[];
  animations: ParameterAnimation[];
  keyframes: ParameterKeyframe[];
}

export interface ProceduralRepresentation {
  sourceCode: string;
  compiledFunction: CompiledFunction;
  inputs: CodeInput[];
  outputs: CodeOutput[];
  dependencies: string[];
  executionTime: number;
  memoryUsage: number;
}

export interface OrganicRepresentation {
  algorithm: GrowthAlgorithm;
  seeds: GrowthSeed[];
  generations: GrowthGeneration[];
  currentGeneration: number;
  growthRules: GrowthRule[];
  environmentalFactors: EnvironmentalData;
}

// Core Canvas Entity
export interface CanvasEntity {
  id: string;
  type: EntityType;
  
  // Core geometric representation
  geometry: GeometryData;
  
  // Multi-modal representations
  representations: {
    vector: VectorRepresentation;
    parametric: ParametricRepresentation;
    procedural: ProceduralRepresentation;
    organic: OrganicRepresentation;
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

// Entity metadata and versioning
export interface EntityMetadata {
  name?: string;
  tags: string[];
  createdAt: number;
  createdBy: CreativeMode;
  originalMode: CreativeMode;
  description?: string;
}

export interface EntityVersion {
  id: string;
  timestamp: number;
  mode: CreativeMode;
  operation: string;
  data: Partial<CanvasEntity>;
  checksum: string;
}

export interface EntityLock {
  mode: CreativeMode;
  operation: string;
  timestamp: number;
  userId?: string;
  lockedAspects: LockAspect[];
}

// Style and visual properties
export interface StyleProperties {
  opacity: number;
  blendMode: string;
  visible: boolean;
  layer: number;
  [key: string]: any;
}

// Drawing-specific types
export interface DrawStroke {
  id: string;
  points: StrokePoint[];
  style: StrokeStyle;
  timestamp: number;
  pressureProfile: number[];
  velocityProfile: Vector2[];
}

export interface StrokePoint {
  position: Point;
  pressure: number;
  velocity: Vector2;
  timestamp: number;
}

export interface StrokeStyle {
  color: Color;
  width: number;
  hardness: number;
  opacity: number;
  blendMode: string;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface PressureData {
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
}

export interface BrushConfiguration {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  spacing: number;
  [key: string]: any;
}

export interface InputDeviceState {
  type: 'mouse' | 'pen' | 'touch';
  supportsPressure: boolean;
  maxPressure: number;
  currentPressure: number;
}

// Parametric-specific types
export interface ParameterValue {
  value: any;
  type: string;
  lastModified: number;
  mode: CreativeMode;
}

export interface PatternGenerator {
  type: string;
  algorithm: string;
  version: string;
  [key: string]: any;
}

export interface ParameterConstraint {
  min?: number;
  max?: number;
  step?: number;
  dependencies?: string[];
  validationFn?: (value: any, allParams: Map<string, any>) => boolean;
}

export interface ParameterAnimation {
  parameterName: string;
  duration: number;
  curve: AnimationCurve;
  loop?: boolean;
  pingPong?: boolean;
  delay?: number;
}

export interface ParameterKeyframe {
  time: number;
  value: any;
  interpolation: 'linear' | 'cubic' | 'step';
}

export interface AnimationCurve {
  type: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  keyframes: { time: number; value: any }[];
}

// Code-specific types
export interface CompiledFunction {
  bytecode: Uint8Array;
  symbols: SymbolTable;
  entryPoint: number;
}

export interface SymbolTable {
  functions: Map<string, FunctionSymbol>;
  variables: Map<string, VariableSymbol>;
  imports: Map<string, ImportSymbol>;
}

export interface FunctionSymbol {
  name: string;
  address: number;
  parameters: ParameterSymbol[];
  returnType: string;
}

export interface VariableSymbol {
  name: string;
  type: string;
  address: number;
  scope: string;
}

export interface ImportSymbol {
  name: string;
  module: string;
  alias?: string;
}

export interface ParameterSymbol {
  name: string;
  type: string;
  defaultValue?: any;
}

export interface CodeInput {
  name: string;
  type: string;
  value: any;
  required: boolean;
}

export interface CodeOutput {
  name: string;
  type: string;
  value: any;
  timestamp: number;
}

// Growth-specific types
export interface GrowthAlgorithm {
  type: 'organic' | 'l-system' | 'cellular' | 'reaction-diffusion' | 'dla';
  parameters: Map<string, any>;
  version: string;
}

export interface GrowthSeed {
  id: string;
  position: Point;
  energy: number;
  type: SeedType;
  properties: SeedProperties;
}

export interface SeedType {
  name: string;
  growthRate: number;
  energyConsumption: number;
  maxSize: number;
}

export interface SeedProperties {
  color: Color;
  shape: string;
  behavior: string;
  [key: string]: any;
}

export interface GrowthGeneration {
  id: number;
  timestamp: number;
  entities: string[]; // Entity IDs
  stats: GenerationStats;
}

export interface GenerationStats {
  totalEntities: number;
  newEntities: number;
  removedEntities: number;
  avgEnergy: number;
  coverage: number;
}

export interface GrowthRule {
  condition: (entity: CanvasEntity, environment: EnvironmentalData) => boolean;
  action: (entity: CanvasEntity, environment: EnvironmentalData) => CanvasEntity;
  priority: number;
}

export interface EnvironmentalData {
  temperature: number;
  humidity: number;
  nutrients: number;
  obstacles: Rectangle[];
  attractors: Point[];
  [key: string]: any;
}

// Translation and synchronization types
export interface TranslationResult {
  vector: VectorRepresentation | null;
  parametric: ParametricRepresentation | null;
  procedural: ProceduralRepresentation | null;
  organic: OrganicRepresentation | null;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  entityId: string;
  timestamp: number;
  description: string;
  affectedModes: CreativeMode[];
}

export interface TemporalConflict extends Conflict {
  operations: ConflictingOperation[];
}

export interface ConflictingOperation {
  mode: CreativeMode;
  operation: string;
  timestamp: number;
  data: any;
}

// Abstract interfaces for extensibility
export abstract class ModeTranslator {
  abstract translate(entity: CanvasEntity): Promise<any>;
  abstract canTranslate(fromMode: CreativeMode, toMode: CreativeMode): boolean;
  abstract getTranslationQuality(entity: CanvasEntity): number;
}

export abstract class ConflictResolver {
  abstract detectConflicts(entity: CanvasEntity, translations: TranslationResult): Conflict[];
  abstract resolveConflict(conflict: Conflict): Promise<void>;
  abstract canResolve(conflict: Conflict): boolean;
}

/**
 * IMPLEMENTATION NOTES FOR DEVELOPERS:
 * 
 * 1. Start with implementing CanvasEntity and basic storage
 * 2. Build a simple VectorToParametricTranslator as proof of concept
 * 3. Implement event-driven synchronization with a simple event bus
 * 4. Add spatial indexing for performance
 * 5. Implement conflict detection and resolution
 * 
 * Priority order:
 * - Phase 1: Core data structures and storage
 * - Phase 2: Basic translation layer (Vector ↔ Parametric)
 * - Phase 3: Synchronization engine
 * - Phase 4: Conflict resolution
 * - Phase 5: Performance optimization
 * 
 * See UNIFIED_DATA_MODEL_ARCHITECTURE.md for detailed implementation guidance.
 */