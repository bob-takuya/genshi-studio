/**
 * Core Parametric Pattern Engine for Genshi Studio
 * Handles parameter-driven pattern generation with hierarchical relationships,
 * constraints, interpolation, and real-time updates
 */

import { Color, Point, Size } from '../../types/graphics';

export enum ParameterType {
  NUMBER = 'number',
  COLOR = 'color',
  POINT = 'point',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  RANGE = 'range',
  ANGLE = 'angle',
  PERCENTAGE = 'percentage'
}

export interface ParameterConstraint {
  min?: number;
  max?: number;
  step?: number;
  dependencies?: string[];
  validationFn?: (value: any, allParams: Map<string, any>) => boolean;
  transformFn?: (value: any, allParams: Map<string, any>) => any;
}

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  defaultValue: any;
  constraints: ParameterConstraint;
  description: string;
  group?: string;
  order?: number;
  hidden?: boolean;
  animatable?: boolean;
}

export interface ParameterGroup {
  name: string;
  description: string;
  collapsed?: boolean;
  order?: number;
  parameters: ParameterDefinition[];
}

export interface ParameterSet {
  id: string;
  name: string;
  description: string;
  groups: ParameterGroup[];
  hierarchies: ParameterHierarchy[];
  constraints: GlobalConstraint[];
}

export interface ParameterHierarchy {
  parentParam: string;
  childParams: string[];
  relationship: 'enable' | 'disable' | 'transform' | 'constrain';
  condition?: (parentValue: any) => boolean;
  transform?: (parentValue: any, childValue: any) => any;
}

export interface GlobalConstraint {
  name: string;
  params: string[];
  validationFn: (values: Map<string, any>) => boolean;
  errorMessage: string;
}

export interface ParameterSnapshot {
  timestamp: number;
  values: Map<string, any>;
  metadata?: Map<string, any>;
}

export interface AnimationCurve {
  type: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  keyframes: { time: number; value: any }[];
}

export interface ParameterAnimation {
  parameterName: string;
  duration: number;
  curve: AnimationCurve;
  loop?: boolean;
  pingPong?: boolean;
  delay?: number;
}

export class ParametricPatternEngine {
  private parameterSets: Map<string, ParameterSet> = new Map();
  private activeValues: Map<string, any> = new Map();
  private snapshots: ParameterSnapshot[] = [];
  private animations: Map<string, ParameterAnimation> = new Map();
  private animationStartTime: number = 0;
  private animationFrame: number = 0;
  private changeListeners: Map<string, ((value: any) => void)[]> = new Map();
  private globalListeners: ((allValues: Map<string, any>) => void)[] = [];
  private _randomSeed: number = 0;

  constructor() {
    this.initializeDefaultParameterSets();
  }

  /**
   * Register a parameter set definition
   */
  registerParameterSet(parameterSet: ParameterSet): void {
    this.parameterSets.set(parameterSet.id, parameterSet);
    this.initializeParameterSet(parameterSet);
  }

  /**
   * Get a parameter set by ID
   */
  getParameterSet(id: string): ParameterSet | undefined {
    return this.parameterSets.get(id);
  }

  /**
   * Set parameter value with validation and hierarchy processing
   */
  setParameter(name: string, value: any, skipValidation: boolean = false): boolean {
    if (!skipValidation && !this.validateParameter(name, value)) {
      return false;
    }

    const oldValue = this.activeValues.get(name);
    this.activeValues.set(name, value);

    // Process hierarchical relationships
    this.processHierarchicalChanges(name, value, oldValue);

    // Trigger change listeners
    this.triggerChangeListeners(name, value);
    this.triggerGlobalListeners();

    return true;
  }

  /**
   * Get parameter value
   */
  getParameter(name: string): any {
    return this.activeValues.get(name);
  }

  /**
   * Get all parameter values
   */
  getAllParameters(): Map<string, any> {
    return new Map(this.activeValues);
  }

  /**
   * Set multiple parameters at once
   */
  setParameters(parameters: Map<string, any>): boolean {
    const oldValues = new Map(this.activeValues);
    let success = true;

    // Validate all parameters first
    for (const [name, value] of parameters) {
      if (!this.validateParameter(name, value)) {
        success = false;
        break;
      }
    }

    if (!success) {
      return false;
    }

    // Apply all changes
    for (const [name, value] of parameters) {
      this.activeValues.set(name, value);
    }

    // Process hierarchical relationships for all changed parameters
    for (const [name, value] of parameters) {
      this.processHierarchicalChanges(name, value, oldValues.get(name));
    }

    this.triggerGlobalListeners();
    return true;
  }

