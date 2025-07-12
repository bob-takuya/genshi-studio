/**
 * Growth Inference Engine
 * Infers growth and evolution algorithms from static patterns
 * Creates L-systems, cellular automata, and procedural generation rules
 */

import { Point, Color } from '../../types/graphics';
import { StrokeData, VectorPath, GrowthData, GrowthRule, GrowthConstraint } from '../BidirectionalTranslationEngine';
import { PatternGroup, PatternElement } from './PatternRecognition';

export interface GrowthPattern {
  id: string;
  type: 'L-system' | 'cellular-automata' | 'particle-system' | 'fractal' | 'agent-based';
  complexity: number; // 0-1
  scalability: number; // 0-1
  naturalness: number; // 0-1
  rules: InferredRule[];
  parameters: GrowthParameter[];
  constraints: InferredConstraint[];
}

export interface InferredRule {
  id: string;
  type: 'production' | 'evolution' | 'death' | 'movement' | 'interaction';
  condition: string;
  action: string;
  probability: number;
  priority: number;
  variables: { [key: string]: any };
}

export interface GrowthParameter {
  name: string;
  type: 'number' | 'angle' | 'probability' | 'distance';
  value: number;
  range: { min: number; max: number };
  influence: string; // What this parameter affects
}

export interface InferredConstraint {
  type: 'boundary' | 'density' | 'resource' | 'collision' | 'aesthetic';
  description: string;
  formula: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GrowthInferenceResult {
  success: boolean;
  patterns: GrowthPattern[];
  confidence: number; // 0-1
  recommendations: string[];
  generationSteps: number;
  estimatedComplexity: number;
  metadata: {
    analysisTime: number;
    algorithmsUsed: string[];
    qualityScore: number;
  };
}

export interface InferenceOptions {
  preferredTypes: ('L-system' | 'cellular-automata' | 'particle-system' | 'fractal' | 'agent-based')[];
  maxComplexity: number; // 0-1
  optimizeForNaturalness: boolean;
  includeStochastic: boolean;
  targetGenerations: number;
}

export class GrowthInference {
  private options: InferenceOptions;
  private analysisCache = new Map<string, any>();
  
  constructor(options: Partial<InferenceOptions> = {}) {
    this.options = {
      preferredTypes: ['L-system', 'fractal', 'particle-system'],
      maxComplexity: 0.8,
      optimizeForNaturalness: true,
      includeStochastic: true,
      targetGenerations: 10,
      ...options
    };
  }

  /**
   * Infer growth patterns from stroke data
   */
  async inferFromStrokes(strokes: StrokeData[]): Promise<GrowthInferenceResult> {
    const startTime = performance.now();
    const algorithmsUsed: string[] = [];
    
    try {
      // 1. Analyze stroke characteristics for growth indicators
      algorithmsUsed.push('stroke_growth_analysis');
      const strokeAnalysis = await this.analyzeStrokesForGrowth(strokes);
      
      // 2. Identify potential growth patterns
      algorithmsUsed.push('growth_pattern_identification');
      const growthIndicators = this.identifyGrowthIndicators(strokeAnalysis);
      
      // 3. Generate growth patterns
      const patterns = await this.generateGrowthPatterns(growthIndicators);
      
      // 4. Calculate confidence and quality
      const confidence = this.calculateInferenceConfidence(patterns, strokeAnalysis);
      const qualityScore = this.calculateQualityScore(patterns);
      
      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(patterns, strokeAnalysis);
      
      return {
        success: true,
        patterns,
        confidence,
        recommendations,
        generationSteps: this.estimateGenerationSteps(patterns),
        estimatedComplexity: this.calculateComplexity(patterns),
        metadata: {
          analysisTime: performance.now() - startTime,
          algorithmsUsed,
          qualityScore
        }
      };
      
    } catch (error) {
      return {
        success: false,
        patterns: [],
        confidence: 0,
        recommendations: [`Error during inference: ${error.message}`],
        generationSteps: 0,
        estimatedComplexity: 0,
        metadata: {
          analysisTime: performance.now() - startTime,
          algorithmsUsed,
          qualityScore: 0
        }
      };
    }
  }

