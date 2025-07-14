/**
 * Operational Transform (OT) Implementation for Genshi Studio
 * Handles complex transformations for concurrent editing
 */

import { SyncChange, ChangeType } from './SynchronizationEngine'

// OT Operation types
export enum OTOpType {
  INSERT = 'insert',
  DELETE = 'delete',
  MOVE = 'move',
  MODIFY = 'modify',
  COMPOSITE = 'composite'
}

// Base OT operation
export interface OTOperation {
  type: OTOpType
  position: number | { x: number; y: number }
  length?: number
  data?: any
  operations?: OTOperation[] // For composite operations
  contextId?: string // Identifies the context (e.g., stroke ID, layer ID)
  version?: number
}

// Transform result
export interface TransformResult {
  op1: OTOperation
  op2: OTOperation
  conflict: boolean
}

// OT Statistics
interface OTStats {
  transforms: number
  conflicts: number
  compositions: number
  inversions: number
  averageComplexity: number
}

/**
 * Abstract base class for OT algorithms
 */
abstract class OTAlgorithm {
  abstract transform(op1: OTOperation, op2: OTOperation): TransformResult
  abstract compose(op1: OTOperation, op2: OTOperation): OTOperation
  abstract invert(op: OTOperation): OTOperation | null
  
  protected isInsert(op: OTOperation): boolean {
    return op.type === OTOpType.INSERT
  }
  
  protected isDelete(op: OTOperation): boolean {
    return op.type === OTOpType.DELETE
  }
  
  protected isMove(op: OTOperation): boolean {
    return op.type === OTOpType.MOVE
  }
  
  protected isModify(op: OTOperation): boolean {
    return op.type === OTOpType.MODIFY
  }
}

/**
 * Text OT Algorithm
 * Handles text transformations for code mode
 */
class TextOT extends OTAlgorithm {
  transform(op1: OTOperation, op2: OTOperation): TransformResult {
    const pos1 = op1.position as number
    const pos2 = op2.position as number
    
    if (this.isInsert(op1) && this.isInsert(op2)) {
      if (pos1 < pos2) {
        return {
          op1: op1,
          op2: { ...op2, position: pos2 + (op1.length || 0) },
          conflict: false
        }
      } else if (pos1 > pos2) {
        return {
          op1: { ...op1, position: pos1 + (op2.length || 0) },
          op2: op2,
          conflict: false
        }
      } else {
        // Same position - conflict
        return {
          op1: op1,
          op2: { ...op2, position: pos2 + (op1.length || 0) },
          conflict: true
        }
      }
    }
    
    if (this.isDelete(op1) && this.isDelete(op2)) {
      const end1 = pos1 + (op1.length || 0)
      const end2 = pos2 + (op2.length || 0)
      
      if (end1 <= pos2) {
        return {
          op1: op1,
          op2: { ...op2, position: pos2 - (op1.length || 0) },
          conflict: false
        }
      } else if (end2 <= pos1) {
        return {
          op1: { ...op1, position: pos1 - (op2.length || 0) },
          op2: op2,
          conflict: false
        }
      } else {
        // Overlapping deletes - conflict
        return this.handleOverlappingDeletes(op1, op2)
      }
    }
    
    if (this.isInsert(op1) && this.isDelete(op2)) {
      const end2 = pos2 + (op2.length || 0)
      
      if (pos1 <= pos2) {
        return {
          op1: op1,
          op2: { ...op2, position: pos2 + (op1.length || 0) },
          conflict: false
        }
      } else if (pos1 >= end2) {
        return {
          op1: { ...op1, position: pos1 - (op2.length || 0) },
          op2: op2,
          conflict: false
        }
      } else {
        // Insert within delete range - conflict
        return {
          op1: { ...op1, position: pos2 },
          op2: op2,
          conflict: true
        }
      }
    }
    
    if (this.isDelete(op1) && this.isInsert(op2)) {
      return this.invertTransform(this.transform(op2, op1))
    }
    
    // Default: no transformation needed
    return { op1, op2, conflict: false }
  }
  
