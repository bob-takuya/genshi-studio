/**
 * Code Generation Engine
 * Converts visual patterns and strokes into executable TypeScript/JavaScript code
 * that reproduces the artwork using the Genshi API
 */

import { Point, Color } from '../../types/graphics';
import { StrokeData, VectorPath, CodeData } from '../BidirectionalTranslationEngine';
import { PatternGroup, PatternElement } from './PatternRecognition';

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  parameters: {
    name: string;
    type: 'number' | 'color' | 'point' | 'boolean';
    placeholder: string;
  }[];
}

export interface GenerationOptions {
  targetAPI: 'genshi' | 'p5js' | 'canvas' | 'svg';
  optimizeForPerformance: boolean;
  includeComments: boolean;
  minifyOutput: boolean;
  generateAnimations: boolean;
  preserveOriginalStructure: boolean;
}

export interface CodeGenerationResult {
  success: boolean;
  code: CodeData;
  quality: {
    readability: number; // 0-1
    performance: number; // 0-1
    accuracy: number; // 0-1
    maintainability: number; // 0-1
  };
  statistics: {
    linesOfCode: number;
    functions: number;
    complexityScore: number;
    estimatedExecutionTime: number;
  };
  warnings: string[];
  suggestions: string[];
}

export class CodeGeneration {
  private options: GenerationOptions;
  private templates = new Map<string, CodeTemplate>();
  private generatedFunctions = new Set<string>();
  
  constructor(options: Partial<GenerationOptions> = {}) {
    this.options = {
      targetAPI: 'genshi',
      optimizeForPerformance: true,
      includeComments: true,
      minifyOutput: false,
      generateAnimations: false,
      preserveOriginalStructure: true,
      ...options
    };
    
    this.initializeTemplates();
  }

  /**
   * Generate code from stroke data
   */
  async generateFromStrokes(strokes: StrokeData[]): Promise<CodeGenerationResult> {
    const startTime = performance.now();
    this.generatedFunctions.clear();
    
    try {
      // 1. Analyze strokes for code patterns
      const analysis = await this.analyzeStrokesForCode(strokes);
      
      // 2. Generate main drawing function
      const mainFunction = this.generateMainDrawingFunction(analysis);
      
      // 3. Generate helper functions
      const helperFunctions = this.generateHelperFunctions(analysis);
      
      // 4. Combine and optimize
      const fullCode = this.combineAndOptimize(mainFunction, helperFunctions);
      
      // 5. Calculate quality metrics
      const quality = this.calculateCodeQuality(fullCode, strokes);
      
      const codeData: CodeData = {
        source: fullCode,
        language: 'typescript',
        dependencies: this.extractDependencies(analysis),
        api: this.options.targetAPI,
        functions: this.extractFunctionSignatures(fullCode)
      };
      
      return {
        success: true,
        code: codeData,
        quality,
        statistics: this.calculateStatistics(fullCode),
        warnings: this.generateWarnings(analysis),
        suggestions: this.generateSuggestions(analysis)
      };
      
    } catch (error) {
      return {
        success: false,
        code: {
          source: `// Code generation failed: ${error.message}`,
          language: 'typescript',
          dependencies: [],
          api: this.options.targetAPI,
          functions: []
        },
        quality: { readability: 0, performance: 0, accuracy: 0, maintainability: 0 },
        statistics: { linesOfCode: 0, functions: 0, complexityScore: 0, estimatedExecutionTime: 0 },
        warnings: [error.message],
        suggestions: []
      };
    }
  }

