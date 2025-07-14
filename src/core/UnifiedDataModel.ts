/**
 * Unified Data Model for Multi-Mode Canvas
 * Enables cross-mode translation and synchronization between Draw, Parametric, Code, and Growth modes
 */

import { Point, Color, Rectangle } from '../types/graphics';

export enum DataNodeType {
  // Draw mode types
  STROKE = 'stroke',
  PATH = 'path',
  SHAPE = 'shape',
  
  // Parametric mode types
  PARAMETER = 'parameter',
  EQUATION = 'equation',
  CONSTRAINT = 'constraint',
  
  // Code mode types
  FUNCTION = 'function',
  VARIABLE = 'variable',
  EXPRESSION = 'expression',
  
  // Growth mode types
  SEED = 'seed',
  RULE = 'rule',
  BRANCH = 'branch',
  
  // Common types
  GROUP = 'group',
  COMPOSITE = 'composite',
  REFERENCE = 'reference'
}

export interface DataNode {
  id: string;
  type: DataNodeType;
  mode: string; // Origin mode
  timestamp: number;
  metadata: NodeMetadata;
  data: NodeData;
  children?: DataNode[];
  parent?: string;
  connections?: NodeConnection[];
  translations?: ModeTranslation[];
}

export interface NodeMetadata {
  name?: string;
  description?: string;
  tags?: string[];
  version: number;
  author?: string;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
}

export interface NodeData {
  // Common properties
  bounds?: Rectangle;
  transform?: Transform;
  style?: StyleProperties;
  
  // Mode-specific data
  strokeData?: StrokeData;
  parametricData?: ParametricData;
  codeData?: CodeData;
  growthData?: GrowthData;
  
  // Computed properties
  cachedGeometry?: any;
  cachedRender?: ImageData;
}

export interface Transform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  origin?: Point;
}

export interface StyleProperties {
  fillColor?: Color;
  strokeColor?: Color;
  strokeWidth?: number;
  opacity?: number;
  blendMode?: string;
  filters?: string[];
}

// Draw mode data structures
export interface StrokeData {
  points: StrokePoint[];
  smoothing?: number;
  closed?: boolean;
  pressure?: boolean;
  velocity?: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  time?: number;
}

// Parametric mode data structures
export interface ParametricData {
  type: 'formula' | 'geometric' | 'fractal' | 'wave';
  parameters: Parameter[];
  equations?: Equation[];
  constraints?: Constraint[];
  bounds: Rectangle;
}

export interface Parameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  expression?: string; // For computed parameters
}

export interface Equation {
  id: string;
  expression: string;
  variables: string[];
  output: 'x' | 'y' | 'radius' | 'angle' | 'color' | 'size';
}

export interface Constraint {
  type: 'range' | 'relationship' | 'symmetry';
  expression: string;
  priority?: number;
}

// Code mode data structures
export interface CodeData {
  nodeType: 'input' | 'process' | 'output' | 'control';
  code?: string;
  inputs?: CodePort[];
  outputs?: CodePort[];
  state?: any;
  executionOrder?: number;
}

export interface CodePort {
  id: string;
  name: string;
  type: string; // 'number' | 'vector' | 'color' | 'geometry' | 'any'
  value?: any;
  connected?: boolean;
  connectionId?: string;
}

// Growth mode data structures
export interface GrowthData {
  type: 'lsystem' | 'cellular' | 'reaction' | 'physics';
  rules?: GrowthRule[];
  seed?: GrowthSeed;
  iteration?: number;
  parameters?: GrowthParameter[];
}

export interface GrowthRule {
  id: string;
  symbol: string;
  replacement: string;
  probability?: number;
  condition?: string;
  actions?: GrowthAction[];
}

export interface GrowthSeed {
  position: Point;
  direction?: number;
  energy?: number;
  attributes?: Record<string, any>;
}

export interface GrowthAction {
  type: 'move' | 'turn' | 'branch' | 'scale' | 'color';
  value: number | string;
  relative?: boolean;
}

export interface GrowthParameter {
  name: string;
  value: number;
  influence: 'angle' | 'length' | 'thickness' | 'color' | 'probability';
}

// Node connections for graph-like structures
export interface NodeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: string;
  targetPort?: string;
  type?: 'data' | 'control' | 'reference';
  metadata?: any;
}

// Cross-mode translation
export interface ModeTranslation {
  targetMode: string;
  targetNodeId?: string;
  confidence: number; // 0-1, how well the translation preserves intent
  lossless: boolean;
  mapping: TranslationMapping;
}