  compose(op1: OTOperation, op2: OTOperation): OTOperation {
    const pos1 = op1.position as number
    const pos2 = op2.position as number
    
    if (this.isInsert(op1) && this.isInsert(op2)) {
      if (pos2 <= pos1 + (op1.length || 0)) {
        // Merge adjacent inserts
        return {
          type: OTOpType.INSERT,
          position: Math.min(pos1, pos2),
          length: (op1.length || 0) + (op2.length || 0),
          data: this.mergeData(op1.data, op2.data)
        }
      }
    }
    
    if (this.isDelete(op1) && this.isDelete(op2)) {
      const end1 = pos1 + (op1.length || 0)
      
      if (pos2 >= pos1 && pos2 <= end1) {
        // Merge overlapping deletes
        return {
          type: OTOpType.DELETE,
          position: pos1,
          length: Math.max(end1, pos2 + (op2.length || 0)) - pos1
        }
      }
    }
    
    // Can't compose - return composite operation
    return {
      type: OTOpType.COMPOSITE,
      position: 0,
      operations: [op1, op2]
    }
  }
  
  invert(op: OTOperation): OTOperation | null {
    switch (op.type) {
      case OTOpType.INSERT:
        return {
          type: OTOpType.DELETE,
          position: op.position,
          length: op.length
        }
      case OTOpType.DELETE:
        return {
          type: OTOpType.INSERT,
          position: op.position,
          length: op.length,
          data: op.data // Need original data for proper inversion
        }
      default:
        return null
    }
  }
  
  private handleOverlappingDeletes(op1: OTOperation, op2: OTOperation): TransformResult {
    const pos1 = op1.position as number
    const pos2 = op2.position as number
    const end1 = pos1 + (op1.length || 0)
    const end2 = pos2 + (op2.length || 0)
    
    if (pos1 <= pos2 && end1 >= end2) {
      // op1 contains op2
      return {
        op1: { ...op1, length: (op1.length || 0) - (op2.length || 0) },
        op2: { ...op2, length: 0 }, // No-op
        conflict: false
      }
    } else if (pos2 <= pos1 && end2 >= end1) {
      // op2 contains op1
      return {
        op1: { ...op1, length: 0 }, // No-op
        op2: { ...op2, length: (op2.length || 0) - (op1.length || 0) },
        conflict: false
      }
    } else if (pos1 < pos2) {
      // Partial overlap, op1 starts first
      return {
        op1: { ...op1, length: pos2 - pos1 },
        op2: { ...op2, position: pos1, length: end2 - end1 },
        conflict: false
      }
    } else {
      // Partial overlap, op2 starts first
      return {
        op1: { ...op1, position: pos2, length: end1 - end2 },
        op2: { ...op2, length: pos1 - pos2 },
        conflict: false
      }
    }
  }
  
  private mergeData(data1: any, data2: any): any {
    if (typeof data1 === 'string' && typeof data2 === 'string') {
      return data1 + data2
    }
    return data2 // Default to second data
  }
  
  private invertTransform(result: TransformResult): TransformResult {
    return {
      op1: result.op2,
      op2: result.op1,
      conflict: result.conflict
    }
  }
}

/**
 * Vector Graphics OT Algorithm
 * Handles transformations for draw mode (strokes, shapes)
 */
class VectorOT extends OTAlgorithm {
  transform(op1: OTOperation, op2: OTOperation): TransformResult {
    if (op1.contextId === op2.contextId) {
      // Same context (e.g., same stroke) - potential conflict
      return this.transformSameContext(op1, op2)
    }
    
    // Different contexts - usually no conflict
    if (this.isMove(op1) && this.isMove(op2)) {
      // Both moving different objects - no conflict
      return { op1, op2, conflict: false }
    }
    
    if (this.isModify(op1) && this.isModify(op2)) {
      // Modifying different objects - no conflict
      return { op1, op2, conflict: false }
    }
    
    return { op1, op2, conflict: false }
  }
  
  compose(op1: OTOperation, op2: OTOperation): OTOperation {
    if (op1.contextId !== op2.contextId) {
      // Different contexts - create composite
      return {
        type: OTOpType.COMPOSITE,
        position: { x: 0, y: 0 },
        operations: [op1, op2]
      }
    }
    
    if (this.isMove(op1) && this.isMove(op2)) {
      // Compose moves
      const pos1 = op1.position as { x: number; y: number }
      const pos2 = op2.position as { x: number; y: number }
      
      return {
        type: OTOpType.MOVE,
        position: {
          x: pos1.x + pos2.x,
          y: pos1.y + pos2.y
        },
        contextId: op1.contextId
      }
    }
    
    if (this.isModify(op1) && this.isModify(op2)) {
      // Merge modifications
      return {
        type: OTOpType.MODIFY,
        position: op2.position,
        data: { ...op1.data, ...op2.data },
        contextId: op1.contextId
      }
    }
    
    return {
      type: OTOpType.COMPOSITE,
      position: { x: 0, y: 0 },
      operations: [op1, op2]
    }
  }
  
