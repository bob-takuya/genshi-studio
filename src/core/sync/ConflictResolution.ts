/**
 * Conflict Resolution System for Genshi Studio Synchronization Engine
 * Handles conflicts when multiple changes affect the same artwork simultaneously
 */

import { SyncChange, ModeType, ChangeType, SyncPriority, ConflictResolution } from './SynchronizationEngine'

export enum ConflictType {
  CONCURRENT_EDIT = 'concurrent_edit',           // Multiple users editing same element
  MODE_MISMATCH = 'mode_mismatch',              // Conflicting interpretations between modes
  TEMPORAL_CONFLICT = 'temporal_conflict',       // Changes arrived out of order
  DATA_CORRUPTION = 'data_corruption',          // Corrupted or invalid change data
  RESOURCE_CONFLICT = 'resource_conflict',      // Competition for shared resources
  USER_PREFERENCE = 'user_preference'           // User explicitly chose conflicting option
}

export interface ConflictContext {
  conflictType: ConflictType
  affectedModes: ModeType[]
  priority: 'critical' | 'warning' | 'info'
  userNotification: boolean
  autoResolvable: boolean
  timestamp: number
}

export interface ConflictStrategy {
  name: string
  description: string
  applies: (changes: SyncChange[]) => boolean
  resolve: (changes: SyncChange[], context?: ConflictContext) => ConflictResolution
  weight: number // Higher weight = higher priority
}

/**
 * Conflict Resolution Engine
 * Manages and resolves conflicts between synchronization changes
 */
export class ConflictResolutionEngine {
  private strategies: ConflictStrategy[] = []
  private resolutionHistory: ConflictResolution[] = []
  private userPreferences: Map<string, any> = new Map()
  private conflictCallbacks: Map<ConflictType, Function[]> = new Map()
  
  constructor() {
    this.initializeDefaultStrategies()
    console.log('⚖️ ConflictResolutionEngine initialized')
  }
  
  /**
   * Register a conflict resolution strategy
   */
  public registerStrategy(strategy: ConflictStrategy): void {
    this.strategies.push(strategy)
    // Sort by weight (higher weight first)
    this.strategies.sort((a, b) => b.weight - a.weight)
    console.log(`⚖️ Registered conflict strategy: ${strategy.name}`)
  }
  
  /**
   * Register callback for specific conflict types
   */
  public onConflict(conflictType: ConflictType, callback: Function): void {
    if (!this.conflictCallbacks.has(conflictType)) {
      this.conflictCallbacks.set(conflictType, [])
    }
    this.conflictCallbacks.get(conflictType)!.push(callback)
  }
  
  /**
   * Set user preference for conflict resolution
   */
  public setUserPreference(key: string, value: any): void {
    this.userPreferences.set(key, value)
  }
  
  /**
   * Resolve conflicts between multiple changes
   */
  public resolveConflicts(changes: SyncChange[]): ConflictResolution {
    if (changes.length <= 1) {
      // No conflict with single change
      return {
        strategy: 'no_conflict',
        reason: 'Single change, no conflict to resolve',
        appliedChange: changes[0],
        rejectedChanges: []
      }
    }
    
    // Analyze conflict context
    const context = this.analyzeConflictContext(changes)
    
    // Find applicable strategy
    const strategy = this.findBestStrategy(changes)
    
    if (!strategy) {
      // Fallback to default resolution
      return this.defaultResolution(changes, context)
    }
    
    // Apply strategy
    const resolution = strategy.resolve(changes, context)
    
    // Store resolution history
    this.resolutionHistory.push(resolution)
    
    // Notify callbacks
    this.notifyConflictCallbacks(context, resolution)
    
    console.log(`⚖️ Conflict resolved using strategy: ${strategy.name}`, {
      appliedChangeId: resolution.appliedChange.id,
      rejectedCount: resolution.rejectedChanges.length
    })
    
    return resolution
  }
  
  /**
   * Get conflict resolution history
   */
  public getResolutionHistory(limit: number = 50): ConflictResolution[] {
    return this.resolutionHistory.slice(-limit)
  }
  
  /**
   * Clear resolution history
   */
  public clearHistory(): void {
    this.resolutionHistory = []
  }
  