  /**
   * Infer growth patterns from recognized patterns
   */
  async inferFromPatterns(patternGroups: PatternGroup[]): Promise<GrowthInferenceResult> {
    const startTime = performance.now();
    const algorithmsUsed: string[] = [];
    
    try {
      // 1. Analyze pattern characteristics
      algorithmsUsed.push('pattern_growth_analysis');
      const patternAnalysis = await this.analyzePatternsForGrowth(patternGroups);
      
      // 2. Determine growth type based on pattern structure
      algorithmsUsed.push('growth_type_classification');
      const growthTypes = this.classifyGrowthTypes(patternAnalysis);
      
      // 3. Generate specific growth algorithms
      const patterns = await this.generateGrowthAlgorithms(growthTypes, patternAnalysis);
      
      const confidence = this.calculatePatternInferenceConfidence(patterns, patternAnalysis);
      const qualityScore = this.calculateQualityScore(patterns);
      const recommendations = this.generatePatternRecommendations(patterns, patternAnalysis);
      
      return {
        success: true,
        patterns,
        confidence,
        recommendations,
        generationSteps: this.estimateGenerationSteps(patterns),
        estimatedComplexity: this.calculateComplexity(patterns),
        metadata: {
          analysisTime: performance.now() - startTime,
          algorithmsUsed,
          qualityScore
        }
      };
      
    } catch (error) {
      throw new Error(`Pattern growth inference failed: ${error.message}`);
    }
  }

  /**
   * Analyze strokes for growth characteristics
   */
  private async analyzeStrokesForGrowth(strokes: StrokeData[]): Promise<any> {
    const analysis = {
      branching: [],
      scaling: [],
      directional: [],
      organic: [],
      fractal: [],
      temporal: []
    };
    
    for (const stroke of strokes) {
      // Analyze branching patterns
      const branching = this.analyzeBranchingPatterns(stroke);
      if (branching.hasBranching) {
        analysis.branching.push(branching);
      }
      
      // Analyze scaling patterns
      const scaling = this.analyzeScalingPatterns(stroke);
      if (scaling.hasScaling) {
        analysis.scaling.push(scaling);
      }
      
      // Analyze directional growth
      const directional = this.analyzeDirectionalGrowth(stroke);
      if (directional.hasDirection) {
        analysis.directional.push(directional);
      }
      
      // Analyze organic characteristics
      const organic = this.analyzeOrganicCharacteristics(stroke);
      if (organic.isOrganic) {
        analysis.organic.push(organic);
      }
      
      // Analyze fractal properties
      const fractal = this.analyzeFractalProperties(stroke);
      if (fractal.isFractal) {
        analysis.fractal.push(fractal);
      }
    }
    
    return analysis;
  }

  private analyzeBranchingPatterns(stroke: StrokeData): any {
    const points = stroke.points;
    const branches = [];
    
    // Look for sharp angle changes that might indicate branching
    for (let i = 1; i < points.length - 1; i++) {
      const v1 = {
        x: points[i].x - points[i - 1].x,
        y: points[i].y - points[i - 1].y
      };
      const v2 = {
        x: points[i + 1].x - points[i].x,
        y: points[i + 1].y - points[i].y
      };
      
      const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
      const angleDiff = Math.abs(angle);
      
      // Significant angle change might indicate branching
      if (angleDiff > Math.PI / 3) {
        branches.push({
          point: points[i],
          angle: angleDiff,
          index: i
        });
      }
    }
    
    return {
      hasBranching: branches.length > 0,
      branchCount: branches.length,
      branches,
      branchingAngle: branches.length > 0 
        ? branches.reduce((sum, b) => sum + b.angle, 0) / branches.length 
        : 0
    };
  }

