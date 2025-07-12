/**
 * Pattern Recognition System
 * Identifies repeating elements, symmetries, and geometric patterns
 * for conversion to parametric representations
 */

import { Point, Color } from '../../types/graphics';
import { VectorPath } from '../BidirectionalTranslationEngine';

export interface PatternElement {
  id: string;
  type: 'line' | 'curve' | 'circle' | 'polygon' | 'composite';
  bounds: { min: Point; max: Point };
  center: Point;
  characteristics: {
    area: number;
    perimeter: number;
    orientation: number; // radians
    aspectRatio: number;
    curvature: number;
  };
  points: Point[];
  style: {
    stroke: Color;
    fill: Color;
    strokeWidth: number;
  };
}

export interface PatternGroup {
  id: string;
  elements: PatternElement[];
  repetition: {
    type: 'linear' | 'radial' | 'grid' | 'spiral' | 'fractal';
    count: number;
    spacing: number;
    angle: number;
    center: Point;
    scale: number;
  };
  symmetry: {
    type: 'none' | 'reflection' | 'rotation' | 'translation' | 'glide';
    axes: Point[][];
    order: number;
  };
  confidence: number; // 0-1
}

export interface RecognitionResult {
  patterns: PatternGroup[];
  elements: PatternElement[];
  statistics: {
    totalElements: number;
    recognizedPatterns: number;
    coverage: number; // percentage of elements in patterns
    confidence: number; // overall confidence
  };
  metadata: {
    processingTime: number;
    algorithmsUsed: string[];
    qualityScore: number;
  };
}

export interface RecognitionOptions {
  minPatternSize: number; // minimum elements in a pattern
  maxPatternSize: number; // maximum elements in a pattern
  similarityThreshold: number; // 0-1
  symmetryTolerance: number; // pixels
  enableAdvancedPatterns: boolean; // fractals, spirals, etc.
  adaptiveThresholds: boolean;
}

export class PatternRecognition {
  private options: RecognitionOptions;
  private elementCache = new Map<string, PatternElement>();
  
  constructor(options: Partial<RecognitionOptions> = {}) {
    this.options = {
      minPatternSize: 2,
      maxPatternSize: 20,
      similarityThreshold: 0.8,
      symmetryTolerance: 5.0,
      enableAdvancedPatterns: true,
      adaptiveThresholds: true,
      ...options
    };
  }

  /**
   * Recognize patterns in vector paths
   */
  async recognizePatterns(vectorPaths: VectorPath[]): Promise<RecognitionResult> {
    const startTime = performance.now();
    const algorithmsUsed: string[] = [];
    
    try {
      // 1. Extract individual elements
      algorithmsUsed.push('element_extraction');
      const elements = await this.extractElements(vectorPaths);
      
      // 2. Group similar elements
      algorithmsUsed.push('similarity_grouping');
      const similarGroups = await this.groupSimilarElements(elements);
      
      // 3. Detect repetition patterns
      algorithmsUsed.push('repetition_detection');
      const repetitionPatterns = await this.detectRepetitionPatterns(similarGroups);
      
      // 4. Detect symmetry patterns
      algorithmsUsed.push('symmetry_detection');
      const symmetryPatterns = await this.detectSymmetryPatterns(elements);
      
      // 5. Detect advanced patterns (fractals, spirals)
      if (this.options.enableAdvancedPatterns) {
        algorithmsUsed.push('advanced_patterns');
      }
      const advancedPatterns = this.options.enableAdvancedPatterns 
        ? await this.detectAdvancedPatterns(elements)
        : [];
      
      // 6. Combine and rank all patterns
      const allPatterns = [...repetitionPatterns, ...symmetryPatterns, ...advancedPatterns];
      const rankedPatterns = this.rankPatterns(allPatterns);
      
      // 7. Calculate statistics
      const statistics = this.calculateStatistics(elements, rankedPatterns);
      
      const processingTime = performance.now() - startTime;
      
      return {
        patterns: rankedPatterns,
        elements,
        statistics,
        metadata: {
          processingTime,
          algorithmsUsed,
          qualityScore: this.calculateQualityScore(rankedPatterns, statistics)
        }
      };
      
    } catch (error) {
      console.error('Pattern recognition failed:', error);
      return {
        patterns: [],
        elements: [],
        statistics: {
          totalElements: 0,
          recognizedPatterns: 0,
          coverage: 0,
          confidence: 0
        },
        metadata: {
          processingTime: performance.now() - startTime,
          algorithmsUsed,
          qualityScore: 0
        }
      };
    }
  }