  /**
   * Get conflict statistics
   */
  public getConflictStats(): {
    totalConflicts: number
    strategiesUsed: Record<string, number>
    conflictTypes: Record<ConflictType, number>
    resolutionRate: number
  } {
    const totalConflicts = this.resolutionHistory.length
    
    const strategiesUsed: Record<string, number> = {}
    const conflictTypes: Record<ConflictType, number> = {}
    
    for (const resolution of this.resolutionHistory) {
      strategiesUsed[resolution.strategy] = (strategiesUsed[resolution.strategy] || 0) + 1
    }
    
    // Calculate resolution rate (successful auto-resolutions)
    const autoResolved = this.resolutionHistory.filter(r => 
      r.strategy !== 'user_manual' && r.appliedChange !== null
    ).length
    
    const resolutionRate = totalConflicts > 0 ? autoResolved / totalConflicts : 1
    
    return {
      totalConflicts,
      strategiesUsed,
      conflictTypes,
      resolutionRate
    }
  }
  
  // Private methods
  
  private initializeDefaultStrategies(): void {
    // Strategy 1: User Action Priority
    this.registerStrategy({
      name: 'user_action_priority',
      description: 'Prioritize direct user actions over automatic updates',
      weight: 100,
      applies: (changes) => changes.some(c => c.priority === SyncPriority.USER_ACTION),
      resolve: (changes) => {
        const userChanges = changes.filter(c => c.priority === SyncPriority.USER_ACTION)
        const appliedChange = userChanges.length > 0 ? 
          this.selectLatestChange(userChanges) : changes[0]
        
        return {
          strategy: 'user_action_priority',
          reason: 'User actions take priority over automatic updates',
          appliedChange,
          rejectedChanges: changes.filter(c => c.id !== appliedChange.id)
        }
      }
    })
    
    // Strategy 2: Temporal Resolution (Latest Wins)
    this.registerStrategy({
      name: 'latest_wins',
      description: 'Apply the most recent change',
      weight: 50,
      applies: (changes) => changes.length > 1,
      resolve: (changes) => {
        const latestChange = this.selectLatestChange(changes)
        
        return {
          strategy: 'latest_wins',
          reason: 'Applied most recent change',
          appliedChange: latestChange,
          rejectedChanges: changes.filter(c => c.id !== latestChange.id)
        }
      }
    })
    
    // Strategy 3: Mode-Specific Priority
    this.registerStrategy({
      name: 'mode_priority',
      description: 'Prioritize changes from specific modes based on context',
      weight: 75,
      applies: (changes) => this.hasModeSpecificPriority(changes),
      resolve: (changes) => {
        const prioritizedChange = this.selectByModePriority(changes)
        
        return {
          strategy: 'mode_priority',
          reason: `Prioritized ${prioritizedChange.sourceMode} mode change`,
          appliedChange: prioritizedChange,
          rejectedChanges: changes.filter(c => c.id !== prioritizedChange.id)
        }
      }
    })
    
    // Strategy 4: Smart Merge
    this.registerStrategy({
      name: 'smart_merge',
      description: 'Attempt to merge compatible changes',
      weight: 90,
      applies: (changes) => this.areChangesMergeable(changes),
      resolve: (changes) => {
        const mergedChange = this.mergeCompatibleChanges(changes)
        
        return {
          strategy: 'smart_merge',
          reason: 'Successfully merged compatible changes',
          appliedChange: mergedChange,
          rejectedChanges: []
        }
      }
    })
    
    // Strategy 5: Rollback on Corruption
    this.registerStrategy({
      name: 'rollback_corruption',
      description: 'Rollback changes when data corruption is detected',
      weight: 200, // Highest priority
      applies: (changes) => changes.some(c => this.isDataCorrupted(c)),
      resolve: (changes) => {
        const validChanges = changes.filter(c => !this.isDataCorrupted(c))
        const appliedChange = validChanges.length > 0 ? validChanges[0] : changes[0]
        
        return {
          strategy: 'rollback_corruption',
          reason: 'Rolled back due to data corruption detected',
          appliedChange,
          rejectedChanges: changes.filter(c => this.isDataCorrupted(c))
        }
      }
    })
    
    // Strategy 6: User Preference Based
    this.registerStrategy({
      name: 'user_preference',
      description: 'Apply resolution based on user preferences',
      weight: 85,
      applies: (changes) => this.hasUserPreferenceFor(changes),
      resolve: (changes) => {
        const preferredChange = this.selectByUserPreference(changes)
        
        return {
          strategy: 'user_preference',
          reason: 'Applied change based on user preferences',
          appliedChange: preferredChange,
          rejectedChanges: changes.filter(c => c.id !== preferredChange.id)
        }
      }
    })
  }
  
