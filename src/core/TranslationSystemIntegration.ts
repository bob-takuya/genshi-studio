/**
 * Translation System Integration
 * Main integration point for the bidirectional translation system
 * Integrates with Genshi Studio's existing architecture
 */

import { TranslationCoordinator, CoordinatorOptions } from './TranslationCoordinator';
import { BidirectionalTranslationEngine, ModeType } from './BidirectionalTranslationEngine';
import { ParametricPatternEngine } from '../graphics/patterns/ParametricPatternEngine';
import { CodeExecutionEngine } from './execution/CodeExecutionEngine';
import { StrokeVectorization } from './algorithms/StrokeVectorization';
import { PatternRecognition } from './algorithms/PatternRecognition';
import { CodeGeneration } from './algorithms/CodeGeneration';
import { GrowthInference } from './algorithms/GrowthInference';

// Export all translation types
export {
  ModeType,
  TranslationCoordinator,
  BidirectionalTranslationEngine,
  StrokeVectorization,
  PatternRecognition,
  CodeGeneration,
  GrowthInference
};

export interface TranslationSystemConfig {
  enableVectorization: boolean;
  enablePatternRecognition: boolean;
  enableCodeGeneration: boolean;
  enableGrowthInference: boolean;
  enableCaching: boolean;
  enableLogging: boolean;
  performanceOptimized: boolean;
  coordinatorOptions?: Partial<CoordinatorOptions>;
}

export interface TranslationSystemStatus {
  initialized: boolean;
  coordinator: TranslationCoordinator | null;
  engine: BidirectionalTranslationEngine | null;
  algorithms: {
    vectorization: StrokeVectorization | null;
    recognition: PatternRecognition | null;
    codeGeneration: CodeGeneration | null;
    growthInference: GrowthInference | null;
  };
  error?: string;
}

/**
 * Translation System Manager
 * Manages the lifecycle and integration of the translation system
 */
export class TranslationSystemManager {
  private static instance: TranslationSystemManager | null = null;
  private status: TranslationSystemStatus;
  private config: TranslationSystemConfig;
  
  private constructor() {
    this.status = {
      initialized: false,
      coordinator: null,
      engine: null,
      algorithms: {
        vectorization: null,
        recognition: null,
        codeGeneration: null,
        growthInference: null
      }
    };
    
    this.config = {
      enableVectorization: true,
      enablePatternRecognition: true,
      enableCodeGeneration: true,
      enableGrowthInference: true,
      enableCaching: true,
      enableLogging: true,
      performanceOptimized: true
    };
  }
  
  static getInstance(): TranslationSystemManager {
    if (!TranslationSystemManager.instance) {
      TranslationSystemManager.instance = new TranslationSystemManager();
    }
    return TranslationSystemManager.instance;
  }
  
