import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Layers, 
  Eye, 
  EyeOff, 
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  Palette,
  X
} from 'lucide-react';
import { 
  PatternCombination, 
  CustomPattern, 
  BlendMode,
  Point
} from '../../types/graphics';
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
  const [, setPreviewImage] = useState<string | null>(null);
  
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
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        
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

  // Render
  return (
    <div className="pattern-combiner">
      {/* Component UI would go here */}
      <div>Pattern Combiner Component</div>
    </div>
  );
}