  private analyzeConflictContext(changes: SyncChange[]): ConflictContext {
    const affectedModes = [...new Set(changes.map(c => c.sourceMode))]
    const timestamps = changes.map(c => c.timestamp)
    const timeSpread = Math.max(...timestamps) - Math.min(...timestamps)
    
    let conflictType: ConflictType
    let priority: 'critical' | 'warning' | 'info'
    
    // Determine conflict type
    if (changes.some(c => this.isDataCorrupted(c))) {
      conflictType = ConflictType.DATA_CORRUPTION
      priority = 'critical'
    } else if (timeSpread > 10000) { // 10 seconds
      conflictType = ConflictType.TEMPORAL_CONFLICT
      priority = 'warning'
    } else if (affectedModes.length > 2) {
      conflictType = ConflictType.MODE_MISMATCH
      priority = 'warning'
    } else if (changes.some(c => c.priority === SyncPriority.USER_ACTION)) {
      conflictType = ConflictType.CONCURRENT_EDIT
      priority = 'info'
    } else {
      conflictType = ConflictType.RESOURCE_CONFLICT
      priority = 'info'
    }
    
    return {
      conflictType,
      affectedModes,
      priority,
      userNotification: priority === 'critical',
      autoResolvable: priority !== 'critical',
      timestamp: Date.now()
    }
  }
  