  /**
   * Initialize the translation system
   */
  async initialize(
    parametricEngine: ParametricPatternEngine,
    codeEngine: CodeExecutionEngine,
    config: Partial<TranslationSystemConfig> = {}
  ): Promise<boolean> {
    try {
      this.config = { ...this.config, ...config };
      
      console.log('🔄 Initializing Translation System...');
      
      // Initialize core translation engine
      this.status.engine = new BidirectionalTranslationEngine(
        parametricEngine,
        codeEngine
      );
      
      // Initialize algorithms based on configuration
      if (this.config.enableVectorization) {
        this.status.algorithms.vectorization = new StrokeVectorization({
          smoothingFactor: this.config.performanceOptimized ? 0.3 : 0.5,
          simplificationTolerance: this.config.performanceOptimized ? 3.0 : 2.0,
          adaptiveThreshold: true
        });
        console.log('✅ Stroke Vectorization initialized');
      }
      
      if (this.config.enablePatternRecognition) {
        this.status.algorithms.recognition = new PatternRecognition({
          minPatternSize: 2,
          maxPatternSize: this.config.performanceOptimized ? 15 : 20,
          similarityThreshold: 0.8,
          enableAdvancedPatterns: !this.config.performanceOptimized
        });
        console.log('✅ Pattern Recognition initialized');
      }
      
      if (this.config.enableCodeGeneration) {
        this.status.algorithms.codeGeneration = new CodeGeneration({
          targetAPI: 'genshi',
          optimizeForPerformance: this.config.performanceOptimized,
          includeComments: !this.config.performanceOptimized,
          minifyOutput: this.config.performanceOptimized
        });
        console.log('✅ Code Generation initialized');
      }
      
      if (this.config.enableGrowthInference) {
        this.status.algorithms.growthInference = new GrowthInference({
          maxComplexity: this.config.performanceOptimized ? 0.6 : 0.8,
          optimizeForNaturalness: true,
          includeStochastic: !this.config.performanceOptimized,
          targetGenerations: this.config.performanceOptimized ? 5 : 10
        });
        console.log('✅ Growth Inference initialized');
      }
      
      // Initialize coordinator
      const coordinatorOptions: Partial<CoordinatorOptions> = {
        enableCaching: this.config.enableCaching,
        enableLogging: this.config.enableLogging,
        enablePerformanceMonitoring: true,
        ...this.config.coordinatorOptions
      };
      
      this.status.coordinator = new TranslationCoordinator(
        parametricEngine,
        codeEngine,
        coordinatorOptions
      );
      
      this.status.initialized = true;
      console.log('🎉 Translation System fully initialized');
      
      return true;
      
    } catch (error) {
      this.status.error = error.message;
      console.error('❌ Translation System initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Get the translation coordinator
   */
  getCoordinator(): TranslationCoordinator | null {
    return this.status.coordinator;
  }
  
  /**
   * Get the translation engine
   */
  getEngine(): BidirectionalTranslationEngine | null {
    return this.status.engine;
  }
  
  /**
   * Get specific algorithm instance
   */
  getAlgorithm<T>(
    algorithmName: 'vectorization' | 'recognition' | 'codeGeneration' | 'growthInference'
  ): T | null {
    return this.status.algorithms[algorithmName] as T;
  }
  
  /**
   * Get system status
   */
  getStatus(): TranslationSystemStatus {
    return { ...this.status };
  }
  
  /**
   * Check if system is ready for translations
   */
  isReady(): boolean {
    return this.status.initialized && this.status.coordinator !== null;
  }
  
  /**
   * Quick translate helper
   */
  async translate(
    sourceMode: ModeType,
    targetMode: ModeType,
    data: any,
    options: any = {}
  ): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Translation system not initialized');
    }
    
    return await this.status.coordinator!.translate(
      sourceMode,
      targetMode,
      data,
      options
    );
  }
  
  /**
   * Smart translate helper
   */
  async smartTranslate(
    sourceMode: ModeType,
    targetMode: ModeType,
    data: any,
    userIntent: 'preserve' | 'enhance' | 'simplify' = 'preserve'
  ): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Translation system not initialized');
    }
    
    return await this.status.coordinator!.smartTranslate(
      sourceMode,
      targetMode,
      data,
      userIntent
    );
  }
  
  /**
   * Get translation suggestions
   */
  async getSuggestions(sourceMode: ModeType, data: any): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Translation system not initialized');
    }
    
    return await this.status.coordinator!.getTranslationSuggestions(sourceMode, data);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TranslationSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.status.coordinator) {
      // Update coordinator options if needed
      const coordinatorOptions: Partial<CoordinatorOptions> = {
        enableCaching: this.config.enableCaching,
        enableLogging: this.config.enableLogging
      };
      this.status.coordinator.updateOptions(coordinatorOptions);
    }
  }
  
  /**
   * Reset system
   */
  reset(): void {
    if (this.status.coordinator) {
      this.status.coordinator.clearCache();
      this.status.coordinator.resetMetrics();
    }
    
    console.log('🔄 Translation system reset');
  }
  
  /**
   * Shutdown system
   */
  shutdown(): void {
    this.status = {
      initialized: false,
      coordinator: null,
      engine: null,
      algorithms: {
        vectorization: null,
        recognition: null,
        codeGeneration: null,
        growthInference: null
      }
    };
    
    console.log('🛑 Translation system shut down');
  }
}