  private analyzeScalingPatterns(stroke: StrokeData): any {
    const points = stroke.points;
    const segments = [];
    
    // Analyze segment lengths for scaling patterns
    for (let i = 0; i < points.length - 1; i++) {
      const length = this.distance(points[i], points[i + 1]);
      segments.push(length);
    }
    
    // Look for systematic scaling
    const ratios = [];
    for (let i = 1; i < segments.length; i++) {
      if (segments[i - 1] > 0) {
        ratios.push(segments[i] / segments[i - 1]);
      }
    }
    
    // Check for consistent scaling ratio
    if (ratios.length > 2) {
      const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;
      const isConsistent = variance < 0.1;
      
      return {
        hasScaling: isConsistent && Math.abs(avgRatio - 1) > 0.1,
        scalingRatio: avgRatio,
        consistency: 1 - variance,
        direction: avgRatio > 1 ? 'expanding' : 'contracting'
      };
    }
    
    return { hasScaling: false };
  }

  private analyzeDirectionalGrowth(stroke: StrokeData): any {
    const points = stroke.points;
    
    if (points.length < 3) {
      return { hasDirection: false };
    }
    
    // Calculate overall direction
    const start = points[0];
    const end = points[points.length - 1];
    const overallDirection = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Check consistency of direction
    let consistentDirections = 0;
    const directionTolerance = Math.PI / 6; // 30 degrees
    
    for (let i = 0; i < points.length - 1; i++) {
      const segmentDirection = Math.atan2(
        points[i + 1].y - points[i].y,
        points[i + 1].x - points[i].x
      );
      
      const angleDiff = Math.abs(segmentDirection - overallDirection);
      if (angleDiff < directionTolerance || angleDiff > Math.PI * 2 - directionTolerance) {
        consistentDirections++;
      }
    }
    
    const consistency = consistentDirections / (points.length - 1);
    
    return {
      hasDirection: consistency > 0.7,
      direction: overallDirection,
      consistency,
      growth: end.y < start.y ? 'upward' : 'downward'
    };
  }

  private analyzeOrganicCharacteristics(stroke: StrokeData): any {
    const points = stroke.points;
    
    // Calculate curvature variation (organic shapes have varied curvature)
    const curvatures = [];
    for (let i = 1; i < points.length - 1; i++) {
      const curvature = this.calculateCurvature(
        points[i - 1], points[i], points[i + 1]
      );
      curvatures.push(curvature);
    }
    
    if (curvatures.length === 0) {
      return { isOrganic: false };
    }
    
    const avgCurvature = curvatures.reduce((sum, c) => sum + c, 0) / curvatures.length;
    const curvatureVariation = this.calculateVariation(curvatures);
    
    // Organic shapes tend to have moderate curvature with variation
    const isOrganic = avgCurvature > 0.1 && 
                     avgCurvature < 2.0 && 
                     curvatureVariation > 0.3;
    
    return {
      isOrganic,
      avgCurvature,
      curvatureVariation,
      smoothness: 1 - curvatureVariation,
      naturalness: isOrganic ? 0.8 : 0.2
    };
  }

  private analyzeFractalProperties(stroke: StrokeData): any {
    const points = stroke.points;
    
    // Simple fractal detection - look for self-similarity at different scales
    const scales = [2, 4, 8];
    const similarities = [];
    
    for (const scale of scales) {
      if (points.length >= scale * 2) {
        const similarity = this.calculateSelfSimilarity(points, scale);
        similarities.push(similarity);
      }
    }
    
    if (similarities.length === 0) {
      return { isFractal: false };
    }
    
    const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const isFractal = avgSimilarity > 0.6;
    
    return {
      isFractal,
      selfSimilarity: avgSimilarity,
      fractalDimension: this.estimateFractalDimension(points),
      scales: similarities.length
    };
  }

  /**
   * Identify growth indicators from analysis
   */
  private identifyGrowthIndicators(analysis: any): any {
    const indicators = {
      lSystemLikely: false,
      cellularAutomataLikely: false,
      particleSystemLikely: false,
      fractalLikely: false,
      agentBasedLikely: false,
      confidence: 0
    };
    
    // L-System indicators
    if (analysis.branching.length > 0 && analysis.directional.length > 0) {
      indicators.lSystemLikely = true;
      indicators.confidence += 0.3;
    }
    
    // Fractal indicators
    if (analysis.fractal.length > 0 || analysis.scaling.length > 0) {
      indicators.fractalLikely = true;
      indicators.confidence += 0.2;
    }
    
    // Organic/particle system indicators
    if (analysis.organic.length > 0) {
      indicators.particleSystemLikely = true;
      indicators.agentBasedLikely = true;
      indicators.confidence += 0.2;
    }
    
    // Cellular automata indicators (grid-like patterns)
    const hasGridLike = analysis.directional.some(d => 
      d.consistency > 0.9 && (d.direction % (Math.PI / 2)) < 0.1
    );
    if (hasGridLike) {
      indicators.cellularAutomataLikely = true;
      indicators.confidence += 0.15;
    }
    
    return indicators;
  }