  /**
   * Randomize parameters within constraints
   */
  randomizeParameters(parameterNames?: string[], seed?: number): void {
    if (seed !== undefined) {
      this.randomSeed = seed;
    }

    const paramsToRandomize = parameterNames || Array.from(this.activeValues.keys());
    
    for (const paramName of paramsToRandomize) {
      const paramDef = this.findParameterDefinition(paramName);
      if (!paramDef) continue;

      const randomValue = this.generateRandomValue(paramDef);
      this.setParameter(paramName, randomValue);
    }
  }

  /**
   * Interpolate between two parameter sets
   */
  interpolateParameters(
    set1: Map<string, any>,
    set2: Map<string, any>,
    factor: number,
    curve: AnimationCurve['type'] = 'linear'
  ): Map<string, any> {
    const result = new Map<string, any>();
    const adjustedFactor = this.applyCurve(factor, curve);

    for (const [name, value1] of set1) {
      const value2 = set2.get(name);
      if (value2 === undefined) {
        result.set(name, value1);
        continue;
      }

      const interpolated = this.interpolateValue(value1, value2, adjustedFactor);
      result.set(name, interpolated);
    }

    return result;
  }

  /**
   * Create a snapshot of current parameter state
   */
  createSnapshot(metadata?: Map<string, any>): ParameterSnapshot {
    const snapshot: ParameterSnapshot = {
      timestamp: Date.now(),
      values: new Map(this.activeValues),
      metadata: metadata ? new Map(metadata) : undefined
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Restore parameters from a snapshot
   */
  restoreSnapshot(snapshot: ParameterSnapshot): void {
    this.setParameters(snapshot.values);
  }

  /**
   * Start parameter animation
   */
  startAnimation(animations: ParameterAnimation[]): void {
    this.stopAnimation();
    
    for (const animation of animations) {
      this.animations.set(animation.parameterName, animation);
    }

    this.animationStartTime = performance.now();
    this.animateParameters();
  }

  /**
   * Stop parameter animation
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.animations.clear();
  }

  /**
   * Add parameter change listener
   */
  addChangeListener(parameterName: string, listener: (value: any) => void): void {
    if (!this.changeListeners.has(parameterName)) {
      this.changeListeners.set(parameterName, []);
    }
    this.changeListeners.get(parameterName)!.push(listener);
  }

  /**
   * Add global change listener
   */
  addGlobalChangeListener(listener: (allValues: Map<string, any>) => void): void {
    this.globalListeners.push(listener);
  }

  /**
   * Remove parameter change listener
   */
  removeChangeListener(parameterName: string, listener: (value: any) => void): void {
    const listeners = this.changeListeners.get(parameterName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Generate parameter variations for exploration
   */
  generateVariations(
    baseParameters: Map<string, any>,
    variationCount: number = 8,
    variationStrength: number = 0.3
  ): Map<string, any>[] {
    const variations: Map<string, any>[] = [];

    for (let i = 0; i < variationCount; i++) {
      const variation = new Map(baseParameters);
      
      for (const [name, value] of baseParameters) {
        const paramDef = this.findParameterDefinition(name);
        if (!paramDef || !paramDef.animatable) continue;

        const variedValue = this.varyValue(value, paramDef, variationStrength);
        variation.set(name, variedValue);
      }

      variations.push(variation);
    }

    return variations;
  }

  // Private methods

  private initializeDefaultParameterSets(): void {
    // Initialize with common parameter sets
    this.registerParameterSet({
      id: 'basic',
      name: 'Basic Parameters',
      description: 'Essential parameters for all patterns',
      groups: [
        {
          name: 'Transform',
          description: 'Basic transformations',
          order: 1,
          parameters: [
            {
              name: 'scale',
              type: ParameterType.NUMBER,
              defaultValue: 1.0,
              constraints: { min: 0.1, max: 10.0, step: 0.1 },
              description: 'Scale factor',
              animatable: true
            },
            {
              name: 'rotation',
              type: ParameterType.ANGLE,
              defaultValue: 0.0,
              constraints: { min: 0, max: 360, step: 1 },
              description: 'Rotation angle in degrees',
              animatable: true
            },
            {
              name: 'offsetX',
              type: ParameterType.NUMBER,
              defaultValue: 0.0,
              constraints: { min: -100, max: 100, step: 0.1 },
              description: 'Horizontal offset',
              animatable: true
            },
            {
              name: 'offsetY',
              type: ParameterType.NUMBER,
              defaultValue: 0.0,
              constraints: { min: -100, max: 100, step: 0.1 },
              description: 'Vertical offset',
              animatable: true
            }
          ]
        },
        {
          name: 'Colors',
          description: 'Color parameters',
          order: 2,
          parameters: [
            {
              name: 'primaryColor',
              type: ParameterType.COLOR,
              defaultValue: { r: 0.2, g: 0.3, b: 0.8, a: 1.0 },
              constraints: {},
              description: 'Primary color',
              animatable: true
            },
            {
              name: 'secondaryColor',
              type: ParameterType.COLOR,
              defaultValue: { r: 0.8, g: 0.9, b: 1.0, a: 1.0 },
              constraints: {},
              description: 'Secondary color',
              animatable: true
            }
          ]
        }
      ],
      hierarchies: [],
      constraints: []
    });
  }

  private initializeParameterSet(parameterSet: ParameterSet): void {
    for (const group of parameterSet.groups) {
      for (const param of group.parameters) {
        if (!this.activeValues.has(param.name)) {
          this.activeValues.set(param.name, param.defaultValue);
        }
      }
    }
  }

  private validateParameter(name: string, value: any): boolean {
    const paramDef = this.findParameterDefinition(name);
    if (!paramDef) return false;

    const { constraints } = paramDef;

    // Basic type validation
    if (paramDef.type === ParameterType.NUMBER || paramDef.type === ParameterType.RANGE) {
      if (typeof value !== 'number') return false;
      if (constraints.min !== undefined && value < constraints.min) return false;
      if (constraints.max !== undefined && value > constraints.max) return false;
    }

    // Custom validation
    if (constraints.validationFn) {
      return constraints.validationFn(value, this.activeValues);
    }

    return true;
  }

  private processHierarchicalChanges(paramName: string, value: any, oldValue: any): void {
    for (const paramSet of this.parameterSets.values()) {
      for (const hierarchy of paramSet.hierarchies) {
        if (hierarchy.parentParam === paramName) {
          this.processHierarchy(hierarchy, value);
        }
      }
    }
  }

  private processHierarchy(hierarchy: ParameterHierarchy, parentValue: any): void {
    const shouldApply = !hierarchy.condition || hierarchy.condition(parentValue);
    
    if (!shouldApply) return;

    for (const childParam of hierarchy.childParams) {
      const childValue = this.activeValues.get(childParam);
      
      switch (hierarchy.relationship) {
        case 'enable':
          // Enable/disable parameter based on parent
          break;
        case 'disable':
          // Disable parameter based on parent
          break;
        case 'transform':
          if (hierarchy.transform) {
            const transformedValue = hierarchy.transform(parentValue, childValue);
            this.setParameter(childParam, transformedValue, true);
          }
          break;
        case 'constrain':
          // Apply constraints based on parent value
          break;
      }
    }
  }

  private findParameterDefinition(name: string): ParameterDefinition | undefined {
    for (const paramSet of this.parameterSets.values()) {
      for (const group of paramSet.groups) {
        const param = group.parameters.find(p => p.name === name);
        if (param) return param;
      }
    }
    return undefined;
  }

  private generateRandomValue(paramDef: ParameterDefinition): any {
    const { type, constraints } = paramDef;
    
    switch (type) {
      case ParameterType.NUMBER:
      case ParameterType.RANGE:
        const min = constraints.min || 0;
        const max = constraints.max || 1;
        return min + Math.random() * (max - min);
      
      case ParameterType.ANGLE:
        return Math.random() * 360;
      
      case ParameterType.PERCENTAGE:
        return Math.random() * 100;
      
      case ParameterType.COLOR:
        return {
          r: Math.random(),
          g: Math.random(),
          b: Math.random(),
          a: 1.0
        };
      
      case ParameterType.BOOLEAN:
        return Math.random() > 0.5;
      
      default:
        return paramDef.defaultValue;
    }
  }

  private interpolateValue(value1: any, value2: any, factor: number): any {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return value1 + (value2 - value1) * factor;
    }
    
    if (value1 && value2 && typeof value1 === 'object' && 'r' in value1) {
      // Color interpolation
      return {
        r: value1.r + (value2.r - value1.r) * factor,
        g: value1.g + (value2.g - value1.g) * factor,
        b: value1.b + (value2.b - value1.b) * factor,
        a: value1.a + (value2.a - value1.a) * factor
      };
    }
    
    return factor < 0.5 ? value1 : value2;
  }

  private applyCurve(factor: number, curve: AnimationCurve['type']): number {
    switch (curve) {
      case 'ease':
        return factor * factor * (3 - 2 * factor);
      case 'ease-in':
        return factor * factor;
      case 'ease-out':
        return 1 - Math.pow(1 - factor, 2);
      case 'ease-in-out':
        return factor < 0.5 
          ? 2 * factor * factor 
          : 1 - Math.pow(-2 * factor + 2, 2) / 2;
      case 'bounce':
        return this.bounceEase(factor);
      case 'elastic':
        return this.elasticEase(factor);
      default:
        return factor;
    }
  }

  private bounceEase(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  private elasticEase(t: number): number {
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  }

  private varyValue(value: any, paramDef: ParameterDefinition, strength: number): any {
    if (typeof value === 'number') {
      const range = (paramDef.constraints.max || 1) - (paramDef.constraints.min || 0);
      const variation = (Math.random() - 0.5) * range * strength;
      return Math.max(
        paramDef.constraints.min || 0,
        Math.min(paramDef.constraints.max || 1, value + variation)
      );
    }
    
    if (value && typeof value === 'object' && 'r' in value) {
      return {
        r: Math.max(0, Math.min(1, value.r + (Math.random() - 0.5) * strength)),
        g: Math.max(0, Math.min(1, value.g + (Math.random() - 0.5) * strength)),
        b: Math.max(0, Math.min(1, value.b + (Math.random() - 0.5) * strength)),
        a: value.a
      };
    }
    
    return value;
  }

  private animateParameters(): void {
    const currentTime = performance.now();
    const elapsed = currentTime - this.animationStartTime;

    let hasActiveAnimations = false;

    for (const [paramName, animation] of this.animations) {
      const animationTime = (elapsed - (animation.delay || 0)) / (animation.duration * 1000);
      
      if (animationTime >= 0) {
        let normalizedTime = animationTime;
        
        if (animation.loop) {
          normalizedTime = normalizedTime % 1;
        }
        
        if (animation.pingPong && Math.floor(animationTime) % 2 === 1) {
          normalizedTime = 1 - (normalizedTime % 1);
        }
        
        normalizedTime = Math.max(0, Math.min(1, normalizedTime));
        
        const animatedValue = this.evaluateAnimationCurve(animation.curve, normalizedTime);
        this.setParameter(paramName, animatedValue, true);
        
        if (animationTime < 1 || animation.loop) {
          hasActiveAnimations = true;
        }
      } else {
        hasActiveAnimations = true;
      }
    }

    if (hasActiveAnimations) {
      this.animationFrame = requestAnimationFrame(() => this.animateParameters());
    }
  }

  private evaluateAnimationCurve(curve: AnimationCurve, time: number): any {
    const { keyframes } = curve;
    
    if (keyframes.length === 0) return 0;
    if (keyframes.length === 1) return keyframes[0].value;
    
    // Find surrounding keyframes
    let beforeFrame = keyframes[0];
    let afterFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        beforeFrame = keyframes[i];
        afterFrame = keyframes[i + 1];
        break;
      }
    }
    
    if (beforeFrame === afterFrame) {
      return beforeFrame.value;
    }
    
    const frameProgress = (time - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
    const adjustedProgress = this.applyCurve(frameProgress, curve.type);
    
    return this.interpolateValue(beforeFrame.value, afterFrame.value, adjustedProgress);
  }

  private triggerChangeListeners(paramName: string, value: any): void {
    const listeners = this.changeListeners.get(paramName);
    if (listeners) {
      listeners.forEach(listener => listener(value));
    }
  }

  private triggerGlobalListeners(): void {
    this.globalListeners.forEach(listener => listener(this.activeValues));
  }

  destroy(): void {
    this.stopAnimation();
    this.changeListeners.clear();
    this.globalListeners.length = 0;
    this.parameterSets.clear();
    this.activeValues.clear();
  }
}