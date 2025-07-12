/**
 * Unified Editing System Demonstration
 * DEVELOPER_013 - Live working demonstration of revolutionary unified editing
 * 
 * This demonstrates:
 * - Real-time synchronization between all 4 modes
 * - Bidirectional translation in action
 * - User interactions propagating across modes
 * - Live algorithm evolution
 */

import { UnifiedEditingSystem } from './UnifiedEditingSystem';
import { CanvasMode } from '../graphics/canvas/UnifiedCanvas';
import { CreativeMode, EntityType } from '../unified/UnifiedDataModel';
import { ChangeType, SyncPriority } from './sync/SynchronizationEngine';

export interface DemoScenario {
  name: string;
  description: string;
  steps: DemoStep[];
}

export interface DemoStep {
  action: string;
  mode: CanvasMode;
  data: any;
  expectedResult: string;
}

export class UnifiedEditingSystemDemo extends UnifiedEditingSystem {
  private demoMode: boolean = false;
  private currentScenario: DemoScenario | null = null;
  private currentStep: number = 0;
  private interactionHistory: any[] = [];
  
  // Demo state
  private demoPatterns = {
    grid: {
      spacing: 20,
      rows: 10,
      cols: 10
    },
    ichimatsu: {
      tileSize: 40,
      offset: 0
    },
    growth: {
      seeds: [] as { x: number; y: number }[],
      generation: 0,
      speed: 0.02
    }
  };

  constructor(config: any) {
    super(config);
    this.setupDemoInteractions();
    console.log('🎭 Unified Editing System Demo initialized');
  }

  private setupDemoInteractions(): void {
    const canvas = this.getCanvas();
    const mainCanvas = canvas['mainCanvas'] as HTMLCanvasElement;
    
    // Enhanced pointer interactions
    mainCanvas.addEventListener('pointerdown', this.handleDemoPointerDown.bind(this));
    mainCanvas.addEventListener('pointermove', this.handleDemoPointerMove.bind(this));
    mainCanvas.addEventListener('pointerup', this.handleDemoPointerUp.bind(this));
    
    // Keyboard shortcuts for demo
    window.addEventListener('keydown', this.handleDemoKeyDown.bind(this));
  }

  private handleDemoPointerDown(event: PointerEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = (event as any).pressure || 1.0;
    
    // Get current primary mode
    const primaryMode = this.getCanvas().getPrimaryMode() || CanvasMode.DRAW;
    
    // Create interaction based on mode
    switch (primaryMode) {
      case CanvasMode.DRAW:
        this.handleDrawInteraction(x, y, pressure, 'start');
        break;
      case CanvasMode.PARAMETRIC:
        this.handleParametricInteraction(x, y, 'start');
        break;
      case CanvasMode.CODE:
        this.handleCodeInteraction(x, y, 'start');
        break;
      case CanvasMode.GROWTH:
        this.handleGrowthInteraction(x, y, 'start');
        break;
    }
    
    // Record interaction
    this.interactionHistory.push({
      type: 'pointerdown',
      mode: primaryMode,
      x, y, pressure,
      timestamp: Date.now()
    });
  }

  private handleDemoPointerMove(event: PointerEvent): void {
    if (!event.buttons) return; // Only track when button is pressed
    
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pressure = (event as any).pressure || 1.0;
    
    const primaryMode = this.getCanvas().getPrimaryMode() || CanvasMode.DRAW;
    
    switch (primaryMode) {
      case CanvasMode.DRAW:
        this.handleDrawInteraction(x, y, pressure, 'move');
        break;
      case CanvasMode.PARAMETRIC:
        this.handleParametricInteraction(x, y, 'move');
        break;
    }
  }

  private handleDemoPointerUp(event: PointerEvent): void {
    const primaryMode = this.getCanvas().getPrimaryMode() || CanvasMode.DRAW;
    
    // Finalize interactions
    if (primaryMode === CanvasMode.DRAW) {
      // Trigger pattern recognition after drawing
      this.recognizeDrawnPattern();
    }
  }

