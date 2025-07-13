import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Brush, 
  Code, 
  Zap, 
  Grid3x3,
  Eye,
  EyeOff,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';

export enum CanvasMode {
  DRAW = 'draw',
  PARAMETRIC = 'parametric',
  CODE = 'code',
  GROWTH = 'growth'
}

interface ModeConfig {
  mode: CanvasMode;
  name: string;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  opacity: number;
  visible: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const SimpleUnifiedCanvas: React.FC<{ className?: string }> = ({ 
  className = "" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeColor } = useAppStore();
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [currentMode, setCurrentMode] = useState<CanvasMode>(CanvasMode.DRAW);
  
  // Mode configurations
  const [modeConfigs, setModeConfigs] = useState<ModeConfig[]>([
    {
      mode: CanvasMode.DRAW,
      name: 'Draw',
      icon: <Brush className="w-4 h-4" />,
      color: 'bg-blue-500',
      active: true,
      opacity: 1.0,
      visible: true
    },
    {
      mode: CanvasMode.PARAMETRIC,
      name: 'Parametric',
      icon: <Grid3x3 className="w-4 h-4" />,
      color: 'bg-purple-500',
      active: false,
      opacity: 0.8,
      visible: true
    },
    {
      mode: CanvasMode.CODE,
      name: 'Code',
      icon: <Code className="w-4 h-4" />,
      color: 'bg-green-500',
      active: false,
      opacity: 0.9,
      visible: true
    },
    {
      mode: CanvasMode.GROWTH,
      name: 'Growth',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-orange-500',
      active: false,
      opacity: 0.7,
      visible: true
    }
  ]);
  
  const [showModeSettings, setShowModeSettings] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const updateCanvasSize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      
      // Initialize with white background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  // Drawing handlers
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (currentMode !== CanvasMode.DRAW) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setIsDrawing(true);
    setLastPoint({ x, y });
    
    // Draw initial point
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.fill();
    }
  }, [currentMode, activeColor]);
  
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDrawing || !lastPoint || currentMode !== CanvasMode.DRAW) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    
    setLastPoint({ x, y });
  }, [isDrawing, lastPoint, currentMode, activeColor]);
  
  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);
  
  // Mode management
  const toggleMode = useCallback((mode: CanvasMode) => {
    setModeConfigs(prev => prev.map(config => 
      config.mode === mode 
        ? { ...config, active: !config.active }
        : config
    ));
    
    // Set as current mode if activating
    const config = modeConfigs.find(c => c.mode === mode);
    if (config && !config.active) {
      setCurrentMode(mode);
    }
  }, [modeConfigs]);
  
  const handleOpacityChange = useCallback((mode: CanvasMode, opacity: number) => {
    setModeConfigs(prev => prev.map(config =>
      config.mode === mode
        ? { ...config, opacity }
        : config
    ));
  }, []);
  
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);
  
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'genshi-canvas.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }, []);
  
  return (
    <div className={`h-full bg-gray-900 text-white relative overflow-hidden ${className}`}>
      {/* Mode Control Panel */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Unified Multi-Mode Canvas</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModeSettings(!showModeSettings)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Mode Indicators */}
        <div className="flex gap-2 mb-4">
          {modeConfigs.map(config => (
            <button
              key={config.mode}
              onClick={() => toggleMode(config.mode)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all
                ${config.active 
                  ? `${config.color} text-white shadow-lg` 
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
                }
              `}
              title={`${config.active ? 'Deactivate' : 'Activate'} ${config.name} mode`}
            >
              {config.icon}
              {config.name}
              {config.active && <span className="text-xs">●</span>}
            </button>
          ))}
        </div>

        {/* Mode Controls */}
        {showModeSettings && (
          <div className="space-y-3 border-t border-white/20 pt-4">
            {modeConfigs.map(config => (
              <div key={config.mode} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-xs font-medium">{config.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                    >
                      {config.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                
                {config.active && (
                  <div className="ml-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60 min-w-12">Opacity</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.opacity}
                        onChange={(e) => handleOpacityChange(config.mode, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-white/60 min-w-8">
                        {Math.round(config.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
        
        {/* Status */}
        <div className="mt-4 text-xs text-green-400">
          ● Live Sync Active
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        data-testid="main-canvas"
      >
        <canvas
          ref={canvasRef}
          id="drawing-canvas"
          data-testid="drawing-canvas"
          className="absolute inset-0 w-full h-full bg-white"
          style={{ 
            touchAction: 'none',
            cursor: currentMode === CanvasMode.DRAW ? 'crosshair' : 'default'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Mode Activity Indicators */}
      <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2">
        <div className="text-xs text-white/60 mb-1">Mode Activity</div>
        {modeConfigs.filter(config => config.active && config.visible).map(config => (
          <div 
            key={config.mode}
            className="flex items-center gap-2"
          >
            <div 
              className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}
              style={{ 
                opacity: config.opacity,
                animationDuration: '2s'
              }}
            />
            <span className="text-xs text-white/80">{config.name}</span>
          </div>
        ))}
      </div>
      
      {/* Performance indicator */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs font-mono">
        <div className="text-white/60 mb-1">Performance</div>
        <div className="text-green-400">Canvas 2D Mode</div>
        <div className="text-blue-400">Drawing Ready</div>
      </div>
    </div>
  );
};