  private findBestStrategy(changes: SyncChange[]): ConflictStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.applies(changes)) {
        return strategy
      }
    }
    return null
  }
  
  private defaultResolution(changes: SyncChange[], context: ConflictContext): ConflictResolution {
    // Simple fallback: prioritize user actions, then latest
    const userChanges = changes.filter(c => c.priority === SyncPriority.USER_ACTION)
    const appliedChange = userChanges.length > 0 ? 
      this.selectLatestChange(userChanges) : 
      this.selectLatestChange(changes)
    
    return {
      strategy: 'default_fallback',
      reason: 'Used default conflict resolution strategy',
      appliedChange,
      rejectedChanges: changes.filter(c => c.id !== appliedChange.id)
    }
  }
  
  private selectLatestChange(changes: SyncChange[]): SyncChange {
    return changes.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    )
  }
  
  private hasModeSpecificPriority(changes: SyncChange[]): boolean {
    // Check if there's a clear mode priority based on change types
    const userDrawing = changes.some(c => 
      c.sourceMode === ModeType.DRAW && c.priority === SyncPriority.USER_ACTION
    )
    
    const codeExecution = changes.some(c => 
      c.sourceMode === ModeType.CODE && c.changeType === ChangeType.CODE_EXECUTED
    )
    
    return userDrawing || codeExecution
  }
  
  private selectByModePriority(changes: SyncChange[]): SyncChange {
    // Priority order: User Draw > Code Execution > Parametric > Growth
    const modeWeights = {
      [ModeType.DRAW]: 4,
      [ModeType.CODE]: 3,
      [ModeType.PARAMETRIC]: 2,
      [ModeType.GROWTH]: 1
    }
    
    return changes.reduce((best, current) => {
      const currentWeight = modeWeights[current.sourceMode] || 0
      const bestWeight = modeWeights[best.sourceMode] || 0
      
      // Factor in priority
      const currentScore = currentWeight + (current.priority === SyncPriority.USER_ACTION ? 10 : 0)
      const bestScore = bestWeight + (best.priority === SyncPriority.USER_ACTION ? 10 : 0)
      
      return currentScore > bestScore ? current : best
    })
  }
  
  private areChangesMergeable(changes: SyncChange[]): boolean {
    // Check if changes can be safely merged
    if (changes.length !== 2) return false
    
    const [change1, change2] = changes
    
    // Different modes targeting compatible data
    if (change1.sourceMode !== change2.sourceMode) {
      return this.areModesCompatible(change1.sourceMode, change2.sourceMode)
    }
    
    // Same mode, different change types that don't conflict
    if (change1.changeType !== change2.changeType) {
      return this.areChangeTypesCompatible(change1.changeType, change2.changeType)
    }
    
    return false
  }
  
  private areModesCompatible(mode1: ModeType, mode2: ModeType): boolean {
    // Define which modes can be safely merged
    const compatiblePairs = [
      [ModeType.DRAW, ModeType.PARAMETRIC],
      [ModeType.PARAMETRIC, ModeType.CODE],
      [ModeType.GROWTH, ModeType.DRAW]
    ]
    
    return compatiblePairs.some(([m1, m2]) => 
      (mode1 === m1 && mode2 === m2) || (mode1 === m2 && mode2 === m1)
    )
  }
  
  private areChangeTypesCompatible(type1: ChangeType, type2: ChangeType): boolean {
    // Define which change types can coexist
    const compatibleTypes = [
      [ChangeType.STROKE_ADDED, ChangeType.PARAMETER_CHANGED],
      [ChangeType.PARAMETER_CHANGED, ChangeType.CODE_EXECUTED],
      [ChangeType.GROWTH_UPDATED, ChangeType.STROKE_ADDED]
    ]
    
    return compatibleTypes.some(([t1, t2]) => 
      (type1 === t1 && type2 === t2) || (type1 === t2 && type2 === t1)
    )
  }
  
  private mergeCompatibleChanges(changes: SyncChange[]): SyncChange {
    const [change1, change2] = changes
    
    // Create merged change
    const mergedChange: SyncChange = {
      id: `merged-${change1.id}-${change2.id}`,
      timestamp: Math.max(change1.timestamp, change2.timestamp),
      sourceMode: change1.priority <= change2.priority ? change1.sourceMode : change2.sourceMode,
      changeType: change1.priority <= change2.priority ? change1.changeType : change2.changeType,
      priority: Math.min(change1.priority, change2.priority),
      data: this.mergeChangeData(change1.data, change2.data),
      metadata: {
        mergedFrom: [change1.id, change2.id],
        mergeStrategy: 'smart_merge'
      }
    }
    
    return mergedChange
  }
  
  private mergeChangeData(data1: any, data2: any): any {
    // Smart merge of change data
    if (Array.isArray(data1) && Array.isArray(data2)) {
      return [...data1, ...data2]
    }
    
    if (typeof data1 === 'object' && typeof data2 === 'object') {
      return { ...data1, ...data2 }
    }
    
    // Fallback to latest data
    return data2
  }
  
  private isDataCorrupted(change: SyncChange): boolean {
    // Basic corruption detection
    if (!change.data) return true
    if (change.timestamp <= 0) return true
    if (!change.id || !change.sourceMode) return true
    
    // Type-specific validation
    try {
      switch (change.sourceMode) {
        case ModeType.DRAW:
          return this.validateDrawData(change.data)
        case ModeType.PARAMETRIC:
          return this.validateParametricData(change.data)
        case ModeType.CODE:
          return this.validateCodeData(change.data)
        case ModeType.GROWTH:
          return this.validateGrowthData(change.data)
        default:
          return false
      }
    } catch (error) {
      console.warn('Data validation error:', error)
      return true
    }
  }
  
  private validateDrawData(data: any): boolean {
    if (!data.strokes || !Array.isArray(data.strokes)) return true
    
    return data.strokes.some((stroke: any) => 
      !stroke.id || !stroke.points || !Array.isArray(stroke.points)
    )
  }
  
  private validateParametricData(data: any): boolean {
    if (data.activePattern) {
      const pattern = data.activePattern
      return !pattern.type || !pattern.colors || 
             typeof pattern.size !== 'number' ||
             typeof pattern.density !== 'number'
    }
    return false
  }
  
  private validateCodeData(data: any): boolean {
    return typeof data.code !== 'string'
  }
  
  private validateGrowthData(data: any): boolean {
    return !data.algorithm || !data.settings
  }
  
  private hasUserPreferenceFor(changes: SyncChange[]): boolean {
    // Check if user has set preferences for this type of conflict
    const modeKey = `conflict_preference_${changes[0].sourceMode}`
    return this.userPreferences.has(modeKey)
  }
  
  private selectByUserPreference(changes: SyncChange[]): SyncChange {
    const modeKey = `conflict_preference_${changes[0].sourceMode}`
    const preference = this.userPreferences.get(modeKey)
    
    if (preference === 'latest') {
      return this.selectLatestChange(changes)
    } else if (preference === 'user_action') {
      const userChanges = changes.filter(c => c.priority === SyncPriority.USER_ACTION)
      return userChanges.length > 0 ? userChanges[0] : changes[0]
    }
    
    return changes[0]
  }
  
  private notifyConflictCallbacks(context: ConflictContext, resolution: ConflictResolution): void {
    const callbacks = this.conflictCallbacks.get(context.conflictType) || []
    
    for (const callback of callbacks) {
      try {
        callback(context, resolution)
      } catch (error) {
        console.error('Error in conflict callback:', error)
      }
    }
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolutionEngine()