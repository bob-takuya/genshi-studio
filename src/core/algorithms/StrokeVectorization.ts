/**
 * Stroke Vectorization Algorithm
 * Converts raster brush strokes to vector paths with high accuracy
 * Preserves artistic intent while enabling parametric manipulation
 */

import { Point, Color } from '../../types/graphics';
import { StrokeData, VectorPath, BezierCurve } from '../BidirectionalTranslationEngine';

export interface VectorizationOptions {
  smoothingFactor: number; // 0-1
  simplificationTolerance: number; // pixels
  curveDetectionThreshold: number; // 0-1
  preserveSpeed: boolean;
  adaptiveThreshold: boolean;
}

export interface VectorizationResult {
  paths: VectorPath[];
  accuracy: number; // 0-1
  compressionRatio: number;
  processingTime: number;
  metadata: {
    originalPointCount: number;
    vectorizedPointCount: number;
    curvesDetected: number;
    smoothingApplied: boolean;
  };
}

export class StrokeVectorization {
  private options: VectorizationOptions;
  
  constructor(options: Partial<VectorizationOptions> = {}) {
    this.options = {
      smoothingFactor: 0.5,
      simplificationTolerance: 2.0,
      curveDetectionThreshold: 0.7,
      preserveSpeed: true,
      adaptiveThreshold: true,
      ...options
    };
  }

  /**
   * Vectorize stroke data to vector paths
   */
  async vectorize(strokes: StrokeData[]): Promise<VectorizationResult> {
    const startTime = performance.now();
    const originalPointCount = strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
    
    const paths: VectorPath[] = [];
    let totalCurvesDetected = 0;
    let vectorizedPointCount = 0;
    
    for (const stroke of strokes) {
      const vectorPath = await this.vectorizeStroke(stroke);
      paths.push(vectorPath);
      totalCurvesDetected += vectorPath.curves.length;
      vectorizedPointCount += vectorPath.points.length;
    }
    
    const processingTime = performance.now() - startTime;
    const compressionRatio = originalPointCount > 0 ? vectorizedPointCount / originalPointCount : 1;
    const accuracy = this.calculateAccuracy(strokes, paths);
    
    return {
      paths,
      accuracy,
      compressionRatio,
      processingTime,
      metadata: {
        originalPointCount,
        vectorizedPointCount,
        curvesDetected: totalCurvesDetected,
        smoothingApplied: this.options.smoothingFactor > 0
      }
    };
  }

  /**
   * Vectorize a single stroke
   */
  private async vectorizeStroke(stroke: StrokeData): Promise<VectorPath> {
    // 1. Apply smoothing if enabled
    let smoothedPoints = this.options.smoothingFactor > 0 
      ? this.smoothPoints(stroke.points, stroke.pressures)
      : stroke.points;
    
    // 2. Simplify path using Douglas-Peucker algorithm
    const simplifiedPoints = this.simplifyPath(smoothedPoints, this.options.simplificationTolerance);
    
    // 3. Detect curves and generate Bezier curves
    const curves = this.detectAndGenerateCurves(simplifiedPoints, stroke.pressures);
    
    // 4. Calculate style from brush settings
    const style = this.extractStyle(stroke.brushSettings);
    
    return {
      points: simplifiedPoints,
      curves,
      style
    };
  }

  /**
   * Smooth points using moving average with pressure weighting
   */
  private smoothPoints(points: Point[], pressures: number[]): Point[] {
    if (points.length < 3) return points;
    
    const smoothed: Point[] = [points[0]]; // Keep first point
    const windowSize = Math.max(3, Math.floor(points.length * 0.1)); // Adaptive window
    
    for (let i = 1; i < points.length - 1; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(points.length, i + Math.floor(windowSize / 2) + 1);
      
      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;
      
      for (let j = start; j < end; j++) {
        // Weight by pressure and distance from center
        const distanceWeight = 1 - Math.abs(j - i) / (windowSize / 2);
        const pressureWeight = pressures[j] || 1.0;
        const weight = distanceWeight * pressureWeight * this.options.smoothingFactor;
        
        weightedX += points[j].x * weight;
        weightedY += points[j].y * weight;
        totalWeight += weight;
      }
      
      // Interpolate between original and smoothed
      const smoothedPoint = {
        x: weightedX / totalWeight,
        y: weightedY / totalWeight
      };
      
      smoothed.push({
        x: points[i].x * (1 - this.options.smoothingFactor) + smoothedPoint.x * this.options.smoothingFactor,
        y: points[i].y * (1 - this.options.smoothingFactor) + smoothedPoint.y * this.options.smoothingFactor
      });
    }
    
    smoothed.push(points[points.length - 1]); // Keep last point
    return smoothed;
  }