  /**
   * Generate code from pattern recognition results
   */
  async generateFromPatterns(patterns: PatternGroup[]): Promise<CodeGenerationResult> {
    try {
      // 1. Convert patterns to code constructs
      const codeConstructs = patterns.map(pattern => this.patternToCodeConstruct(pattern));
      
      // 2. Generate main function
      const mainFunction = this.generatePatternMainFunction(codeConstructs);
      
      // 3. Generate pattern-specific functions
      const patternFunctions = codeConstructs.map(construct => 
        this.generatePatternFunction(construct)
      ).join('\n\n');
      
      // 4. Combine
      const fullCode = this.combinePatternCode(mainFunction, patternFunctions);
      
      const codeData: CodeData = {
        source: fullCode,
        language: 'typescript',
        dependencies: ['genshi-patterns'],
        api: this.options.targetAPI,
        functions: this.extractFunctionSignatures(fullCode)
      };
      
      return {
        success: true,
        code: codeData,
        quality: this.calculatePatternCodeQuality(fullCode, patterns),
        statistics: this.calculateStatistics(fullCode),
        warnings: [],
        suggestions: this.generatePatternSuggestions(patterns)
      };
      
    } catch (error) {
      throw new Error(`Pattern code generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze strokes to identify code patterns
   */
  private async analyzeStrokesForCode(strokes: StrokeData[]): Promise<any> {
    const analysis = {
      totalStrokes: strokes.length,
      shapes: [],
      patterns: [],
      complexity: 0,
      suggestedFunctions: [],
      optimizations: []
    };
    
    for (const stroke of strokes) {
      // Classify stroke type
      const shape = this.classifyStrokeShape(stroke);
      analysis.shapes.push(shape);
      
      // Check for patterns
      const patterns = this.identifyStrokePatterns(stroke);
      analysis.patterns.push(...patterns);
    }
    
    // Calculate complexity
    analysis.complexity = this.calculateStrokeComplexity(strokes);
    
    // Suggest function decomposition
    analysis.suggestedFunctions = this.suggestFunctions(analysis);
    
    // Identify optimization opportunities
    analysis.optimizations = this.identifyOptimizations(analysis);
    
    return analysis;
  }

  private classifyStrokeShape(stroke: StrokeData): any {
    const points = stroke.points;
    
    if (points.length < 2) {
      return { type: 'point', confidence: 1.0 };
    }
    
    if (points.length === 2) {
      return { type: 'line', confidence: 1.0, start: points[0], end: points[1] };
    }
    
    // Check for geometric shapes
    if (this.isCircle(points)) {
      const center = this.calculateCentroid(points);
      const radius = this.calculateAverageRadius(points, center);
      return { type: 'circle', confidence: 0.9, center, radius };
    }
    
    if (this.isRectangle(points)) {
      const bounds = this.calculateBounds(points);
      return { 
        type: 'rectangle', 
        confidence: 0.85, 
        x: bounds.min.x, 
        y: bounds.min.y,
        width: bounds.max.x - bounds.min.x,
        height: bounds.max.y - bounds.min.y
      };
    }
    
    if (this.isPolygon(points)) {
      return { type: 'polygon', confidence: 0.8, points: this.simplifyPolygon(points) };
    }
    
    // Default to curve/path
    return { type: 'path', confidence: 0.7, points };
  }

  private identifyStrokePatterns(stroke: StrokeData): any[] {
    const patterns = [];
    
    // Check for repetitive elements
    if (this.hasRepetitiveElements(stroke.points)) {
      patterns.push({ type: 'repetitive', suggestion: 'use loop' });
    }
    
    // Check for symmetry
    if (this.hasSymmetry(stroke.points)) {
      patterns.push({ type: 'symmetric', suggestion: 'use mirroring' });
    }
    
    return patterns;
  }

  private calculateStrokeComplexity(strokes: StrokeData[]): number {
    let complexity = 0;
    
    for (const stroke of strokes) {
      // Point count complexity
      complexity += Math.log(stroke.points.length + 1);
      
      // Pressure variation complexity
      if (stroke.pressures) {
        const pressureVariation = this.calculateVariation(stroke.pressures);
        complexity += pressureVariation * 2;
      }
      
      // Curvature complexity
      complexity += this.calculateCurvatureComplexity(stroke.points);
    }
    
    return complexity / strokes.length;
  }

  private suggestFunctions(analysis: any): string[] {
    const suggestions = [];
    
    // Group similar shapes
    const shapeGroups = new Map();
    for (const shape of analysis.shapes) {
      const key = shape.type;
      if (!shapeGroups.has(key)) {
        shapeGroups.set(key, []);
      }
      shapeGroups.get(key).push(shape);
    }
    
    // Suggest functions for repeated shapes
    for (const [type, shapes] of shapeGroups) {
      if (shapes.length > 2) {
        suggestions.push(`draw${type.charAt(0).toUpperCase() + type.slice(1)}`);
      }
    }
    
    return suggestions;
  }

  private identifyOptimizations(analysis: any): string[] {
    const optimizations = [];
    
    if (analysis.totalStrokes > 50) {
      optimizations.push('Consider using patterns or loops to reduce code duplication');
    }
    
    if (analysis.complexity > 5) {
      optimizations.push('Break down complex paths into simpler functions');
    }
    
    return optimizations;
  }

  /**
   * Generate the main drawing function
   */
  private generateMainDrawingFunction(analysis: any): string {
    const lines = [];
    
    if (this.options.includeComments) {
      lines.push('/**');
      lines.push(' * Main drawing function');
      lines.push(` * Generated from ${analysis.totalStrokes} strokes`);
      lines.push(' */');
    }
    
    lines.push('function drawArtwork() {');
    
    // Canvas setup
    if (this.options.targetAPI === 'genshi') {
      lines.push('  // Canvas setup');
      lines.push('  canvas.background("white");');
      lines.push('  draw.strokeWidth(2);');
    }
    
    // Generate drawing commands for each shape
    for (let i = 0; i < analysis.shapes.length; i++) {
      const shape = analysis.shapes[i];
      const drawingCode = this.generateShapeDrawingCode(shape, i);
      lines.push(`  ${drawingCode}`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private generateShapeDrawingCode(shape: any, index: number): string {
    switch (shape.type) {
      case 'line':
        return `shapes.line(${shape.start.x}, ${shape.start.y}, ${shape.end.x}, ${shape.end.y});`;
      
      case 'circle':
        return `shapes.circle(${shape.center.x}, ${shape.center.y}, ${shape.radius});`;
      
      case 'rectangle':
        return `shapes.rect(${shape.x}, ${shape.y}, ${shape.width}, ${shape.height});`;
      
      case 'polygon':
        const pointsStr = shape.points.map(p => `${p.x}, ${p.y}`).join(', ');
        return `shapes.polygon(${pointsStr});`;
      
      case 'path':
        return this.generatePathDrawingCode(shape.points, index);
      
      default:
        return `// Unknown shape type: ${shape.type}`;
    }
  }

  private generatePathDrawingCode(points: Point[], index: number): string {
    if (points.length < 2) return '';
    
    if (points.length === 2) {
      return `shapes.line(${points[0].x}, ${points[0].y}, ${points[1].x}, ${points[1].y});`;
    }
    
    // For complex paths, use a drawing function
    const functionName = `drawPath${index}`;
    this.generatedFunctions.add(functionName);
    
    return `${functionName}();`;
  }

  /**
   * Generate helper functions
   */
  private generateHelperFunctions(analysis: any): string {
    const functions = [];
    
    // Generate path drawing functions
    for (let i = 0; i < analysis.shapes.length; i++) {
      const shape = analysis.shapes[i];
      if (shape.type === 'path' && shape.points.length > 2) {
        const functionName = `drawPath${i}`;
        if (this.generatedFunctions.has(functionName)) {
          functions.push(this.generatePathFunction(functionName, shape.points));
        }
      }
    }
    
    // Generate utility functions if needed
    if (analysis.suggestedFunctions.length > 0) {
      functions.push(...this.generateUtilityFunctions(analysis));
    }
    
    return functions.join('\n\n');
  }

  private generatePathFunction(functionName: string, points: Point[]): string {
    const lines = [];
    
    if (this.options.includeComments) {
      lines.push(`/**`);
      lines.push(` * Draw complex path with ${points.length} points`);
      lines.push(` */`);
    }
    
    lines.push(`function ${functionName}() {`);
    
    // Start path
    lines.push(`  // Complex path drawing`);
    
    // Simplify path for better performance
    const simplifiedPoints = this.simplifyPath(points);
    
    for (let i = 0; i < simplifiedPoints.length - 1; i++) {
      const p1 = simplifiedPoints[i];
      const p2 = simplifiedPoints[i + 1];
      lines.push(`  shapes.line(${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}, ${p2.x.toFixed(1)}, ${p2.y.toFixed(1)});`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private generateUtilityFunctions(analysis: any): string[] {
    const functions = [];
    
    // Generate shape-specific functions if there are multiple instances
    const shapeCounts = new Map();
    for (const shape of analysis.shapes) {
      shapeCounts.set(shape.type, (shapeCounts.get(shape.type) || 0) + 1);
    }
    
    for (const [type, count] of shapeCounts) {
      if (count > 2) {
        functions.push(this.generateShapeUtilityFunction(type));
      }
    }
    
    return functions;
  }

  private generateShapeUtilityFunction(shapeType: string): string {
    switch (shapeType) {
      case 'circle':
        return `
function drawCircleAt(x: number, y: number, radius: number) {
  shapes.circle(x, y, radius);
}`;
      
      case 'rectangle':
        return `
function drawRectAt(x: number, y: number, width: number, height: number) {
  shapes.rect(x, y, width, height);
}`;
      
      default:
        return `
// Utility function for ${shapeType} could be added here`;
    }
  }

  /**
   * Pattern-based code generation
   */
  private patternToCodeConstruct(pattern: PatternGroup): any {
    return {
      id: pattern.id,
      type: pattern.repetition.type,
      elements: pattern.elements,
      repetition: pattern.repetition,
      symmetry: pattern.symmetry,
      functionName: this.generatePatternFunctionName(pattern)
    };
  }

  private generatePatternFunctionName(pattern: PatternGroup): string {
    const type = pattern.repetition.type;
    const count = pattern.elements.length;
    return `draw${type.charAt(0).toUpperCase() + type.slice(1)}Pattern${count}`;
  }

  private generatePatternMainFunction(constructs: any[]): string {
    const lines = [];
    
    lines.push('function drawPatterns() {');
    lines.push('  canvas.background("white");');
    
    for (const construct of constructs) {
      lines.push(`  ${construct.functionName}();`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private generatePatternFunction(construct: any): string {
    const lines = [];
    
    lines.push(`function ${construct.functionName}() {`);
    
    switch (construct.type) {
      case 'linear':
        lines.push(...this.generateLinearPatternCode(construct));
        break;
      case 'radial':
        lines.push(...this.generateRadialPatternCode(construct));
        break;
      case 'grid':
        lines.push(...this.generateGridPatternCode(construct));
        break;
      default:
        lines.push(`  // Pattern type ${construct.type} not implemented`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private generateLinearPatternCode(construct: any): string[] {
    const lines = [];
    const rep = construct.repetition;
    
    lines.push(`  // Linear pattern with ${rep.count} elements`);
    lines.push(`  const spacing = ${rep.spacing.toFixed(1)};`);
    lines.push(`  const angle = ${rep.angle.toFixed(3)};`);
    lines.push(`  const dx = Math.cos(angle) * spacing;`);
    lines.push(`  const dy = Math.sin(angle) * spacing;`);
    lines.push(``);
    lines.push(`  for (let i = 0; i < ${rep.count}; i++) {`);
    lines.push(`    const x = ${rep.center.x.toFixed(1)} + dx * i;`);
    lines.push(`    const y = ${rep.center.y.toFixed(1)} + dy * i;`);
    lines.push(`    drawElementAt(x, y);`);
    lines.push(`  }`);
    
    return lines;
  }

  private generateRadialPatternCode(construct: any): string[] {
    const lines = [];
    const rep = construct.repetition;
    
    lines.push(`  // Radial pattern with ${rep.count} elements`);
    lines.push(`  const radius = ${rep.spacing.toFixed(1)};`);
    lines.push(`  const angleStep = ${(2 * Math.PI / rep.count).toFixed(3)};`);
    lines.push(``);
    lines.push(`  for (let i = 0; i < ${rep.count}; i++) {`);
    lines.push(`    const angle = angleStep * i;`);
    lines.push(`    const x = ${rep.center.x.toFixed(1)} + Math.cos(angle) * radius;`);
    lines.push(`    const y = ${rep.center.y.toFixed(1)} + Math.sin(angle) * radius;`);
    lines.push(`    drawElementAt(x, y);`);
    lines.push(`  }`);
    
    return lines;
  }

  private generateGridPatternCode(construct: any): string[] {
    const lines = [];
    const rep = construct.repetition;
    const gridSize = Math.ceil(Math.sqrt(rep.count));
    
    lines.push(`  // Grid pattern with ${rep.count} elements`);
    lines.push(`  const gridSize = ${gridSize};`);
    lines.push(`  const spacing = ${rep.spacing.toFixed(1)};`);
    lines.push(``);
    lines.push(`  for (let row = 0; row < gridSize; row++) {`);
    lines.push(`    for (let col = 0; col < gridSize; col++) {`);
    lines.push(`      if (row * gridSize + col < ${rep.count}) {`);
    lines.push(`        const x = ${rep.center.x.toFixed(1)} + col * spacing;`);
    lines.push(`        const y = ${rep.center.y.toFixed(1)} + row * spacing;`);
    lines.push(`        drawElementAt(x, y);`);
    lines.push(`      }`);
    lines.push(`    }`);
    lines.push(`  }`);
    
    return lines;
  }

  /**
   * Code combination and optimization
   */
  private combineAndOptimize(mainFunction: string, helperFunctions: string): string {
    const parts = [];
    
    if (this.options.includeComments) {
      parts.push('// Generated by Genshi Studio Bidirectional Translation Engine');
      parts.push('// This code reproduces the original artwork using the Genshi API');
      parts.push('');
    }
    
    // Add helper functions first
    if (helperFunctions.trim()) {
      parts.push(helperFunctions);
      parts.push('');
    }
    
    // Add main function
    parts.push(mainFunction);
    
    // Add execution call
    parts.push('');
    parts.push('// Execute the drawing');
    parts.push('drawArtwork();');
    
    let combined = parts.join('\n');
    
    // Apply optimizations
    if (this.options.optimizeForPerformance) {
      combined = this.optimizeForPerformance(combined);
    }
    
    if (this.options.minifyOutput) {
      combined = this.minifyCode(combined);
    }
    
    return combined;
  }

  private combinePatternCode(mainFunction: string, patternFunctions: string): string {
    const parts = [];
    
    // Add pattern functions
    parts.push(patternFunctions);
    parts.push('');
    
    // Add basic element drawing function
    parts.push('function drawElementAt(x: number, y: number) {');
    parts.push('  // Draw basic element - customize as needed');
    parts.push('  shapes.circle(x, y, 5);');
    parts.push('}');
    parts.push('');
    
    // Add main function
    parts.push(mainFunction);
    parts.push('');
    parts.push('drawPatterns();');
    
    return parts.join('\n');
  }

  private optimizeForPerformance(code: string): string {
    // Simple optimizations
    return code
      .replace(/shapes\.line\((\d+\.\d+), (\d+\.\d+), (\d+\.\d+), (\d+\.\d+)\);/g, 
               'shapes.line($1, $2, $3, $4);') // Remove unnecessary decimals
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduce multiple empty lines
  }

  private minifyCode(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, ';}') // Compact braces
      .trim();
  }

  /**
   * Quality assessment
   */
  private calculateCodeQuality(code: string, originalStrokes: StrokeData[]): any {
    return {
      readability: this.assessReadability(code),
      performance: this.assessPerformance(code),
      accuracy: this.assessAccuracy(code, originalStrokes),
      maintainability: this.assessMaintainability(code)
    };
  }

  private calculatePatternCodeQuality(code: string, patterns: PatternGroup[]): any {
    return {
      readability: this.assessReadability(code),
      performance: 0.9, // Patterns are generally performant
      accuracy: 0.95, // Pattern-based code is usually accurate
      maintainability: this.assessMaintainability(code)
    };
  }

  private assessReadability(code: string): number {
    const lines = code.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const commentRatio = lines.filter(line => line.trim().startsWith('//')).length / lines.length;
    
    let score = 1.0;
    if (avgLineLength > 100) score -= 0.2; // Penalize long lines
    if (commentRatio < 0.1) score -= 0.3; // Penalize lack of comments
    
    return Math.max(0, score);
  }

  private assessPerformance(code: string): number {
    const lineCount = code.split('\n').length;
    const loopCount = (code.match(/for\s*\(/g) || []).length;
    const functionCount = (code.match(/function\s+\w+/g) || []).length;
    
    let score = 1.0;
    if (lineCount > 200) score -= 0.2;
    if (loopCount > 10) score -= 0.2;
    if (functionCount > 20) score -= 0.1;
    
    return Math.max(0.3, score);
  }

  private assessAccuracy(code: string, originalStrokes: StrokeData[]): number {
    // This would require execution and comparison in a real implementation
    const commandCount = (code.match(/shapes\./g) || []).length;
    const expectedCommands = originalStrokes.length;
    
    if (expectedCommands === 0) return 1.0;
    
    const ratio = Math.min(commandCount / expectedCommands, 1.0);
    return ratio * 0.8 + 0.2; // Base score of 0.2
  }

  private assessMaintainability(code: string): number {
    const functionCount = (code.match(/function\s+\w+/g) || []).length;
    const lineCount = code.split('\n').length;
    const avgFunctionLength = lineCount / Math.max(functionCount, 1);
    
    let score = 1.0;
    if (avgFunctionLength > 50) score -= 0.3;
    if (functionCount === 0) score -= 0.5;
    
    return Math.max(0.2, score);
  }

  /**
   * Utility methods
   */
  private calculateStatistics(code: string): any {
    const lines = code.split('\n').filter(line => line.trim());
    const functions = (code.match(/function\s+\w+/g) || []).length;
    const complexity = this.calculateCyclomaticComplexity(code);
    
    return {
      linesOfCode: lines.length,
      functions,
      complexityScore: complexity,
      estimatedExecutionTime: lines.length * 0.1 // rough estimate in ms
    };
  }

  private calculateCyclomaticComplexity(code: string): number {
    const conditions = (code.match(/if\s*\(|for\s*\(|while\s*\(/g) || []).length;
    const functions = (code.match(/function\s+\w+/g) || []).length;
    
    return conditions + functions + 1;
  }

  private generateWarnings(analysis: any): string[] {
    const warnings = [];
    
    if (analysis.complexity > 8) {
      warnings.push('High complexity detected - consider breaking into smaller functions');
    }
    
    if (analysis.totalStrokes > 100) {
      warnings.push('Large number of strokes - generated code may be lengthy');
    }
    
    return warnings;
  }

  private generateSuggestions(analysis: any): string[] {
    const suggestions = [];
    
    if (analysis.patterns.length > 0) {
      suggestions.push('Consider using pattern-based functions to reduce code duplication');
    }
    
    if (analysis.optimizations.length > 0) {
      suggestions.push(...analysis.optimizations);
    }
    
    return suggestions;
  }

  private generatePatternSuggestions(patterns: PatternGroup[]): string[] {
    const suggestions = [];
    
    if (patterns.length > 1) {
      suggestions.push('Multiple patterns detected - consider combining for efficiency');
    }
    
    return suggestions;
  }

  private extractDependencies(analysis: any): string[] {
    const deps = [];
    
    if (this.options.targetAPI === 'genshi') {
      deps.push('genshi-api');
    }
    
    if (this.options.generateAnimations) {
      deps.push('animation-utils');
    }
    
    return deps;
  }

  private extractFunctionSignatures(code: string): any[] {
    const functions = [];
    const matches = code.matchAll(/function\s+(\w+)\s*\(([^)]*)\)/g);
    
    for (const match of matches) {
      functions.push({
        name: match[1],
        parameters: match[2].split(',').map(p => p.trim()).filter(p => p),
        returnType: 'void'
      });
    }
    
    return functions;
  }

  // Initialize code templates
  private initializeTemplates(): void {
    // Add basic templates
    this.templates.set('circle', {
      id: 'circle',
      name: 'Circle Drawing',
      description: 'Basic circle drawing template',
      template: 'shapes.circle({{x}}, {{y}}, {{radius}});',
      parameters: [
        { name: 'x', type: 'number', placeholder: 'center x' },
        { name: 'y', type: 'number', placeholder: 'center y' },
        { name: 'radius', type: 'number', placeholder: 'radius' }
      ]
    });
    
    // Add more templates as needed
  }

  // Helper geometry methods
  private isCircle(points: Point[]): boolean {
    if (points.length < 8) return false;
    
    const center = this.calculateCentroid(points);
    const distances = points.map(p => this.distance(p, center));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const tolerance = avgDistance * 0.15;
    
    return distances.every(d => Math.abs(d - avgDistance) < tolerance);
  }

  private isRectangle(points: Point[]): boolean {
    if (points.length < 4) return false;
    
    // Check if points form approximately rectangular shape
    const bounds = this.calculateBounds(points);
    const corners = [
      { x: bounds.min.x, y: bounds.min.y },
      { x: bounds.max.x, y: bounds.min.y },
      { x: bounds.max.x, y: bounds.max.y },
      { x: bounds.min.x, y: bounds.max.y }
    ];
    
    // Check if most points are near the boundary
    const tolerance = 10;
    let boundaryPoints = 0;
    
    for (const point of points) {
      const nearBoundary = 
        Math.abs(point.x - bounds.min.x) < tolerance ||
        Math.abs(point.x - bounds.max.x) < tolerance ||
        Math.abs(point.y - bounds.min.y) < tolerance ||
        Math.abs(point.y - bounds.max.y) < tolerance;
      
      if (nearBoundary) boundaryPoints++;
    }
    
    return boundaryPoints / points.length > 0.8;
  }

  private isPolygon(points: Point[]): boolean {
    // Simple polygon detection - check for approximately straight segments
    if (points.length < 6) return false;
    
    let straightSegments = 0;
    const tolerance = 0.2; // radians
    
    for (let i = 0; i < points.length - 2; i++) {
      const angle1 = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x);
      const angle2 = Math.atan2(points[i + 2].y - points[i + 1].y, points[i + 2].x - points[i + 1].x);
      const angleDiff = Math.abs(angle2 - angle1);
      
      if (angleDiff < tolerance || angleDiff > Math.PI * 2 - tolerance) {
        straightSegments++;
      }
    }
    
    return straightSegments / (points.length - 2) > 0.6;
  }

  private simplifyPolygon(points: Point[]): Point[] {
    // Simple polygon simplification
    return points.filter((_, index) => index % 3 === 0).slice(0, 8);
  }

  private hasRepetitiveElements(points: Point[]): boolean {
    // Check for repeating patterns in the point sequence
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        dx: points[i + 1].x - points[i].x,
        dy: points[i + 1].y - points[i].y
      });
    }
    
    // Look for repeated segment patterns
    const patternLength = 3;
    for (let start = 0; start < segments.length - patternLength * 2; start++) {
      const pattern = segments.slice(start, start + patternLength);
      const next = segments.slice(start + patternLength, start + patternLength * 2);
      
      const isRepeating = pattern.every((seg, i) => 
        Math.abs(seg.dx - next[i].dx) < 5 && Math.abs(seg.dy - next[i].dy) < 5
      );
      
      if (isRepeating) return true;
    }
    
    return false;
  }

  private hasSymmetry(points: Point[]): boolean {
    if (points.length < 6) return false;
    
    const center = this.calculateCentroid(points);
    const tolerance = 10;
    
    // Check for vertical symmetry
    let symmetricPoints = 0;
    for (const point of points) {
      const mirrored = { x: 2 * center.x - point.x, y: point.y };
      const hasMatch = points.some(p => 
        Math.abs(p.x - mirrored.x) < tolerance && Math.abs(p.y - mirrored.y) < tolerance
      );
      if (hasMatch) symmetricPoints++;
    }
    
    return symmetricPoints / points.length > 0.7;
  }

  private calculateCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
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

  private calculateAverageRadius(points: Point[], center: Point): number {
    const distances = points.map(p => this.distance(p, center));
    return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  private distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private calculateCurvatureComplexity(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let totalCurvature = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const v1 = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y };
      const v2 = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y };
      
      const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
      totalCurvature += Math.abs(angle);
    }
    
    return totalCurvature / (points.length - 2);
  }

  private simplifyPath(points: Point[]): Point[] {
    // Simple path simplification - keep every nth point
    const step = Math.max(1, Math.floor(points.length / 20));
    const simplified = [];
    
    for (let i = 0; i < points.length; i += step) {
      simplified.push(points[i]);
    }
    
    // Always include the last point
    if (simplified[simplified.length - 1] !== points[points.length - 1]) {
      simplified.push(points[points.length - 1]);
    }
    
    return simplified;
  }
}