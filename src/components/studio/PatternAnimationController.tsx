import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { 
  AnimationConfig, 
  AnimationKeyframe, 
  CustomPattern, 
  PatternParameterConfig
} from '../../types/graphics';
import { AdvancedPatternGenerator } from '../../graphics/patterns/AdvancedPatternGenerator';
import { PatternType } from '../../graphics/patterns/CulturalPatternGenerator';

interface PatternAnimationControllerProps {
  pattern: CustomPattern;
  animationConfig: AnimationConfig;
  onAnimationConfigChange: (config: AnimationConfig) => void;
  width: number;
  height: number;
  onFrameGenerated?: (imageData: ImageData) => void;
  className?: string;
}

export function PatternAnimationController({
  pattern,
  animationConfig,
  onAnimationConfigChange,
  width,
  height,
  onFrameGenerated,
  className
}: PatternAnimationControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportingGif, setExportingGif] = useState(false);
  
  const animationRef = useRef<number | null>(null);
  const generatorRef = useRef<AdvancedPatternGenerator | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const buildPatternOptions = useCallback(() => {
    const options: any = {
      scale: 1,
      rotation: 0,
      color1: { r: 0, g: 0, b: 0, a: 1 },
      color2: { r: 1, g: 1, b: 1, a: 1 }
    };

    pattern.parameters.forEach(param => {
      if (param.type === 'color') {
        const hex = param.value as string;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
          options[param.name] = {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: 1
          };
        }
      } else {
        options[param.name] = param.value;
      }
    });

    return options;
  }, [pattern.parameters]);

  const interpolateKeyframes = useCallback((time: number) => {
    const normalizedTime = time / animationConfig.duration;
    const keyframes = [...animationConfig.keyframes].sort((a, b) => a.time - b.time);
    
    if (keyframes.length === 0) return buildPatternOptions();
    
    // Handle time outside keyframe range
    if (normalizedTime <= keyframes[0].time) {
      return { ...buildPatternOptions(), ...keyframes[0].parameters };
    }
    if (normalizedTime >= keyframes[keyframes.length - 1].time) {
      return { ...buildPatternOptions(), ...keyframes[keyframes.length - 1].parameters };
    }
    
    // Find surrounding keyframes
    let beforeFrame = keyframes[0];
    let afterFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (normalizedTime >= keyframes[i].time && normalizedTime <= keyframes[i + 1].time) {
        beforeFrame = keyframes[i];
        afterFrame = keyframes[i + 1];
        break;
      }
    }
    
    // Interpolate between keyframes
    const progress = (normalizedTime - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
    const interpolatedParams: any = {};
    
    animationConfig.animatedParams.forEach(param => {
      const beforeValue = beforeFrame.parameters[param];
      const afterValue = afterFrame.parameters[param];
      
      if (typeof beforeValue === 'number' && typeof afterValue === 'number') {
        interpolatedParams[param] = beforeValue + (afterValue - beforeValue) * progress;
      } else if (param.includes('color')) {
        // Handle color interpolation
        if (beforeValue && afterValue) {
          interpolatedParams[param] = {
            r: beforeValue.r + (afterValue.r - beforeValue.r) * progress,
            g: beforeValue.g + (afterValue.g - beforeValue.g) * progress,
            b: beforeValue.b + (afterValue.b - beforeValue.b) * progress,
            a: beforeValue.a + (afterValue.a - beforeValue.a) * progress
          };
        }
      }
    });
    
    return { ...buildPatternOptions(), ...interpolatedParams };
  }, [animationConfig, buildPatternOptions]);

  const generateFrame = useCallback((time: number) => {
    if (!generatorRef.current) return;
    
    const options = interpolateKeyframes(time);
    const imageData = generatorRef.current.generatePattern(
      pattern.basePattern as PatternType,
      width,
      height,
      options
    );
    
    if (onFrameGenerated) {
      onFrameGenerated(imageData);
    }
    
    return imageData;
  }, [interpolateKeyframes, pattern.basePattern, width, height, onFrameGenerated]);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = (timestamp - startTimeRef.current) / 1000 * playbackSpeed;
    let animationTime = elapsed;
    
    // Handle direction
    if (animationConfig.direction === 'reverse') {
      animationTime = animationConfig.duration - (elapsed % animationConfig.duration);
    } else if (animationConfig.direction === 'alternate') {
      const cycle = Math.floor(elapsed / animationConfig.duration);
      const cycleTime = elapsed % animationConfig.duration;
      animationTime = cycle % 2 === 0 ? cycleTime : animationConfig.duration - cycleTime;
    } else {
      animationTime = elapsed % animationConfig.duration;
    }
    
    setCurrentTime(animationTime);
    generateFrame(animationTime);
    
    // Check if animation should continue
    if (isPlaying && (isLooping || elapsed < animationConfig.duration)) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isLooping && elapsed >= animationConfig.duration) {
      setIsPlaying(false);
    }
  }, [isPlaying, playbackSpeed, animationConfig, isLooping, generateFrame]);

  const play = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, animate]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setCurrentTime(0);
    generateFrame(0);
  }, [pause, generateFrame]);

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(animationConfig.duration, time));
    setCurrentTime(clampedTime);
    generateFrame(clampedTime);
  }, [animationConfig.duration, generateFrame]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * animationConfig.duration;
    
    seekTo(time);
  }, [animationConfig.duration, seekTo]);

  const addKeyframe = useCallback((time: number) => {
    const normalizedTime = time / animationConfig.duration;
    const currentOptions = buildPatternOptions();
    
    const newKeyframe: AnimationKeyframe = {
      time: normalizedTime,
      parameters: {}
    };
    
    // Add current values for animated parameters
    animationConfig.animatedParams.forEach(param => {
      newKeyframe.parameters[param] = currentOptions[param];
    });
    
    const updatedKeyframes = [...animationConfig.keyframes, newKeyframe]
      .sort((a, b) => a.time - b.time);
    
    onAnimationConfigChange({
      ...animationConfig,
      keyframes: updatedKeyframes
    });
  }, [animationConfig, buildPatternOptions, onAnimationConfigChange]);

  const exportAsGif = useCallback(async () => {
    setExportingGif(true);
    
    try {
      // This is a simplified version - you'd need to implement actual GIF encoding
      const frames: ImageData[] = [];
      const frameCount = Math.ceil(animationConfig.duration * 30); // 30 FPS
      
      for (let i = 0; i < frameCount; i++) {
        const time = (i / frameCount) * animationConfig.duration;
        const frame = generateFrame(time);
        if (frame) frames.push(frame);
      }
      
      // Here you would use a GIF encoder library like gif.js
      console.log('Generated', frames.length, 'frames for GIF export');
      
      // For now, just export the first frame as PNG
      if (frames.length > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(frames[0], 0, 0);
          const link = document.createElement('a');
          link.download = `${pattern.name}-animated.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      }
    } catch (error) {
      console.error('Failed to export GIF:', error);
    } finally {
      setExportingGif(false);
    }
  }, [animationConfig, generateFrame, width, height, pattern.name]);

  const progress = animationConfig.duration > 0 ? currentTime / animationConfig.duration : 0;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      {/* Timeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Timeline</span>
          <span className="text-xs text-muted-foreground">
            {currentTime.toFixed(2)}s / {animationConfig.duration.toFixed(2)}s
          </span>
        </div>
        
        <div
          ref={timelineRef}
          className="relative h-8 bg-secondary rounded cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded"
            style={{ width: `${progress * 100}%` }}
          />
          
          {/* Keyframes */}
          {animationConfig.keyframes.map((keyframe, index) => (
            <div
              key={index}
              className="absolute top-0 w-1 h-full bg-yellow-500 cursor-pointer"
              style={{ left: `${keyframe.time * 100}%` }}
              title={`Keyframe at ${(keyframe.time * animationConfig.duration).toFixed(2)}s`}
            />
          ))}
          
          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => seekTo(currentTime - 0.1)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Step Back"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => seekTo(currentTime + 0.1)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Step Forward"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="text-xs p-1 rounded border border-border bg-background"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-md transition-colors ${
              isLooping ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            title="Loop"
          >
            Loop
          </button>
          
          <button
            onClick={() => addKeyframe(currentTime)}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Add Keyframe"
          >
            <Plus className="h-4 w-4" />
          </button>
          
          <button
            onClick={exportAsGif}
            disabled={exportingGif}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Export as GIF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}