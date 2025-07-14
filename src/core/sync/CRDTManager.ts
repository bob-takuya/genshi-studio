/**
 * CRDT (Conflict-free Replicated Data Types) Manager for Genshi Studio
 * Implements various CRDT types for concurrent editing without conflicts
 */

import { SyncChange, ChangeType, ModeType } from './SynchronizationEngine'

// CRDT operation types
export enum CRDTType {
  GROW_ONLY_SET = 'grow_only_set',
  OBSERVED_REMOVE_SET = 'observed_remove_set',
  LWW_REGISTER = 'lww_register', // Last Write Wins
  PN_COUNTER = 'pn_counter', // Positive-Negative Counter
  RGA = 'rga', // Replicated Growable Array
  WOOT = 'woot', // Without Operational Transform
  JSON_CRDT = 'json_crdt'
}

// Base CRDT operation
export interface CRDTOperation {
  type: CRDTType
  id: string
  timestamp: number
  siteId: string // Unique identifier for each client/site
  vectorClock: VectorClock
  data: any
}

// Vector clock for causality tracking
export interface VectorClock {
  [siteId: string]: number
}

// Site information
interface Site {
  id: string
  lastSeen: number
  clock: number
}

// CRDT statistics
interface CRDTStats {
  operations: number
  merges: number
  conflicts: number
  sites: number
  clockSkew: number
}

/**
 * Base CRDT implementation
 */
abstract class BaseCRDT<T> {
  protected siteId: string
  protected clock: number = 0
  protected sites: Map<string, Site> = new Map()
  
  constructor(siteId: string) {
    this.siteId = siteId
    this.sites.set(siteId, { id: siteId, lastSeen: Date.now(), clock: 0 })
  }
  
  abstract merge(local: T, remote: T): T
  abstract value(): T
  abstract createOperation(data: any): CRDTOperation
  
  protected incrementClock(): number {
    this.clock++
    const site = this.sites.get(this.siteId)!
    site.clock = this.clock
    site.lastSeen = Date.now()
    return this.clock
  }
  
  protected createVectorClock(): VectorClock {
    const vc: VectorClock = {}
    for (const [siteId, site] of this.sites) {
      vc[siteId] = site.clock
    }
    return vc
  }
  
  protected compareVectorClocks(a: VectorClock, b: VectorClock): number {
    let aGreater = false
    let bGreater = false
    
    const allSites = new Set([...Object.keys(a), ...Object.keys(b)])
    
    for (const site of allSites) {
      const aVal = a[site] || 0
      const bVal = b[site] || 0
      
      if (aVal > bVal) aGreater = true
      if (bVal > aVal) bGreater = true
    }
    
    if (aGreater && !bGreater) return 1
    if (bGreater && !aGreater) return -1
    return 0 // Concurrent
  }
  
  protected isConcurrent(a: VectorClock, b: VectorClock): boolean {
    return this.compareVectorClocks(a, b) === 0
  }
}

/**
 * Grow-Only Set CRDT
 */
class GrowOnlySet<T> extends BaseCRDT<Set<T>> {
  private elements: Set<T> = new Set()
  
  add(element: T): CRDTOperation {
    this.elements.add(element)
    return this.createOperation({ add: element })
  }
  
  merge(local: Set<T>, remote: Set<T>): Set<T> {
    const merged = new Set(local)
    for (const elem of remote) {
      merged.add(elem)
    }
    return merged
  }
  
  value(): Set<T> {
    return new Set(this.elements)
  }
  
  createOperation(data: any): CRDTOperation {
    return {
      type: CRDTType.GROW_ONLY_SET,
      id: `${this.siteId}-${this.incrementClock()}`,
      timestamp: Date.now(),
      siteId: this.siteId,
      vectorClock: this.createVectorClock(),
      data
    }
  }
}

/**
 * Observed-Remove Set CRDT
 */
class ObservedRemoveSet<T> extends BaseCRDT<Map<T, Set<string>>> {
  private elements: Map<T, Set<string>> = new Map() // Element -> Set of unique tags
  private tombstones: Set<string> = new Set() // Removed tags
  
