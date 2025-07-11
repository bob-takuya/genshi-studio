/**
 * Pressure Visualization Component
 * Displays real-time pressure data and device information
 */

import React, { useState, useEffect, useRef } from 'react';
import { inputDeviceManager, PressureData, InputDeviceInfo } from '../input/InputDeviceManager';

interface PressureVisualizationProps {
  isDrawing: boolean;
  currentPressure?: PressureData;
}

export const PressureVisualization: React.FC<PressureVisualizationProps> = ({ 
  isDrawing, 
  currentPressure 
}) => {
  const [deviceInfo, setDeviceInfo] = useState<InputDeviceInfo | null>(null);
  const [pressureHistory, setPressureHistory] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyLength = 100;

  useEffect(() => {
    // Get initial device info
    setDeviceInfo(inputDeviceManager.getCurrentDevice());
    
    // Update device info when it changes
    const interval = setInterval(() => {
      setDeviceInfo(inputDeviceManager.getCurrentDevice());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentPressure && isDrawing) {
      setPressureHistory(prev => {
        const newHistory = [...prev, currentPressure.pressure];
        if (newHistory.length > historyLength) {
          newHistory.shift();
        }
        return newHistory;
      });
    }
  }, [currentPressure, isDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pressure graph
    if (pressureHistory.length > 0) {
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.beginPath();

      pressureHistory.forEach((pressure, index) => {
        const x = (index / historyLength) * canvas.width;
        const y = canvas.height - (pressure * canvas.height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [pressureHistory]);

  if (!deviceInfo) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 300,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Pressure Visualization</h3>
      
      {/* Device Info */}
      <div style={{ marginBottom: '10px' }}>
        <div>Device: {deviceInfo.vendor || 'Unknown'} {deviceInfo.type}</div>
        <div>Model: {deviceInfo.model || 'N/A'}</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <span style={{ color: deviceInfo.supportsPressure ? '#4CAF50' : '#f44336' }}>
            Pressure: {deviceInfo.supportsPressure ? '✓' : '✗'}
          </span>
          <span style={{ color: deviceInfo.supportsTilt ? '#4CAF50' : '#f44336' }}>
            Tilt: {deviceInfo.supportsTilt ? '✓' : '✗'}
          </span>
          <span style={{ color: deviceInfo.supportsRotation ? '#4CAF50' : '#f44336' }}>
            Rotation: {deviceInfo.supportsRotation ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Current Values */}
      {currentPressure && isDrawing && (
        <div style={{ marginBottom: '10px' }}>
          <div>Pressure: {(currentPressure.pressure * 100).toFixed(1)}%</div>
          {currentPressure.tiltX !== undefined && (
            <div>Tilt: X={currentPressure.tiltX.toFixed(1)}° Y={currentPressure.tiltY?.toFixed(1)}°</div>
          )}
          {currentPressure.twist !== undefined && (
            <div>Rotation: {currentPressure.twist.toFixed(1)}°</div>
          )}
        </div>
      )}

      {/* Pressure Graph */}
      <canvas 
        ref={canvasRef}
        width={270}
        height={80}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          marginTop: '10px'
        }}
      />
      
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginTop: '5px' 
      }}>
        Real-time pressure graph (0-100%)
      </div>
    </div>
  );
};