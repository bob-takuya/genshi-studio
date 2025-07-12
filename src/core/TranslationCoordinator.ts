/**
 * Translation Coordinator
 * Orchestrates all translation algorithms and provides unified API
 * for bidirectional translation between Draw, Parametric, Code, and Growth modes
 */

import { Point, Color } from '../types/graphics';
import { ParametricPatternEngine } from '../graphics/patterns/ParametricPatternEngine';
import { CodeExecutionEngine } from './execution/CodeExecutionEngine';
import { 
  BidirectionalTranslationEngine, 
  ModeType, 
  TranslationResult, 
  TranslationOptions,
  StrokeData,
  VectorPath,
  ParametricData,
  CodeData,
  GrowthData
} from './BidirectionalTranslationEngine';
import { StrokeVectorization, VectorizationOptions } from './algorithms/StrokeVectorization';
import { PatternRecognition, RecognitionOptions } from './algorithms/PatternRecognition';
import { CodeGeneration, GenerationOptions } from './algorithms/CodeGeneration';
import { GrowthInference, InferenceOptions } from './algorithms/GrowthInference';

export interface CoordinatorOptions {
  vectorization: Partial<VectorizationOptions>;
  recognition: Partial<RecognitionOptions>;
  codeGeneration: Partial<GenerationOptions>;
  growthInference: Partial<InferenceOptions>;
  translation: Partial<TranslationOptions>;
  enableCaching: boolean;
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface TranslationRequest {
  id: string;
  sourceMode: ModeType;
  targetMode: ModeType;
  data: any;
  options?: Partial<TranslationOptions>;
  priority: 'high' | 'normal' | 'low';
  metadata?: { [key: string]: any };
}

export interface TranslationResponse {
  requestId: string;
  result: TranslationResult<any>;
  performance: {
    totalTime: number;
    algorithmTimes: { [algorithm: string]: number };
    cacheHit: boolean;
  };
  quality: {
    overall: number;
    accuracy: number;
    preservation: number;
    performance: number;
  };
  recommendations: string[];
}

export interface SystemStatus {
  isReady: boolean;
  activeTranslations: number;
  cacheSize: number;
  qualityMetrics: {
    averageAccuracy: number;
    averageTime: number;
    successRate: number;
  };
  algorithmStatus: {
    vectorization: 'ready' | 'busy' | 'error';
    recognition: 'ready' | 'busy' | 'error';
    codeGeneration: 'ready' | 'busy' | 'error';
    growthInference: 'ready' | 'busy' | 'error';
  };
}

export class TranslationCoordinator {
  private translationEngine: BidirectionalTranslationEngine;
  private vectorizer: StrokeVectorization;
  private patternRecognizer: PatternRecognition;
  private codeGenerator: CodeGeneration;
  private growthInference: GrowthInference;
  
  private options: CoordinatorOptions;
  private requestQueue: TranslationRequest[] = [];
  private activeRequests = new Map<string, Promise<TranslationResponse>>();
  private cache = new Map<string, any>();
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageTime: 0,
    averageAccuracy: 0
  };
  
  private isProcessing = false;
  private logger: Console | null = null;
  
  constructor(
    parametricEngine: ParametricPatternEngine,
    codeEngine: CodeExecutionEngine,
    options: Partial<CoordinatorOptions> = {}
  ) {
    this.options = {
      vectorization: {},
      recognition: {},
      codeGeneration: {},
      growthInference: {},
      translation: {},
      enableCaching: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      ...options
    };
    
    // Initialize core translation engine
    this.translationEngine = new BidirectionalTranslationEngine(
      parametricEngine,
      codeEngine
    );
    
    // Initialize specialized algorithms
    this.vectorizer = new StrokeVectorization(this.options.vectorization);
    this.patternRecognizer = new PatternRecognition(this.options.recognition);
    this.codeGenerator = new CodeGeneration(this.options.codeGeneration);
    this.growthInference = new GrowthInference(this.options.growthInference);
    
    // Set up logging
    if (this.options.enableLogging) {
      this.logger = console;
    }
    
    this.log('Translation Coordinator initialized');
  }