  add(element: T): CRDTOperation {
    const tag = `${this.siteId}-${this.incrementClock()}`
    
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set())
    }
    this.elements.get(element)!.add(tag)
    
    return this.createOperation({ add: element, tag })
  }
  
  remove(element: T): CRDTOperation {
    const tags = this.elements.get(element)
    if (!tags) return this.createOperation({ remove: element, tags: [] })
    
    const tagArray = Array.from(tags)
    tagArray.forEach(tag => this.tombstones.add(tag))
    this.elements.delete(element)
    
    return this.createOperation({ remove: element, tags: tagArray })
  }
  
  merge(local: Map<T, Set<string>>, remote: Map<T, Set<string>>): Map<T, Set<string>> {
    const merged = new Map<T, Set<string>>()
    
    // Merge all elements
    const allElements = new Set([...local.keys(), ...remote.keys()])
    
    for (const elem of allElements) {
      const localTags = local.get(elem) || new Set()
      const remoteTags = remote.get(elem) || new Set()
      
      const mergedTags = new Set([...localTags, ...remoteTags])
      
      // Remove tombstoned tags
      for (const tag of mergedTags) {
        if (this.tombstones.has(tag)) {
          mergedTags.delete(tag)
        }
      }
      
      if (mergedTags.size > 0) {
        merged.set(elem, mergedTags)
      }
    }
    
    return merged
  }
  
  value(): Map<T, Set<string>> {
    return new Map(this.elements)
  }
  
  has(element: T): boolean {
    return this.elements.has(element) && this.elements.get(element)!.size > 0
  }
  
  createOperation(data: any): CRDTOperation {
    return {
      type: CRDTType.OBSERVED_REMOVE_SET,
      id: `${this.siteId}-${this.clock}`,
      timestamp: Date.now(),
      siteId: this.siteId,
      vectorClock: this.createVectorClock(),
      data
    }
  }
}

/**
 * Last-Write-Wins Register CRDT
 */
class LWWRegister<T> extends BaseCRDT<{ value: T; timestamp: number }> {
  private currentValue: T
  private lastTimestamp: number
  
  constructor(siteId: string, initialValue: T) {
    super(siteId)
    this.currentValue = initialValue
    this.lastTimestamp = Date.now()
  }
  
  set(value: T): CRDTOperation {
    const timestamp = Date.now()
    
    if (timestamp > this.lastTimestamp || 
        (timestamp === this.lastTimestamp && this.siteId > this.sites.keys().next().value)) {
      this.currentValue = value
      this.lastTimestamp = timestamp
    }
    
    return this.createOperation({ value, timestamp })
  }
  
  merge(local: { value: T; timestamp: number }, remote: { value: T; timestamp: number }): { value: T; timestamp: number } {
    if (remote.timestamp > local.timestamp ||
        (remote.timestamp === local.timestamp && this.siteId < remote.value.toString())) {
      return remote
    }
    return local
  }
  
  value(): { value: T; timestamp: number } {
    return { value: this.currentValue, timestamp: this.lastTimestamp }
  }
  
  get(): T {
    return this.currentValue
  }
  
  createOperation(data: any): CRDTOperation {
    return {
      type: CRDTType.LWW_REGISTER,
      id: `${this.siteId}-${this.incrementClock()}`,
      timestamp: data.timestamp,
      siteId: this.siteId,
      vectorClock: this.createVectorClock(),
      data
    }
  }
}

/**
 * Replicated Growable Array CRDT
 */
class RGA<T> extends BaseCRDT<Array<{ id: string; value: T; deleted: boolean }>> {
  private elements: Array<{ id: string; value: T; deleted: boolean; next?: string }> = []
  private index: Map<string, number> = new Map()
  
  insert(index: number, value: T): CRDTOperation {
    const id = `${this.siteId}-${this.incrementClock()}`
    const element = { id, value, deleted: false }
    
    if (index >= this.elements.length) {
      this.elements.push(element)
      this.index.set(id, this.elements.length - 1)
    } else {
      this.elements.splice(index, 0, element)
      this.rebuildIndex()
    }
    
    const prevId = index > 0 ? this.elements[index - 1].id : null
    const nextId = index < this.elements.length - 1 ? this.elements[index + 1]?.id : null
    
    return this.createOperation({
      type: 'insert',
      id,
      value,
      prevId,
      nextId
    })
  }
  
