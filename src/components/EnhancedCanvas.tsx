/**
 * Enhanced Canvas Component with Pressure-Sensitive Input Support
 */

import React, { useRef, useEffect, useState } from 'react';
import { GraphicsEngine } from '../graphics/engine/GraphicsEngine';
import { Color } from '../types/graphics';
import { PressureVisualization } from './PressureVisualization';
import { DeviceCalibration } from './DeviceCalibration';
import { PressureData } from '../input/InputDeviceManager';

interface EnhancedCanvasProps {
  width?: number;
  height?: number;
  onEngineReady?: (engine: GraphicsEngine) => void;
}

export const EnhancedCanvas: React.FC<EnhancedCanvasProps> = ({ 
  width = window.innerWidth - 300, 
  height = window.innerHeight - 200,
  onEngineReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GraphicsEngine | null>(null);
  const [, setIsReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPressure, setCurrentPressure] = useState<PressureData | undefined>();
  const [showPressureViz, setShowPressureViz] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);

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

    // Set up pressure tracking
    const handlePressureUpdate = (event: any) => {
      if (event.detail) {
        setIsDrawing(event.detail.isDrawing);
        setCurrentPressure(event.detail.pressure);
      }
    };

    window.addEventListener('pressureUpdate', handlePressureUpdate);

    return () => {
      window.removeEventListener('pressureUpdate', handlePressureUpdate);
      engine.destroy();
    };
  }, [width, height, onEngineReady]);

  return (
    <div className="enhanced-canvas-container" style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        data-testid="main-canvas"
        width={width}
        height={height}
        style={{
          display: 'block',
          border: '1px solid #333',
          cursor: 'crosshair',
          touchAction: 'none',
          background: '#f8f8f8'
        }}
      />
      
      {/* Pressure Visualization */}
      {showPressureViz && (
        <PressureVisualization 
          isDrawing={isDrawing} 
          currentPressure={currentPressure} 
        />
      )}

      {/* Device Calibration Modal */}
      {showCalibration && (
        <DeviceCalibration onClose={() => setShowCalibration(false)} />
      )}

      {/* Quick Controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setShowPressureViz(!showPressureViz)}
          style={{
            padding: '8px 12px',
            background: showPressureViz ? '#4CAF50' : 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Pressure Info
        </button>
        <button
          onClick={() => setShowCalibration(true)}
          style={{
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Calibrate Device
        </button>
      </div>
    </div>
  );
};

// Enhanced Toolbar with pressure-sensitive brush controls
interface EnhancedToolbarProps {
  engine: GraphicsEngine | null;
}

export const EnhancedToolbar: React.FC<EnhancedToolbarProps> = ({ engine }) => {
  const [currentColor, setCurrentColor] = useState<Color>({ r: 0, g: 0, b: 0, a: 1 });
  const [brushSettings, setBrushSettings] = useState<any>({
    size: 20,
    hardness: 0.8,
    opacity: 1.0,
    flow: 1.0,
    smoothing: 0.5,
    minSize: 1,
    maxSize: 100,
    dynamics: {
      sizePressure: 1.0,
      opacityPressure: 0.7,
      sizeVelocity: 0,
      opacityVelocity: 0,
      sizeTilt: 0,
      opacityTilt: 0
    }
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handleColorChange = (color: Color) => {
    setCurrentColor(color);
    engine?.setColor(color);
  };

  const handleBrushSettingChange = (setting: string, value: any) => {
    const newSettings = { ...brushSettings };
    
    // Handle nested settings
    if (setting.includes('.')) {
      const [parent, child] = setting.split('.');
      newSettings[parent] = { ...newSettings[parent], [child]: value };
    } else {
      newSettings[setting] = value;
    }
    
    setBrushSettings(newSettings);
    engine?.updateBrushSettings(newSettings);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    engine?.setBrushPreset(preset);
    
    // Update local settings to reflect preset
    if (engine) {
      const settings = engine.getBrushSettings();
      setBrushSettings(settings);
    }
  };

  const brushPresets = [
    { id: 'pencil', name: 'Pencil', icon: '✏️' },
    { id: 'marker', name: 'Marker', icon: '🖍️' },
    { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
    { id: 'oil', name: 'Oil Paint', icon: '🖌️' },
    { id: 'airbrush', name: 'Airbrush', icon: '💨' }
  ];

  const tools = [
    { id: 'brush', name: 'Brush', icon: '🖌️', action: () => engine?.selectBrushTool() },
    { id: 'eraser', name: 'Eraser', icon: '🧹', action: () => engine?.selectEraserTool() },
    { id: 'pattern', name: 'Pattern', icon: '🔲', action: () => engine?.selectPatternTool() }
  ];

  return (
    <div className="enhanced-toolbar" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      padding: '15px',
      background: '#2a2a2a',
      color: 'white',
      borderBottom: '1px solid #444'
    }}>
      {/* Top row - Tools and presets */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
                border: '1px solid #555',
                background: '#3a3a3a',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#4a4a4a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3a3a3a'}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Brush presets */}
        <div className="brush-presets" style={{ display: 'flex', gap: '5px' }}>
          <span style={{ marginRight: '10px', alignSelf: 'center' }}>Presets:</span>
          {brushPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              title={preset.name}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: selectedPreset === preset.id ? '2px solid #4CAF50' : '1px solid #555',
                background: selectedPreset === preset.id ? '#3a3a3a' : '#2a2a2a',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {preset.icon} {preset.name}
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
            style={{
              width: '50px',
              height: '30px',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Bottom row - Brush settings */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
        {/* Basic settings */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div>
            <label>Size: </label>
            <input
              type="range"
              min={brushSettings.minSize || 1}
              max={brushSettings.maxSize || 100}
              value={brushSettings.size}
              onChange={(e) => handleBrushSettingChange('size', Number(e.target.value))}
              style={{ width: '100px' }}
            />
            <span style={{ marginLeft: '5px' }}>{brushSettings.size}px</span>
          </div>

          <div>
            <label>Opacity: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.opacity * 100}
              onChange={(e) => handleBrushSettingChange('opacity', Number(e.target.value) / 100)}
              style={{ width: '100px' }}
            />
            <span style={{ marginLeft: '5px' }}>{Math.round(brushSettings.opacity * 100)}%</span>
          </div>

          <div>
            <label>Hardness: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.hardness * 100}
              onChange={(e) => handleBrushSettingChange('hardness', Number(e.target.value) / 100)}
              style={{ width: '100px' }}
            />
            <span style={{ marginLeft: '5px' }}>{Math.round(brushSettings.hardness * 100)}%</span>
          </div>

          <div>
            <label>Flow: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.flow * 100}
              onChange={(e) => handleBrushSettingChange('flow', Number(e.target.value) / 100)}
              style={{ width: '100px' }}
            />
            <span style={{ marginLeft: '5px' }}>{Math.round(brushSettings.flow * 100)}%</span>
          </div>
        </div>

        {/* Pressure dynamics */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          paddingLeft: '20px', 
          borderLeft: '1px solid #555' 
        }}>
          <div>
            <label>Size → Pressure: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.dynamics.sizePressure * 100}
              onChange={(e) => handleBrushSettingChange('dynamics.sizePressure', Number(e.target.value) / 100)}
              style={{ width: '80px' }}
            />
            <span style={{ marginLeft: '5px' }}>{Math.round(brushSettings.dynamics.sizePressure * 100)}%</span>
          </div>

          <div>
            <label>Opacity → Pressure: </label>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSettings.dynamics.opacityPressure * 100}
              onChange={(e) => handleBrushSettingChange('dynamics.opacityPressure', Number(e.target.value) / 100)}
              style={{ width: '80px' }}
            />
            <span style={{ marginLeft: '5px' }}>{Math.round(brushSettings.dynamics.opacityPressure * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};