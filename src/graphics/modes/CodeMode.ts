/**
 * Code Mode - Visual programming with node-based execution
 * Supports real-time code execution, visual debugging, and data flow visualization
 */

import { Point, Color, Rectangle } from '../../types/graphics';
import { unifiedDataModel, DataNode, DataNodeType, CodeData, CodePort } from '../../core/UnifiedDataModel';
import { CodeExecutionEngine } from '../../core/execution/CodeExecutionEngine';

export interface CodeModeConfig {
  gridSize: number;
  snapToGrid: boolean;
  showExecutionFlow: boolean;
  animateExecution: boolean;
  executionSpeed: number; // ms between steps
  showDataValues: boolean;
  showPortTypes: boolean;
  connectionStyle: 'bezier' | 'straight' | 'orthogonal';
}

export enum CodeNodeType {
  // Input nodes
  NUMBER = 'number',
  VECTOR = 'vector',
  COLOR = 'color',
  SLIDER = 'slider',
  TOGGLE = 'toggle',
  
  // Processing nodes
  MATH = 'math',
  LOGIC = 'logic',
  TRANSFORM = 'transform',
  FILTER = 'filter',
  GENERATOR = 'generator',
  
  // Output nodes
  DRAW = 'draw',
  SHAPE = 'shape',
  TEXT = 'text',
  CONSOLE = 'console',
  
  // Control flow
  CONDITION = 'condition',
  LOOP = 'loop',
  FUNCTION = 'function',
  TRIGGER = 'trigger'
}

export interface CodeNode {
  id: string;
  type: CodeNodeType;
  position: Point;
  size: { width: number; height: number };
  title: string;
  code?: string;
  inputs: CodePort[];
  outputs: CodePort[];
  state: any;
  selected: boolean;
  executing: boolean;
  error?: string;
  customUI?: CustomNodeUI;
}

export interface CodeConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  animated: boolean;
  dataFlow?: any; // Current data flowing through
}

export interface CustomNodeUI {
  type: 'slider' | 'color-picker' | 'text-input' | 'dropdown';
  config: any;
  value: any;
}

export interface ExecutionContext {
  nodes: Map<string, any>; // Node outputs
  globals: Map<string, any>; // Global variables
  functions: Map<string, Function>; // Custom functions
  iteration: number;
  time: number;
}

export class CodeMode {
  private config: CodeModeConfig;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private executionEngine: CodeExecutionEngine;
  
  // Node management
  private nodes: Map<string, CodeNode> = new Map();
  private connections: Map<string, CodeConnection> = new Map();
  private selectedNodes: Set<string> = new Set();
  private hoveredNode: string | null = null;
  private hoveredPort: { nodeId: string; portId: string; isInput: boolean } | null = null;
  
  // Interaction state
  private isDragging: boolean = false;
  private isConnecting: boolean = false;
  private dragOffset: Point = { x: 0, y: 0 };
  private connectionStart: { nodeId: string; portId: string; isInput: boolean } | null = null;
  private connectionPreview: { start: Point; end: Point } | null = null;
  
  // Execution state
  private executionContext: ExecutionContext;
  private executionOrder: string[] = [];
  private isExecuting: boolean = false;
  private executionStep: number = 0;
  private executionTimer: number | null = null;
  private executionVisualizations: Map<string, any> = new Map();
  
  // Visual elements
  private nodeLibrary: Map<CodeNodeType, () => CodeNode> = new Map();
  private portColors: Map<string, string> = new Map([
    ['number', '#4CAF50'],
    ['vector', '#2196F3'],
    ['color', '#FF9800'],
    ['geometry', '#9C27B0'],
    ['boolean', '#F44336'],
    ['any', '#607D8B']
  ]);
  
  // Grid
  private gridPattern: CanvasPattern | null = null;
  
  constructor(canvas: HTMLCanvasElement, executionEngine: CodeExecutionEngine) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.executionEngine = executionEngine;
    
    // Default configuration
    this.config = {
      gridSize: 20,
      snapToGrid: true,
      showExecutionFlow: true,
      animateExecution: true,
      executionSpeed: 500,
      showDataValues: true,
      showPortTypes: true,
      connectionStyle: 'bezier'
    };
    
    // Initialize execution context
    this.executionContext = {
      nodes: new Map(),
      globals: new Map(),
      functions: new Map(),
      iteration: 0,
      time: 0
    };
    
    // Initialize node library
    this.initializeNodeLibrary();
    
    // Create grid pattern
    this.createGridPattern();
    