  invert(op: OTOperation): OTOperation | null {
    switch (op.type) {
      case OTOpType.MOVE:
        const pos = op.position as { x: number; y: number }
        return {
          type: OTOpType.MOVE,
          position: { x: -pos.x, y: -pos.y },
          contextId: op.contextId
        }
      case OTOpType.MODIFY:
        // Need original data to properly invert
        return op.data?.original ? {
          type: OTOpType.MODIFY,
          position: op.position,
          data: op.data.original,
          contextId: op.contextId
        } : null
      default:
        return null
    }
  }
  
  private transformSameContext(op1: OTOperation, op2: OTOperation): TransformResult {
    if (this.isMove(op1) && this.isMove(op2)) {
      // Both moving same object - later operation wins
      return {
        op1: { ...op1, type: OTOpType.COMPOSITE, operations: [] }, // No-op
        op2: op2,
        conflict: true
      }
    }
    
    if (this.isModify(op1) && this.isModify(op2)) {
      // Both modifying same object - merge changes
      return {
        op1: op1,
        op2: {
          ...op2,
          data: this.mergeModifications(op1.data, op2.data)
        },
        conflict: true
      }
    }
    
    return { op1, op2, conflict: true }
  }
  
  private mergeModifications(data1: any, data2: any): any {
    // Intelligent merge of modifications
    const merged: any = { ...data1 }
    
    for (const key in data2) {
      if (key in merged) {
        // Conflict - use custom resolution
        if (key === 'color' || key === 'style') {
          // Visual properties - latest wins
          merged[key] = data2[key]
        } else if (key === 'points' && Array.isArray(merged[key]) && Array.isArray(data2[key])) {
          // Merge point arrays
          merged[key] = this.mergePointArrays(merged[key], data2[key])
        } else {
          merged[key] = data2[key]
        }
      } else {
        merged[key] = data2[key]
      }
    }
    
    return merged
  }
  
  private mergePointArrays(points1: any[], points2: any[]): any[] {
    // Intelligent point array merging for smooth curves
    if (points1.length === 0) return points2
    if (points2.length === 0) return points1
    
    // Check if arrays overlap
    const lastPoint1 = points1[points1.length - 1]
    const firstPoint2 = points2[0]
    
    if (this.pointsEqual(lastPoint1, firstPoint2)) {
      // Remove duplicate point
      return [...points1, ...points2.slice(1)]
    }
    
    return [...points1, ...points2]
  }
  
  private pointsEqual(p1: any, p2: any): boolean {
    return p1.x === p2.x && p1.y === p2.y
  }
}

/**
 * Main Operational Transform manager
 */
export class OperationalTransform {
  private textOT: TextOT
  private vectorOT: VectorOT
  private stats: OTStats
  private operationCache: Map<string, OTOperation> = new Map()
  
  constructor() {
    this.textOT = new TextOT()
    this.vectorOT = new VectorOT()
    this.stats = {
      transforms: 0,
      conflicts: 0,
      compositions: 0,
      inversions: 0,
      averageComplexity: 0
    }
    
    console.log('🔄 Operational Transform system initialized')
  }
  
  /**
   * Transform operations based on change type
   */
  async transformOperations(changes: SyncChange[]): Promise<SyncChange[]> {
    if (changes.length <= 1) return changes
    
    const transformed: SyncChange[] = []
    const operations: Map<string, OTOperation> = new Map()
    
    // Convert changes to OT operations
    for (const change of changes) {
      const op = this.createOTOperation(change)
      operations.set(change.id, op)
    }
    
    // Transform all pairs of operations
    const ids = Array.from(operations.keys())
    
    for (let i = 0; i < ids.length; i++) {
      let op1 = operations.get(ids[i])!
      
      for (let j = i + 1; j < ids.length; j++) {
        const op2 = operations.get(ids[j])!
        const result = this.transform(op1, op2)
        
        if (result.conflict) {
          this.stats.conflicts++
        }
        
        // Update operations with transformed versions
        op1 = result.op1
        operations.set(ids[j], result.op2)
      }
      
      // Convert back to sync change
      const transformedChange = this.applyOTOperation(changes[i], op1)
      transformed.push(transformedChange)
    }
    
    this.stats.transforms += transformed.length
    return transformed
  }
  
  /**
   * Compose two OT operations
   */
  async compose(op1: OTOperation, op2: OTOperation): Promise<OTOperation> {
    this.stats.compositions++
    
    const algorithm = this.getAlgorithmForOperation(op1)
    const composed = algorithm.compose(op1, op2)
    
    // Update complexity metric
    const complexity = this.calculateComplexity(composed)
    this.stats.averageComplexity = 
      (this.stats.averageComplexity * (this.stats.compositions - 1) + complexity) / 
      this.stats.compositions
    
    return composed
  }
  
