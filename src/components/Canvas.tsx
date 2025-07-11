/**
 * React Canvas Component for Genshi Studio
 */

import React, { useRef, useEffect, useState } from 'react';
import { GraphicsEngine } from '../graphics/engine/GraphicsEngine';
import { Color, BrushSettings } from '../types/graphics';
import { PatternType } from '../graphics/patterns/CulturalPatternGenerator';

interface CanvasProps {
  width?: number;
  height?: number;
  onEngineReady?: (engine: GraphicsEngine) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  width = 800, 
  height = 600,
  onEngineReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GraphicsEngine | null>(null);
  const [, setIsReady] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize graphics engine
    const engine = new GraphicsEngine({
      canvas: canvasRef.current,
      width,
      height
    });

    engineRef.current = engine;
    setIsReady(true);

    if (onEngineReady) {
      onEngineReady(engine);
    }

    // Set up performance monitoring
    const metricsInterval = setInterval(() => {
      if (engineRef.current) {
        setMetrics(engineRef.current.getPerformanceMetrics());
      }
    }, 1000);

    return () => {
      clearInterval(metricsInterval);
      engine.destroy();
    };
  }, [width, height, onEngineReady]);

  return (
    <div className="canvas-container" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          border: '1px solid #ccc',
          cursor: 'crosshair',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      />
      
      {/* Performance overlay */}
      {process.env.NODE_ENV === 'development' && metrics && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            borderRadius: '4px'
          }}
        >
          <div>FPS: {metrics.fps}</div>
          <div>Frame: {metrics.frameCount}</div>
          <div>Objects: {metrics.canvasMetrics?.visibleCount}/{metrics.canvasMetrics?.objectCount}</div>
          <div>Memory: {(metrics.canvasMetrics?.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
        </div>
      )}
    </div>
  );
};

// Toolbar component for tools and settings
interface ToolbarProps {
  engine: GraphicsEngine | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ engine }) => {
  const [currentColor, setCurrentColor] = useState<Color>({ r: 0, g: 0, b: 0, a: 1 });
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 10,
    hardness: 0.8,
    opacity: 1.0,
    flow: 1.0,
    smoothing: 0.5,
    pressureSensitivity: {
      size: true,
      opacity: true,
      flow: true
    }
  });

  const handleColorChange = (color: Color) => {
    setCurrentColor(color);
    engine?.setColor(color);
  };

  const handleBrushSettingChange = (setting: keyof BrushSettings, value: any) => {
    const newSettings = { ...brushSettings, [setting]: value };
    setBrushSettings(newSettings);
    engine?.updateBrushSettings(newSettings);
  };

  const tools = [
    { id: 'brush', name: 'Brush', icon: '🖌️', action: () => engine?.selectBrushTool() },
    { id: 'eraser', name: 'Eraser', icon: '🧹', action: () => engine?.selectEraserTool() },
    { id: 'pattern', name: 'Pattern', icon: '🔲', action: () => engine?.selectPatternTool() }
  ];

  return (
    <div className="toolbar" style={{
      display: 'flex',
      gap: '10px',
      padding: '10px',
      background: '#f0f0f0',
      borderBottom: '1px solid #ccc'
    }}>
      {/* Tool buttons */}
      <div className="tool-buttons" style={{ display: 'flex', gap: '5px' }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={tool.action}
            title={tool.name}
            style={{
              width: '40px',
              height: '40px',
              fontSize: '20px',
              border: '1px solid #ccc',
              background: 'white',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Color picker */}
      <div className="color-picker" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label>Color:</label>
        <input
          type="color"
          value={`#${Math.round(currentColor.r * 255).toString(16).padStart(2, '0')}${Math.round(currentColor.g * 255).toString(16).padStart(2, '0')}${Math.round(currentColor.b * 255).toString(16).padStart(2, '0')}`}
          onChange={(e) => {
            const hex = e.target.value;
            const r = parseInt(hex.substr(1, 2), 16) / 255;
            const g = parseInt(hex.substr(3, 2), 16) / 255;
            const b = parseInt(hex.substr(5, 2), 16) / 255;
            handleColorChange({ r, g, b, a: currentColor.a });
          }}
        />
      </div>

      {/* Brush settings */}
      <div className="brush-settings" style={{ display: 'flex', gap: '10px' }}>
        <div>
          <label>Size: </label>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSettings.size}
            onChange={(e) => handleBrushSettingChange('size', Number(e.target.value))}
          />
          <span>{brushSettings.size}px</span>
        </div>

        <div>
          <label>Opacity: </label>
          <input
            type="range"
            min="0"
            max="100"
            value={brushSettings.opacity * 100}
            onChange={(e) => handleBrushSettingChange('opacity', Number(e.target.value) / 100)}
          />
          <span>{Math.round(brushSettings.opacity * 100)}%</span>
        </div>

        <div>
          <label>Hardness: </label>
          <input
            type="range"
            min="0"
            max="100"
            value={brushSettings.hardness * 100}
            onChange={(e) => handleBrushSettingChange('hardness', Number(e.target.value) / 100)}
          />
          <span>{Math.round(brushSettings.hardness * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

// Pattern panel component
interface PatternPanelProps {
  engine: GraphicsEngine | null;
}

export const PatternPanel: React.FC<PatternPanelProps> = ({ engine }) => {
  const patterns = [
    { type: PatternType.Ichimatsu, name: 'Ichimatsu (市松)', description: 'Checkerboard' },
    { type: PatternType.Seigaiha, name: 'Seigaiha (青海波)', description: 'Waves' },
    { type: PatternType.Asanoha, name: 'Asanoha (麻の葉)', description: 'Hemp leaf' },
    { type: PatternType.Shippo, name: 'Shippo (七宝)', description: 'Seven treasures' },
    { type: PatternType.Kagome, name: 'Kagome (籠目)', description: 'Basket weave' },
    { type: PatternType.Kikkoumon, name: 'Kikkoumon (亀甲文)', description: 'Tortoise shell' },
    { type: PatternType.Sayagata, name: 'Sayagata (紗綾形)', description: 'Key fret' },
    { type: PatternType.Tatewaku, name: 'Tatewaku (立涌)', description: 'Rising steam' }
  ];

  const handlePatternClick = (type: PatternType) => {
    if (!engine) return;

    // Generate pattern at center of canvas
    engine.generatePattern(
      type,
      { x: 100, y: 100, width: 200, height: 200 },
      {
        scale: 1,
        rotation: 0,
        color1: { r: 0, g: 0, b: 0, a: 1 },
        color2: { r: 1, g: 1, b: 1, a: 1 }
      }
    );
  };

  return (
    <div className="pattern-panel" style={{
      width: '200px',
      padding: '10px',
      background: '#f8f8f8',
      borderLeft: '1px solid #ccc',
      overflowY: 'auto'
    }}>
      <h3>Cultural Patterns</h3>
      <div className="pattern-list">
        {patterns.map(pattern => (
          <div
            key={pattern.type}
            className="pattern-item"
            onClick={() => handlePatternClick(pattern.type)}
            style={{
              padding: '10px',
              margin: '5px 0',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div style={{ fontWeight: 'bold' }}>{pattern.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{pattern.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App component
export const GenshiStudioApp: React.FC = () => {
  const [engine, setEngine] = useState<GraphicsEngine | null>(null);

  return (
    <div className="genshi-studio-app" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Toolbar engine={engine} />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Canvas onEngineReady={setEngine} />
        </div>
        <PatternPanel engine={engine} />
      </div>
    </div>
  );
};