    // Create default nodes
    this.createDefaultNodes();
  }
  
  private initializeNodeLibrary(): void {
    // Number input node
    this.nodeLibrary.set(CodeNodeType.NUMBER, () => ({
      id: this.generateNodeId(),
      type: CodeNodeType.NUMBER,
      position: { x: 0, y: 0 },
      size: { width: 120, height: 60 },
      title: 'Number',
      inputs: [],
      outputs: [{
        id: 'value',
        name: 'Value',
        type: 'number',
        value: 0
      }],
      state: { value: 0 },
      selected: false,
      executing: false,
      customUI: {
        type: 'slider',
        config: { min: -100, max: 100, step: 1 },
        value: 0
      }
    }));
    
    // Vector input node
    this.nodeLibrary.set(CodeNodeType.VECTOR, () => ({
      id: this.generateNodeId(),
      type: CodeNodeType.VECTOR,
      position: { x: 0, y: 0 },
      size: { width: 140, height: 80 },
      title: 'Vector',
      inputs: [],
      outputs: [{
        id: 'vector',
        name: 'Vec2',
        type: 'vector',
        value: { x: 0, y: 0 }
      }],
      state: { x: 0, y: 0 },
      selected: false,
      executing: false
    }));
    
    // Math operation node
    this.nodeLibrary.set(CodeNodeType.MATH, () => ({
      id: this.generateNodeId(),
      type: CodeNodeType.MATH,
      position: { x: 0, y: 0 },
      size: { width: 140, height: 100 },
      title: 'Math',
      code: 'return a + b;',
      inputs: [
        { id: 'a', name: 'A', type: 'number', value: 0 },
        { id: 'b', name: 'B', type: 'number', value: 0 }
      ],
      outputs: [{
        id: 'result',
        name: 'Result',
        type: 'number',
        value: 0
      }],
      state: { operation: 'add' },
      selected: false,
      executing: false,
      customUI: {
        type: 'dropdown',
        config: {
          options: ['add', 'subtract', 'multiply', 'divide', 'power', 'modulo']
        },
        value: 'add'
      }
    }));
    
    // Draw shape node
    this.nodeLibrary.set(CodeNodeType.SHAPE, () => ({
      id: this.generateNodeId(),
      type: CodeNodeType.SHAPE,
      position: { x: 0, y: 0 },
      size: { width: 160, height: 120 },
      title: 'Draw Shape',
      inputs: [
        { id: 'position', name: 'Position', type: 'vector', value: { x: 0, y: 0 } },
        { id: 'size', name: 'Size', type: 'number', value: 50 },
        { id: 'color', name: 'Color', type: 'color', value: { r: 0, g: 0, b: 0, a: 1 } }
      ],
      outputs: [{
        id: 'geometry',
        name: 'Geometry',
        type: 'geometry',
        value: null
      }],
      state: { shape: 'circle' },
      selected: false,
      executing: false,
      customUI: {
        type: 'dropdown',
        config: {
          options: ['circle', 'square', 'triangle', 'star', 'polygon']
        },
        value: 'circle'
      }
    }));
    
    // Loop node
    this.nodeLibrary.set(CodeNodeType.LOOP, () => ({
      id: this.generateNodeId(),
      type: CodeNodeType.LOOP,
      position: { x: 0, y: 0 },
      size: { width: 180, height: 140 },
      title: 'Loop',
      code: 'for (let i = 0; i < count; i++) { index = i; }',
      inputs: [
        { id: 'count', name: 'Count', type: 'number', value: 10 },
        { id: 'input', name: 'Input', type: 'any', value: null }
      ],
      outputs: [
        { id: 'index', name: 'Index', type: 'number', value: 0 },
        { id: 'output', name: 'Output', type: 'any', value: null }
      ],
      state: { currentIndex: 0 },
      selected: false,
      executing: false
    }));
  }
  
  private createGridPattern(): void {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = this.config.gridSize;
    patternCanvas.height = this.config.gridSize;
    const patternContext = patternCanvas.getContext('2d')!;
    
    // Draw grid dot
    patternContext.fillStyle = '#ddd';
    patternContext.fillRect(0, 0, 1, 1);
    
    this.gridPattern = this.context.createPattern(patternCanvas, 'repeat');
  }
  
  private createDefaultNodes(): void {
    // Create a simple example setup
    const numberNode1 = this.createNode(CodeNodeType.NUMBER);
    numberNode1.position = { x: 100, y: 100 };
    numberNode1.state.value = 50;
    numberNode1.outputs[0].value = 50;
    
    const numberNode2 = this.createNode(CodeNodeType.NUMBER);
    numberNode2.position = { x: 100, y: 200 };
    numberNode2.state.value = 30;
    numberNode2.outputs[0].value = 30;
    
    const mathNode = this.createNode(CodeNodeType.MATH);
    mathNode.position = { x: 300, y: 150 };
    
    const shapeNode = this.createNode(CodeNodeType.SHAPE);
    shapeNode.position = { x: 500, y: 150 };
    
    // Create connections
    this.createConnection(numberNode1.id, 'value', mathNode.id, 'a');
    this.createConnection(numberNode2.id, 'value', mathNode.id, 'b');
    this.createConnection(mathNode.id, 'result', shapeNode.id, 'size');
  }
  
  private createNode(type: CodeNodeType): CodeNode {
    const nodeFactory = this.nodeLibrary.get(type);
    if (!nodeFactory) throw new Error(`Unknown node type: ${type}`);
    
    const node = nodeFactory();
    this.nodes.set(node.id, node);
    
    // Create data node for unified model
    const dataNode = this.createDataNode(node);
    unifiedDataModel.addNode(dataNode);
    
    return node;
  }
  
  private createDataNode(node: CodeNode): DataNode {
    const codeData: CodeData = {
      nodeType: this.getDataNodeType(node.type),
      code: node.code,
      inputs: node.inputs,
      outputs: node.outputs,
      state: node.state
    };
    
    return {
      id: node.id,
      type: DataNodeType.FUNCTION,
      mode: 'code',
      timestamp: Date.now(),
      metadata: {
        name: node.title,
        version: 1,
        visible: true
      },
      data: {
        bounds: {
          x: node.position.x,
          y: node.position.y,
          width: node.size.width,
          height: node.size.height
        },
        codeData
      }
    };
  }
  
  private getDataNodeType(type: CodeNodeType): 'input' | 'process' | 'output' | 'control' {
    switch (type) {
      case CodeNodeType.NUMBER:
      case CodeNodeType.VECTOR:
      case CodeNodeType.COLOR:
      case CodeNodeType.SLIDER:
      case CodeNodeType.TOGGLE:
        return 'input';
      
      case CodeNodeType.DRAW:
      case CodeNodeType.SHAPE:
      case CodeNodeType.TEXT:
      case CodeNodeType.CONSOLE:
        return 'output';
      
      case CodeNodeType.CONDITION:
      case CodeNodeType.LOOP:
      case CodeNodeType.TRIGGER:
        return 'control';
      
      default:
        return 'process';
    }
  }
  
  private createConnection(sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string): void {
    const connectionId = `${sourceNodeId}_${sourcePortId}_${targetNodeId}_${targetPortId}`;
    
    const connection: CodeConnection = {
      id: connectionId,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      animated: true
    };
    
    this.connections.set(connectionId, connection);
    
    // Update unified data model
    const sourceDataNode = unifiedDataModel.getNode(sourceNodeId);
    const targetDataNode = unifiedDataModel.getNode(targetNodeId);
    
    if (sourceDataNode && targetDataNode) {
      unifiedDataModel.addConnection({
        id: connectionId,
        sourceId: sourceNodeId,
        targetId: targetNodeId,
        sourcePort: sourcePortId,
        targetPort: targetPortId,
        type: 'data'
      });
    }
    
    // Update execution order
    this.updateExecutionOrder();
  }
  
  private updateExecutionOrder(): void {
    // Topological sort to determine execution order
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Visit dependencies first
      this.connections.forEach(connection => {
        if (connection.targetNodeId === nodeId) {
          visit(connection.sourceNodeId);
        }
      });
      
      order.push(nodeId);
    };
    
    // Visit all nodes
    this.nodes.forEach((_, nodeId) => visit(nodeId));
    
    this.executionOrder = order;
  }
  
  // Rendering
  public render(): void {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    if (this.gridPattern) {
      this.context.fillStyle = this.gridPattern;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw connections
    this.renderConnections();
    
    // Draw connection preview
    if (this.connectionPreview) {
      this.renderConnectionPreview();
    }
    
    // Draw nodes
    this.renderNodes();
    
    // Draw execution visualizations
    if (this.config.showExecutionFlow && this.isExecuting) {
      this.renderExecutionFlow();
    }
  }
  
  private renderConnections(): void {
    this.connections.forEach(connection => {
      const sourceNode = this.nodes.get(connection.sourceNodeId);
      const targetNode = this.nodes.get(connection.targetNodeId);
      
      if (!sourceNode || !targetNode) return;
      
      const sourcePort = this.getPortPosition(sourceNode, connection.sourcePortId, false);
      const targetPort = this.getPortPosition(targetNode, connection.targetPortId, true);
      
      if (!sourcePort || !targetPort) return;
      
      // Determine connection color based on data type
      const outputPort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
      const portType = outputPort?.type || 'any';
      const connectionColor = this.portColors.get(portType) || '#607D8B';
      
      // Draw connection
      this.context.strokeStyle = connectionColor;
      this.context.lineWidth = connection.animated && this.isExecuting ? 3 : 2;
      this.context.globalAlpha = connection.animated && this.isExecuting ? 0.8 : 1;
      
      this.drawConnection(sourcePort, targetPort);
      
      // Draw data flow animation
      if (connection.animated && this.isExecuting && connection.dataFlow !== undefined) {
        this.drawDataFlow(sourcePort, targetPort, connection.dataFlow, connectionColor);
      }
      
      this.context.globalAlpha = 1;
    });
  }
  
  private drawConnection(start: Point, end: Point): void {
    this.context.beginPath();
    
    switch (this.config.connectionStyle) {
      case 'bezier':
        const cp1x = start.x + (end.x - start.x) * 0.5;
        const cp1y = start.y;
        const cp2x = end.x - (end.x - start.x) * 0.5;
        const cp2y = end.y;
        
        this.context.moveTo(start.x, start.y);
        this.context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);
        break;
      
      case 'straight':
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(end.x, end.y);
        break;
      
      case 'orthogonal':
        const midX = start.x + (end.x - start.x) / 2;
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(midX, start.y);
        this.context.lineTo(midX, end.y);
        this.context.lineTo(end.x, end.y);
        break;
    }
    
    this.context.stroke();
  }
  
  private drawDataFlow(start: Point, end: Point, data: any, color: string): void {
    // Animate data flowing through connection
    const t = (Date.now() % 1000) / 1000; // Animation progress
    
    // Calculate position along curve
    let flowX, flowY;
    
    if (this.config.connectionStyle === 'bezier') {
      // Bezier curve interpolation
      const cp1x = start.x + (end.x - start.x) * 0.5;
      const cp1y = start.y;
      const cp2x = end.x - (end.x - start.x) * 0.5;
      const cp2y = end.y;
      
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      flowX = mt3 * start.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * end.x;
      flowY = mt3 * start.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * end.y;
    } else {
      // Linear interpolation
      flowX = start.x + (end.x - start.x) * t;
      flowY = start.y + (end.y - start.y) * t;
    }
    
    // Draw data representation
    this.context.save();
    this.context.fillStyle = color;
    this.context.globalAlpha = 0.8;
    
    this.context.beginPath();
    this.context.arc(flowX, flowY, 6, 0, Math.PI * 2);
    this.context.fill();
    
    // Show data value if enabled
    if (this.config.showDataValues && data !== null && data !== undefined) {
      this.context.font = '10px monospace';
      this.context.fillStyle = '#000';
      this.context.textAlign = 'center';
      this.context.fillText(this.formatDataValue(data), flowX, flowY - 10);
    }
    
    this.context.restore();
  }
  
  private formatDataValue(value: any): string {
    if (typeof value === 'number') {
      return value.toFixed(1);
    } else if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
      return `(${value.x.toFixed(0)}, ${value.y.toFixed(0)})`;
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    } else {
      return JSON.stringify(value).substring(0, 10);
    }
  }
  
  private renderConnectionPreview(): void {
    if (!this.connectionPreview) return;
    
    this.context.save();
    this.context.strokeStyle = '#999';
    this.context.lineWidth = 2;
    this.context.setLineDash([5, 5]);
    
    this.drawConnection(this.connectionPreview.start, this.connectionPreview.end);
    
    this.context.restore();
  }
  
  private renderNodes(): void {
    // Sort nodes by selection state (selected nodes on top)
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => {
      if (a.selected && !b.selected) return 1;
      if (!a.selected && b.selected) return -1;
      return 0;
    });
    
    sortedNodes.forEach(node => {
      this.renderNode(node);
    });
  }
  
  private renderNode(node: CodeNode): void {
    const { position, size } = node;
    
    this.context.save();
    
    // Node shadow
    if (node.selected || node.id === this.hoveredNode) {
      this.context.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.context.shadowBlur = 10;
      this.context.shadowOffsetX = 2;
      this.context.shadowOffsetY = 2;
    }
    
    // Node background
    this.context.fillStyle = node.executing ? '#FFE082' : 
                           node.error ? '#FFCDD2' : 
                           node.selected ? '#E3F2FD' : '#fff';
    this.context.strokeStyle = node.selected ? '#2196F3' : '#ccc';
    this.context.lineWidth = node.selected ? 2 : 1;
    
    this.roundRect(position.x, position.y, size.width, size.height, 5);
    this.context.fill();
    this.context.stroke();
    
    // Reset shadow
    this.context.shadowColor = 'transparent';
    
    // Node title
    this.context.fillStyle = '#333';
    this.context.font = 'bold 12px sans-serif';
    this.context.textAlign = 'center';
    this.context.fillText(node.title, position.x + size.width / 2, position.y + 20);
    
    // Render ports
    this.renderPorts(node);
    
    // Render custom UI
    if (node.customUI) {
      this.renderCustomUI(node);
    }
    
    // Error indicator
    if (node.error) {
      this.context.fillStyle = '#F44336';
      this.context.font = '10px sans-serif';
      this.context.textAlign = 'center';
      this.context.fillText('Error', position.x + size.width / 2, position.y + size.height - 5);
    }
    
    this.context.restore();
  }
  
  private renderPorts(node: CodeNode): void {
    // Input ports
    node.inputs.forEach((port, index) => {
      const pos = this.getPortPosition(node, port.id, true);
      if (!pos) return;
      
      const isHovered = this.hoveredPort?.nodeId === node.id && 
                       this.hoveredPort?.portId === port.id && 
                       this.hoveredPort?.isInput;
      
      this.renderPort(pos, port, true, isHovered);
    });
    
    // Output ports
    node.outputs.forEach((port, index) => {
      const pos = this.getPortPosition(node, port.id, false);
      if (!pos) return;
      
      const isHovered = this.hoveredPort?.nodeId === node.id && 
                       this.hoveredPort?.portId === port.id && 
                       !this.hoveredPort?.isInput;
      
      this.renderPort(pos, port, false, isHovered);
    });
  }
  
  private renderPort(position: Point, port: CodePort, isInput: boolean, isHovered: boolean): void {
    const portColor = this.portColors.get(port.type) || '#607D8B';
    
    // Port circle
    this.context.fillStyle = port.connected ? portColor : '#fff';
    this.context.strokeStyle = portColor;
    this.context.lineWidth = isHovered ? 3 : 2;
    
    this.context.beginPath();
    this.context.arc(position.x, position.y, 6, 0, Math.PI * 2);
    this.context.fill();
    this.context.stroke();
    
    // Port label
    if (this.config.showPortTypes || isHovered) {
      this.context.fillStyle = '#666';
      this.context.font = '10px sans-serif';
      this.context.textAlign = isInput ? 'left' : 'right';
      this.context.fillText(
        port.name, 
        position.x + (isInput ? 10 : -10), 
        position.y + 3
      );
    }
  }
  
  private renderCustomUI(node: CodeNode): void {
    if (!node.customUI) return;
    
    const { position, size } = node;
    
    switch (node.customUI.type) {
      case 'slider':
        this.renderSlider(
          position.x + 10,
          position.y + 35,
          size.width - 20,
          node.customUI.value,
          node.customUI.config
        );
        break;
      
      case 'dropdown':
        this.renderDropdown(
          position.x + 10,
          position.y + 35,
          size.width - 20,
          node.customUI.value,
          node.customUI.config
        );
        break;
      
      case 'color-picker':
        this.renderColorPicker(
          position.x + size.width / 2,
          position.y + 45,
          node.customUI.value
        );
        break;
    }
  }
  
  private renderSlider(x: number, y: number, width: number, value: number, config: any): void {
    const { min, max } = config;
    const normalized = (value - min) / (max - min);
    
    // Slider track
    this.context.strokeStyle = '#ddd';
    this.context.lineWidth = 4;
    this.context.lineCap = 'round';
    
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.lineTo(x + width, y);
    this.context.stroke();
    
    // Slider fill
    this.context.strokeStyle = '#2196F3';
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.lineTo(x + width * normalized, y);
    this.context.stroke();
    
    // Slider handle
    this.context.fillStyle = '#2196F3';
    this.context.beginPath();
    this.context.arc(x + width * normalized, y, 6, 0, Math.PI * 2);
    this.context.fill();
    
    // Value label
    this.context.fillStyle = '#666';
    this.context.font = '10px sans-serif';
    this.context.textAlign = 'center';
    this.context.fillText(value.toFixed(1), x + width / 2, y + 15);
  }
  
  private renderDropdown(x: number, y: number, width: number, value: string, config: any): void {
    // Dropdown background
    this.context.fillStyle = '#f5f5f5';
    this.context.strokeStyle = '#ccc';
    this.context.lineWidth = 1;
    
    this.roundRect(x, y, width, 20, 3);
    this.context.fill();
    this.context.stroke();
    
    // Selected value
    this.context.fillStyle = '#333';
    this.context.font = '11px sans-serif';
    this.context.textAlign = 'left';
    this.context.fillText(value, x + 5, y + 14);
    
    // Dropdown arrow
    this.context.fillStyle = '#666';
    this.context.beginPath();
    this.context.moveTo(x + width - 15, y + 8);
    this.context.lineTo(x + width - 10, y + 12);
    this.context.lineTo(x + width - 5, y + 8);
    this.context.closePath();
    this.context.fill();
  }
  
  private renderColorPicker(x: number, y: number, color: Color): void {
    // Color preview
    this.context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    this.context.strokeStyle = '#ccc';
    this.context.lineWidth = 1;
    
    this.context.beginPath();
    this.context.arc(x, y, 15, 0, Math.PI * 2);
    this.context.fill();
    this.context.stroke();
  }
  
  private renderExecutionFlow(): void {
    // Visualize execution order and current step
    this.executionOrder.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      
      // Execution order number
      if (index === this.executionStep) {
        this.context.fillStyle = '#4CAF50';
        this.context.font = 'bold 16px sans-serif';
      } else {
        this.context.fillStyle = '#999';
        this.context.font = '14px sans-serif';
      }
      
      this.context.textAlign = 'center';
      this.context.fillText(
        (index + 1).toString(),
        node.position.x - 20,
        node.position.y + node.size.height / 2
      );
    });
  }
  
  private getPortPosition(node: CodeNode, portId: string, isInput: boolean): Point | null {
    const ports = isInput ? node.inputs : node.outputs;
    const portIndex = ports.findIndex(p => p.id === portId);
    
    if (portIndex === -1) return null;
    
    const portSpacing = 25;
    const startY = node.position.y + 40;
    
    return {
      x: node.position.x + (isInput ? 0 : node.size.width),
      y: startY + portIndex * portSpacing
    };
  }
  
  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();
  }
  
  // Execution
  public execute(): void {
    if (this.isExecuting) return;
    
    this.isExecuting = true;
    this.executionStep = 0;
    this.executionContext.iteration++;
    this.executionContext.time = Date.now();
    
    if (this.config.animateExecution) {
      this.executeStep();
    } else {
      // Execute all at once
      this.executionOrder.forEach(nodeId => {
        this.executeNode(nodeId);
      });
      this.isExecuting = false;
      this.render();
    }
  }
  
  private executeStep(): void {
    if (this.executionStep >= this.executionOrder.length) {
      this.isExecuting = false;
      this.render();
      return;
    }
    
    const nodeId = this.executionOrder[this.executionStep];
    this.executeNode(nodeId);
    
    this.executionStep++;
    this.render();
    
    this.executionTimer = window.setTimeout(() => {
      this.executeStep();
    }, this.config.executionSpeed);
  }
  
  private executeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    node.executing = true;
    node.error = undefined;
    
    try {
      // Gather input values
      const inputs: Record<string, any> = {};
      node.inputs.forEach(input => {
        // Find connected output
        let value = input.value; // Default value
        
        this.connections.forEach(connection => {
          if (connection.targetNodeId === nodeId && connection.targetPortId === input.id) {
            const sourceNode = this.nodes.get(connection.sourceNodeId);
            if (sourceNode) {
              const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
              if (sourcePort) {
                value = sourcePort.value;
                connection.dataFlow = value; // For visualization
              }
            }
          }
        });
        
        inputs[input.id] = value;
      });
      
      // Execute node logic
      const outputs = this.executeNodeLogic(node, inputs);
      
      // Update output values
      node.outputs.forEach(output => {
        if (outputs[output.id] !== undefined) {
          output.value = outputs[output.id];
        }
      });
      
      // Store in execution context
      this.executionContext.nodes.set(nodeId, outputs);
      
    } catch (error) {
      node.error = error.message;
      console.error(`Error executing node ${nodeId}:`, error);
    }
    
    node.executing = false;
  }
  
  private executeNodeLogic(node: CodeNode, inputs: Record<string, any>): Record<string, any> {
    const outputs: Record<string, any> = {};
    
    switch (node.type) {
      case CodeNodeType.NUMBER:
        outputs.value = node.state.value;
        break;
      
      case CodeNodeType.VECTOR:
        outputs.vector = { x: node.state.x, y: node.state.y };
        break;
      
      case CodeNodeType.MATH:
        const operation = node.customUI?.value || 'add';
        const a = inputs.a || 0;
        const b = inputs.b || 0;
        
        switch (operation) {
          case 'add': outputs.result = a + b; break;
          case 'subtract': outputs.result = a - b; break;
          case 'multiply': outputs.result = a * b; break;
          case 'divide': outputs.result = b !== 0 ? a / b : 0; break;
          case 'power': outputs.result = Math.pow(a, b); break;
          case 'modulo': outputs.result = b !== 0 ? a % b : 0; break;
        }
        break;
      
      case CodeNodeType.SHAPE:
        // Generate shape geometry
        const position = inputs.position || { x: 0, y: 0 };
        const size = inputs.size || 50;
        const color = inputs.color || { r: 0, g: 0, b: 0, a: 1 };
        const shape = node.customUI?.value || 'circle';
        
        outputs.geometry = {
          type: shape,
          position,
          size,
          color
        };
        
        // Actually draw the shape
        this.drawShape(shape, position, size, color);
        break;
      
      case CodeNodeType.LOOP:
        const count = inputs.count || 0;
        const inputValue = inputs.input;
        
        for (let i = 0; i < count; i++) {
          node.state.currentIndex = i;
          outputs.index = i;
          outputs.output = inputValue; // In a real implementation, this would process the input
        }
        break;
      
      default:
        // Custom code execution
        if (node.code) {
          const func = new Function(...Object.keys(inputs), node.code);
          const result = func(...Object.values(inputs));
          
          if (typeof result === 'object' && result !== null) {
            Object.assign(outputs, result);
          } else {
            outputs.result = result;
          }
        }
    }
    
    return outputs;
  }
  
  private drawShape(type: string, position: Point, size: number, color: Color): void {
    const ctx = this.context;
    
    ctx.save();
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    ctx.strokeStyle = `rgba(${color.r * 0.8}, ${color.g * 0.8}, ${color.b * 0.8}, ${color.a})`;
    ctx.lineWidth = 2;
    
    const x = this.canvas.width / 2 + position.x;
    const y = this.canvas.height / 2 + position.y;
    
    ctx.beginPath();
    
    switch (type) {
      case 'circle':
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        break;
      
      case 'square':
        ctx.rect(x - size / 2, y - size / 2, size, size);
        break;
      
      case 'triangle':
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x - size / 2, y + size / 2);
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.closePath();
        break;
      
      case 'star':
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        break;
    }
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  
  // Interaction
  public handleMouseDown(point: Point): void {
    // Check if clicking on a port
    const port = this.getPortAtPoint(point);
    if (port) {
      this.startConnection(port);
      return;
    }
    
    // Check if clicking on a node
    const node = this.getNodeAtPoint(point);
    if (node) {
      if (!this.selectedNodes.has(node.id)) {
        this.selectedNodes.clear();
        this.selectedNodes.add(node.id);
        node.selected = true;
      }
      
      this.isDragging = true;
      this.dragOffset = {
        x: point.x - node.position.x,
        y: point.y - node.position.y
      };
    } else {
      // Clear selection
      this.selectedNodes.forEach(id => {
        const n = this.nodes.get(id);
        if (n) n.selected = false;
      });
      this.selectedNodes.clear();
    }
    
    this.render();
  }
  
  public handleMouseMove(point: Point): void {
    // Update hovered elements
    const prevHoveredNode = this.hoveredNode;
    const prevHoveredPort = this.hoveredPort;
    
    this.hoveredNode = this.getNodeAtPoint(point)?.id || null;
    this.hoveredPort = this.getPortAtPoint(point);
    
    // Handle connection preview
    if (this.isConnecting && this.connectionStart) {
      const startNode = this.nodes.get(this.connectionStart.nodeId);
      if (startNode) {
        const startPos = this.getPortPosition(
          startNode,
          this.connectionStart.portId,
          this.connectionStart.isInput
        );
        
        if (startPos) {
          this.connectionPreview = {
            start: startPos,
            end: point
          };
        }
      }
    }
    
    // Handle node dragging
    if (this.isDragging && this.selectedNodes.size > 0) {
      this.selectedNodes.forEach(nodeId => {
        const node = this.nodes.get(nodeId);
        if (node) {
          let newX = point.x - this.dragOffset.x;
          let newY = point.y - this.dragOffset.y;
          
          // Snap to grid
          if (this.config.snapToGrid) {
            newX = Math.round(newX / this.config.gridSize) * this.config.gridSize;
            newY = Math.round(newY / this.config.gridSize) * this.config.gridSize;
          }
          
          node.position = { x: newX, y: newY };
          
          // Update data model
          unifiedDataModel.updateNode(nodeId, {
            data: {
              bounds: {
                x: newX,
                y: newY,
                width: node.size.width,
                height: node.size.height
              }
            }
          });
        }
      });
    }
    
    // Render if something changed
    if (prevHoveredNode !== this.hoveredNode || 
        prevHoveredPort !== this.hoveredPort ||
        this.isDragging || this.isConnecting) {
      this.render();
    }
  }
  
  public handleMouseUp(point: Point): void {
    // Handle connection completion
    if (this.isConnecting && this.connectionStart) {
      const endPort = this.getPortAtPoint(point);
      if (endPort && this.canConnect(this.connectionStart, endPort)) {
        // Create connection
        if (this.connectionStart.isInput) {
          this.createConnection(
            endPort.nodeId,
            endPort.portId,
            this.connectionStart.nodeId,
            this.connectionStart.portId
          );
        } else {
          this.createConnection(
            this.connectionStart.nodeId,
            this.connectionStart.portId,
            endPort.nodeId,
            endPort.portId
          );
        }
      }
    }
    
    // Reset states
    this.isDragging = false;
    this.isConnecting = false;
    this.connectionStart = null;
    this.connectionPreview = null;
    
    this.render();
  }
  
  private getNodeAtPoint(point: Point): CodeNode | null {
    // Iterate in reverse to get top-most node
    const nodes = Array.from(this.nodes.values()).reverse();
    
    for (const node of nodes) {
      if (point.x >= node.position.x &&
          point.x <= node.position.x + node.size.width &&
          point.y >= node.position.y &&
          point.y <= node.position.y + node.size.height) {
        return node;
      }
    }
    
    return null;
  }
  
  private getPortAtPoint(point: Point): { nodeId: string; portId: string; isInput: boolean } | null {
    for (const [nodeId, node] of this.nodes) {
      // Check input ports
      for (const port of node.inputs) {
        const portPos = this.getPortPosition(node, port.id, true);
        if (portPos) {
          const distance = Math.sqrt(
            Math.pow(point.x - portPos.x, 2) +
            Math.pow(point.y - portPos.y, 2)
          );
          
          if (distance <= 8) {
            return { nodeId, portId: port.id, isInput: true };
          }
        }
      }
      
      // Check output ports
      for (const port of node.outputs) {
        const portPos = this.getPortPosition(node, port.id, false);
        if (portPos) {
          const distance = Math.sqrt(
            Math.pow(point.x - portPos.x, 2) +
            Math.pow(point.y - portPos.y, 2)
          );
          
          if (distance <= 8) {
            return { nodeId, portId: port.id, isInput: false };
          }
        }
      }
    }
    
    return null;
  }
  
  private startConnection(port: { nodeId: string; portId: string; isInput: boolean }): void {
    this.isConnecting = true;
    this.connectionStart = port;
  }
  
  private canConnect(
    start: { nodeId: string; portId: string; isInput: boolean },
    end: { nodeId: string; portId: string; isInput: boolean }
  ): boolean {
    // Can't connect to same node
    if (start.nodeId === end.nodeId) return false;
    
    // Must connect input to output
    if (start.isInput === end.isInput) return false;
    
    // Check if connection already exists
    const connectionExists = Array.from(this.connections.values()).some(conn => {
      return (conn.sourceNodeId === start.nodeId && conn.sourcePortId === start.portId &&
              conn.targetNodeId === end.nodeId && conn.targetPortId === end.portId) ||
             (conn.sourceNodeId === end.nodeId && conn.sourcePortId === end.portId &&
              conn.targetNodeId === start.nodeId && conn.targetPortId === start.portId);
    });
    
    return !connectionExists;
  }
  
  // Public API
  public addNode(type: CodeNodeType, position?: Point): CodeNode {
    const node = this.createNode(type);
    
    if (position) {
      node.position = this.config.snapToGrid ? 
        {
          x: Math.round(position.x / this.config.gridSize) * this.config.gridSize,
          y: Math.round(position.y / this.config.gridSize) * this.config.gridSize
        } : position;
    }
    
    this.render();
    return node;
  }
  
  public removeSelectedNodes(): void {
    this.selectedNodes.forEach(nodeId => {
      // Remove connections
      const connectionsToRemove: string[] = [];
      this.connections.forEach((connection, id) => {
        if (connection.sourceNodeId === nodeId || connection.targetNodeId === nodeId) {
          connectionsToRemove.push(id);
        }
      });
      
      connectionsToRemove.forEach(id => {
        this.connections.delete(id);
      });
      
      // Remove from data model
      unifiedDataModel.removeNode(nodeId);
      
      // Remove node
      this.nodes.delete(nodeId);
    });
    
    this.selectedNodes.clear();
    this.updateExecutionOrder();
    this.render();
  }
  
  public setConfig(config: Partial<CodeModeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.gridSize !== undefined) {
      this.createGridPattern();
    }
    
    this.render();
  }
  
  public clear(): void {
    // Stop execution
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
    }
    
    // Clear data model
    this.nodes.forEach((_, id) => {
      unifiedDataModel.removeNode(id);
    });
    
    // Clear state
    this.nodes.clear();
    this.connections.clear();
    this.selectedNodes.clear();
    this.executionOrder = [];
    this.isExecuting = false;
    
    this.render();
  }
  
  public exportGraph(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      connections: Array.from(this.connections.values())
    };
  }
  
  public importGraph(data: any): void {
    this.clear();
    
    // Import nodes
    data.nodes.forEach((nodeData: CodeNode) => {
      this.nodes.set(nodeData.id, nodeData);
      const dataNode = this.createDataNode(nodeData);
      unifiedDataModel.addNode(dataNode);
    });
    
    // Import connections
    data.connections.forEach((connData: CodeConnection) => {
      this.connections.set(connData.id, connData);
    });
    
    this.updateExecutionOrder();
    this.render();
  }
  
  private generateNodeId(): string {
    return `code_node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public destroy(): void {
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
    }
    
    this.clear();
  }
}