export interface TranslationMapping {
  properties: Record<string, string>; // source property -> target property
  transforms?: TransformFunction[];
  constraints?: string[];
}

export interface TransformFunction {
  name: string;
  parameters: any;
  inverse?: TransformFunction;
}

// Unified data model class
export class UnifiedDataModel {
  private nodes: Map<string, DataNode> = new Map();
  private rootNodes: Set<string> = new Set();
  private modeIndices: Map<string, Set<string>> = new Map();
  private connectionGraph: Map<string, Set<string>> = new Map();
  private translationCache: Map<string, ModeTranslation[]> = new Map();
  
  constructor() {
    // Initialize mode indices
    ['draw', 'parametric', 'code', 'growth'].forEach(mode => {
      this.modeIndices.set(mode, new Set());
    });
  }
  
  // Node management
  addNode(node: DataNode): void {
    this.nodes.set(node.id, node);
    
    // Update indices
    if (!node.parent) {
      this.rootNodes.add(node.id);
    }
    
    const modeNodes = this.modeIndices.get(node.mode);
    if (modeNodes) {
      modeNodes.add(node.id);
    }
    
    // Update connection graph
    if (node.connections) {
      node.connections.forEach(conn => {
        this.addConnection(conn);
      });
    }
  }
  
  updateNode(id: string, updates: Partial<DataNode>): void {
    const node = this.nodes.get(id);
    if (!node) return;
    
    // Merge updates
    Object.assign(node, updates);
    node.metadata.version++;
    node.timestamp = Date.now();
    
    // Invalidate translation cache
    this.translationCache.delete(id);
  }
  
  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;
    
    // Remove from indices
    this.rootNodes.delete(id);
    const modeNodes = this.modeIndices.get(node.mode);
    if (modeNodes) {
      modeNodes.delete(id);
    }
    
    // Remove connections
    this.connectionGraph.delete(id);
    this.connectionGraph.forEach(connections => {
      connections.delete(id);
    });
    
    // Remove from parent's children
    if (node.parent) {
      const parent = this.nodes.get(node.parent);
      if (parent && parent.children) {
        parent.children = parent.children.filter(child => child.id !== id);
      }
    }
    