  /**
   * Generate growth patterns based on indicators
   */
  private async generateGrowthPatterns(indicators: any): Promise<GrowthPattern[]> {
    const patterns: GrowthPattern[] = [];
    
    if (indicators.lSystemLikely && this.options.preferredTypes.includes('L-system')) {
      patterns.push(await this.generateLSystemPattern(indicators));
    }
    
    if (indicators.fractalLikely && this.options.preferredTypes.includes('fractal')) {
      patterns.push(await this.generateFractalPattern(indicators));
    }
    
    if (indicators.particleSystemLikely && this.options.preferredTypes.includes('particle-system')) {
      patterns.push(await this.generateParticleSystemPattern(indicators));
    }
    
    if (indicators.cellularAutomataLikely && this.options.preferredTypes.includes('cellular-automata')) {
      patterns.push(await this.generateCellularAutomataPattern(indicators));
    }
    
    if (indicators.agentBasedLikely && this.options.preferredTypes.includes('agent-based')) {
      patterns.push(await this.generateAgentBasedPattern(indicators));
    }
    
    return patterns.filter(p => p !== null);
  }

  /**
   * Generate L-System pattern
   */
  private async generateLSystemPattern(indicators: any): Promise<GrowthPattern> {
    const rules: InferredRule[] = [
      {
        id: 'axiom',
        type: 'production',
        condition: 'start',
        action: 'F',
        probability: 1.0,
        priority: 1,
        variables: { symbol: 'F', meaning: 'forward' }
      },
      {
        id: 'branch_rule',
        type: 'production',
        condition: 'F',
        action: 'F[+F]F[-F]F',
        probability: 0.8,
        priority: 2,
        variables: { 
          angle: 25, 
          length_factor: 0.7,
          '[': 'push_state',
          ']': 'pop_state',
          '+': 'turn_left',
          '-': 'turn_right'
        }
      }
    ];
    
    const parameters: GrowthParameter[] = [
      {
        name: 'branching_angle',
        type: 'angle',
        value: 25,
        range: { min: 15, max: 45 },
        influence: 'Controls the angle between branches'
      },
      {
        name: 'length_reduction',
        type: 'number',
        value: 0.7,
        range: { min: 0.5, max: 0.9 },
        influence: 'How much shorter each generation becomes'
      },
      {
        name: 'generations',
        type: 'number',
        value: this.options.targetGenerations,
        range: { min: 3, max: 8 },
        influence: 'Number of growth iterations'
      }
    ];
    
    const constraints: InferredConstraint[] = [
      {
        type: 'boundary',
        description: 'Keep growth within canvas bounds',
        formula: 'x >= 0 && x <= width && y >= 0 && y <= height',
        priority: 'high'
      },
      {
        type: 'density',
        description: 'Prevent overcrowding of branches',
        formula: 'branch_density < max_density',
        priority: 'medium'
      }
    ];
    
    return {
      id: 'lsystem_pattern',
      type: 'L-system',
      complexity: 0.7,
      scalability: 0.9,
      naturalness: this.options.optimizeForNaturalness ? 0.8 : 0.6,
      rules,
      parameters,
      constraints
    };
  }