  /**
   * Main translation method - handles all mode pairs
   */
  async translate(
    sourceMode: ModeType,
    targetMode: ModeType,
    data: any,
    options: Partial<TranslationOptions> = {},
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<TranslationResponse> {
    const requestId = this.generateRequestId();
    
    const request: TranslationRequest = {
      id: requestId,
      sourceMode,
      targetMode,
      data,
      options,
      priority,
      metadata: {
        timestamp: Date.now(),
        userAgent: 'genshi-studio'
      }
    };
    
    this.log(`Translation request ${requestId}: ${sourceMode} → ${targetMode}`);
    
    // Check cache first
    if (this.options.enableCaching) {
      const cacheKey = this.generateCacheKey(request);
      if (this.cache.has(cacheKey)) {
        this.log(`Cache hit for request ${requestId}`);
        const cachedResult = this.cache.get(cacheKey);
        return {
          requestId,
          result: cachedResult,
          performance: {
            totalTime: 0,
            algorithmTimes: {},
            cacheHit: true
          },
          quality: this.assessCachedQuality(cachedResult),
          recommendations: []
        };
      }
    }
    
    // Process request
    const response = await this.processTranslationRequest(request);
    
    // Cache successful results
    if (this.options.enableCaching && response.result.success) {
      const cacheKey = this.generateCacheKey(request);
      this.cache.set(cacheKey, response.result);
    }
    
    // Update metrics
    this.updateMetrics(response);
    
    return response;
  }

  /**
   * Enhanced translation with smart interpretation
   */
  async smartTranslate(
    sourceMode: ModeType,
    targetMode: ModeType,
    data: any,
    userIntent: 'preserve' | 'enhance' | 'simplify' = 'preserve',
    options: Partial<TranslationOptions> = {}
  ): Promise<TranslationResponse> {
    const startTime = performance.now();
    const algorithmTimes: { [key: string]: number } = {};
    
    try {
      // 1. Analyze user intent and enhance data
      const intentAnalysisStart = performance.now();
      const enhancedData = await this.analyzeAndEnhanceData(data, sourceMode, userIntent);
      algorithmTimes.intentAnalysis = performance.now() - intentAnalysisStart;
      
      // 2. Perform optimized translation
      const translationStart = performance.now();
      const result = await this.translationEngine.interpretUserAction(
        sourceMode,
        targetMode,
        enhancedData,
        userIntent
      );
      algorithmTimes.translation = performance.now() - translationStart;
      
      // 3. Post-process and validate
      const validationStart = performance.now();
      const validatedResult = await this.validateAndRefineResult(result, sourceMode, targetMode);
      algorithmTimes.validation = performance.now() - validationStart;
      
      const totalTime = performance.now() - startTime;
      
      return {
        requestId: this.generateRequestId(),
        result: validatedResult,
        performance: {
          totalTime,
          algorithmTimes,
          cacheHit: false
        },
        quality: this.assessTranslationQuality(validatedResult, data),
        recommendations: this.generateSmartRecommendations(validatedResult, userIntent)
      };
      
    } catch (error) {
      this.log(`Smart translation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch translation for multiple requests
   */
  async batchTranslate(
    requests: Omit<TranslationRequest, 'id'>[]
  ): Promise<TranslationResponse[]> {
    const startTime = performance.now();
    
    // Assign IDs and sort by priority
    const processedRequests = requests
      .map(req => ({ ...req, id: this.generateRequestId() }))
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
    
    this.log(`Batch translation: ${processedRequests.length} requests`);
    
    // Process requests in parallel (with concurrency limit)
    const maxConcurrency = 3;
    const results: TranslationResponse[] = [];
    
    for (let i = 0; i < processedRequests.length; i += maxConcurrency) {
      const batch = processedRequests.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(req => this.processTranslationRequest(req));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    this.log(`Batch translation completed in ${performance.now() - startTime}ms`);
    
    return results;
  }

  /**
   * Get translation suggestions for given data and source mode
   */
  async getTranslationSuggestions(
    sourceMode: ModeType,
    data: any
  ): Promise<{
    targetMode: ModeType;
    confidence: number;
    reasoning: string;
    expectedQuality: number;
  }[]> {
    const suggestions = [];
    
    const allModes = [ModeType.DRAW, ModeType.PARAMETRIC, ModeType.CODE, ModeType.GROWTH];
    const targetModes = allModes.filter(mode => mode !== sourceMode);
    
    for (const targetMode of targetModes) {
      const suggestion = await this.analyzeSuitability(sourceMode, targetMode, data);
      suggestions.push({
        targetMode,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
        expectedQuality: suggestion.expectedQuality
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get system status and health information
   */
  getSystemStatus(): SystemStatus {
    const qualityMetrics = {
      averageAccuracy: this.metrics.averageAccuracy,
      averageTime: this.metrics.averageTime,
      successRate: this.metrics.totalRequests > 0 
        ? this.metrics.successfulRequests / this.metrics.totalRequests 
        : 0
    };
    
    return {
      isReady: !this.isProcessing,
      activeTranslations: this.activeRequests.size,
      cacheSize: this.cache.size,
      qualityMetrics,
      algorithmStatus: {
        vectorization: 'ready',
        recognition: 'ready',
        codeGeneration: 'ready',
        growthInference: 'ready'
      }
    };
  }

  /**
   * Clear caches and reset metrics
   */
  clearCache(): void {
    this.cache.clear();
    this.log('Translation cache cleared');
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageTime: 0,
      averageAccuracy: 0
    };
    this.log('Metrics reset');
  }

  /**
   * Configure algorithm options at runtime
   */
  updateOptions(options: Partial<CoordinatorOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Update algorithm configurations
    if (options.vectorization) {
      this.vectorizer.updateOptions(options.vectorization);
    }
    
    this.log('Configuration updated');
  }

  /**
   * Get quality metrics for all translation pairs
   */
  getQualityMetrics(): any {
    return {
      translationEngine: this.translationEngine.getQualityMetrics(),
      coordinator: this.metrics,
      algorithms: {
        vectorization: this.vectorizer.getOptions(),
        recognition: 'Available',
        codeGeneration: 'Available',
        growthInference: 'Available'
      }
    };
  }

  /**
   * Private methods
   */
  private async processTranslationRequest(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = performance.now();
    const algorithmTimes: { [key: string]: number } = {};
    
    try {
      this.activeRequests.set(request.id, Promise.resolve({} as TranslationResponse));
      
      // Merge options
      const translationOptions = {
        ...this.options.translation,
        ...request.options
      };
      
      // Perform translation based on source and target modes
      let result: TranslationResult<any>;
      
      if (this.isComplexTranslation(request.sourceMode, request.targetMode)) {
        result = await this.performComplexTranslation(request, algorithmTimes);
      } else {
        const translationStart = performance.now();
        result = await this.translationEngine.translate(
          request.data,
          request.sourceMode,
          request.targetMode,
          translationOptions
        );
        algorithmTimes.translation = performance.now() - translationStart;
      }
      
      const totalTime = performance.now() - startTime;
      
      const response: TranslationResponse = {
        requestId: request.id,
        result,
        performance: {
          totalTime,
          algorithmTimes,
          cacheHit: false
        },
        quality: this.assessTranslationQuality(result, request.data),
        recommendations: this.generateRecommendations(result, request)
      };
      
      this.activeRequests.delete(request.id);
      return response;
      
    } catch (error) {
      this.activeRequests.delete(request.id);
      this.log(`Translation request ${request.id} failed: ${error.message}`);
      throw error;
    }
  }

  private isComplexTranslation(sourceMode: ModeType, targetMode: ModeType): boolean {
    // Complex translations require multiple algorithm steps
    return (
      (sourceMode === ModeType.DRAW && targetMode === ModeType.PARAMETRIC) ||
      (sourceMode === ModeType.DRAW && targetMode === ModeType.CODE) ||
      (sourceMode === ModeType.PARAMETRIC && targetMode === ModeType.GROWTH) ||
      (sourceMode === ModeType.CODE && targetMode === ModeType.GROWTH)
    );
  }

  private async performComplexTranslation(
    request: TranslationRequest,
    algorithmTimes: { [key: string]: number }
  ): Promise<TranslationResult<any>> {
    const { sourceMode, targetMode, data } = request;
    
    if (sourceMode === ModeType.DRAW && targetMode === ModeType.PARAMETRIC) {
      return await this.drawToParametricComplex(data, algorithmTimes);
    }
    
    if (sourceMode === ModeType.DRAW && targetMode === ModeType.CODE) {
      return await this.drawToCodeComplex(data, algorithmTimes);
    }
    
    if (sourceMode === ModeType.PARAMETRIC && targetMode === ModeType.GROWTH) {
      return await this.parametricToGrowthComplex(data, algorithmTimes);
    }
    
    if (sourceMode === ModeType.CODE && targetMode === ModeType.GROWTH) {
      return await this.codeToGrowthComplex(data, algorithmTimes);
    }
    
    // Fallback to basic translation
    return await this.translationEngine.translate(data, sourceMode, targetMode);
  }

  private async drawToParametricComplex(
    strokeData: StrokeData[],
    algorithmTimes: { [key: string]: number }
  ): Promise<TranslationResult<ParametricData>> {
    // 1. Vectorize strokes
    const vectorizeStart = performance.now();
    const vectorResult = await this.vectorizer.vectorize(strokeData);
    algorithmTimes.vectorization = performance.now() - vectorizeStart;
    
    // 2. Recognize patterns
    const recognizeStart = performance.now();
    const patternResult = await this.patternRecognizer.recognizePatterns(vectorResult.paths);
    algorithmTimes.recognition = performance.now() - recognizeStart;
    
    // 3. Convert to parametric
    const convertStart = performance.now();
    const parametricData = await this.convertPatternsToParametric(patternResult.patterns);
    algorithmTimes.conversion = performance.now() - convertStart;
    
    return {
      success: true,
      data: parametricData,
      confidence: Math.min(vectorResult.accuracy, patternResult.statistics.confidence),
      preservedIntent: true,
      metadata: {
        translationTime: Object.values(algorithmTimes).reduce((sum, time) => sum + time, 0),
        originalMode: ModeType.DRAW,
        targetMode: ModeType.PARAMETRIC,
        quality: 'high',
        fallbackUsed: false
      }
    };
  }

  private async drawToCodeComplex(
    strokeData: StrokeData[],
    algorithmTimes: { [key: string]: number }
  ): Promise<TranslationResult<CodeData>> {
    // 1. Generate code directly from strokes
    const codeGenStart = performance.now();
    const codeResult = await this.codeGenerator.generateFromStrokes(strokeData);
    algorithmTimes.codeGeneration = performance.now() - codeGenStart;
    
    return {
      success: codeResult.success,
      data: codeResult.code,
      confidence: codeResult.quality.accuracy,
      preservedIntent: codeResult.quality.accuracy > 0.8,
      metadata: {
        translationTime: algorithmTimes.codeGeneration,
        originalMode: ModeType.DRAW,
        targetMode: ModeType.CODE,
        quality: codeResult.quality.accuracy > 0.8 ? 'high' : 'medium',
        fallbackUsed: false
      },
      warnings: codeResult.warnings
    };
  }

  private async parametricToGrowthComplex(
    parametricData: ParametricData,
    algorithmTimes: { [key: string]: number }
  ): Promise<TranslationResult<GrowthData>> {
    // Use growth inference to create growth system
    const inferenceStart = performance.now();
    // This would use pattern recognition first to get patterns, then infer growth
    // For now, we'll use the basic translation
    const result = await this.translationEngine.toGrowth(
      parametricData,
      ModeType.PARAMETRIC
    );
    algorithmTimes.growthInference = performance.now() - inferenceStart;
    
    return result;
  }

  private async codeToGrowthComplex(
    codeData: CodeData,
    algorithmTimes: { [key: string]: number }
  ): Promise<TranslationResult<GrowthData>> {
    // Analyze code and infer growth patterns
    const inferenceStart = performance.now();
    const result = await this.translationEngine.toGrowth(
      codeData,
      ModeType.CODE
    );
    algorithmTimes.growthInference = performance.now() - inferenceStart;
    
    return result;
  }

  private async convertPatternsToParametric(patterns: any[]): Promise<ParametricData> {
    // Convert recognized patterns to parametric representation
    const parameters = new Map<string, any>();
    
    if (patterns.length > 0) {
      const primaryPattern = patterns[0];
      
      // Extract parameters from pattern
      parameters.set('scale', primaryPattern.repetition?.scale || 1.0);
      parameters.set('rotation', primaryPattern.repetition?.angle || 0);
      parameters.set('count', primaryPattern.repetition?.count || 1);
      parameters.set('spacing', primaryPattern.repetition?.spacing || 10);
    }
    
    return {
      parameters,
      constraints: [],
      animations: [],
      metadata: {
        patternType: patterns[0]?.repetition?.type || 'custom',
        complexity: patterns.length,
        variation: 'generated'
      }
    };
  }

  private async analyzeAndEnhanceData(data: any, sourceMode: ModeType, userIntent: string): Promise<any> {
    // This would use AI/ML to analyze user intent and enhance the data
    // For now, return data as-is
    return data;
  }

  private async validateAndRefineResult(
    result: TranslationResult<any>,
    sourceMode: ModeType,
    targetMode: ModeType
  ): Promise<TranslationResult<any>> {
    // Validate and potentially refine the translation result
    // For now, return as-is
    return result;
  }

  private async analyzeSuitability(
    sourceMode: ModeType,
    targetMode: ModeType,
    data: any
  ): Promise<{ confidence: number; reasoning: string; expectedQuality: number }> {
    // Analyze how suitable the translation would be
    let confidence = 0.5;
    let reasoning = '';
    let expectedQuality = 0.5;
    
    if (sourceMode === ModeType.DRAW && targetMode === ModeType.PARAMETRIC) {
      confidence = 0.8;
      reasoning = 'Draw strokes can be effectively vectorized and pattern-recognized for parametric conversion';
      expectedQuality = 0.75;
    } else if (sourceMode === ModeType.PARAMETRIC && targetMode === ModeType.CODE) {
      confidence = 0.9;
      reasoning = 'Parametric data translates very well to code with high fidelity';
      expectedQuality = 0.9;
    } else if (sourceMode === ModeType.CODE && targetMode === ModeType.DRAW) {
      confidence = 0.95;
      reasoning = 'Code can be executed to produce precise drawing commands';
      expectedQuality = 0.95;
    } else if (targetMode === ModeType.GROWTH) {
      confidence = 0.6;
      reasoning = 'Growth inference is experimental but can produce interesting results';
      expectedQuality = 0.6;
    }
    
    return { confidence, reasoning, expectedQuality };
  }

  private assessTranslationQuality(
    result: TranslationResult<any>,
    originalData: any
  ): { overall: number; accuracy: number; preservation: number; performance: number } {
    const accuracy = result.confidence;
    const preservation = result.preservedIntent ? 0.9 : 0.5;
    const performance = result.metadata.translationTime < 1000 ? 0.9 : 0.6;
    const overall = (accuracy + preservation + performance) / 3;
    
    return { overall, accuracy, preservation, performance };
  }

  private assessCachedQuality(result: TranslationResult<any>): any {
    return {
      overall: result.confidence,
      accuracy: result.confidence,
      preservation: result.preservedIntent ? 0.9 : 0.5,
      performance: 1.0 // Cached results have perfect performance
    };
  }

  private generateRecommendations(
    result: TranslationResult<any>,
    request: TranslationRequest
  ): string[] {
    const recommendations = [];
    
    if (result.confidence < 0.7) {
      recommendations.push('Low confidence translation. Consider adjusting input or trying different parameters.');
    }
    
    if (!result.preservedIntent) {
      recommendations.push('Artistic intent may not be fully preserved. Review output carefully.');
    }
    
    if (result.metadata.translationTime > 2000) {
      recommendations.push('Translation took longer than expected. Consider simplifying input for faster processing.');
    }
    
    if (result.warnings && result.warnings.length > 0) {
      recommendations.push(`Address warnings: ${result.warnings.join(', ')}`);
    }
    
    return recommendations;
  }

  private generateSmartRecommendations(
    result: TranslationResult<any>,
    userIntent: string
  ): string[] {
    const recommendations = this.generateRecommendations(result, {} as TranslationRequest);
    
    if (userIntent === 'enhance' && result.confidence > 0.8) {
      recommendations.push('High-quality enhancement achieved. Consider exploring variations.');
    }
    
    if (userIntent === 'simplify' && result.metadata.quality === 'high') {
      recommendations.push('Simplification successful while maintaining quality.');
    }
    
    return recommendations;
  }

  private generateRequestId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(request: TranslationRequest): string {
    // Generate a cache key based on request parameters
    const keyData = {
      sourceMode: request.sourceMode,
      targetMode: request.targetMode,
      dataHash: this.hashData(request.data),
      options: request.options
    };
    
    return btoa(JSON.stringify(keyData)).substring(0, 32);
  }

  private hashData(data: any): string {
    // Simple hash function for data
    return btoa(JSON.stringify(data).substring(0, 100)).substring(0, 16);
  }

  private getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private updateMetrics(response: TranslationResponse): void {
    this.metrics.totalRequests++;
    
    if (response.result.success) {
      this.metrics.successfulRequests++;
    }
    
    // Update running averages
    const alpha = 0.1; // Exponential smoothing factor
    this.metrics.averageTime = 
      this.metrics.averageTime * (1 - alpha) + response.performance.totalTime * alpha;
    
    this.metrics.averageAccuracy = 
      this.metrics.averageAccuracy * (1 - alpha) + response.quality.accuracy * alpha;
  }

  private log(message: string): void {
    if (this.logger) {
      this.logger.log(`[TranslationCoordinator] ${message}`);
    }
  }
}