    // Remove node
    this.nodes.delete(id);
    this.translationCache.delete(id);
  }
  
  getNode(id: string): DataNode | undefined {
    return this.nodes.get(id);
  }
  
  getNodesByMode(mode: string): DataNode[] {
    const nodeIds = this.modeIndices.get(mode);
    if (!nodeIds) return [];
    
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter(node => node !== undefined) as DataNode[];
  }
  
  // Connection management
  addConnection(connection: NodeConnection): void {
    let sourceConnections = this.connectionGraph.get(connection.sourceId);
    if (!sourceConnections) {
      sourceConnections = new Set();
      this.connectionGraph.set(connection.sourceId, sourceConnections);
    }
    sourceConnections.add(connection.targetId);
  }
  
  removeConnection(sourceId: string, targetId: string): void {
    const connections = this.connectionGraph.get(sourceId);
    if (connections) {
      connections.delete(targetId);
    }
  }
  
  getConnections(nodeId: string): string[] {
    const connections = this.connectionGraph.get(nodeId);
    return connections ? Array.from(connections) : [];
  }
  
  // Translation methods
  translateNode(nodeId: string, targetMode: string): DataNode | null {
    const sourceNode = this.nodes.get(nodeId);
    if (!sourceNode) return null;
    
    // Check cache
    const cached = this.translationCache.get(nodeId);
    if (cached) {
      const existing = cached.find(t => t.targetMode === targetMode);
      if (existing && existing.targetNodeId) {
        return this.nodes.get(existing.targetNodeId) || null;
      }
    }
    
    // Perform translation
    const translator = this.getTranslator(sourceNode.mode, targetMode);
    if (!translator) return null;
    
    const translatedNode = translator(sourceNode);
    if (translatedNode) {
      this.addNode(translatedNode);
      
      // Cache translation
      const translation: ModeTranslation = {
        targetMode,
        targetNodeId: translatedNode.id,
        confidence: this.calculateTranslationConfidence(sourceNode, translatedNode),
        lossless: this.isLosslessTranslation(sourceNode, translatedNode),
        mapping: this.generateTranslationMapping(sourceNode, translatedNode)
      };
      
      if (!sourceNode.translations) {
        sourceNode.translations = [];
      }
      sourceNode.translations.push(translation);
      
      // Update cache
      if (!cached) {
        this.translationCache.set(nodeId, [translation]);
      } else {
        cached.push(translation);
      }
    }
    
    return translatedNode;
  }
  
  private getTranslator(sourceMode: string, targetMode: string): ((node: DataNode) => DataNode | null) | null {
    // This would be implemented with specific translation logic for each mode pair
    // For now, returning a simple stub
    return (node: DataNode) => {
      const translated: DataNode = {
        id: `${node.id}_${targetMode}`,
        type: this.mapNodeType(node.type, targetMode),
        mode: targetMode,
        timestamp: Date.now(),
        metadata: { ...node.metadata, version: 1 },
        data: this.translateNodeData(node.data, sourceMode, targetMode)
      };
      return translated;
    };
  }
  
  private mapNodeType(sourceType: DataNodeType, targetMode: string): DataNodeType {
    // Map node types between modes
    const typeMap: Record<string, Record<DataNodeType, DataNodeType>> = {
      'draw-parametric': {
        [DataNodeType.STROKE]: DataNodeType.EQUATION,
        [DataNodeType.PATH]: DataNodeType.EQUATION,
        [DataNodeType.SHAPE]: DataNodeType.PARAMETER
      },
      'parametric-code': {
        [DataNodeType.EQUATION]: DataNodeType.FUNCTION,
        [DataNodeType.PARAMETER]: DataNodeType.VARIABLE,
        [DataNodeType.CONSTRAINT]: DataNodeType.EXPRESSION
      },
      'code-growth': {
        [DataNodeType.FUNCTION]: DataNodeType.RULE,
        [DataNodeType.VARIABLE]: DataNodeType.PARAMETER,
        [DataNodeType.EXPRESSION]: DataNodeType.SEED
      },
      'growth-draw': {
        [DataNodeType.BRANCH]: DataNodeType.PATH,
        [DataNodeType.SEED]: DataNodeType.STROKE,
        [DataNodeType.RULE]: DataNodeType.SHAPE
      }
    };
    
    const key = `${sourceType}-${targetMode}`;
    return typeMap[key]?.[sourceType] || DataNodeType.COMPOSITE;
  }
  
  private translateNodeData(data: NodeData, sourceMode: string, targetMode: string): NodeData {
    const translated: NodeData = {
      bounds: data.bounds,
      transform: data.transform,
      style: data.style
    };
    
    // Add mode-specific translation logic here
    // This is a simplified version
    switch (targetMode) {
      case 'parametric':
        translated.parametricData = this.convertToParametric(data, sourceMode);
        break;
      case 'code':
        translated.codeData = this.convertToCode(data, sourceMode);
        break;
      case 'growth':
        translated.growthData = this.convertToGrowth(data, sourceMode);
        break;
      case 'draw':
        translated.strokeData = this.convertToStroke(data, sourceMode);
        break;
    }
    
    return translated;
  }
  
  private convertToParametric(data: NodeData, sourceMode: string): ParametricData {
    // Stub implementation
    return {
      type: 'geometric',
      parameters: [],
      bounds: data.bounds || { x: 0, y: 0, width: 100, height: 100 }
    };
  }
  
  private convertToCode(data: NodeData, sourceMode: string): CodeData {
    // Stub implementation
    return {
      nodeType: 'process',
      inputs: [],
      outputs: []
    };
  }
  
  private convertToGrowth(data: NodeData, sourceMode: string): GrowthData {
    // Stub implementation
    return {
      type: 'lsystem',
      rules: [],
      iteration: 0
    };
  }
  
  private convertToStroke(data: NodeData, sourceMode: string): StrokeData {
    // Stub implementation
    return {
      points: [],
      smoothing: 0.5
    };
  }
  
  private calculateTranslationConfidence(source: DataNode, target: DataNode): number {
    // Calculate how well the translation preserves the original intent
    // This is a simplified calculation
    let confidence = 0.5; // Base confidence
    
    // Check if bounds are preserved
    if (source.data.bounds && target.data.bounds) {
      const boundsMatch = 
        Math.abs(source.data.bounds.width - target.data.bounds.width) < 1 &&
        Math.abs(source.data.bounds.height - target.data.bounds.height) < 1;
      if (boundsMatch) confidence += 0.2;
    }
    
    // Check if style is preserved
    if (source.data.style && target.data.style) {
      if (source.data.style.fillColor === target.data.style.fillColor) confidence += 0.1;
      if (source.data.style.strokeColor === target.data.style.strokeColor) confidence += 0.1;
    }
    
    // Check if transform is preserved
    if (source.data.transform && target.data.transform) {
      const transformMatch = 
        source.data.transform.scaleX === target.data.transform.scaleX &&
        source.data.transform.scaleY === target.data.transform.scaleY;
      if (transformMatch) confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  private isLosslessTranslation(source: DataNode, target: DataNode): boolean {
    // Determine if the translation can be reversed without loss
    // This is mode-pair specific
    const losslessPairs = [
      ['parametric', 'code'],
      ['code', 'parametric'],
      ['draw', 'growth'], // When using vector data
    ];
    
    return losslessPairs.some(pair => 
      (pair[0] === source.mode && pair[1] === target.mode) ||
      (pair[1] === source.mode && pair[0] === target.mode)
    );
  }
  
  private generateTranslationMapping(source: DataNode, target: DataNode): TranslationMapping {
    // Generate property mapping between nodes
    return {
      properties: {
        'bounds': 'bounds',
        'transform': 'transform',
        'style': 'style'
      },
      transforms: [],
      constraints: []
    };
  }
  
  // Querying methods
  findNodesByType(type: DataNodeType): DataNode[] {
    return Array.from(this.nodes.values()).filter(node => node.type === type);
  }
  
  findNodesByTag(tag: string): DataNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      node.metadata.tags?.includes(tag)
    );
  }
  
  findConnectedNodes(nodeId: string, depth: number = 1): DataNode[] {
    const visited = new Set<string>();
    const result: DataNode[] = [];
    
    const traverse = (id: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(id)) return;
      visited.add(id);
      
      const node = this.nodes.get(id);
      if (node && id !== nodeId) {
        result.push(node);
      }
      
      const connections = this.connectionGraph.get(id);
      if (connections) {
        connections.forEach(connectedId => {
          traverse(connectedId, currentDepth + 1);
        });
      }
    };
    
    traverse(nodeId, 0);
    return result;
  }
  
  // Serialization
  serialize(): string {
    const data = {
      nodes: Array.from(this.nodes.entries()),
      rootNodes: Array.from(this.rootNodes),
      connectionGraph: Array.from(this.connectionGraph.entries()).map(([key, value]) => [key, Array.from(value)])
    };
    return JSON.stringify(data);
  }
  
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    
    // Clear existing data
    this.nodes.clear();
    this.rootNodes.clear();
    this.connectionGraph.clear();
    this.modeIndices.forEach(index => index.clear());
    
    // Restore nodes
    parsed.nodes.forEach(([id, node]: [string, DataNode]) => {
      this.nodes.set(id, node);
      
      if (!node.parent) {
        this.rootNodes.add(id);
      }
      
      const modeNodes = this.modeIndices.get(node.mode);
      if (modeNodes) {
        modeNodes.add(id);
      }
    });
    
    // Restore connections
    parsed.connectionGraph.forEach(([source, targets]: [string, string[]]) => {
      this.connectionGraph.set(source, new Set(targets));
    });
  }
  
  // Utility methods
  generateNodeId(mode: string, type: DataNodeType): string {
    return `${mode}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  clear(): void {
    this.nodes.clear();
    this.rootNodes.clear();
    this.connectionGraph.clear();
    this.translationCache.clear();
    this.modeIndices.forEach(index => index.clear());
  }
  
  getStatistics(): {
    totalNodes: number;
    nodesByMode: Record<string, number>;
    nodesByType: Record<string, number>;
    connections: number;
    translations: number;
  } {
    const stats = {
      totalNodes: this.nodes.size,
      nodesByMode: {} as Record<string, number>,
      nodesByType: {} as Record<string, number>,
      connections: 0,
      translations: 0
    };
    
    // Count by mode
    this.modeIndices.forEach((nodes, mode) => {
      stats.nodesByMode[mode] = nodes.size;
    });
    
    // Count by type and translations
    this.nodes.forEach(node => {
      stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
      stats.translations += node.translations?.length || 0;
    });
    
    // Count connections
    this.connectionGraph.forEach(connections => {
      stats.connections += connections.size;
    });
    
    return stats;
  }
}

// Global instance for the application
export const unifiedDataModel = new UnifiedDataModel();