  /**
   * Generate Fractal pattern
   */
  private async generateFractalPattern(indicators: any): Promise<GrowthPattern> {
    const rules: InferredRule[] = [
      {
        id: 'initial_shape',
        type: 'production',
        condition: 'start',
        action: 'create_initial_shape',
        probability: 1.0,
        priority: 1,
        variables: { shape: 'triangle', size: 100 }
      },
      {
        id: 'fractal_subdivision',
        type: 'evolution',
        condition: 'has_shape && generation < max_generations',
        action: 'subdivide_and_replicate',
        probability: 1.0,
        priority: 2,
        variables: { 
          subdivision_factor: 3,
          scale_factor: 0.5,
          offset_angle: 60
        }
      }
    ];
    
    const parameters: GrowthParameter[] = [
      {
        name: 'scale_factor',
        type: 'number',
        value: 0.5,
        range: { min: 0.3, max: 0.7 },
        influence: 'Size reduction at each iteration'
      },
      {
        name: 'rotation_angle',
        type: 'angle',
        value: 60,
        range: { min: 30, max: 120 },
        influence: 'Rotation angle for fractal elements'
      },
      {
        name: 'iterations',
        type: 'number',
        value: 5,
        range: { min: 3, max: 7 },
        influence: 'Fractal iteration depth'
      }
    ];
    
    const constraints: InferredConstraint[] = [
      {
        type: 'resource',
        description: 'Limit total number of elements',
        formula: 'total_elements < max_elements',
        priority: 'high'
      },
      {
        type: 'aesthetic',
        description: 'Maintain visual balance',
        formula: 'visual_density_variance < threshold',
        priority: 'medium'
      }
    ];
    
    return {
      id: 'fractal_pattern',
      type: 'fractal',
      complexity: 0.8,
      scalability: 1.0,
      naturalness: 0.6,
      rules,
      parameters,
      constraints
    };
  }

  /**
   * Generate Particle System pattern
   */
  private async generateParticleSystemPattern(indicators: any): Promise<GrowthPattern> {
    const rules: InferredRule[] = [
      {
        id: 'spawn_particles',
        type: 'production',
        condition: 'time % spawn_interval == 0',
        action: 'create_particle',
        probability: 0.9,
        priority: 1,
        variables: { 
          spawn_rate: 5,
          initial_velocity: { x: 0, y: -2 },
          life_span: 100
        }
      },
      {
        id: 'update_particles',
        type: 'evolution',
        condition: 'is_alive',
        action: 'update_position_and_properties',
        probability: 1.0,
        priority: 2,
        variables: {
          gravity: { x: 0, y: 0.1 },
          friction: 0.99,
          size_decay: 0.98
        }
      },
      {
        id: 'particle_death',
        type: 'death',
        condition: 'age > life_span || size < min_size',
        action: 'remove_particle',
        probability: 1.0,
        priority: 3,
        variables: { min_size: 1 }
      }
    ];
    
    const parameters: GrowthParameter[] = [
      {
        name: 'spawn_rate',
        type: 'number',
        value: 5,
        range: { min: 1, max: 20 },
        influence: 'Number of particles created per frame'
      },
      {
        name: 'gravity_strength',
        type: 'number',
        value: 0.1,
        range: { min: 0, max: 0.5 },
        influence: 'Downward acceleration of particles'
      },
      {
        name: 'life_span',
        type: 'number',
        value: 100,
        range: { min: 50, max: 300 },
        influence: 'How long particles live (frames)'
      }
    ];
    
    const constraints: InferredConstraint[] = [
      {
        type: 'boundary',
        description: 'Remove particles outside canvas',
        formula: 'x >= -margin && x <= width + margin && y >= -margin && y <= height + margin',
        priority: 'high'
      },
      {
        type: 'resource',
        description: 'Limit maximum particle count',
        formula: 'particle_count < max_particles',
        priority: 'high'
      }
    ];
    
    return {
      id: 'particle_system_pattern',
      type: 'particle-system',
      complexity: 0.6,
      scalability: 0.8,
      naturalness: 0.9,
      rules,
      parameters,
      constraints
    };
  }