/**
 * Convenience functions for direct usage
 */

/**
 * Initialize the translation system (convenience function)
 */
export async function initializeTranslationSystem(
  parametricEngine: ParametricPatternEngine,
  codeEngine: CodeExecutionEngine,
  config: Partial<TranslationSystemConfig> = {}
): Promise<boolean> {
  const manager = TranslationSystemManager.getInstance();
  return await manager.initialize(parametricEngine, codeEngine, config);
}

/**
 * Get the translation system manager instance
 */
export function getTranslationSystem(): TranslationSystemManager {
  return TranslationSystemManager.getInstance();
}

/**
 * Quick translation function
 */
export async function quickTranslate(
  sourceMode: ModeType,
  targetMode: ModeType,
  data: any,
  options: any = {}
): Promise<any> {
  const manager = TranslationSystemManager.getInstance();
  return await manager.translate(sourceMode, targetMode, data, options);
}

/**
 * Smart translation function
 */
export async function smartTranslate(
  sourceMode: ModeType,
  targetMode: ModeType,
  data: any,
  userIntent: 'preserve' | 'enhance' | 'simplify' = 'preserve'
): Promise<any> {
  const manager = TranslationSystemManager.getInstance();
  return await manager.smartTranslate(sourceMode, targetMode, data, userIntent);
}

/**
 * Get translation suggestions
 */
export async function getTranslationSuggestions(
  sourceMode: ModeType,
  data: any
): Promise<any> {
  const manager = TranslationSystemManager.getInstance();
  return await manager.getSuggestions(sourceMode, data);
}

/**
 * Check if translation system is ready
 */
export function isTranslationSystemReady(): boolean {
  const manager = TranslationSystemManager.getInstance();
  return manager.isReady();
}

/**
 * Integration with Genshi Studio's existing module system
 */
export interface GenshiStudioTranslationHooks {
  onModeSwitch?: (fromMode: ModeType, toMode: ModeType, data: any) => Promise<any>;
  onTranslationComplete?: (result: any) => void;
  onTranslationError?: (error: Error) => void;
  onQualityCheck?: (quality: any) => boolean;
}

/**
 * Register hooks for integration with Genshi Studio
 */
export function registerTranslationHooks(hooks: GenshiStudioTranslationHooks): void {
  // This would integrate with Genshi Studio's event system
  console.log('Translation hooks registered:', Object.keys(hooks));
}

/**
 * Default configuration for production use
 */
export const PRODUCTION_CONFIG: TranslationSystemConfig = {
  enableVectorization: true,
  enablePatternRecognition: true,
  enableCodeGeneration: true,
  enableGrowthInference: true,
  enableCaching: true,
  enableLogging: false, // Disabled in production
  performanceOptimized: true,
  coordinatorOptions: {
    enableCaching: true,
    enableLogging: false,
    enablePerformanceMonitoring: true
  }
};

/**
 * Default configuration for development use
 */
export const DEVELOPMENT_CONFIG: TranslationSystemConfig = {
  enableVectorization: true,
  enablePatternRecognition: true,
  enableCodeGeneration: true,
  enableGrowthInference: true,
  enableCaching: true,
  enableLogging: true,
  performanceOptimized: false,
  coordinatorOptions: {
    enableCaching: true,
    enableLogging: true,
    enablePerformanceMonitoring: true
  }
};

/**
 * Performance-optimized configuration for resource-constrained environments
 */
export const PERFORMANCE_CONFIG: TranslationSystemConfig = {
  enableVectorization: true,
  enablePatternRecognition: true,
  enableCodeGeneration: true,
  enableGrowthInference: false, // Most expensive algorithm
  enableCaching: true,
  enableLogging: false,
  performanceOptimized: true,
  coordinatorOptions: {
    enableCaching: true,
    enableLogging: false,
    enablePerformanceMonitoring: false
  }
};