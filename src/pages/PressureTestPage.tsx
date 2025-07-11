/**
 * Pressure Test Page - Demonstrates pressure-sensitive input capabilities
 */

import React, { useState } from 'react';
import { EnhancedCanvas, EnhancedToolbar } from '../components/EnhancedCanvas';
import { GraphicsEngine } from '../graphics/engine/GraphicsEngine';

export const PressureTestPage: React.FC = () => {
  const [engine, setEngine] = useState<GraphicsEngine | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const handleEngineReady = (engineInstance: GraphicsEngine) => {
    setEngine(engineInstance);
    
    // Get device info
    const info = engineInstance.getInputDeviceInfo();
    setDeviceInfo(info);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1a1a1a',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#2a2a2a',
        borderBottom: '1px solid #444'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Genshi Studio - Pressure-Sensitive Drawing</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#aaa' }}>
          Professional digital art with tablet support
        </p>
      </header>

      {/* Enhanced Toolbar */}
      <EnhancedToolbar engine={engine} />

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Instructions */}
        <aside style={{
          width: '300px',
          padding: '20px',
          background: '#2a2a2a',
          borderRight: '1px solid #444',
          overflowY: 'auto'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Quick Start Guide</h2>
          
          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Supported Devices</h3>
            <ul style={{ fontSize: '12px', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>✓ Wacom Tablets (Intuos, Cintiq, etc.)</li>
              <li>✓ Apple Pencil (iPad Pro/Air)</li>
              <li>✓ Surface Pen (Surface Pro/Studio)</li>
              <li>✓ Huion Tablets</li>
              <li>✓ XP-Pen Devices</li>
              <li>✓ Most pressure-sensitive styluses</li>
            </ul>
          </section>

          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Keyboard Shortcuts</h3>
            <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
              <div><kbd>B</kbd> - Brush Tool</div>
              <div><kbd>E</kbd> - Eraser Tool</div>
              <div><kbd>G</kbd> - Pattern Tool</div>
              <div><kbd>[</kbd> - Decrease Brush Size</div>
              <div><kbd>]</kbd> - Increase Brush Size</div>
              <div><kbd>Space</kbd> - Pan Canvas (hold)</div>
            </div>
          </section>

          <section style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Pressure Features</h3>
            <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
              <p><strong>Size Variation:</strong> Brush size responds to pen pressure</p>
              <p><strong>Opacity Control:</strong> Lighter pressure = more transparent</p>
              <p><strong>Tilt Support:</strong> Angle affects brush shape (supported devices)</p>
              <p><strong>Rotation:</strong> Pen rotation changes brush angle (select devices)</p>
              <p><strong>Velocity Sensing:</strong> Fast strokes create different effects</p>
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Current Device</h3>
            {deviceInfo ? (
              <div style={{ fontSize: '12px', background: '#1a1a1a', padding: '10px', borderRadius: '4px' }}>
                <div>Type: {deviceInfo.type}</div>
                <div>Vendor: {deviceInfo.vendor || 'Unknown'}</div>
                <div>Pressure: {deviceInfo.supportsPressure ? '✓' : '✗'}</div>
                <div>Tilt: {deviceInfo.supportsTilt ? '✓' : '✗'}</div>
                <div>Rotation: {deviceInfo.supportsRotation ? '✓' : '✗'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#666' }}>No device detected</div>
            )}
          </section>
        </aside>

        {/* Canvas Area */}
        <main style={{ flex: 1, position: 'relative', background: '#333' }}>
          <EnhancedCanvas onEngineReady={handleEngineReady} />
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '10px 20px',
        background: '#2a2a2a',
        borderTop: '1px solid #444',
        fontSize: '12px',
        color: '#888'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Genshi Studio v1.0 - Professional Digital Art Software</span>
          <span>For best results, use a pressure-sensitive tablet</span>
        </div>
      </footer>
    </div>
  );
};