  /**
   * Generate Cellular Automata pattern
   */
  private async generateCellularAutomataPattern(indicators: any): Promise<GrowthPattern> {
    const rules: InferredRule[] = [
      {
        id: 'birth_rule',
        type: 'production',
        condition: 'is_dead && neighbor_count == 3',
        action: 'become_alive',
        probability: 1.0,
        priority: 1,
        variables: { birth_threshold: 3 }
      },
      {
        id: 'survival_rule',
        type: 'evolution',
        condition: 'is_alive && (neighbor_count == 2 || neighbor_count == 3)',
        action: 'stay_alive',
        probability: 1.0,
        priority: 2,
        variables: { survival_range: [2, 3] }
      },
      {
        id: 'death_rule',
        type: 'death',
        condition: 'is_alive && (neighbor_count < 2 || neighbor_count > 3)',
        action: 'become_dead',
        probability: 1.0,
        priority: 3,
        variables: { death_conditions: ['underpopulation', 'overpopulation'] }
      }
    ];
    
    const parameters: GrowthParameter[] = [
      {
        name: 'grid_size',
        type: 'number',
        value: 50,
        range: { min: 20, max: 100 },
        influence: 'Size of the cellular grid'
      },
      {
        name: 'initial_density',
        type: 'probability',
        value: 0.3,
        range: { min: 0.1, max: 0.5 },
        influence: 'Initial proportion of living cells'
      },
      {
        name: 'update_speed',
        type: 'number',
        value: 10,
        range: { min: 1, max: 30 },
        influence: 'Frames between generations'
      }
    ];
    
    const constraints: InferredConstraint[] = [
      {
        type: 'boundary',
        description: 'Grid boundaries (toroidal wrapping)',
        formula: 'wrap_coordinates_around_edges',
        priority: 'high'
      },
      {
        type: 'aesthetic',
        description: 'Prevent extinction or total saturation',
        formula: 'living_cells > min_population && living_cells < max_population',
        priority: 'medium'
      }
    ];
    
    return {
      id: 'cellular_automata_pattern',
      type: 'cellular-automata',
      complexity: 0.7,
      scalability: 0.9,
      naturalness: 0.7,
      rules,
      parameters,
      constraints
    };
  }

  /**
   * Generate Agent-based pattern
   */
  private async generateAgentBasedPattern(indicators: any): Promise<GrowthPattern> {
    const rules: InferredRule[] = [
      {
        id: 'agent_movement',
        type: 'movement',
        condition: 'is_active',
        action: 'move_towards_goal',
        probability: 0.9,
        priority: 1,
        variables: {
          speed: 2,
          randomness: 0.2,
          goal_attraction: 0.8
        }
      },
      {
        id: 'agent_interaction',
        type: 'interaction',
        condition: 'distance_to_neighbor < interaction_radius',
        action: 'influence_neighbor',
        probability: 0.7,
        priority: 2,
        variables: {
          interaction_radius: 20,
          influence_strength: 0.5,
          alignment_factor: 0.3
        }
      },
      {
        id: 'trail_creation',
        type: 'production',
        condition: 'is_moving',
        action: 'leave_trail',
        probability: 0.8,
        priority: 3,
        variables: {
          trail_opacity: 0.3,
          trail_decay: 0.95,
          trail_width: 2
        }
      }
    ];
    
    const parameters: GrowthParameter[] = [
      {
        name: 'agent_count',
        type: 'number',
        value: 20,
        range: { min: 5, max: 50 },
        influence: 'Number of active agents'
      },
      {
        name: 'interaction_strength',
        type: 'number',
        value: 0.5,
        range: { min: 0.1, max: 1.0 },
        influence: 'How much agents influence each other'
      },
      {
        name: 'exploration_randomness',
        type: 'probability',
        value: 0.2,
        range: { min: 0.0, max: 0.5 },
        influence: 'Amount of random movement'
      }
    ];
    
    const constraints: InferredConstraint[] = [
      {
        type: 'boundary',
        description: 'Agents bounce off walls or wrap around',
        formula: 'handle_boundary_collision',
        priority: 'high'
      },
      {
        type: 'collision',
        description: 'Agents avoid overlapping',
        formula: 'distance_between_agents > min_distance',
        priority: 'medium'
      }
    ];
    
    return {
      id: 'agent_based_pattern',
      type: 'agent-based',
      complexity: 0.8,
      scalability: 0.7,
      naturalness: 0.9,
      rules,
      parameters,
      constraints
    };
  }