  /**
   * Extract individual pattern elements from vector paths
   */
  private async extractElements(vectorPaths: VectorPath[]): Promise<PatternElement[]> {
    const elements: PatternElement[] = [];
    
    for (let i = 0; i < vectorPaths.length; i++) {
      const path = vectorPaths[i];
      const element = await this.analyzeVectorPath(path, i);
      if (element) {
        elements.push(element);
      }
    }
    
    return elements;
  }

  private async analyzeVectorPath(path: VectorPath, index: number): Promise<PatternElement | null> {
    if (path.points.length < 2) return null;
    
    const cacheKey = this.generateElementCacheKey(path);
    if (this.elementCache.has(cacheKey)) {
      return this.elementCache.get(cacheKey)!;
    }
    
    // Calculate bounds
    const bounds = this.calculateBounds(path.points);
    const center = {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2
    };
    
    // Classify element type
    const type = this.classifyElementType(path);
    
    // Calculate characteristics
    const characteristics = this.calculateCharacteristics(path);
    
    const element: PatternElement = {
      id: `element_${index}`,
      type,
      bounds,
      center,
      characteristics,
      points: path.points,
      style: {
        stroke: path.style.stroke,
        fill: path.style.fill,
        strokeWidth: path.style.strokeWidth
      }
    };
    
    this.elementCache.set(cacheKey, element);
    return element;
  }

  private generateElementCacheKey(path: VectorPath): string {
    // Generate a hash of the path for caching
    const pointsStr = path.points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('|');
    return btoa(pointsStr).substring(0, 16);
  }

  private calculateBounds(points: Point[]): { min: Point; max: Point } {
    if (points.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }
    
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }

  private classifyElementType(path: VectorPath): PatternElement['type'] {
    const points = path.points;
    
    if (points.length < 3) {
      return 'line';
    }
    
    // Check if it's approximately circular
    if (this.isCircular(points)) {
      return 'circle';
    }
    
    // Check if it's a polygon (closed with straight sides)
    if (this.isPolygonal(points)) {
      return 'polygon';
    }
    
    // Check if it's primarily curved
    if (path.curves && path.curves.length > 0) {
      return 'curve';
    }
    
    return 'composite';
  }

  private isCircular(points: Point[]): boolean {
    if (points.length < 8) return false; // Need minimum points for circle
    
    const center = this.calculateCentroid(points);
    const distances = points.map(p => this.distance(p, center));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Check if all distances are within tolerance of average
    const tolerance = avgDistance * 0.1;
    return distances.every(d => Math.abs(d - avgDistance) < tolerance);
  }

  private isPolygonal(points: Point[]): boolean {
    if (points.length < 4) return false;
    
    // Check if most segments are approximately straight
    let straightSegments = 0;
    const tolerance = 0.1; // radians
    
    for (let i = 0; i < points.length - 2; i++) {
      const angle1 = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x);
      const angle2 = Math.atan2(points[i + 2].y - points[i + 1].y, points[i + 2].x - points[i + 1].x);
      const angleDiff = Math.abs(angle2 - angle1);
      
      if (angleDiff < tolerance || angleDiff > Math.PI * 2 - tolerance) {
        straightSegments++;
      }
    }
    
