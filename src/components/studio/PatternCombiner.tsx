import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Layers, 
  Eye, 
  EyeOff, 
  Move, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  Blend,
  Palette
} from 'lucide-react';
import { 
  PatternCombination, 
  CustomPattern, 
  BlendMode,
  Point
} from '../../types/graphics';
import { PatternType } from '../../graphics/patterns/CulturalPatternGenerator';
import { AdvancedPatternGenerator } from '../../graphics/patterns/AdvancedPatternGenerator';
import { PatternStorageService } from '../../services/PatternStorageService';

interface PatternLayer {
  id: string;
  patternId: string;
  name: string;
  pattern: CustomPattern;
  blendMode: BlendMode;
  opacity: number;
  offset: Point;
  scale: number;
  rotation: number;
  visible: boolean;
}

interface PatternCombinerProps {
  onCombinationChange: (combination: PatternCombination) => void;
  width: number;
  height: number;
  className?: string;
}

export function PatternCombiner({ 
  onCombinationChange, 
  width, 
  height, 
  className 
}: PatternCombinerProps) {
  const [layers, setLayers] = useState<PatternLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [availablePatterns, setAvailablePatterns] = useState<CustomPattern[]>([]);
  const [compositionMode, setCompositionMode] = useState<'overlay' | 'multiply' | 'screen' | 'difference'>('overlay');
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatorRef = useRef<AdvancedPatternGenerator | null>(null);
  const dragLayer = useRef<string | null>(null);
  const dragStart = useRef<Point>({ x: 0, y: 0 });

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

  // Load available patterns
  useEffect(() => {
    const patterns = PatternStorageService.getAllPatterns();
    setAvailablePatterns(patterns);
  }, []);

  // Update combination when layers change
  useEffect(() => {
    const combination: PatternCombination = {
      id: crypto.randomUUID(),
      patterns: layers.map(layer => ({
        patternId: layer.patternId,
        blendMode: layer.blendMode,
        opacity: layer.opacity,
        offset: layer.offset,
        scale: layer.scale,
        rotation: layer.rotation
      })),
      compositionMode
    };
    
    onCombinationChange(combination);
    renderCombination();
  }, [layers, compositionMode, onCombinationChange]);

  const renderCombination = useCallback(async () => {
    if (!generatorRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    
    // Set composition mode
    ctx.globalCompositeOperation = compositionMode;
    
    // Render each visible layer
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      try {
        // Generate pattern for this layer
        const patternData = generatorRef.current.generateCustomPattern(
          layer.pattern,
          width,
          height
        );
        
        // Create temporary canvas for this layer
        const tempCanvas = new OffscreenCanvas(width, height);
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        
        tempCtx.putImageData(patternData, 0, 0);
        
        // Apply layer transformations
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        
        // Apply transformations
        ctx.translate(layer.offset.x + width / 2, layer.offset.y + height / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scale, layer.scale);
        ctx.translate(-width / 2, -height / 2);
        
        // Draw the pattern
        ctx.drawImage(tempCanvas, 0, 0);
        
        ctx.restore();
      } catch (error) {
        console.error('Error rendering layer:', layer.name, error);
      }
    }
    
    // Update preview image
    setPreviewImage(canvas.toDataURL());
  }, [layers, compositionMode, width, height]);

  const addLayer = useCallback((pattern: CustomPattern) => {
    const newLayer: PatternLayer = {
      id: crypto.randomUUID(),
      patternId: pattern.id,
      name: pattern.name,
      pattern,
      blendMode: BlendMode.Normal,
      opacity: 1,
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      visible: true
    };
    
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
    setShowPatternPicker(false);
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSelectedLayer(null);
  }, []);

  const updateLayer = useCallback((layerId: string, updates: Partial<PatternLayer>) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, ...updates }
          : layer
      )
    );
  }, []);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const duplicatedLayer: PatternLayer = {
      ...layer,
      id: crypto.randomUUID(),
      name: `${layer.name} Copy`,
      offset: { x: layer.offset.x + 10, y: layer.offset.y + 10 }
    };
    
    setLayers(prev => [...prev, duplicatedLayer]);
  }, [layers]);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  }, []);

  const handleLayerDragStart = useCallback((layerId: string, e: React.MouseEvent) => {
    dragLayer.current = layerId;
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragLayer.current) return;
      
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      updateLayer(dragLayer.current, {
        offset: { x: deltaX, y: deltaY }
      });
    };
    
    const handleMouseUp = () => {
      dragLayer.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateLayer]);

  const selectedLayerData = selectedLayer ? layers.find(l => l.id === selectedLayer) : null;

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Layers Panel */}
      <div className="w-80 bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Layers
          </h3>
          <button
            onClick={() => setShowPatternPicker(true)}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="Add Layer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Composition Mode */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Composition Mode</label>
          <select
            value={compositionMode}
            onChange={(e) => setCompositionMode(e.target.value as any)}
            className="w-full p-2 rounded border border-border bg-background"
          >
            <option value="overlay">Overlay</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="difference">Difference</option>
          </select>
        </div>

        {/* Layer List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedLayer === layer.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedLayer(layer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="p-1 hover:bg-accent rounded"
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </button>
                  <span className="text-sm font-medium">{layer.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 hover:bg-accent rounded disabled:opacity-50"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    disabled={index === layers.length - 1}
                    className="p-1 hover:bg-accent rounded disabled:opacity-50"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    className="p-1 hover:bg-accent rounded text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                {layer.blendMode} • {Math.round(layer.opacity * 100)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Properties
        </h3>
        
        {selectedLayerData ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Blend Mode</label>
              <select
                value={selectedLayerData.blendMode}
                onChange={(e) => updateLayer(selectedLayerData.id, { blendMode: e.target.value as BlendMode })}
                className="w-full p-2 rounded border border-border bg-background"
              >
                {Object.values(BlendMode).map(mode => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Opacity ({Math.round(selectedLayerData.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedLayerData.opacity}
                onChange={(e) => updateLayer(selectedLayerData.id, { opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Scale ({selectedLayerData.scale.toFixed(2)})
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedLayerData.scale}
                onChange={(e) => updateLayer(selectedLayerData.id, { scale: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rotation ({selectedLayerData.rotation}°)
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedLayerData.rotation}
                onChange={(e) => updateLayer(selectedLayerData.id, { rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">X</label>
                  <input
                    type="number"
                    value={selectedLayerData.offset.x}
                    onChange={(e) => updateLayer(selectedLayerData.id, { 
                      offset: { ...selectedLayerData.offset, x: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full p-1 rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Y</label>
                  <input
                    type="number"
                    value={selectedLayerData.offset.y}
                    onChange={(e) => updateLayer(selectedLayerData.id, { 
                      offset: { ...selectedLayerData.offset, y: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full p-1 rounded border border-border bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a layer to edit properties</p>
          </div>
        )}
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Preview</h3>
        <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '400px' }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Pattern Picker Modal */}
      <AnimatePresence>
        {showPatternPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPatternPicker(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[70vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Pattern</h3>
                <button
                  onClick={() => setShowPatternPicker(false)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {availablePatterns.map(pattern => (
                  <div
                    key={pattern.id}
                    onClick={() => addLayer(pattern)}
                    className="p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <h4 className="font-medium">{pattern.name}</h4>
                    <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {pattern.tags.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              
              {availablePatterns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No patterns available. Create some patterns first!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}