  /**
   * Analyze patterns for growth characteristics
   */
  private async analyzePatternsForGrowth(patternGroups: PatternGroup[]): Promise<any> {
    const analysis = {
      repetition: [],
      symmetry: [],
      scaling: [],
      distribution: [],
      complexity: 0
    };
    
    for (const group of patternGroups) {
      // Analyze repetition characteristics
      analysis.repetition.push({
        type: group.repetition.type,
        count: group.repetition.count,
        spacing: group.repetition.spacing,
        regularity: group.confidence
      });
      
      // Analyze symmetry
      analysis.symmetry.push({
        type: group.symmetry.type,
        order: group.symmetry.order,
        axes: group.symmetry.axes.length
      });
      
      // Calculate complexity
      analysis.complexity += group.elements.length * group.confidence;
    }
    
    analysis.complexity /= patternGroups.length;
    
    return analysis;
  }

  private classifyGrowthTypes(analysis: any): any {
    const types = {
      lSystem: false,
      fractal: false,
      cellular: false,
      particle: false,
      agent: false
    };
    
    // Check for L-system indicators
    const hasBranching = analysis.repetition.some(r => r.type === 'radial' || r.type === 'linear');
    if (hasBranching && analysis.complexity > 0.5) {
      types.lSystem = true;
    }
    
    // Check for fractal indicators
    const hasScaling = analysis.repetition.some(r => r.count > 3 && r.regularity > 0.8);
    if (hasScaling || analysis.symmetry.some(s => s.type === 'rotation')) {
      types.fractal = true;
    }
    
    // Check for cellular automata indicators
    const hasGrid = analysis.repetition.some(r => r.type === 'grid');
    if (hasGrid && analysis.complexity < 0.7) {
      types.cellular = true;
    }
    
    // Default to particle/agent systems for organic patterns
    if (analysis.complexity > 0.6) {
      types.particle = true;
      types.agent = true;
    }
    
    return types;
  }

  private async generateGrowthAlgorithms(types: any, analysis: any): Promise<GrowthPattern[]> {
    const patterns: GrowthPattern[] = [];
    
    if (types.lSystem) {
      patterns.push(await this.generateLSystemPattern(analysis));
    }
    
    if (types.fractal) {
      patterns.push(await this.generateFractalPattern(analysis));
    }
    
    if (types.cellular) {
      patterns.push(await this.generateCellularAutomataPattern(analysis));
    }
    
    if (types.particle) {
      patterns.push(await this.generateParticleSystemPattern(analysis));
    }
    
    if (types.agent) {
      patterns.push(await this.generateAgentBasedPattern(analysis));
    }
    
    return patterns.filter(p => p !== null);
  }

  /**
   * Utility methods
   */
  private calculateInferenceConfidence(patterns: GrowthPattern[], analysis: any): number {
    if (patterns.length === 0) return 0;
    
    const avgComplexity = patterns.reduce((sum, p) => sum + p.complexity, 0) / patterns.length;
    const avgNaturalness = patterns.reduce((sum, p) => sum + p.naturalness, 0) / patterns.length;
    const patternCount = patterns.length;
    
    return Math.min(1, avgComplexity * 0.4 + avgNaturalness * 0.4 + (patternCount / 5) * 0.2);
  }

  private calculatePatternInferenceConfidence(patterns: GrowthPattern[], analysis: any): number {
    const baseConfidence = this.calculateInferenceConfidence(patterns, analysis);
    const patternQuality = analysis.repetition.reduce((sum, r) => sum + r.regularity, 0) / analysis.repetition.length;
    
    return Math.min(1, baseConfidence * 0.7 + patternQuality * 0.3);
  }

  private calculateQualityScore(patterns: GrowthPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const avgComplexity = patterns.reduce((sum, p) => sum + p.complexity, 0) / patterns.length;
    const avgScalability = patterns.reduce((sum, p) => sum + p.scalability, 0) / patterns.length;
    const avgNaturalness = patterns.reduce((sum, p) => sum + p.naturalness, 0) / patterns.length;
    
    return (avgComplexity + avgScalability + avgNaturalness) / 3;
  }

  private estimateGenerationSteps(patterns: GrowthPattern[]): number {
    return this.options.targetGenerations;
  }

  private calculateComplexity(patterns: GrowthPattern[]): number {
    if (patterns.length === 0) return 0;
    
    return patterns.reduce((sum, p) => sum + p.complexity, 0) / patterns.length;
  }