    return straightSegments / (points.length - 2) > 0.7;
  }

  private calculateCharacteristics(path: VectorPath): PatternElement['characteristics'] {
    const points = path.points;
    const area = this.calculateArea(points);
    const perimeter = this.calculatePerimeter(points);
    const orientation = this.calculateOrientation(points);
    const bounds = this.calculateBounds(points);
    const aspectRatio = (bounds.max.x - bounds.min.x) / (bounds.max.y - bounds.min.y);
    const curvature = this.calculateCurvature(points);
    
    return {
      area,
      perimeter,
      orientation,
      aspectRatio,
      curvature
    };
  }

  private calculateArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculatePerimeter(points: Point[]): number {
    if (points.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < points.length - 1; i++) {
      perimeter += this.distance(points[i], points[i + 1]);
    }
    return perimeter;
  }

  private calculateOrientation(points: Point[]): number {
    if (points.length < 2) return 0;
    
    // Calculate dominant direction
    const start = points[0];
    const end = points[points.length - 1];
    return Math.atan2(end.y - start.y, end.x - start.x);
  }

  private calculateCurvature(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let totalCurvature = 0;
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
      totalCurvature += Math.abs(angle);
    }
    
    return totalCurvature / (points.length - 2);
  }

  /**
   * Group similar elements together
   */
  private async groupSimilarElements(elements: PatternElement[]): Promise<PatternElement[][]> {
    const groups: PatternElement[][] = [];
    const used = new Set<string>();
    
    for (const element of elements) {
      if (used.has(element.id)) continue;
      
      const group = [element];
      used.add(element.id);
      
      // Find similar elements
      for (const other of elements) {
        if (used.has(other.id)) continue;
        
        const similarity = this.calculateElementSimilarity(element, other);
        if (similarity >= this.options.similarityThreshold) {
          group.push(other);
          used.add(other.id);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private calculateElementSimilarity(element1: PatternElement, element2: PatternElement): number {
    // Type similarity
    const typeSimilarity = element1.type === element2.type ? 1 : 0;
    
    // Size similarity
    const area1 = element1.characteristics.area;
    const area2 = element2.characteristics.area;
    const sizeSimilarity = 1 - Math.abs(area1 - area2) / Math.max(area1, area2);
    
    // Shape similarity (aspect ratio)
    const aspectRatio1 = element1.characteristics.aspectRatio;
    const aspectRatio2 = element2.characteristics.aspectRatio;
    const shapeSimilarity = 1 - Math.abs(aspectRatio1 - aspectRatio2) / Math.max(aspectRatio1, aspectRatio2);
    
    // Curvature similarity
    const curvature1 = element1.characteristics.curvature;
    const curvature2 = element2.characteristics.curvature;
    const curvatureSimilarity = 1 - Math.abs(curvature1 - curvature2) / Math.max(curvature1 + 0.1, curvature2 + 0.1);
    
    // Weighted average
    return typeSimilarity * 0.3 + sizeSimilarity * 0.3 + shapeSimilarity * 0.2 + curvatureSimilarity * 0.2;
  }

  /**
   * Detect repetition patterns in element groups
   */
  private async detectRepetitionPatterns(groups: PatternElement[][]): Promise<PatternGroup[]> {
    const patterns: PatternGroup[] = [];
    
    for (const group of groups) {
      if (group.length < this.options.minPatternSize) continue;
      
      // Try different repetition types
      const linearPattern = this.detectLinearRepetition(group);
      if (linearPattern) patterns.push(linearPattern);
      
      const radialPattern = this.detectRadialRepetition(group);
      if (radialPattern) patterns.push(radialPattern);
      
      const gridPattern = this.detectGridRepetition(group);
      if (gridPattern) patterns.push(gridPattern);
    }
    
    return patterns;
  }

  private detectLinearRepetition(elements: PatternElement[]): PatternGroup | null {
    if (elements.length < 2) return null;
    
    // Calculate vectors between consecutive elements
    const vectors: Point[] = [];
    for (let i = 1; i < elements.length; i++) {
      vectors.push({
        x: elements[i].center.x - elements[i - 1].center.x,
        y: elements[i].center.y - elements[i - 1].center.y
      });
    }
    
    // Check if vectors are approximately parallel and equal
    const avgVector = this.calculateAverageVector(vectors);
    const isLinear = vectors.every(v => 
      this.vectorSimilarity(v, avgVector) > 0.8
    );
    
    if (!isLinear) return null;
    
    const spacing = Math.sqrt(avgVector.x * avgVector.x + avgVector.y * avgVector.y);
    const angle = Math.atan2(avgVector.y, avgVector.x);
    
    return {
      id: `linear_${Date.now()}`,
      elements,
      repetition: {
        type: 'linear',
        count: elements.length,
        spacing,
        angle,
        center: this.calculateCentroid(elements.map(e => e.center)),
        scale: 1
      },
      symmetry: {
        type: 'translation',
        axes: [],
        order: 1
      },
      confidence: this.calculatePatternConfidence(elements, 'linear')
    };
  }

  private detectRadialRepetition(elements: PatternElement[]): PatternGroup | null {
    if (elements.length < 3) return null;
    
    // Find potential center by testing different points
    const center = this.findRadialCenter(elements);
    if (!center) return null;
    
    // Calculate angles from center to each element
    const angles = elements.map(e => 
      Math.atan2(e.center.y - center.y, e.center.x - center.x)
    );
    
    // Sort angles and check for regular spacing
    angles.sort();
    const angleDifferences = [];
    for (let i = 1; i < angles.length; i++) {
      angleDifferences.push(angles[i] - angles[i - 1]);
    }
    // Add wrap-around difference
    angleDifferences.push(2 * Math.PI - (angles[angles.length - 1] - angles[0]));
    
    const avgAngleDiff = angleDifferences.reduce((sum, diff) => sum + diff, 0) / angleDifferences.length;
    const isRegular = angleDifferences.every(diff => 
      Math.abs(diff - avgAngleDiff) < 0.3 // tolerance in radians
    );
    
    if (!isRegular) return null;
    
    return {
      id: `radial_${Date.now()}`,
      elements,
      repetition: {
        type: 'radial',
        count: elements.length,
        spacing: avgAngleDiff,
        angle: 0,
        center,
        scale: 1
      },
      symmetry: {
        type: 'rotation',
        axes: [],
        order: elements.length
      },
      confidence: this.calculatePatternConfidence(elements, 'radial')
    };
  }

  private detectGridRepetition(elements: PatternElement[]): PatternGroup | null {
    if (elements.length < 4) return null;
    
    // Try to arrange elements in a grid
    const sortedByX = [...elements].sort((a, b) => a.center.x - b.center.x);
    const sortedByY = [...elements].sort((a, b) => a.center.y - b.center.y);
    
    // Find potential grid dimensions
    const xPositions = [...new Set(sortedByX.map(e => Math.round(e.center.x / 10) * 10))];
    const yPositions = [...new Set(sortedByY.map(e => Math.round(e.center.y / 10) * 10))];
    
    if (xPositions.length * yPositions.length !== elements.length) return null;
    
    // Check if elements form a regular grid
    const xSpacing = xPositions.length > 1 ? xPositions[1] - xPositions[0] : 0;
    const ySpacing = yPositions.length > 1 ? yPositions[1] - yPositions[0] : 0;
    
    const isRegularGrid = this.validateGridSpacing(elements, xSpacing, ySpacing);
    if (!isRegularGrid) return null;
    
    return {
      id: `grid_${Date.now()}`,
      elements,
      repetition: {
        type: 'grid',
        count: elements.length,
        spacing: Math.sqrt(xSpacing * xSpacing + ySpacing * ySpacing),
        angle: 0,
        center: this.calculateCentroid(elements.map(e => e.center)),
        scale: 1
      },
      symmetry: {
        type: 'translation',
        axes: [],
        order: 1
      },
      confidence: this.calculatePatternConfidence(elements, 'grid')
    };
  }

  /**
   * Detect symmetry patterns
   */
  private async detectSymmetryPatterns(elements: PatternElement[]): Promise<PatternGroup[]> {
    const patterns: PatternGroup[] = [];
    
    // Try reflection symmetry
    const reflectionPattern = this.detectReflectionSymmetry(elements);
    if (reflectionPattern) patterns.push(reflectionPattern);
    
    // Try rotational symmetry
    const rotationPattern = this.detectRotationalSymmetry(elements);
    if (rotationPattern) patterns.push(rotationPattern);
    
    return patterns;
  }

  private detectReflectionSymmetry(elements: PatternElement[]): PatternGroup | null {
    // Try different reflection axes
    const center = this.calculateCentroid(elements.map(e => e.center));
    
    // Try horizontal, vertical, and diagonal axes
    const axes = [
      [{ x: center.x - 100, y: center.y }, { x: center.x + 100, y: center.y }], // horizontal
      [{ x: center.x, y: center.y - 100 }, { x: center.x, y: center.y + 100 }], // vertical
      [{ x: center.x - 70, y: center.y - 70 }, { x: center.x + 70, y: center.y + 70 }], // diagonal
      [{ x: center.x - 70, y: center.y + 70 }, { x: center.x + 70, y: center.y - 70 }]  // anti-diagonal
    ];
    
    for (const axis of axes) {
      if (this.testReflectionSymmetry(elements, axis)) {
        return {
          id: `reflection_${Date.now()}`,
          elements,
          repetition: {
            type: 'linear',
            count: elements.length,
            spacing: 0,
            angle: 0,
            center,
            scale: 1
          },
          symmetry: {
            type: 'reflection',
            axes: [axis],
            order: 2
          },
          confidence: this.calculatePatternConfidence(elements, 'reflection')
        };
      }
    }
    
    return null;
  }

  private detectRotationalSymmetry(elements: PatternElement[]): PatternGroup | null {
    const center = this.calculateCentroid(elements.map(e => e.center));
    
    // Test for 2-fold, 3-fold, 4-fold, etc. rotational symmetry
    for (let order = 2; order <= Math.min(8, elements.length); order++) {
      if (this.testRotationalSymmetry(elements, center, order)) {
        return {
          id: `rotation_${Date.now()}`,
          elements,
          repetition: {
            type: 'radial',
            count: elements.length,
            spacing: 2 * Math.PI / order,
            angle: 0,
            center,
            scale: 1
          },
          symmetry: {
            type: 'rotation',
            axes: [],
            order
          },
          confidence: this.calculatePatternConfidence(elements, 'rotation')
        };
      }
    }
    
    return null;
  }

  /**
   * Detect advanced patterns (fractals, spirals)
   */
  private async detectAdvancedPatterns(elements: PatternElement[]): Promise<PatternGroup[]> {
    const patterns: PatternGroup[] = [];
    
    // Detect spiral patterns
    const spiralPattern = this.detectSpiralPattern(elements);
    if (spiralPattern) patterns.push(spiralPattern);
    
    // Detect fractal patterns
    const fractalPattern = this.detectFractalPattern(elements);
    if (fractalPattern) patterns.push(fractalPattern);
    
    return patterns;
  }

  private detectSpiralPattern(elements: PatternElement[]): PatternGroup | null {
    if (elements.length < 4) return null;
    
    // Sort elements by distance from center
    const center = this.calculateCentroid(elements.map(e => e.center));
    const sorted = elements.sort((a, b) => 
      this.distance(a.center, center) - this.distance(b.center, center)
    );
    
    // Check if angles increase monotonically while distances increase
    let isSpiral = true;
    let prevAngle = Math.atan2(sorted[0].center.y - center.y, sorted[0].center.x - center.x);
    let prevDistance = this.distance(sorted[0].center, center);
    
    for (let i = 1; i < sorted.length; i++) {
      const angle = Math.atan2(sorted[i].center.y - center.y, sorted[i].center.x - center.x);
      const distance = this.distance(sorted[i].center, center);
      
      // Normalize angle difference
      let angleDiff = angle - prevAngle;
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
      
      if (angleDiff < 0.1 || distance < prevDistance) {
        isSpiral = false;
        break;
      }
      
      prevAngle = angle;
      prevDistance = distance;
    }
    
    if (!isSpiral) return null;
    
    return {
      id: `spiral_${Date.now()}`,
      elements: sorted,
      repetition: {
        type: 'spiral',
        count: elements.length,
        spacing: 0,
        angle: 0,
        center,
        scale: 1
      },
      symmetry: {
        type: 'none',
        axes: [],
        order: 1
      },
      confidence: this.calculatePatternConfidence(elements, 'spiral')
    };
  }

  private detectFractalPattern(elements: PatternElement[]): PatternGroup | null {
    // Simple fractal detection - look for self-similar scaling
    if (elements.length < 6) return null;
    
    // Group elements by size
    const sizeGroups = new Map<number, PatternElement[]>();
    
    for (const element of elements) {
      const size = Math.round(element.characteristics.area / 100) * 100;
      if (!sizeGroups.has(size)) {
        sizeGroups.set(size, []);
      }
      sizeGroups.get(size)!.push(element);
    }
    
    // Check for multiple size levels with similar patterns
    if (sizeGroups.size < 2) return null;
    
    const sizeArray = Array.from(sizeGroups.keys()).sort((a, b) => a - b);
    const ratios = [];
    
    for (let i = 1; i < sizeArray.length; i++) {
      ratios.push(sizeArray[i] / sizeArray[i - 1]);
    }
    
    // Check if ratios are approximately equal (self-similar scaling)
    const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    const isSelfsimilar = ratios.every(r => Math.abs(r - avgRatio) < avgRatio * 0.2);
    
    if (!isSelfsimilar) return null;
    
    return {
      id: `fractal_${Date.now()}`,
      elements,
      repetition: {
        type: 'fractal',
        count: elements.length,
        spacing: 0,
        angle: 0,
        center: this.calculateCentroid(elements.map(e => e.center)),
        scale: avgRatio
      },
      symmetry: {
        type: 'none',
        axes: [],
        order: 1
      },
      confidence: this.calculatePatternConfidence(elements, 'fractal')
    };
  }

  /**
   * Utility methods
   */
  private distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  private calculateAverageVector(vectors: Point[]): Point {
    if (vectors.length === 0) return { x: 0, y: 0 };
    
    const sum = vectors.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
    return { x: sum.x / vectors.length, y: sum.y / vectors.length };
  }

  private vectorSimilarity(v1: Point, v2: Point): number {
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const cosAngle = dot / (mag1 * mag2);
    const magSimilarity = 1 - Math.abs(mag1 - mag2) / Math.max(mag1, mag2);
    
    return (cosAngle + 1) / 2 * magSimilarity;
  }

  private findRadialCenter(elements: PatternElement[]): Point | null {
    // Try different potential centers and score them
    const candidates = [
      this.calculateCentroid(elements.map(e => e.center)),
      ...elements.map(e => e.center)
    ];
    
    let bestCenter: Point | null = null;
    let bestScore = 0;
    
    for (const candidate of candidates) {
      const score = this.scoreRadialCenter(elements, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCenter = candidate;
      }
    }
    
    return bestScore > 0.7 ? bestCenter : null;
  }

  private scoreRadialCenter(elements: PatternElement[], center: Point): number {
    const distances = elements.map(e => this.distance(e.center, center));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Score based on how similar the distances are
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const normalizedVariance = variance / (avgDistance * avgDistance);
    
    return Math.max(0, 1 - normalizedVariance);
  }

  private validateGridSpacing(elements: PatternElement[], xSpacing: number, ySpacing: number): boolean {
    const tolerance = Math.min(xSpacing, ySpacing) * 0.1;
    
    for (const element of elements) {
      const expectedX = Math.round(element.center.x / xSpacing) * xSpacing;
      const expectedY = Math.round(element.center.y / ySpacing) * ySpacing;
      
      if (Math.abs(element.center.x - expectedX) > tolerance ||
          Math.abs(element.center.y - expectedY) > tolerance) {
        return false;
      }
    }
    
    return true;
  }

  private testReflectionSymmetry(elements: PatternElement[], axis: Point[]): boolean {
    const tolerance = this.options.symmetryTolerance;
    
    for (const element of elements) {
      const reflected = this.reflectPointAcrossLine(element.center, axis[0], axis[1]);
      
      // Find closest element to reflected point
      let minDistance = Infinity;
      for (const other of elements) {
        const distance = this.distance(reflected, other.center);
        minDistance = Math.min(minDistance, distance);
      }
      
      if (minDistance > tolerance) return false;
    }
    
    return true;
  }

  private testRotationalSymmetry(elements: PatternElement[], center: Point, order: number): boolean {
    const tolerance = this.options.symmetryTolerance;
    const angle = 2 * Math.PI / order;
    
    for (const element of elements) {
      for (let i = 1; i < order; i++) {
        const rotated = this.rotatePointAroundCenter(element.center, center, angle * i);
        
        // Find closest element to rotated point
        let minDistance = Infinity;
        for (const other of elements) {
          const distance = this.distance(rotated, other.center);
          minDistance = Math.min(minDistance, distance);
        }
        
        if (minDistance > tolerance) return false;
      }
    }
    
    return true;
  }

  private reflectPointAcrossLine(point: Point, lineStart: Point, lineEnd: Point): Point {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return point;
    
    const nx = dx / length; // normalized x
    const ny = dy / length; // normalized y
    
    // Vector from line start to point
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    
    // Project onto line
    const dot = px * nx + py * ny;
    const projX = dot * nx;
    const projY = dot * ny;
    
    // Reflect
    return {
      x: lineStart.x + 2 * projX - px,
      y: lineStart.y + 2 * projY - py
    };
  }

  private rotatePointAroundCenter(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  private rankPatterns(patterns: PatternGroup[]): PatternGroup[] {
    return patterns.sort((a, b) => {
      // Sort by confidence first, then by complexity (element count)
      if (Math.abs(a.confidence - b.confidence) > 0.1) {
        return b.confidence - a.confidence;
      }
      return b.elements.length - a.elements.length;
    });
  }

  private calculateStatistics(elements: PatternElement[], patterns: PatternGroup[]) {
    const elementsInPatterns = new Set<string>();
    patterns.forEach(pattern => 
      pattern.elements.forEach(element => elementsInPatterns.add(element.id))
    );
    
    const coverage = elements.length > 0 ? elementsInPatterns.size / elements.length : 0;
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;
    
    return {
      totalElements: elements.length,
      recognizedPatterns: patterns.length,
      coverage,
      confidence: avgConfidence
    };
  }

  private calculateQualityScore(patterns: PatternGroup[], statistics: any): number {
    const coverageScore = statistics.coverage;
    const confidenceScore = statistics.confidence;
    const patternDiversityScore = Math.min(1, patterns.length / 5); // Bonus for finding multiple patterns
    
    return (coverageScore * 0.4 + confidenceScore * 0.4 + patternDiversityScore * 0.2);
  }

  private calculatePatternConfidence(elements: PatternElement[], patternType: string): number {
    // Base confidence based on element count and pattern type
    const baseConfidence = Math.min(1, elements.length / 5);
    
    const typeMultipliers = {
      'linear': 0.9,
      'radial': 0.85,
      'grid': 0.8,
      'reflection': 0.75,
      'rotation': 0.75,
      'spiral': 0.7,
      'fractal': 0.6
    };
    
    return baseConfidence * (typeMultipliers[patternType] || 0.5);
  }
}