  private handleDemoKeyDown(event: KeyboardEvent): void {
    // Demo shortcuts
    switch (event.key) {
      case '1':
        this.setPrimaryMode(CanvasMode.DRAW);
        this.showModeNotification('Draw Mode Active');
        break;
      case '2':
        this.setPrimaryMode(CanvasMode.PARAMETRIC);
        this.showModeNotification('Parametric Mode Active');
        break;
      case '3':
        this.setPrimaryMode(CanvasMode.CODE);
        this.showModeNotification('Code Mode Active');
        break;
      case '4':
        this.setPrimaryMode(CanvasMode.GROWTH);
        this.showModeNotification('Growth Mode Active');
        break;
      case 'd':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          this.toggleDemoMode();
        }
        break;
    }
  }

  // Mode-specific interaction handlers
  private handleDrawInteraction(x: number, y: number, pressure: number, phase: 'start' | 'move' | 'end'): void {
    const entityId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create stroke change that will propagate to other modes
    const change = {
      id: `draw_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: this.getModeType(CanvasMode.DRAW),
      changeType: ChangeType.STROKE_ADDED,
      priority: SyncPriority.USER_ACTION,
      data: {
        entityId,
        stroke: {
          points: [{ x, y }],
          pressure,
          color: '#000000',
          width: pressure * 5
        }
      }
    };
    
    // Apply change through sync engine
    this['syncEngine'].applyChange(change);
    
    // Demo effect: Show ripple effect at interaction point
    if (this.demoMode) {
      this.showInteractionFeedback(x, y, 'draw');
    }
  }

  private handleParametricInteraction(x: number, y: number, phase: 'start' | 'move' | 'end'): void {
    // Parametric mode: Adjust pattern parameters based on position
    const canvas = this.getCanvas()['mainCanvas'] as HTMLCanvasElement;
    const normalizedX = x / canvas.width;
    const normalizedY = y / canvas.height;
    
    // Update pattern parameters
    this.demoPatterns.grid.spacing = 10 + normalizedX * 50;
    this.demoPatterns.ichimatsu.tileSize = 20 + normalizedY * 60;
    
    const change = {
      id: `param_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: this.getModeType(CanvasMode.PARAMETRIC),
      changeType: ChangeType.PATTERN_APPLIED,
      priority: SyncPriority.USER_ACTION,
      data: {
        patternType: 'ichimatsu',
        parameters: {
          spacing: this.demoPatterns.grid.spacing,
          tileSize: this.demoPatterns.ichimatsu.tileSize,
          rotation: normalizedX * Math.PI * 2
        }
      }
    };
    
    this['syncEngine'].applyChange(change);
    
    if (this.demoMode) {
      this.showInteractionFeedback(x, y, 'parametric');
    }
  }

  private handleCodeInteraction(x: number, y: number, phase: 'start' | 'move' | 'end'): void {
    if (phase !== 'start') return;
    
    // Code mode: Generate code based on click position
    const code = this.generatePatternCode(x, y);
    
    const change = {
      id: `code_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: this.getModeType(CanvasMode.CODE),
      changeType: ChangeType.CODE_EXECUTED,
      priority: SyncPriority.USER_ACTION,
      data: {
        code,
        executionPoint: { x, y },
        result: 'Pattern function generated'
      }
    };
    
    this['syncEngine'].applyChange(change);
    
    if (this.demoMode) {
      this.showCodePreview(code, x, y);
    }
  }

  private handleGrowthInteraction(x: number, y: number, phase: 'start' | 'move' | 'end'): void {
    if (phase !== 'start') return;
    
    // Growth mode: Add growth seed
    this.demoPatterns.growth.seeds.push({ x, y });
    
    const change = {
      id: `growth_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: this.getModeType(CanvasMode.GROWTH),
      changeType: ChangeType.GROWTH_UPDATED,
      priority: SyncPriority.USER_ACTION,
      data: {
        seeds: this.demoPatterns.growth.seeds,
        generation: this.demoPatterns.growth.generation++,
        algorithm: 'organic',
        parameters: {
          speed: this.demoPatterns.growth.speed,
          density: 0.3
        }
      }
    };
    
    this['syncEngine'].applyChange(change);
    
    if (this.demoMode) {
      this.showGrowthAnimation(x, y);
    }
  }

  // Pattern recognition for drawn strokes
  private recognizeDrawnPattern(): void {
    // Analyze recent strokes to detect patterns
    const recentStrokes = this.interactionHistory
      .filter(h => h.type === 'pointerdown' && h.mode === CanvasMode.DRAW)
      .slice(-10);
    
    if (recentStrokes.length >= 4) {
      // Simple grid detection
      const isGrid = this.detectGridPattern(recentStrokes);
      
      if (isGrid) {
        // Automatically generate parametric pattern
        this.generateParametricFromDrawing(recentStrokes);
        this.showModeNotification('Grid pattern detected! Generating parametric controls...');
      }
    }
  }

  private detectGridPattern(strokes: any[]): boolean {
    // Simple heuristic: check if strokes form roughly perpendicular lines
    if (strokes.length < 4) return false;
    
    // Calculate average spacing
    const xPositions = strokes.map(s => s.x).sort((a, b) => a - b);
    const yPositions = strokes.map(s => s.y).sort((a, b) => a - b);
    
    let xSpacings = [];
    let ySpacings = [];
    
    for (let i = 1; i < xPositions.length; i++) {
      xSpacings.push(xPositions[i] - xPositions[i - 1]);
    }
    
    for (let i = 1; i < yPositions.length; i++) {
      ySpacings.push(yPositions[i] - yPositions[i - 1]);
    }
    
    // Check if spacings are regular (within 20% tolerance)
    const avgXSpacing = xSpacings.reduce((a, b) => a + b, 0) / xSpacings.length;
    const avgYSpacing = ySpacings.reduce((a, b) => a + b, 0) / ySpacings.length;
    
    const xRegular = xSpacings.every(s => Math.abs(s - avgXSpacing) / avgXSpacing < 0.2);
    const yRegular = ySpacings.every(s => Math.abs(s - avgYSpacing) / avgYSpacing < 0.2);
    
    return xRegular || yRegular;
  }

  private generateParametricFromDrawing(strokes: any[]): void {
    // Generate parametric pattern based on drawn strokes
    const bounds = this.calculateStrokeBounds(strokes);
    
    const change = {
      id: `auto_param_${Date.now()}`,
      timestamp: Date.now(),
      sourceMode: this.getModeType(CanvasMode.PARAMETRIC),
      changeType: ChangeType.PATTERN_APPLIED,
      priority: SyncPriority.DERIVED_CHANGE,
      data: {
        patternType: 'grid',
        parameters: {
          spacing: bounds.avgSpacing,
          rows: Math.floor(bounds.height / bounds.avgSpacing),
          cols: Math.floor(bounds.width / bounds.avgSpacing),
          originX: bounds.minX,
          originY: bounds.minY
        },
        sourceAnalysis: 'Detected from drawing'
      }
    };
    
    this['syncEngine'].applyChange(change);
  }

  private calculateStrokeBounds(strokes: any[]): any {
    const xs = strokes.map(s => s.x);
    const ys = strokes.map(s => s.y);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      avgSpacing: 30 // Simplified for demo
    };
  }

  private generatePatternCode(x: number, y: number): string {
    // Generate code based on current pattern state
    const pattern = this.demoPatterns;
    
    return `// Generated pattern at (${Math.round(x)}, ${Math.round(y)})
function createPattern(ctx, width, height) {
  const spacing = ${pattern.grid.spacing.toFixed(1)};
  const tileSize = ${pattern.ichimatsu.tileSize.toFixed(1)};
  
  // Draw Ichimatsu pattern
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
  
  // Add growth seeds
  ${pattern.growth.seeds.map(seed => 
    `growthEngine.addSeed(${seed.x.toFixed(1)}, ${seed.y.toFixed(1)});`
  ).join('\n  ')}
}`;
  }

  // Visual feedback methods
  private showInteractionFeedback(x: number, y: number, mode: string): void {
    const canvas = this.getCanvas();
    const ctx = canvas['contexts'].get(CanvasMode.DRAW);
    if (!ctx) return;
    
    // Draw ripple effect
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = this.getModeColor(mode);
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        ctx.beginPath();
        ctx.arc(x, y, 10 + i * 15, 0, Math.PI * 2);
        ctx.stroke();
      }, i * 100);
    }
    
    ctx.restore();
  }

  private showCodePreview(code: string, x: number, y: number): void {
    // Create temporary overlay to show generated code
    const preview = document.createElement('div');
    preview.className = 'code-preview-popup';
    preview.style.cssText = `
      position: absolute;
      left: ${x + 20}px;
      top: ${y + 20}px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      max-width: 400px;
      white-space: pre-wrap;
      z-index: 1000;
      pointer-events: none;
      animation: fadeInOut 3s ease-in-out;
    `;
    preview.textContent = code.split('\n').slice(0, 5).join('\n') + '\n...';
    
    document.body.appendChild(preview);
    
    setTimeout(() => {
      preview.remove();
    }, 3000);
  }

  private showGrowthAnimation(x: number, y: number): void {
    const canvas = this.getCanvas();
    const ctx = canvas['contexts'].get(CanvasMode.GROWTH);
    if (!ctx) return;
    
    // Animate growth from seed point
    let radius = 0;
    const maxRadius = 50;
    const animate = () => {
      if (radius < maxRadius) {
        ctx.save();
        ctx.globalAlpha = 1 - (radius / maxRadius);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        radius += 2;
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private showModeNotification(message: string): void {
    // Create notification overlay
    const notification = document.createElement('div');
    notification.className = 'mode-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  private getModeColor(mode: string): string {
    const colors: { [key: string]: string } = {
      draw: '#0088ff',
      parametric: '#ff00ff',
      code: '#00ff00',
      growth: '#ff8800'
    };
    return colors[mode] || '#ffffff';
  }

  private getModeType(canvasMode: CanvasMode): any {
    const mapping = {
      [CanvasMode.DRAW]: 0,
      [CanvasMode.PARAMETRIC]: 1,
      [CanvasMode.CODE]: 2,
      [CanvasMode.GROWTH]: 3
    };
    return mapping[canvasMode];
  }

  // Demo scenarios
  public startDemoScenario(scenario: DemoScenario): void {
    this.currentScenario = scenario;
    this.currentStep = 0;
    this.demoMode = true;
    
    console.log(`🎬 Starting demo scenario: ${scenario.name}`);
    this.showModeNotification(`Demo: ${scenario.name}`);
    
    this.executeNextDemoStep();
  }

  private executeNextDemoStep(): void {
    if (!this.currentScenario || this.currentStep >= this.currentScenario.steps.length) {
      this.completeDemoScenario();
      return;
    }
    
    const step = this.currentScenario.steps[this.currentStep];
    console.log(`📍 Executing step ${this.currentStep + 1}: ${step.action}`);
    
    // Execute the step
    this.setPrimaryMode(step.mode);
    
    // Simulate the action
    setTimeout(() => {
      this.simulateDemoAction(step);
      this.currentStep++;
      
      // Continue to next step after delay
      setTimeout(() => {
        this.executeNextDemoStep();
      }, 2000);
    }, 1000);
  }

  private simulateDemoAction(step: DemoStep): void {
    // Simulate user interactions based on step data
    const { action, mode, data } = step;
    
    switch (action) {
      case 'draw':
        data.points.forEach((point: any, index: number) => {
          setTimeout(() => {
            this.handleDrawInteraction(point.x, point.y, 1.0, 'start');
          }, index * 100);
        });
        break;
        
      case 'adjust_parameter':
        this.handleParametricInteraction(data.x, data.y, 'start');
        break;
        
      case 'execute_code':
        this.handleCodeInteraction(data.x, data.y, 'start');
        break;
        
      case 'add_growth':
        this.handleGrowthInteraction(data.x, data.y, 'start');
        break;
    }
    
    this.showModeNotification(step.expectedResult);
  }

  private completeDemoScenario(): void {
    console.log(`✅ Demo scenario completed: ${this.currentScenario?.name}`);
    this.showModeNotification('Demo completed!');
    this.currentScenario = null;
    this.demoMode = false;
  }

  public toggleDemoMode(): void {
    this.demoMode = !this.demoMode;
    this.showModeNotification(this.demoMode ? 'Demo Mode ON' : 'Demo Mode OFF');
    
    if (this.demoMode) {
      // Add demo mode styles
      const style = document.createElement('style');
      style.id = 'demo-mode-styles';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes slideUp {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, -20px); }
        }
        
        .code-preview-popup {
          box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
        }
        
        .mode-notification {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
      `;
      document.head.appendChild(style);
    } else {
      // Remove demo mode styles
      document.getElementById('demo-mode-styles')?.remove();
    }
  }

  // Pre-defined demo scenarios
  public static readonly DEMO_SCENARIOS: DemoScenario[] = [
    {
      name: 'Pattern Creation Flow',
      description: 'Draw a grid, see parametric controls, generate code, watch growth',
      steps: [
        {
          action: 'draw',
          mode: CanvasMode.DRAW,
          data: {
            points: [
              { x: 100, y: 100 }, { x: 200, y: 100 },
              { x: 100, y: 200 }, { x: 200, y: 200 }
            ]
          },
          expectedResult: 'Drawing grid pattern...'
        },
        {
          action: 'adjust_parameter',
          mode: CanvasMode.PARAMETRIC,
          data: { x: 300, y: 300 },
          expectedResult: 'Parametric controls generated!'
        },
        {
          action: 'execute_code',
          mode: CanvasMode.CODE,
          data: { x: 400, y: 400 },
          expectedResult: 'Pattern code generated!'
        },
        {
          action: 'add_growth',
          mode: CanvasMode.GROWTH,
          data: { x: 250, y: 250 },
          expectedResult: 'Growth algorithm animating!'
        }
      ]
    },
    {
      name: 'Bidirectional Editing',
      description: 'Changes in any mode instantly reflect in all others',
      steps: [
        {
          action: 'adjust_parameter',
          mode: CanvasMode.PARAMETRIC,
          data: { x: 200, y: 200 },
          expectedResult: 'Adjusting pattern spacing...'
        },
        {
          action: 'draw',
          mode: CanvasMode.DRAW,
          data: {
            points: [{ x: 150, y: 150 }]
          },
          expectedResult: 'Drawing updates parameters!'
        },
        {
          action: 'execute_code',
          mode: CanvasMode.CODE,
          data: { x: 300, y: 300 },
          expectedResult: 'Code changes update visuals!'
        }
      ]
    }
  ];
}