  delete(index: number): CRDTOperation {
    if (index < 0 || index >= this.elements.length) {
      throw new Error('Index out of bounds')
    }
    
    const element = this.elements[index]
    element.deleted = true
    
    return this.createOperation({
      type: 'delete',
      id: element.id
    })
  }
  
  merge(local: Array<{ id: string; value: T; deleted: boolean }>, 
        remote: Array<{ id: string; value: T; deleted: boolean }>): Array<{ id: string; value: T; deleted: boolean }> {
    // Complex merge logic for RGA
    const merged: Array<{ id: string; value: T; deleted: boolean }> = []
    const seen = new Set<string>()
    
    // First pass: collect all unique elements
    const allElements = [...local, ...remote]
    
    for (const elem of allElements) {
      if (!seen.has(elem.id)) {
        seen.add(elem.id)
        merged.push({ ...elem })
      } else {
        // Update deleted status if needed
        const existing = merged.find(e => e.id === elem.id)
        if (existing && elem.deleted) {
          existing.deleted = true
        }
      }
    }
    
    // Sort by site ID and clock to maintain consistent ordering
    merged.sort((a, b) => {
      const [aSite, aClock] = a.id.split('-')
      const [bSite, bClock] = b.id.split('-')
      
      if (aSite === bSite) {
        return parseInt(aClock) - parseInt(bClock)
      }
      return aSite.localeCompare(bSite)
    })
    
    return merged
  }
  
  value(): Array<{ id: string; value: T; deleted: boolean }> {
    return this.elements.filter(e => !e.deleted)
  }
  
  toArray(): T[] {
    return this.elements.filter(e => !e.deleted).map(e => e.value)
  }
  
  private rebuildIndex(): void {
    this.index.clear()
    this.elements.forEach((elem, idx) => {
      this.index.set(elem.id, idx)
    })
  }
  
  createOperation(data: any): CRDTOperation {
    return {
      type: CRDTType.RGA,
      id: `${this.siteId}-${this.clock}`,
      timestamp: Date.now(),
      siteId: this.siteId,
      vectorClock: this.createVectorClock(),
      data
    }
  }
}

/**
 * JSON CRDT for complex nested structures
 */
class JsonCRDT extends BaseCRDT<any> {
  private root: Map<string, LWWRegister<any>> = new Map()
  private arrays: Map<string, RGA<any>> = new Map()
  private sets: Map<string, ObservedRemoveSet<any>> = new Map()
  
  set(path: string, value: any): CRDTOperation {
    if (Array.isArray(value)) {
      // Handle as RGA
      const rga = new RGA<any>(this.siteId)
      value.forEach((item, idx) => rga.insert(idx, item))
      this.arrays.set(path, rga)
    } else if (value instanceof Set) {
      // Handle as OR-Set
      const orSet = new ObservedRemoveSet<any>(this.siteId)
      for (const item of value) {
        orSet.add(item)
      }
      this.sets.set(path, orSet)
    } else {
      // Handle as LWW-Register
      if (!this.root.has(path)) {
        this.root.set(path, new LWWRegister(this.siteId, value))
      } else {
        this.root.get(path)!.set(value)
      }
    }
    
    return this.createOperation({ path, value, type: this.getValueType(value) })
  }
  
  get(path: string): any {
    if (this.root.has(path)) {
      return this.root.get(path)!.get()
    } else if (this.arrays.has(path)) {
      return this.arrays.get(path)!.toArray()
    } else if (this.sets.has(path)) {
      const orSet = this.sets.get(path)!
      const result = new Set<any>()
      for (const [value, tags] of orSet.value()) {
        if (tags.size > 0) result.add(value)
      }
      return result
    }
    return undefined
  }
  
