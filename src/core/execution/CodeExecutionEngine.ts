/**
 * Code Execution Engine for Genshi Studio
 * Handles TypeScript transpilation and sandboxed code execution
 */

import * as ts from 'typescript';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  logs: string[];
  performance: {
    transpileTime: number;
    executionTime: number;
  };
}

export interface GenshiAPI {
  canvas: {
    width: number;
    height: number;
    background: (color: string) => void;
    clear: () => void;
  };
  draw: {
    fill: (color: string) => void;
    stroke: (color: string) => void;
    strokeWidth: (width: number) => void;
    noFill: () => void;
    noStroke: () => void;
  };
  shapes: {
    rect: (x: number, y: number, width: number, height: number) => void;
    circle: (x: number, y: number, radius: number) => void;
    ellipse: (x: number, y: number, width: number, height: number) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => void;
    polygon: (...points: number[]) => void;
  };
  patterns: {
    japanese: {
      seigaiha: (scale?: number) => any;
      asanoha: (scale?: number) => any;
      shippo: (scale?: number) => any;
    };
    celtic: {
      knot: (complexity?: number) => any;
      spiral: (turns?: number) => any;
    };
    islamic: {
      geometric: (sides?: number) => any;
      arabesque: (complexity?: number) => any;
    };
  };
}