  /**
   * Simplify path using Douglas-Peucker algorithm
   */
  private simplifyPath(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;
    
    const simplified = this.douglasPeucker(points, tolerance);
    
    // Ensure minimum point density for curves
    return this.ensureMinimumDensity(simplified, points);
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;
    
    // Find the point with maximum distance from line
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      // Combine results (remove duplicate middle point)
      return [...left.slice(0, -1), ...right];
    }
    
    // Otherwise, return just the endpoints
    return [start, end];
  }

  private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      // Line start and end are the same point
      return this.distance(point, lineStart);
    }
    
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
    
    if (t < 0) {
      return this.distance(point, lineStart);
    } else if (t > 1) {
      return this.distance(point, lineEnd);
    }
    
    const projection = {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy
    };
    
    return this.distance(point, projection);
  }

  private distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Ensure minimum point density for proper curve detection
   */
  private ensureMinimumDensity(simplified: Point[], original: Point[]): Point[] {
    const result: Point[] = [];
    
    for (let i = 0; i < simplified.length - 1; i++) {
      result.push(simplified[i]);
      
      const segmentLength = this.distance(simplified[i], simplified[i + 1]);
      const maxSegmentLength = 20; // pixels
      
      if (segmentLength > maxSegmentLength) {
        // Add intermediate points from original stroke
        const intermediatePoints = this.findIntermediatePoints(
          simplified[i], 
          simplified[i + 1], 
          original,
          Math.floor(segmentLength / maxSegmentLength)
        );
        result.push(...intermediatePoints);
      }
    }
    
    result.push(simplified[simplified.length - 1]);
    return result;
  }

  private findIntermediatePoints(start: Point, end: Point, original: Point[], count: number): Point[] {
    // Find original points that lie approximately on the line segment
    const intermediates: Point[] = [];
    const tolerance = 5; // pixels
    
    for (const point of original) {
      const distanceToLine = this.perpendicularDistance(point, start, end);
      if (distanceToLine < tolerance) {
        // Check if point is between start and end
        const distToStart = this.distance(point, start);
        const distToEnd = this.distance(point, end);
        const segmentLength = this.distance(start, end);
        
        if (distToStart + distToEnd <= segmentLength + tolerance) {
          intermediates.push(point);
        }
      }
    }
    
    // Sort by distance from start and take the required count
    intermediates.sort((a, b) => this.distance(a, start) - this.distance(b, start));
    
    const step = Math.max(1, Math.floor(intermediates.length / (count + 1)));
    const selected: Point[] = [];
    
    for (let i = step; i < intermediates.length && selected.length < count; i += step) {
      selected.push(intermediates[i]);
    }
    
    return selected;
  }

  /**
   * Detect curves and generate Bezier curves
   */
  private detectAndGenerateCurves(points: Point[], pressures: number[]): BezierCurve[] {
    if (points.length < 4) return [];
    
    const curves: BezierCurve[] = [];
    let i = 0;
    
    while (i < points.length - 3) {
      const segment = points.slice(i, i + 4);
      
      if (this.isCurveSegment(segment)) {
        const curve = this.generateBezierCurve(segment, pressures.slice(i, i + 4));
        curves.push(curve);
        i += 3; // Move by 3 to overlap by 1 point
      } else {
        i++;
      }
    }
    
    return curves;
  }

  private isCurveSegment(points: Point[]): boolean {
    if (points.length < 4) return false;
    
    // Calculate curvature using angles between consecutive segments
    const angles: number[] = [];
    
    for (let i = 0; i < points.length - 2; i++) {
      const v1 = {
        x: points[i + 1].x - points[i].x,
        y: points[i + 1].y - points[i].y
      };
      const v2 = {
        x: points[i + 2].x - points[i + 1].x,
        y: points[i + 2].y - points[i + 1].y
      };
      
      const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
      angles.push(Math.abs(angle));
    }
    
    // Check if total curvature exceeds threshold
    const totalCurvature = angles.reduce((sum, angle) => sum + angle, 0);
    return totalCurvature > this.options.curveDetectionThreshold;
  }

  private generateBezierCurve(points: Point[], pressures: number[]): BezierCurve {
    // Use the 4 points to create a cubic Bezier curve
    const start = points[0];
    const end = points[3];
    
    // Calculate control points using the intermediate points
    const control1 = this.calculateControlPoint(points[0], points[1], points[2], true);
    const control2 = this.calculateControlPoint(points[1], points[2], points[3], false);
    
    return { start, control1, control2, end };
  }

  private calculateControlPoint(p1: Point, p2: Point, p3: Point, isFirst: boolean): Point {
    // Calculate control point for smooth curve
    const tension = 0.3; // Curve tension factor
    
    if (isFirst) {
      return {
        x: p2.x + tension * (p2.x - p1.x),
        y: p2.y + tension * (p2.y - p1.y)
      };
    } else {
      return {
        x: p2.x + tension * (p3.x - p2.x),
        y: p2.y + tension * (p3.y - p2.y)
      };
    }
  }

  /**
   * Extract style information from brush settings
   */
  private extractStyle(brushSettings: any): VectorPath['style'] {
    return {
      stroke: { r: 0, g: 0, b: 0, a: 1 }, // Default black
      fill: { r: 0, g: 0, b: 0, a: 0 },   // No fill
      strokeWidth: brushSettings.size || 1,
      opacity: brushSettings.opacity || 1
    };
  }

  /**
   * Calculate accuracy of vectorization
   */
  private calculateAccuracy(originalStrokes: StrokeData[], vectorPaths: VectorPath[]): number {
    if (originalStrokes.length === 0 || vectorPaths.length === 0) return 0;
    
    let totalAccuracy = 0;
    const minLength = Math.min(originalStrokes.length, vectorPaths.length);
    
    for (let i = 0; i < minLength; i++) {
      const strokeAccuracy = this.calculateStrokeAccuracy(originalStrokes[i], vectorPaths[i]);
      totalAccuracy += strokeAccuracy;
    }
    
    return totalAccuracy / minLength;
  }

  private calculateStrokeAccuracy(original: StrokeData, vector: VectorPath): number {
    // Sample points along the vector path and compare to original
    const sampleCount = Math.min(original.points.length, 100); // Limit sampling
    let totalError = 0;
    
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const originalPoint = this.interpolateOriginalPoint(original.points, t);
      const vectorPoint = this.interpolateVectorPoint(vector, t);
      
      const error = this.distance(originalPoint, vectorPoint);
      totalError += error;
    }
    
    const avgError = totalError / sampleCount;
    const maxAcceptableError = 5; // pixels
    
    return Math.max(0, 1 - (avgError / maxAcceptableError));
  }

  private interpolateOriginalPoint(points: Point[], t: number): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    
    const index = t * (points.length - 1);
    const i = Math.floor(index);
    const fraction = index - i;
    
    if (i >= points.length - 1) return points[points.length - 1];
    
    return {
      x: points[i].x + (points[i + 1].x - points[i].x) * fraction,
      y: points[i].y + (points[i + 1].y - points[i].y) * fraction
    };
  }

  private interpolateVectorPoint(vector: VectorPath, t: number): Point {
    // For simplicity, just interpolate between vector points
    // In a full implementation, this would sample Bezier curves
    return this.interpolateOriginalPoint(vector.points, t);
  }

  /**
   * Update vectorization options
   */
  updateOptions(newOptions: Partial<VectorizationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  getOptions(): VectorizationOptions {
    return { ...this.options };
  }
}