import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Share2, 
  Download, 
  Upload,
  Plus,
  Minus,
  Sliders,
  Layers,
  Palette,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  CustomPattern, 
  PatternParameterConfig, 
  AnimationConfig, 
  PatternCombination,
  Color,
  PatternGeneratorOptions
} from '../../types/graphics';
import { AdvancedPatternGenerator } from '../../graphics/patterns/AdvancedPatternGenerator';
import { PatternType } from '../../graphics/patterns/CulturalPatternGenerator';
import { PatternStorageService } from '../../services/PatternStorageService';

interface PatternBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  initialPattern?: CustomPattern;
  onSave?: (pattern: CustomPattern) => void;
}

export function PatternBuilder({ isOpen, onClose, initialPattern, onSave }: PatternBuilderProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'animate' | 'combine'>('design');
  const [currentPattern, setCurrentPattern] = useState<CustomPattern | null>(initialPattern || null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    enabled: false,
    duration: 2,
    direction: 'forward',
    easing: 'ease',
    animatedParams: ['rotation'],
    keyframes: [
      { time: 0, parameters: { rotation: 0 } },
      { time: 1, parameters: { rotation: 360 } }
    ]
  });
  const [patternCombination, setPatternCombination] = useState<PatternCombination>({
    id: crypto.randomUUID(),
    patterns: [],
    compositionMode: 'overlay'
  });
  const [selectedBasePattern, setSelectedBasePattern] = useState<PatternType>(PatternType.Ichimatsu);
  const [patternParameters, setPatternParameters] = useState<PatternParameterConfig[]>([]);
  const [previewSize, setPreviewSize] = useState({ width: 400, height: 400 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatorRef = useRef<AdvancedPatternGenerator | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize pattern generator
  useEffect(() => {
    if (!generatorRef.current) {
      generatorRef.current = new AdvancedPatternGenerator();
    }
    
    return () => {
      if (generatorRef.current) {
        generatorRef.current.destroy();
      }
    };
  }, []);

  // Initialize default parameters
  useEffect(() => {
    if (!currentPattern) {
      setPatternParameters(getDefaultParameters(selectedBasePattern));
    } else {
      setPatternParameters(currentPattern.parameters);
      setSelectedBasePattern(currentPattern.basePattern as PatternType);
    }
  }, [selectedBasePattern, currentPattern]);

  // Update preview when parameters change
  useEffect(() => {
    updatePreview();
  }, [patternParameters, selectedBasePattern, previewSize]);

  const updatePreview = useCallback(() => {
    if (!generatorRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = previewSize.width;
    canvas.height = previewSize.height;

    const options = buildOptionsFromParameters(patternParameters);
    const imageData = generatorRef.current.generatePattern(
      selectedBasePattern,
      previewSize.width,
      previewSize.height,
      options
    );

    ctx.putImageData(imageData, 0, 0);
  }, [patternParameters, selectedBasePattern, previewSize]);

  const buildOptionsFromParameters = (params: PatternParameterConfig[]): PatternGeneratorOptions => {
    const options: PatternGeneratorOptions = {
      scale: 1,
      rotation: 0,
      color1: { r: 0, g: 0, b: 0, a: 1 },
      color2: { r: 1, g: 1, b: 1, a: 1 }
    };

    params.forEach(param => {
      if (param.type === 'color') {
        const hex = param.value as string;
        (options as any)[param.name] = hexToColor(hex);
      } else {
        (options as any)[param.name] = param.value;
      }
    });

    return options;
  };

  const hexToColor = (hex: string): Color => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0, a: 1 };
    
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      a: 1
    };
  };

  const colorToHex = (color: Color): string => {
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setPatternParameters(prev => 
      prev.map(param => 
        param.name === paramName 
          ? { ...param, value }
          : param
      )
    );
  };

  const startAnimation = () => {
    if (!generatorRef.current || !canvasRef.current) return;

    setIsAnimating(true);
    
    generatorRef.current.generateAnimatedPattern(
      selectedBasePattern,
      previewSize.width,
      previewSize.height,
      buildOptionsFromParameters(patternParameters),
      animationConfig,
      (imageData) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.putImageData(imageData, 0, 0);
      }
    );
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (generatorRef.current) {
      generatorRef.current.stopAnimation();
    }
    updatePreview();
  };

  const savePattern = () => {
    const pattern: CustomPattern = {
      id: currentPattern?.id || crypto.randomUUID(),
      name: currentPattern?.name || `Custom ${selectedBasePattern}`,
      description: currentPattern?.description || 'Custom pattern created in Pattern Builder',
      basePattern: selectedBasePattern,
      parameters: patternParameters,
      animation: animationConfig.enabled ? animationConfig : undefined,
      combinations: patternCombination.patterns.length > 0 ? [patternCombination] : undefined,
      createdAt: currentPattern?.createdAt || new Date(),
      modifiedAt: new Date(),
      tags: currentPattern?.tags || ['custom'],
      isPublic: currentPattern?.isPublic || false
    };

    PatternStorageService.savePattern(pattern);
    setCurrentPattern(pattern);
    
    if (onSave) {
      onSave(pattern);
    }
  };

  const sharePattern = () => {
    if (!currentPattern) return;
    
    const shareUrl = PatternStorageService.generateShareableUrl(currentPattern);
    navigator.clipboard.writeText(shareUrl);
    
    // Show success message (you might want to add a toast notification here)
    console.log('Pattern share URL copied to clipboard:', shareUrl);
  };

  const exportPattern = (format: 'png' | 'svg' | 'json') => {
    if (!currentPattern || !generatorRef.current) return;

    const result = generatorRef.current.exportPattern(
      currentPattern,
      previewSize.width,
      previewSize.height,
      format
    );

    if (result instanceof Promise) {
      result.then(blob => downloadBlob(blob, `pattern.${format}`));
    } else {
      downloadText(result, `pattern.${format}`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, filename);
  };

  const addParameterToAnimation = (paramName: string) => {
    setAnimationConfig(prev => ({
      ...prev,
      animatedParams: [...prev.animatedParams, paramName]
    }));
  };

  const removeParameterFromAnimation = (paramName: string) => {
    setAnimationConfig(prev => ({
      ...prev,
      animatedParams: prev.animatedParams.filter(p => p !== paramName)
    }));
  };

  const renderParameterControl = (param: PatternParameterConfig) => {
    switch (param.type) {
      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              value={param.value as number}
              onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm w-16 text-right">{param.value}</span>
          </div>
        );
      
      case 'color':
        return (
          <input
            type="color"
            value={param.value as string}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={param.value as boolean}
              onChange={(e) => handleParameterChange(param.name, e.target.checked)}
              className="rounded"
            />
            <span>Enabled</span>
          </label>
        );
      
      case 'select':
        return (
          <select
            value={param.value as string}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
          >
            {param.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={param.value as string}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-2xl font-bold">Pattern Builder</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={savePattern}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={sharePattern}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'animate', label: 'Animate', icon: Play },
              { id: 'combine', label: 'Combine', icon: Layers }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Controls Panel */}
            <div className="w-1/3 border-r border-border p-6 overflow-y-auto">
              {activeTab === 'design' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Base Pattern</h3>
                    <select
                      value={selectedBasePattern}
                      onChange={(e) => setSelectedBasePattern(e.target.value as PatternType)}
                      className="w-full p-2 rounded border border-border bg-background"
                    >
                      {Object.values(PatternType).map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Parameters</h3>
                    <div className="space-y-4">
                      {patternParameters.map((param) => (
                        <div key={param.name}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">
                              {param.name}
                            </label>
                            {activeTab === 'animate' && (
                              <button
                                onClick={() => {
                                  if (animationConfig.animatedParams.includes(param.name)) {
                                    removeParameterFromAnimation(param.name);
                                  } else {
                                    addParameterToAnimation(param.name);
                                  }
                                }}
                                className={`p-1 rounded ${
                                  animationConfig.animatedParams.includes(param.name)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                <Play className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {renderParameterControl(param)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'animate' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Animation Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Duration (seconds)</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={animationConfig.duration}
                          onChange={(e) => setAnimationConfig(prev => ({
                            ...prev,
                            duration: parseFloat(e.target.value)
                          }))}
                          className="w-full p-2 rounded border border-border bg-background"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Direction</label>
                        <select
                          value={animationConfig.direction}
                          onChange={(e) => setAnimationConfig(prev => ({
                            ...prev,
                            direction: e.target.value as any
                          }))}
                          className="w-full p-2 rounded border border-border bg-background"
                        >
                          <option value="forward">Forward</option>
                          <option value="reverse">Reverse</option>
                          <option value="alternate">Alternate</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Easing</label>
                        <select
                          value={animationConfig.easing}
                          onChange={(e) => setAnimationConfig(prev => ({
                            ...prev,
                            easing: e.target.value as any
                          }))}
                          className="w-full p-2 rounded border border-border bg-background"
                        >
                          <option value="linear">Linear</option>
                          <option value="ease">Ease</option>
                          <option value="ease-in">Ease In</option>
                          <option value="ease-out">Ease Out</option>
                          <option value="ease-in-out">Ease In Out</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Animation Controls</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={isAnimating ? stopAnimation : startAnimation}
                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 ${
                          isAnimating
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {isAnimating ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          stopAnimation();
                          updatePreview();
                        }}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'combine' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Pattern Combination</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add multiple patterns to create complex compositions
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Composition Mode</label>
                        <select
                          value={patternCombination.compositionMode}
                          onChange={(e) => setPatternCombination(prev => ({
                            ...prev,
                            compositionMode: e.target.value as any
                          }))}
                          className="w-full p-2 rounded border border-border bg-background"
                        >
                          <option value="overlay">Overlay</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="difference">Difference</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          // Add logic to add pattern to combination
                        }}
                        className="w-full py-2 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Pattern Layer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportPattern('png')}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title="Export as PNG"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportPattern('svg')}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title="Export as SVG"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportPattern('json')}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title="Export as JSON"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={previewSize.width}
                  height={previewSize.height}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center gap-4">
                <label className="text-sm font-medium">Preview Size:</label>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={previewSize.width}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    setPreviewSize({ width: size, height: size });
                  }}
                  className="flex-1"
                />
                <span className="text-sm">{previewSize.width}px</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function to get default parameters for a pattern
function getDefaultParameters(pattern: PatternType): PatternParameterConfig[] {
  const baseParams: PatternParameterConfig[] = [
    {
      name: 'scale',
      type: 'range',
      min: 0.1,
      max: 3,
      step: 0.1,
      value: 1,
      description: 'Scale of the pattern'
    },
    {
      name: 'rotation',
      type: 'range',
      min: 0,
      max: 360,
      step: 1,
      value: 0,
      description: 'Rotation angle in degrees'
    },
    {
      name: 'color1',
      type: 'color',
      value: '#1e40af',
      description: 'Primary color'
    },
    {
      name: 'color2',
      type: 'color',
      value: '#60a5fa',
      description: 'Secondary color'
    }
  ];

  // Add pattern-specific parameters
  switch (pattern) {
    case PatternType.Seigaiha:
      baseParams.push({
        name: 'waveHeight',
        type: 'range',
        min: 0.5,
        max: 2,
        step: 0.1,
        value: 1,
        description: 'Wave height multiplier'
      });
      break;
    case PatternType.Asanoha:
      baseParams.push({
        name: 'lineWidth',
        type: 'range',
        min: 1,
        max: 5,
        step: 0.5,
        value: 2,
        description: 'Line width'
      });
      break;
    case PatternType.Tatewaku:
      baseParams.push({
        name: 'complexity',
        type: 'range',
        min: 3,
        max: 10,
        step: 1,
        value: 5,
        description: 'Pattern complexity'
      });
      break;
  }

  return baseParams;
}