export class CodeExecutionEngine {
  private worker: Worker | null = null;
  private executionTimeout: number = 5000; // 5 seconds max execution time
  private graphicsEngine: any; // Will be injected
  private executionQueue: Array<{
    code: string;
    resolve: (result: ExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isExecuting: boolean = false;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    // Create worker from blob to avoid separate file
    const workerCode = `
      // Web Worker for sandboxed code execution
      let executionTimeout;
      const MAX_EXECUTION_TIME = 5000;
      
      // Command queue for graphics operations
      const commandQueue = [];
      
      // Genshi API implementation
      const canvas = {
        width: 800,
        height: 600,
        background: (color) => {
          commandQueue.push({ type: 'canvas.background', args: [color] });
        },
        clear: () => {
          commandQueue.push({ type: 'canvas.clear', args: [] });
        }
      };
      
      const draw = {
        _fillColor: '#000000',
        _strokeColor: '#000000',
        _strokeWidth: 1,
        _hasFill: true,
        _hasStroke: true,
        
        fill: (color) => {
          draw._fillColor = color;
          draw._hasFill = true;
          commandQueue.push({ type: 'draw.fill', args: [color] });
        },
        stroke: (color) => {
          draw._strokeColor = color;
          draw._hasStroke = true;
          commandQueue.push({ type: 'draw.stroke', args: [color] });
        },
        strokeWidth: (width) => {
          draw._strokeWidth = width;
          commandQueue.push({ type: 'draw.strokeWidth', args: [width] });
        },
        noFill: () => {
          draw._hasFill = false;
          commandQueue.push({ type: 'draw.noFill', args: [] });
        },
        noStroke: () => {
          draw._hasStroke = false;
          commandQueue.push({ type: 'draw.noStroke', args: [] });
        }
      };
      
      const shapes = {
        rect: (x, y, width, height) => {
          commandQueue.push({ type: 'shapes.rect', args: [x, y, width, height] });
        },
        circle: (x, y, radius) => {
          commandQueue.push({ type: 'shapes.circle', args: [x, y, radius] });
        },
        ellipse: (x, y, width, height) => {
          commandQueue.push({ type: 'shapes.ellipse', args: [x, y, width, height] });
        },
        line: (x1, y1, x2, y2) => {
          commandQueue.push({ type: 'shapes.line', args: [x1, y1, x2, y2] });
        },
        triangle: (x1, y1, x2, y2, x3, y3) => {
          commandQueue.push({ type: 'shapes.triangle', args: [x1, y1, x2, y2, x3, y3] });
        },
        polygon: (...points) => {
          commandQueue.push({ type: 'shapes.polygon', args: points });
        }
      };
      
      const patterns = {
        japanese: {
          seigaiha: (scale = 1) => {
            commandQueue.push({ type: 'patterns.japanese.seigaiha', args: [scale] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          },
          asanoha: (scale = 1) => {
            commandQueue.push({ type: 'patterns.japanese.asanoha', args: [scale] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          },
          shippo: (scale = 1) => {
            commandQueue.push({ type: 'patterns.japanese.shippo', args: [scale] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          }
        },
        celtic: {
          knot: (complexity = 1) => {
            commandQueue.push({ type: 'patterns.celtic.knot', args: [complexity] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          },
          spiral: (turns = 3) => {
            commandQueue.push({ type: 'patterns.celtic.spiral', args: [turns] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          }
        },
        islamic: {
          geometric: (sides = 8) => {
            commandQueue.push({ type: 'patterns.islamic.geometric', args: [sides] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          },
          arabesque: (complexity = 1) => {
            commandQueue.push({ type: 'patterns.islamic.arabesque', args: [complexity] });
            return { apply: () => {}, scale: () => {}, rotate: () => {}, translate: () => {} };
          }
        }
      };
      
      // Console override for logging
      const logs = [];
      const console = {
        log: (...args) => {
          logs.push(args.map(arg => String(arg)).join(' '));
        },
        error: (...args) => {
          logs.push('[ERROR] ' + args.map(arg => String(arg)).join(' '));
        },
        warn: (...args) => {
          logs.push('[WARN] ' + args.map(arg => String(arg)).join(' '));
        }
      };
      
      self.onmessage = function(event) {
        const { type, code, id } = event.data;
        
        if (type === 'execute') {
          // Clear previous state
          commandQueue.length = 0;
          logs.length = 0;
          
          // Set execution timeout
          executionTimeout = setTimeout(() => {
            self.postMessage({
              type: 'error',
              id,
              error: 'Execution timeout exceeded (5 seconds)',
              logs,
              commands: []
            });
          }, MAX_EXECUTION_TIME);
          
          try {
            // Create sandboxed function
            const sandboxedCode = new Function(
              'canvas', 'draw', 'shapes', 'patterns', 'console',
              code
            );
            
            // Execute code
            sandboxedCode(canvas, draw, shapes, patterns, console);
            
            // Clear timeout
            clearTimeout(executionTimeout);
            
            // Send results
            self.postMessage({
              type: 'success',
              id,
              commands: [...commandQueue],
              logs
            });
          } catch (error) {
            clearTimeout(executionTimeout);
            self.postMessage({
              type: 'error',
              id,
              error: error.message || String(error),
              logs,
              commands: [...commandQueue]
            });
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);
    
    // Set up message handler
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }

  /**
   * Transpile TypeScript to JavaScript
   */
  private transpileTypeScript(code: string): { js: string; errors: ts.Diagnostic[] } {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        removeComments: true
      }
    });

    return {
      js: result.outputText,
      errors: result.diagnostics || []
    };
  }

  /**
   * Execute code and return results
   */
  async execute(code: string): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      // Add to execution queue
      this.executionQueue.push({ code, resolve, reject });
      
      // Process queue if not already executing
      if (!this.isExecuting) {
        this.processExecutionQueue();
      }
    });
  }

  private async processExecutionQueue(): Promise<void> {
    if (this.executionQueue.length === 0 || this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    const { code, resolve, reject } = this.executionQueue.shift()!;

    const startTime = performance.now();
    const logs: string[] = [];

    try {
      // Transpile TypeScript to JavaScript
      const transpileStart = performance.now();
      const { js, errors } = this.transpileTypeScript(code);
      const transpileTime = performance.now() - transpileStart;

      if (errors.length > 0) {
        const errorMessages = errors.map(err => 
          ts.flattenDiagnosticMessageText(err.messageText, '\n')
        );
        resolve({
          success: false,
          error: `TypeScript errors:\n${errorMessages.join('\n')}`,
          logs,
          performance: { transpileTime, executionTime: 0 }
        });
        this.isExecuting = false;
        this.processExecutionQueue();
        return;
      }

      // Execute in worker
      const executionStart = performance.now();
      const executionId = Date.now();
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.id !== executionId) return;
        
        const executionTime = performance.now() - executionStart;
        
        if (event.data.type === 'success') {
          // Process commands
          this.processCommands(event.data.commands);
          
          resolve({
            success: true,
            logs: event.data.logs,
            performance: { transpileTime, executionTime }
          });
        } else {
          resolve({
            success: false,
            error: event.data.error,
            logs: event.data.logs,
            performance: { transpileTime, executionTime }
          });
        }
        
        this.worker!.removeEventListener('message', messageHandler);
        this.isExecuting = false;
        this.processExecutionQueue();
      };
      
      this.worker!.addEventListener('message', messageHandler);
      this.worker!.postMessage({ type: 'execute', code: js, id: executionId });
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs,
        performance: { 
          transpileTime: 0, 
          executionTime: performance.now() - startTime 
        }
      });
      this.isExecuting = false;
      this.processExecutionQueue();
    }
  }

  /**
   * Process graphics commands from worker
   */
  private processCommands(commands: any[]): void {
    if (!this.graphicsEngine) {
      console.warn('Graphics engine not connected');
      return;
    }

    // Clear canvas first
    this.graphicsEngine.clearExecutionLayer();

    // Process each command
    for (const cmd of commands) {
      this.executeGraphicsCommand(cmd);
    }

    // Trigger redraw
    this.graphicsEngine.requestRedraw();
  }

  private executeGraphicsCommand(cmd: any): void {
    const [category, method] = cmd.type.split('.');
    
    switch (category) {
      case 'canvas':
        this.executeCanvasCommand(method, cmd.args);
        break;
      case 'draw':
        this.executeDrawCommand(method, cmd.args);
        break;
      case 'shapes':
        this.executeShapeCommand(method, cmd.args);
        break;
      case 'patterns':
        this.executePatternCommand(cmd.type, cmd.args);
        break;
    }
  }

  private executeCanvasCommand(method: string, args: any[]): void {
    switch (method) {
      case 'background':
        this.graphicsEngine.setCanvasBackground(args[0]);
        break;
      case 'clear':
        this.graphicsEngine.clearCanvas();
        break;
    }
  }

  private executeDrawCommand(method: string, args: any[]): void {
    switch (method) {
      case 'fill':
        this.graphicsEngine.setFillColor(args[0]);
        break;
      case 'stroke':
        this.graphicsEngine.setStrokeColor(args[0]);
        break;
      case 'strokeWidth':
        this.graphicsEngine.setStrokeWidth(args[0]);
        break;
      case 'noFill':
        this.graphicsEngine.setFillEnabled(false);
        break;
      case 'noStroke':
        this.graphicsEngine.setStrokeEnabled(false);
        break;
    }
  }

  private executeShapeCommand(method: string, args: any[]): void {
    switch (method) {
      case 'rect':
        this.graphicsEngine.drawRect(...args);
        break;
      case 'circle':
        this.graphicsEngine.drawCircle(...args);
        break;
      case 'ellipse':
        this.graphicsEngine.drawEllipse(...args);
        break;
      case 'line':
        this.graphicsEngine.drawLine(...args);
        break;
      case 'triangle':
        this.graphicsEngine.drawTriangle(...args);
        break;
      case 'polygon':
        this.graphicsEngine.drawPolygon(args);
        break;
    }
  }

  private executePatternCommand(type: string, args: any[]): void {
    const parts = type.split('.');
    if (parts.length === 3) {
      const [_, culture, pattern] = parts;
      this.graphicsEngine.drawPattern(culture, pattern, args);
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    // Handled by individual message handlers
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
  }

  /**
   * Connect graphics engine
   */
  connectGraphicsEngine(engine: any): void {
    this.graphicsEngine = engine;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}