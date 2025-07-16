/**
 * Test suite for canvas rendering fixes
 * Tests WebGL fallback, Canvas2D fallback, and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebGLContextManager } from '../graphics/engine/WebGLContext';
import { Canvas2DFallbackManager } from '../graphics/engine/Canvas2DFallback';
import { UnifiedEditingSystem } from '../core/UnifiedEditingSystem';
import { CanvasMode } from '../graphics/canvas/UnifiedCanvas';

// Mock canvas and WebGL context
const mockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

// Mock WebGL context that fails
const mockFailingWebGLContext = () => {
  const canvas = mockCanvas();
  // Override getContext to return null for WebGL
  const originalGetContext = canvas.getContext.bind(canvas);
  canvas.getContext = (contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
      return null;
    }
    return originalGetContext(contextType);
  };
  return canvas;
};

describe('Canvas Rendering Fixes', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '<div id="test-container"></div>';
    canvas = mockCanvas();
    document.getElementById('test-container')?.appendChild(canvas);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Canvas2D Fallback Manager', () => {
    it('should initialize successfully with Canvas2D', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      
      expect(fallbackManager.isReady()).toBe(true);
      expect(fallbackManager.isCanvas2D()).toBe(true);
      expect(fallbackManager.getContext()).toBeInstanceOf(CanvasRenderingContext2D);
    });

    it('should handle device pixel ratio correctly', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      const pixelRatio = fallbackManager.getPixelRatio();
      
      expect(pixelRatio).toBeLessThanOrEqual(2); // Should be capped at 2x
      expect(pixelRatio).toBeGreaterThan(0);
    });

    it('should resize canvas properly', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      const newWidth = 1024;
      const newHeight = 768;
      
      fallbackManager.resize(newWidth, newHeight);
      const size = fallbackManager.getSize();
      
      expect(size.width).toBe(newWidth);
      expect(size.height).toBe(newHeight);
    });

    it('should clear canvas without errors', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      
      expect(() => {
        fallbackManager.clear(0, 0, 0, 0);
      }).not.toThrow();
    });

    it('should provide drawing methods', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      
      expect(typeof fallbackManager.drawPath).toBe('function');
      expect(typeof fallbackManager.drawImage).toBe('function');
      expect(typeof fallbackManager.drawText).toBe('function');
      expect(typeof fallbackManager.createLinearGradient).toBe('function');
    });

    it('should handle batch operations', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      
      expect(() => {
        fallbackManager.beginBatch();
        fallbackManager.endBatch();
      }).not.toThrow();
    });

    it('should destroy without errors', () => {
      const fallbackManager = new Canvas2DFallbackManager(canvas);
      
      expect(() => {
        fallbackManager.destroy();
      }).not.toThrow();
    });
  });

  describe('WebGL Context Manager with Fallback', () => {
    it('should initialize with WebGL when available', () => {
      // Skip this test if WebGL is not available
      const testContext = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!testContext) {
        return;
      }

      const contextManager = new WebGLContextManager(canvas);
      
      expect(contextManager.isReady()).toBe(true);
      expect(contextManager.getContext()).toBeTruthy();
    });

    it('should fallback to Canvas2D when WebGL fails', () => {
      const failingCanvas = mockFailingWebGLContext();
      
      const contextManager = new WebGLContextManager(failingCanvas);
      
      expect(contextManager.isReady()).toBe(true);
      expect(contextManager.isCanvas2D()).toBe(true);
      expect(contextManager.getFallbackManager()).toBeTruthy();
    });

    it('should handle resize with fallback', () => {
      const failingCanvas = mockFailingWebGLContext();
      const contextManager = new WebGLContextManager(failingCanvas);
      
      expect(() => {
        contextManager.resize(1024, 768);
      }).not.toThrow();
    });

    it('should handle clear with fallback', () => {
      const failingCanvas = mockFailingWebGLContext();
      const contextManager = new WebGLContextManager(failingCanvas);
      
      expect(() => {
        contextManager.clear(0, 0, 0, 1);
      }).not.toThrow();
    });

    it('should destroy with fallback', () => {
      const failingCanvas = mockFailingWebGLContext();
      const contextManager = new WebGLContextManager(failingCanvas);
      
      expect(() => {
        contextManager.destroy();
      }).not.toThrow();
    });
  });

  describe('UnifiedEditingSystem Timeout and Degraded Mode', () => {
    it('should handle start timeout gracefully', async () => {
      const config = {
        canvas,
        width: 800,
        height: 600,
        pixelRatio: 1,
        performanceTarget: {
          fps: 60,
          maxSyncLatency: 16
        }
      };

      const system = new UnifiedEditingSystem(config);
      
      // Mock a scenario where initialization takes too long
      const originalStart = system.start.bind(system);
      let startPromise: Promise<void>;
      
      // This should not throw an error even if initialization is slow
      expect(() => {
        startPromise = system.start();
      }).not.toThrow();
      
      // Wait for the promise to resolve or timeout
      await expect(startPromise!).resolves.not.toThrow();
    });

    it('should provide degraded mode status', () => {
      const config = {
        canvas,
        width: 800,
        height: 600,
        pixelRatio: 1
      };

      const system = new UnifiedEditingSystem(config);
      const status = system.getInitializationStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('running');
      expect(typeof status.initialized).toBe('boolean');
      expect(typeof status.running).toBe('boolean');
    });

    it('should handle mode operations without errors', () => {
      const config = {
        canvas,
        width: 800,
        height: 600,
        pixelRatio: 1
      };

      const system = new UnifiedEditingSystem(config);
      
      expect(() => {
        system.setModeActive(CanvasMode.DRAW, true);
        system.setPrimaryMode(CanvasMode.DRAW);
        system.setModeOpacity(CanvasMode.DRAW, 0.8);
      }).not.toThrow();
    });

    it('should destroy without errors', () => {
      const config = {
        canvas,
        width: 800,
        height: 600,
        pixelRatio: 1
      };

      const system = new UnifiedEditingSystem(config);
      
      expect(() => {
        system.destroy();
      }).not.toThrow();
    });
  });

  describe('Device Pixel Ratio Handling', () => {
    it('should handle high DPI displays properly', () => {
      // Mock high DPI display
      const originalDevicePixelRatio = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 3,
        writable: true
      });

      const fallbackManager = new Canvas2DFallbackManager(canvas);
      const pixelRatio = fallbackManager.getPixelRatio();
      
      // Should be capped at 2 for performance
      expect(pixelRatio).toBeLessThanOrEqual(2);
      
      // Restore original value
      Object.defineProperty(window, 'devicePixelRatio', {
        value: originalDevicePixelRatio,
        writable: true
      });
    });

    it('should handle low DPI displays', () => {
      // Mock low DPI display
      const originalDevicePixelRatio = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 1,
        writable: true
      });

      const fallbackManager = new Canvas2DFallbackManager(canvas);
      const pixelRatio = fallbackManager.getPixelRatio();
      
      expect(pixelRatio).toBe(1);
      
      // Restore original value
      Object.defineProperty(window, 'devicePixelRatio', {
        value: originalDevicePixelRatio,
        writable: true
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Canvas2D fallback manager initialization errors', () => {
      // Mock a canvas that fails to get 2D context
      const failingCanvas = mockCanvas();
      const originalGetContext = failingCanvas.getContext.bind(failingCanvas);
      failingCanvas.getContext = () => null;

      expect(() => {
        new Canvas2DFallbackManager(failingCanvas);
      }).toThrow();
    });

    it('should handle WebGL context manager total failure', () => {
      // Mock a canvas that fails to get any context
      const failingCanvas = mockCanvas();
      failingCanvas.getContext = () => null;

      expect(() => {
        new WebGLContextManager(failingCanvas);
      }).toThrow();
    });

    it('should handle unified editing system canvas errors', () => {
      const failingCanvas = mockCanvas();
      failingCanvas.getContext = () => null;
      
      const config = {
        canvas: failingCanvas,
        width: 800,
        height: 600,
        pixelRatio: 1
      };

      // Should handle errors gracefully
      expect(() => {
        new UnifiedEditingSystem(config);
      }).not.toThrow();
    });
  });
});

// Integration test
describe('Canvas Rendering Integration', () => {
  it('should work end-to-end with fallback', async () => {
    const container = document.createElement('div');
    const canvas = mockFailingWebGLContext();
    container.appendChild(canvas);
    document.body.appendChild(container);

    const config = {
      canvas,
      width: 800,
      height: 600,
      pixelRatio: 1,
      performanceTarget: {
        fps: 60,
        maxSyncLatency: 16
      }
    };

    const system = new UnifiedEditingSystem(config);
    
    // Should initialize without errors
    expect(system.getInitializationStatus().initialized).toBe(true);
    
    // Should be able to set up drawing mode
    system.setModeActive(CanvasMode.DRAW, true);
    system.setPrimaryMode(CanvasMode.DRAW);
    
    // Should be able to start the system
    await expect(system.start()).resolves.not.toThrow();
    
    // Should be able to get canvas
    const unifiedCanvas = system.getCanvas();
    expect(unifiedCanvas).toBeTruthy();
    
    // Should be able to destroy cleanly
    expect(() => {
      system.destroy();
    }).not.toThrow();
    
    document.body.removeChild(container);
  });
});