  /**
   * Invert an OT operation
   */
  async invert(op: OTOperation): Promise<OTOperation | null> {
    this.stats.inversions++
    
    const algorithm = this.getAlgorithmForOperation(op)
    return algorithm.invert(op)
  }
  
  /**
   * Get OT statistics
   */
  getStats(): OTStats {
    return { ...this.stats }
  }
  
  // Private helper methods
  
  private transform(op1: OTOperation, op2: OTOperation): TransformResult {
    const algorithm = this.getAlgorithmForOperation(op1)
    return algorithm.transform(op1, op2)
  }
  
  private getAlgorithmForOperation(op: OTOperation): OTAlgorithm {
    // Determine algorithm based on operation context
    if (op.contextId?.startsWith('code-') || op.contextId?.startsWith('text-')) {
      return this.textOT
    }
    return this.vectorOT
  }
  
  private createOTOperation(change: SyncChange): OTOperation {
    // Check cache first
    const cached = this.operationCache.get(change.id)
    if (cached) return cached
    
    let operation: OTOperation
    
    switch (change.changeType) {
      case ChangeType.STROKE_ADDED:
        operation = {
          type: OTOpType.INSERT,
          position: this.getPositionFromData(change.data),
          data: change.data,
          contextId: `stroke-${change.data.id || change.id}`
        }
        break
        
      case ChangeType.STROKE_MODIFIED:
        operation = {
          type: OTOpType.MODIFY,
          position: this.getPositionFromData(change.data),
          data: change.data,
          contextId: `stroke-${change.data.id || change.id}`
        }
        break
        
      case ChangeType.STROKE_REMOVED:
        operation = {
          type: OTOpType.DELETE,
          position: this.getPositionFromData(change.data),
          contextId: `stroke-${change.data.id || change.id}`
        }
        break
        
      case ChangeType.PARAMETER_CHANGED:
        operation = {
          type: OTOpType.MODIFY,
          position: 0,
          data: change.data,
          contextId: `param-${change.data.parameter || 'global'}`
        }
        break
        
      case ChangeType.CODE_EXECUTED:
        operation = {
          type: OTOpType.INSERT,
          position: change.data.position || 0,
          length: change.data.length || 0,
          data: change.data,
          contextId: `code-${change.sourceMode}`
        }
        break
        
      default:
        operation = {
          type: OTOpType.MODIFY,
          position: 0,
          data: change.data,
          contextId: `${change.changeType}-${change.id}`
        }
    }
    
    // Cache the operation
    this.operationCache.set(change.id, operation)
    
    // Limit cache size
    if (this.operationCache.size > 1000) {
      const firstKey = this.operationCache.keys().next().value
      this.operationCache.delete(firstKey)
    }
    
    return operation
  }
  
  private getPositionFromData(data: any): number | { x: number; y: number } {
    if (data.position !== undefined) {
      return data.position
    }
    
    if (data.x !== undefined && data.y !== undefined) {
      return { x: data.x, y: data.y }
    }
    
    if (data.index !== undefined) {
      return data.index
    }
    
    if (data.points && data.points.length > 0) {
      const firstPoint = data.points[0]
      return { x: firstPoint.x || 0, y: firstPoint.y || 0 }
    }
    
    return 0
  }
  
  private applyOTOperation(change: SyncChange, op: OTOperation): SyncChange {
    const transformed: SyncChange = {
      ...change,
      data: { ...change.data }
    }
    
    // Apply position changes
    if (typeof op.position === 'number') {
      transformed.data.position = op.position
    } else if (op.position && typeof op.position === 'object') {
      transformed.data.x = op.position.x
      transformed.data.y = op.position.y
    }
    
    // Apply data changes
    if (op.data) {
      transformed.data = { ...transformed.data, ...op.data }
    }
    
    // Add OT operation reference
    (transformed as any).otOp = op
    
    return transformed
  }
  
  private calculateComplexity(op: OTOperation): number {
    let complexity = 1
    
    if (op.type === OTOpType.COMPOSITE && op.operations) {
      complexity = op.operations.reduce((sum, subOp) => 
        sum + this.calculateComplexity(subOp), 0)
    }
    
    if (op.data) {
      // Add complexity based on data size
      const dataStr = JSON.stringify(op.data)
      complexity += Math.log2(dataStr.length + 1)
    }
    
    return complexity
  }
}

// Export types
export type { TransformResult, OTStats }