  private generateRecommendations(patterns: GrowthPattern[], analysis: any): string[] {
    const recommendations = [];
    
    if (patterns.length === 0) {
      recommendations.push('No suitable growth patterns identified. Consider simplifying the input or adjusting parameters.');
    } else if (patterns.length === 1) {
      recommendations.push(`Single ${patterns[0].type} pattern identified. Consider exploring alternative growth algorithms.`);
    } else {
      recommendations.push(`Multiple growth patterns possible. Experiment with different algorithms for varied results.`);
    }
    
    if (patterns.some(p => p.complexity > 0.8)) {
      recommendations.push('High complexity patterns detected. Consider reducing parameters for better performance.');
    }
    
    if (patterns.some(p => p.naturalness < 0.5)) {
      recommendations.push('Low naturalness score. Adjust parameters to achieve more organic growth.');
    }
    
    return recommendations;
  }

  private generatePatternRecommendations(patterns: GrowthPattern[], analysis: any): string[] {
    const recommendations = this.generateRecommendations(patterns, analysis);
    
    if (analysis.symmetry.some(s => s.type === 'rotation')) {
      recommendations.push('Rotational symmetry detected. L-systems or fractals may work well.');
    }
    
    if (analysis.repetition.some(r => r.type === 'grid')) {
      recommendations.push('Grid patterns detected. Cellular automata recommended.');
    }
    
    return recommendations;
  }

  // Utility calculation methods
  private distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCurvature(p1: Point, p2: Point, p3: Point): number {
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const angle1 = Math.atan2(v1.y, v1.x);
    const angle2 = Math.atan2(v2.y, v2.x);
    
    return Math.abs(angle2 - angle1);
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / (mean + 0.001); // Avoid division by zero
  }

  private calculateSelfSimilarity(points: Point[], scale: number): number {
    if (points.length < scale * 2) return 0;
    
    const segment1 = points.slice(0, scale);
    const segment2 = points.slice(scale, scale * 2);
    
    // Normalize segments and compare
    const norm1 = this.normalizeSegment(segment1);
    const norm2 = this.normalizeSegment(segment2);
    
    let similarity = 0;
    for (let i = 0; i < Math.min(norm1.length, norm2.length); i++) {
      const dist = this.distance(norm1[i], norm2[i]);
      similarity += 1 / (1 + dist);
    }
    
    return similarity / Math.min(norm1.length, norm2.length);
  }

  private normalizeSegment(points: Point[]): Point[] {
    if (points.length === 0) return [];
    
    // Scale to unit size and center at origin
    const bounds = this.calculateBounds(points);
    const center = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2
    };
    const scale = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
    
    if (scale === 0) return points;
    
    return points.map(p => ({
      x: (p.x - center.x) / scale,
      y: (p.y - center.y) / scale
    }));
  }

  private calculateBounds(points: Point[]): { min: Point; max: Point } {
    if (points.length === 0) return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  private estimateFractalDimension(points: Point[]): number {
    // Simple box-counting fractal dimension estimation
    const scales = [2, 4, 8, 16];
    const counts = [];
    
    for (const scale of scales) {
      const boxes = new Set<string>();
      for (const point of points) {
        const boxX = Math.floor(point.x / scale);
        const boxY = Math.floor(point.y / scale);
        boxes.add(`${boxX},${boxY}`);
      }
      counts.push(boxes.size);
    }
    
    // Linear regression to find dimension
    // log(count) = -D * log(scale) + constant
    // D is negative slope
    
    if (counts.length < 2) return 1.0;
    
    const logScales = scales.map(s => Math.log(s));
    const logCounts = counts.map(c => Math.log(c + 1));
    
    // Simple linear regression
    const n = logScales.length;
    const sumX = logScales.reduce((sum, x) => sum + x, 0);
    const sumY = logCounts.reduce((sum, y) => sum + y, 0);
    const sumXY = logScales.reduce((sum, x, i) => sum + x * logCounts[i], 0);
    const sumXX = logScales.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return Math.abs(slope); // Fractal dimension is absolute value of slope
  }
}