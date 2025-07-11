/**
 * Device Calibration Component
 * Allows users to calibrate their pressure-sensitive devices
 */

import React, { useState, useEffect } from 'react';
import { inputDeviceManager, PressureCurve } from '../input/InputDeviceManager';

interface DeviceCalibrationProps {
  onClose: () => void;
}

export const DeviceCalibration: React.FC<DeviceCalibrationProps> = ({ onClose }) => {
  const [selectedCurve, setSelectedCurve] = useState<string>('default');
  const [availableCurves, setAvailableCurves] = useState<string[]>([]);
  const [customCurve, setCustomCurve] = useState<PressureCurve>({
    name: 'custom',
    controlPoints: [
      { x: 0, y: 0 },
      { x: 0.25, y: 0.25 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.75 },
      { x: 1, y: 1 }
    ],
    interpolation: 'cubic'
  });
  const [testPressure, setTestPressure] = useState<number>(0);
  const [isTestingPressure, setIsTestingPressure] = useState(false);

  useEffect(() => {
    const curves = inputDeviceManager.getAvailableCurves();
    setAvailableCurves(curves);
    
    const activeCurve = inputDeviceManager.getActiveCurve();
    setSelectedCurve(activeCurve.name.toLowerCase());
  }, []);

  const handleCurveChange = (curveName: string) => {
    setSelectedCurve(curveName);
    inputDeviceManager.setPressureCurve(curveName);
  };

  const handleCustomPointChange = (index: number, value: number, axis: 'x' | 'y') => {
    const newPoints = [...customCurve.controlPoints];
    newPoints[index] = { ...newPoints[index], [axis]: value };
    
    // Sort points by x value
    if (axis === 'x') {
      newPoints.sort((a, b) => a.x - b.x);
    }
    
    setCustomCurve({ ...customCurve, controlPoints: newPoints });
  };

  const applyCustomCurve = () => {
    inputDeviceManager.addCustomPressureCurve(customCurve);
    inputDeviceManager.setPressureCurve('custom');
    setSelectedCurve('custom');
  };

  const renderCurvePreview = () => {
    const width = 200;
    const height = 200;
    const points = selectedCurve === 'custom' 
      ? customCurve.controlPoints 
      : inputDeviceManager.getActiveCurve().controlPoints;

    return (
      <svg width={width} height={height} style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line
              x1={0}
              y1={height - v * height}
              x2={width}
              y2={height - v * height}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
            <line
              x1={v * width}
              y1={0}
              x2={v * width}
              y2={height}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Diagonal reference line */}
        <line
          x1={0}
          y1={height}
          x2={width}
          y2={0}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Curve */}
        <polyline
          points={points.map(p => `${p.x * width},${height - p.y * height}`).join(' ')}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="2"
        />

        {/* Control points */}
        {selectedCurve === 'custom' && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x * width}
            cy={height - point.y * height}
            r="4"
            fill="#4CAF50"
            stroke="white"
            strokeWidth="1"
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* Test pressure indicator */}
        {isTestingPressure && (
          <>
            <line
              x1={testPressure * width}
              y1={0}
              x2={testPressure * width}
              y2={height}
              stroke="#FF5722"
              strokeWidth="2"
            />
            <circle
              cx={testPressure * width}
              cy={height - (testPressure * height)}
              r="6"
              fill="#FF5722"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxHeight: '80vh',
      background: 'rgba(30, 30, 30, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Device Calibration</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left side - Curve selection and preview */}
        <div style={{ flex: 1 }}>
          <h3>Pressure Curve</h3>
          
          {/* Preset curves */}
          <div style={{ marginBottom: '15px' }}>
            <label>Preset Curves:</label>
            <select
              value={selectedCurve}
              onChange={(e) => handleCurveChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white'
              }}
            >
              {availableCurves.map(curve => (
                <option key={curve} value={curve}>
                  {curve.charAt(0).toUpperCase() + curve.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Curve preview */}
          <div style={{ marginBottom: '15px' }}>
            {renderCurvePreview()}
          </div>

          {/* Test area */}
          <div>
            <h4>Test Pressure</h4>
            <div
              style={{
                width: '100%',
                height: '60px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'crosshair',
                userSelect: 'none'
              }}
              onPointerDown={(e) => {
                setIsTestingPressure(true);
                setTestPressure(e.pressure);
              }}
              onPointerMove={(e) => {
                if (isTestingPressure) {
                  setTestPressure(e.pressure);
                }
              }}
              onPointerUp={() => {
                setIsTestingPressure(false);
              }}
              onPointerLeave={() => {
                setIsTestingPressure(false);
              }}
            >
              {isTestingPressure ? (
                <span>Pressure: {(testPressure * 100).toFixed(1)}%</span>
              ) : (
                <span>Press here to test pressure</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Custom curve editor */}
        <div style={{ flex: 1 }}>
          <h3>Custom Curve Editor</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Control Points:</label>
            {customCurve.controlPoints.map((point, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '10px', 
                marginTop: '10px',
                alignItems: 'center'
              }}>
                <span style={{ width: '30px' }}>P{index + 1}:</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px' }}>X:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={point.x}
                    onChange={(e) => handleCustomPointChange(index, parseFloat(e.target.value), 'x')}
                    disabled={index === 0 || index === customCurve.controlPoints.length - 1}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px' }}>Y:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={point.y}
                    onChange={(e) => handleCustomPointChange(index, parseFloat(e.target.value), 'y')}
                    style={{ width: '100%' }}
                  />
                </div>
                <span style={{ fontSize: '11px', minWidth: '80px' }}>
                  ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={applyCustomCurve}
            style={{
              width: '100%',
              padding: '10px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Apply Custom Curve
          </button>

          {/* Device-specific settings */}
          <div style={{ marginTop: '20px' }}>
            <h4>Device Settings</h4>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              <p>Tips for optimal pressure sensitivity:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Wacom: Use driver settings for initial calibration</li>
                <li>Apple Pencil: Adjust in iPad settings first</li>
                <li>Surface Pen: Configure in Windows Ink settings</li>
                <li>Huion: Install latest drivers for best support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};