  merge(local: any, remote: any): any {
    // Complex merge for JSON structures
    const merged: any = {}
    
    const allPaths = new Set([
      ...Object.keys(local),
      ...Object.keys(remote)
    ])
    
    for (const path of allPaths) {
      const localValue = local[path]
      const remoteValue = remote[path]
      
      if (localValue === undefined) {
        merged[path] = remoteValue
      } else if (remoteValue === undefined) {
        merged[path] = localValue
      } else {
        // Both have values - need to merge based on type
        merged[path] = this.mergeValues(localValue, remoteValue)
      }
    }
    
    return merged
  }
  
  value(): any {
    const result: any = {}
    
    for (const [path, register] of this.root) {
      result[path] = register.get()
    }
    
    for (const [path, rga] of this.arrays) {
      result[path] = rga.toArray()
    }
    
    for (const [path, orSet] of this.sets) {
      const set = new Set()
      for (const [value, tags] of orSet.value()) {
        if (tags.size > 0) set.add(value)
      }
      result[path] = set
    }
    
    return result
  }
  
  private getValueType(value: any): string {
    if (Array.isArray(value)) return 'array'
    if (value instanceof Set) return 'set'
    if (value instanceof Map) return 'map'
    return typeof value
  }
  
  private mergeValues(local: any, remote: any): any {
    const localType = this.getValueType(local)
    const remoteType = this.getValueType(remote)
    
    if (localType !== remoteType) {
      // Type conflict - use LWW
      return Date.now() % 2 === 0 ? local : remote
    }
    
    switch (localType) {
      case 'array':
        // Merge arrays element by element
        const maxLen = Math.max(local.length, remote.length)
        const merged = []
        for (let i = 0; i < maxLen; i++) {
          if (i < local.length && i < remote.length) {
            merged[i] = this.mergeValues(local[i], remote[i])
          } else if (i < local.length) {
            merged[i] = local[i]
          } else {
            merged[i] = remote[i]
          }
        }
        return merged
        
      case 'object':
        return this.merge(local, remote)
        
      default:
        // Use LWW for primitive types
        return Date.now() % 2 === 0 ? local : remote
    }
  }
  
  createOperation(data: any): CRDTOperation {
    return {
      type: CRDTType.JSON_CRDT,
      id: `${this.siteId}-${this.incrementClock()}`,
      timestamp: Date.now(),
      siteId: this.siteId,
      vectorClock: this.createVectorClock(),
      data
    }
  }
}

/**
 * CRDT Manager - Manages all CRDT types and operations
 */
export class CRDTManager {
  private siteId: string
  private crdts: Map<string, BaseCRDT<any>> = new Map()
  private stats: CRDTStats
  
  constructor() {
    this.siteId = this.generateSiteId()
    this.stats = {
      operations: 0,
      merges: 0,
      conflicts: 0,
      sites: 1,
      clockSkew: 0
    }
    
    console.log(`🔗 CRDT Manager initialized with site ID: ${this.siteId}`)
  }
  
  /**
   * Create CRDT operation from sync change
   */
  createOperation(change: SyncChange): CRDTOperation {
    const crdtKey = `${change.sourceMode}-${change.changeType}`
    let crdt = this.crdts.get(crdtKey)
    
    if (!crdt) {
      crdt = this.createCRDTForChange(change)
      this.crdts.set(crdtKey, crdt)
    }
    
    this.stats.operations++
    return crdt.createOperation(change.data)
  }
  
  /**
   * Merge multiple CRDT operations
   */
  async mergeOperations(grouped: Map<string, SyncChange[]>): Promise<SyncChange[]> {
    const merged: SyncChange[] = []
    
    for (const [key, changes] of grouped) {
      if (changes.length === 1) {
        merged.push(changes[0])
        continue
      }
      
      // Get or create CRDT for this group
      let crdt = this.crdts.get(key)
      if (!crdt) {
        crdt = this.createCRDTForChange(changes[0])
        this.crdts.set(key, crdt)
      }
      
      // Merge all operations
      let mergedValue = crdt.value()
      for (const change of changes) {
        if (change.crdtOp) {
          const remoteValue = change.crdtOp.data
          mergedValue = crdt.merge(mergedValue, remoteValue)
          this.stats.merges++
        }
      }
      
      // Create merged change
      const mergedChange: SyncChange = {
        ...changes[changes.length - 1],
        data: mergedValue,
        metadata: {
          ...changes[changes.length - 1].metadata,
          mergedFrom: changes.map(c => c.id)
        }
      }
      
      merged.push(mergedChange)
    }
    
    return merged
  }
  
