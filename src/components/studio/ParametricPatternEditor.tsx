/**
 * Parametric Pattern Editor Component for Genshi Studio
 * Provides a user interface for creating and editing parametric patterns
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdvancedParametricPatternSystem, PatternPreset, PatternExportOptions } from '../../graphics/patterns/AdvancedParametricPatternSystem';
import { MathematicalPatternType } from '../../graphics/patterns/MathematicalPatternGenerators';
import { ParameterType } from '../../graphics/patterns/ParametricPatternEngine';
import { Size } from '../../types/graphics';

interface ParametricPatternEditorProps {
  width: number;
  height: number;
  onPatternChange?: (patternData: any) => void;
  onExport?: (blob: Blob) => void;
  className?: string;
}

interface ParameterControl {
  name: string;
  type: ParameterType;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
  group?: string;
}

export const ParametricPatternEditor: React.FC<ParametricPatternEditorProps> = ({
  width,
  height,
  onPatternChange,
  onExport,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patternSystemRef = useRef<AdvancedParametricPatternSystem | null>(null);
  
  const [currentPatternType, setCurrentPatternType] = useState<MathematicalPatternType>(
    MathematicalPatternType.ISLAMIC_GEOMETRIC
  );
  const [parameters, setParameters] = useState<Map<string, any>>(new Map());
  const [parameterControls, setParameterControls] = useState<ParameterControl[]>([]);
  const [presets, setPresets] = useState<PatternPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0
  });
  const [activeTab, setActiveTab] = useState<'parameters' | 'presets' | 'export' | 'performance'>('parameters');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Transform', 'Colors']));

  // Initialize pattern system
  useEffect(() => {
    if (canvasRef.current) {
      patternSystemRef.current = new AdvancedParametricPatternSystem(canvasRef.current);
      
      // Initialize session
      patternSystemRef.current.initializeSession(currentPatternType);
      
      // Load presets
      setPresets(patternSystemRef.current.getPresets());
      
      // Initialize parameters
      updateParameterControls();
      
      // Initial render
      generatePattern();
      
      // Performance monitoring
      const interval = setInterval(updatePerformanceMetrics, 1000);
      
      return () => {
        clearInterval(interval);
        patternSystemRef.current?.destroy();
      };
    }
  }, []);

  // Update pattern when type changes
  useEffect(() => {
    if (patternSystemRef.current) {
      patternSystemRef.current.initializeSession(currentPatternType);
      updateParameterControls();
      generatePattern();
    }
  }, [currentPatternType]);

  const updateParameterControls = useCallback(() => {
    if (!patternSystemRef.current) return;
    
    const allParams = patternSystemRef.current.getAllParameters();
    const controls: ParameterControl[] = [];
    
    // Generate controls based on current parameters
    for (const [name, value] of allParams) {
      const control = createParameterControl(name, value);
      if (control) {
        controls.push(control);
      }
    }
    
    setParameterControls(controls);
    setParameters(new Map(allParams));
  }, []);

  const createParameterControl = (name: string, value: any): ParameterControl | null => {
    let control: ParameterControl = {
      name,
      type: ParameterType.NUMBER,
      value,
      description: getParameterDescription(name)
    };
    
    // Determine control type and constraints based on parameter name and value
    if (name.includes('Color') || name.includes('color')) {
      control.type = ParameterType.COLOR;
      control.group = 'Colors';
    } else if (name === 'rotation' || name.includes('Angle')) {
      control.type = ParameterType.ANGLE;
      control.min = 0;
      control.max = 360;
      control.step = 1;
      control.group = 'Transform';
    } else if (name === 'scale') {
      control.type = ParameterType.RANGE;
      control.min = 0.1;
      control.max = 5.0;
      control.step = 0.1;
      control.group = 'Transform';
    } else if (name.includes('offset') || name.includes('Offset')) {
      control.type = ParameterType.RANGE;
      control.min = -100;
      control.max = 100;
      control.step = 0.1;
      control.group = 'Transform';
    } else if (name.includes('opacity') || name.includes('Opacity')) {
      control.type = ParameterType.PERCENTAGE;
      control.min = 0;
      control.max = 100;
      control.step = 1;
      control.group = 'Colors';
    } else if (typeof value === 'boolean') {
      control.type = ParameterType.BOOLEAN;
      control.group = 'Options';
    } else if (typeof value === 'number') {
      control.type = ParameterType.RANGE;
      control.min = getParameterMin(name);
      control.max = getParameterMax(name);
      control.step = getParameterStep(name);
      control.group = getParameterGroup(name);
    } else if (name.includes('colorScheme') || name.includes('ColorScheme')) {
      control.type = ParameterType.SELECT;
      control.options = ['rainbow', 'fire', 'ice', 'monochrome'];
      control.group = 'Colors';
    }
    
    return control;
  };

  const getParameterDescription = (name: string): string => {
    const descriptions: { [key: string]: string } = {
      'scale': 'Overall size of the pattern',
      'rotation': 'Rotation angle in degrees',
      'symmetry': 'Number of symmetry axes',
      'complexity': 'Pattern complexity level',
      'fractalIterations': 'Number of fractal iterations',
      'fractalZoom': 'Zoom level for fractal view',
      'voronoiPointCount': 'Number of Voronoi seed points',
      'tileSize': 'Size of individual tiles',
      'strokeWidth': 'Width of pattern strokes',
      'primaryColor': 'Primary pattern color',
      'secondaryColor': 'Secondary pattern color',
      'backgroundColor': 'Background color'
    };
    
    return descriptions[name] || `${name} parameter`;
  };

  const getParameterMin = (name: string): number => {
    const mins: { [key: string]: number } = {
      'symmetry': 3,
      'complexity': 1,
      'fractalIterations': 10,
      'fractalZoom': 0.1,
      'voronoiPointCount': 5,
      'tileSize': 10,
      'strokeWidth': 0.5
    };
    
    return mins[name] || 0;
  };

  const getParameterMax = (name: string): number => {
    const maxs: { [key: string]: number } = {
      'symmetry': 16,
      'complexity': 10,
      'fractalIterations': 500,
      'fractalZoom': 1000,
      'voronoiPointCount': 200,
      'tileSize': 100,
      'strokeWidth': 10
    };
    
    return maxs[name] || 100;
  };

  const getParameterStep = (name: string): number => {
    const steps: { [key: string]: number } = {
      'symmetry': 1,
      'complexity': 1,
      'fractalIterations': 10,
      'fractalZoom': 0.1,
      'voronoiPointCount': 5,
      'tileSize': 1,
      'strokeWidth': 0.1
    };
    
    return steps[name] || 0.1;
  };

  const getParameterGroup = (name: string): string => {
    if (name.includes('fractal') || name.includes('Fractal')) return 'Fractal';
    if (name.includes('voronoi') || name.includes('Voronoi')) return 'Voronoi';
    if (name.includes('tile') || name.includes('Tile')) return 'Tiles';
    if (name.includes('animation') || name.includes('Animation')) return 'Animation';
    
    return 'General';
  };

  const generatePattern = useCallback(() => {
    if (!patternSystemRef.current) return;
    
    const resolution: Size = { width, height };
    patternSystemRef.current.generatePattern(currentPatternType, resolution, true);
    
    // Trigger change callback
    if (onPatternChange) {
      onPatternChange({
        type: currentPatternType,
        parameters: Object.fromEntries(parameters)
      });
    }
  }, [currentPatternType, parameters, width, height, onPatternChange]);

  const handleParameterChange = (name: string, value: any) => {
    if (!patternSystemRef.current) return;
    
    const success = patternSystemRef.current.setParameter(name, value);
    if (success) {
      const newParams = new Map(parameters);
      newParams.set(name, value);
      setParameters(newParams);
      
      // Re-generate pattern with debouncing
      setTimeout(generatePattern, 100);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    if (!patternSystemRef.current) return;
    
    const success = patternSystemRef.current.applyPreset(presetId);
    if (success) {
      setSelectedPreset(presetId);
      updateParameterControls();
      generatePattern();
    }
  };

  const handleRandomize = () => {
    if (!patternSystemRef.current) return;
    
    const animatableParams = parameterControls
      .filter(control => control.type !== ParameterType.BOOLEAN)
      .map(control => control.name);
    
    // Set each parameter individually
    animatableParams.forEach(name => {
      patternSystemRef.current.setParameter(name, generateRandomValue(name));
    });
    
    updateParameterControls();
    generatePattern();
  };

  const generateRandomValue = (paramName: string): any => {
    const control = parameterControls.find(c => c.name === paramName);
    if (!control) return 0;
    
    switch (control.type) {
      case ParameterType.RANGE:
      case ParameterType.NUMBER:
        const min = control.min || 0;
        const max = control.max || 100;
        return min + Math.random() * (max - min);
      
      case ParameterType.ANGLE:
        return Math.random() * 360;
      
      case ParameterType.PERCENTAGE:
        return Math.random() * 100;
      
      case ParameterType.COLOR:
        return {
          r: Math.random(),
          g: Math.random(),
          b: Math.random(),
          a: 1.0
        };
      
      case ParameterType.SELECT:
        const options = control.options || [];
        return options[Math.floor(Math.random() * options.length)];
      
      default:
        return control.value;
    }
  };

  const handleExport = async (format: 'png' | 'webp' | 'svg' | 'json') => {
    if (!patternSystemRef.current) return;
    
    setIsExporting(true);
    
    try {
      const options: PatternExportOptions = {
        format,
        resolution: { width: width * 2, height: height * 2 }, // Export at 2x resolution
        quality: 0.9,
        includeMetadata: true
      };
      
      const result = await patternSystemRef.current.exportPattern(currentPatternType, options);
      
      if (result instanceof Blob && onExport) {
        onExport(result);
      } else if (typeof result === 'string') {
        // Handle SVG or JSON export
        const blob = new Blob([result], { 
          type: format === 'svg' ? 'image/svg+xml' : 'application/json' 
        });
        if (onExport) {
          onExport(blob);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleAnimation = () => {
    if (!patternSystemRef.current) return;
    
    if (isAnimating) {
      patternSystemRef.current.stopAnimation();
    } else {
      patternSystemRef.current.startAnimation(currentPatternType, { width, height });
    }
    
    setIsAnimating(!isAnimating);
  };

  const updatePerformanceMetrics = () => {
    if (!patternSystemRef.current) return;
    
    const metrics = patternSystemRef.current.getPerformanceMetrics();
    setPerformanceMetrics({
      fps: metrics.renderer.fps,
      renderTime: metrics.renderer.avgRenderTime,
      memoryUsage: metrics.system.memoryUsage
    });
  };

  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const renderParameterControl = (control: ParameterControl) => {
    const value = parameters.get(control.name);
    
    switch (control.type) {
      case ParameterType.RANGE:
      case ParameterType.NUMBER:
        return (
          <div key={control.name} className="parameter-control">
            <label>{control.name}: {value?.toFixed(2)}</label>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              onChange={(e) => handleParameterChange(control.name, parseFloat(e.target.value))}
            />
          </div>
        );
      
      case ParameterType.ANGLE:
        return (
          <div key={control.name} className="parameter-control">
            <label>{control.name}: {value}°</label>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={value}
              onChange={(e) => handleParameterChange(control.name, parseInt(e.target.value))}
            />
          </div>
        );
      
      case ParameterType.COLOR:
        return (
          <div key={control.name} className="parameter-control">
            <label>{control.name}</label>
            <input
              type="color"
              value={`#${Math.floor(value.r * 255).toString(16).padStart(2, '0')}${Math.floor(value.g * 255).toString(16).padStart(2, '0')}${Math.floor(value.b * 255).toString(16).padStart(2, '0')}`}
              onChange={(e) => {
                const hex = e.target.value.substring(1);
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                handleParameterChange(control.name, { r, g, b, a: 1.0 });
              }}
            />
          </div>
        );
      
      case ParameterType.BOOLEAN:
        return (
          <div key={control.name} className="parameter-control">
            <label>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleParameterChange(control.name, e.target.checked)}
              />
              {control.name}
            </label>
          </div>
        );
      
      case ParameterType.SELECT:
        return (
          <div key={control.name} className="parameter-control">
            <label>{control.name}</label>
            <select
              value={value}
              onChange={(e) => handleParameterChange(control.name, e.target.value)}
            >
              {control.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderParameterGroups = () => {
    const groups: { [key: string]: ParameterControl[] } = {};
    
    parameterControls.forEach(control => {
      const group = control.group || 'General';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(control);
    });
    
    return Object.entries(groups).map(([groupName, controls]) => (
      <div key={groupName} className="parameter-group">
        <button
          className="group-header"
          onClick={() => toggleGroupExpansion(groupName)}
        >
          {groupName} {expandedGroups.has(groupName) ? '▼' : '▶'}
        </button>
        {expandedGroups.has(groupName) && (
          <div className="group-content">
            {controls.map(renderParameterControl)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={`parametric-pattern-editor ${className}`}>
      <div className="editor-header">
        <div className="pattern-type-selector">
          <select
            value={currentPatternType}
            onChange={(e) => setCurrentPatternType(e.target.value as MathematicalPatternType)}
          >
            <option value={MathematicalPatternType.ISLAMIC_GEOMETRIC}>Islamic Geometric</option>
            <option value={MathematicalPatternType.PENROSE_TILING}>Penrose Tiling</option>
            <option value={MathematicalPatternType.TRUCHET_TILES}>Truchet Tiles</option>
            <option value={MathematicalPatternType.MANDELBROT}>Mandelbrot Set</option>
            <option value={MathematicalPatternType.JULIA_SET}>Julia Set</option>
            <option value={MathematicalPatternType.VORONOI}>Voronoi Diagram</option>
            <option value={MathematicalPatternType.CELTIC_KNOT}>Celtic Knot</option>
            <option value={MathematicalPatternType.GIRIH_TILES}>Girih Tiles</option>
          </select>
        </div>
        
        <div className="editor-controls">
          <button onClick={handleRandomize}>Randomize</button>
          <button onClick={toggleAnimation}>
            {isAnimating ? 'Stop' : 'Animate'}
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="pattern-canvas"
          />
        </div>
        
        <div className="controls-panel">
          <div className="tab-navigation">
            <button
              className={activeTab === 'parameters' ? 'active' : ''}
              onClick={() => setActiveTab('parameters')}
            >
              Parameters
            </button>
            <button
              className={activeTab === 'presets' ? 'active' : ''}
              onClick={() => setActiveTab('presets')}
            >
              Presets
            </button>
            <button
              className={activeTab === 'export' ? 'active' : ''}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
            <button
              className={activeTab === 'performance' ? 'active' : ''}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'parameters' && (
              <div className="parameters-tab">
                <div className="parameter-controls">
                  {renderParameterGroups()}
                </div>
              </div>
            )}
            
            {activeTab === 'presets' && (
              <div className="presets-tab">
                <div className="preset-list">
                  {presets.map(preset => (
                    <div
                      key={preset.id}
                      className={`preset-item ${selectedPreset === preset.id ? 'selected' : ''}`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <h4>{preset.name}</h4>
                      <p>{preset.description}</p>
                      <div className="preset-tags">
                        {preset.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'export' && (
              <div className="export-tab">
                <div className="export-options">
                  <h3>Export Pattern</h3>
                  <div className="export-buttons">
                    <button
                      onClick={() => handleExport('png')}
                      disabled={isExporting}
                    >
                      Export PNG
                    </button>
                    <button
                      onClick={() => handleExport('webp')}
                      disabled={isExporting}
                    >
                      Export WebP
                    </button>
                    <button
                      onClick={() => handleExport('svg')}
                      disabled={isExporting}
                    >
                      Export SVG
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      disabled={isExporting}
                    >
                      Export Config
                    </button>
                  </div>
                  {isExporting && <div className="export-progress">Exporting...</div>}
                </div>
              </div>
            )}
            
            {activeTab === 'performance' && (
              <div className="performance-tab">
                <div className="performance-metrics">
                  <h3>Performance</h3>
                  <div className="metric">
                    <span>FPS: {performanceMetrics.fps}</span>
                  </div>
                  <div className="metric">
                    <span>Render Time: {performanceMetrics.renderTime.toFixed(2)}ms</span>
                  </div>
                  <div className="metric">
                    <span>Memory: {performanceMetrics.memoryUsage.toFixed(2)}MB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* TODO: Move styles to CSS modules or styled-components */}
      <style>{`
        .parametric-pattern-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f5f5;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid #ddd;
        }
        
        .pattern-type-selector select {
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .editor-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .editor-controls button {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .editor-controls button:hover {
          background: #0056b3;
        }
        
        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .canvas-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
          border-right: 1px solid #ddd;
        }
        
        .pattern-canvas {
          max-width: 100%;
          max-height: 100%;
          border: 1px solid #ccc;
        }
        
        .controls-panel {
          width: 300px;
          display: flex;
          flex-direction: column;
          background: white;
        }
        
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #ddd;
        }
        
        .tab-navigation button {
          flex: 1;
          padding: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .tab-navigation button.active {
          background: #007bff;
          color: white;
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .parameter-group {
          margin-bottom: 1rem;
        }
        
        .group-header {
          width: 100%;
          text-align: left;
          padding: 0.5rem;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .group-content {
          padding: 0.5rem 0;
        }
        
        .parameter-control {
          margin-bottom: 0.75rem;
        }
        
        .parameter-control label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .parameter-control input[type="range"] {
          width: 100%;
        }
        
        .parameter-control input[type="color"] {
          width: 100%;
          height: 2rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .parameter-control select {
          width: 100%;
          padding: 0.25rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .preset-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .preset-item {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .preset-item:hover {
          background: #f8f9fa;
        }
        
        .preset-item.selected {
          background: #e3f2fd;
          border-color: #007bff;
        }
        
        .preset-item h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
        }
        
        .preset-item p {
          margin: 0 0 0.5rem 0;
          font-size: 0.75rem;
          color: #666;
        }
        
        .preset-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        .tag {
          padding: 0.125rem 0.5rem;
          background: #e9ecef;
          border-radius: 12px;
          font-size: 0.625rem;
          color: #495057;
        }
        
        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .export-buttons button {
          padding: 0.5rem 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .export-buttons button:hover {
          background: #218838;
        }
        
        .export-buttons button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .export-progress {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          text-align: center;
        }
        
        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .metric {
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
          font-family: monospace;
        }
        
        @media (max-width: 768px) {
          .editor-content {
            flex-direction: column;
          }
          
          .controls-panel {
            width: 100%;
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
};