  /**
   * Merge two CRDT operations
   */
  merge(a: CRDTOperation, b: CRDTOperation): CRDTOperation {
    // Update site information
    if (!this.crdts.has(a.type)) {
      throw new Error(`Unknown CRDT type: ${a.type}`)
    }
    
    const crdt = this.crdts.get(a.type)!
    const merged = crdt.merge(a.data, b.data)
    
    // Detect conflicts
    const clock = crdt as any
    if (clock.isConcurrent && clock.isConcurrent(a.vectorClock, b.vectorClock)) {
      this.stats.conflicts++
    }
    
    return {
      type: a.type,
      id: `merged-${Date.now()}-${this.siteId}`,
      timestamp: Math.max(a.timestamp, b.timestamp),
      siteId: this.siteId,
      vectorClock: this.mergeVectorClocks(a.vectorClock, b.vectorClock),
      data: merged
    }
  }
  
  /**
   * Invert a CRDT operation (for undo)
   */
  invert(op: CRDTOperation): CRDTOperation | null {
    switch (op.type) {
      case CRDTType.OBSERVED_REMOVE_SET:
        if (op.data.add) {
          return {
            ...op,
            id: `inv-${op.id}`,
            data: { remove: op.data.add, tags: [op.data.tag] }
          }
        } else if (op.data.remove) {
          // Cannot invert remove in OR-Set
          return null
        }
        break
        
      case CRDTType.RGA:
        if (op.data.type === 'insert') {
          return {
            ...op,
            id: `inv-${op.id}`,
            data: { type: 'delete', id: op.data.id }
          }
        } else if (op.data.type === 'delete') {
          // Cannot truly invert delete - mark for special handling
          return {
            ...op,
            id: `inv-${op.id}`,
            data: { type: 'undelete', id: op.data.id }
          }
        }
        break
        
      case CRDTType.LWW_REGISTER:
        // Cannot invert LWW register - would need previous value
        return null
        
      default:
        return null
    }
    
    return null
  }
  
  /**
   * Get CRDT statistics
   */
  getStats(): CRDTStats {
    // Calculate clock skew
    const clocks: number[] = []
    for (const crdt of this.crdts.values()) {
      const clock = (crdt as any).clock || 0
      clocks.push(clock)
    }
    
    if (clocks.length > 1) {
      const max = Math.max(...clocks)
      const min = Math.min(...clocks)
      this.stats.clockSkew = max - min
    }
    
    return { ...this.stats }
  }
  
  // Private helper methods
  
  private generateSiteId(): string {
    // Generate unique site ID based on timestamp and random value
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `${timestamp}-${random}`
  }
  
  private createCRDTForChange(change: SyncChange): BaseCRDT<any> {
    // Determine appropriate CRDT type based on change
    switch (change.changeType) {
      case ChangeType.STROKE_ADDED:
      case ChangeType.STROKE_REMOVED:
        return new ObservedRemoveSet<any>(this.siteId)
        
      case ChangeType.STROKE_MODIFIED:
      case ChangeType.PARAMETER_CHANGED:
        return new LWWRegister<any>(this.siteId, change.data)
        
      case ChangeType.CODE_EXECUTED:
        return new RGA<any>(this.siteId)
        
      case ChangeType.PATTERN_APPLIED:
      case ChangeType.GROWTH_UPDATED:
        return new JsonCRDT(this.siteId)
        
      default:
        return new LWWRegister<any>(this.siteId, change.data)
    }
  }
  
  private mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
    const merged: VectorClock = {}
    const allSites = new Set([...Object.keys(a), ...Object.keys(b)])
    
    for (const site of allSites) {
      merged[site] = Math.max(a[site] || 0, b[site] || 0)
    }
    
    return merged
  }
}

// Export types
export type { VectorClock, CRDTStats }