/**
 * Core graphics type definitions for Genshi Studio
 */

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

export interface Transform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // radians
}

export interface RenderState {
  viewport: Rectangle;
  transform: Transform;
  currentColor: Color;
  blendMode: BlendMode;
}

export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  SoftLight = 'soft-light',
  HardLight = 'hard-light',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  Darken = 'darken',
  Lighten = 'lighten',
  Difference = 'difference',
  Exclusion = 'exclusion',
}

export interface Shader {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
  attributes: Map<string, number>;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  texture: WebGLTexture | null;
  transform: Transform;
}

export interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  onPointerDown?: (point: Point, pressure: number) => void;
  onPointerMove?: (point: Point, pressure: number) => void;
  onPointerUp?: (point: Point) => void;
}

export interface BrushSettings {
  size: number;
  hardness: number; // 0-1
  opacity: number; // 0-1
  flow: number; // 0-1
  smoothing: number; // 0-1
  pressureSensitivity: {
    size: boolean;
    opacity: boolean;
    flow: boolean;
  };
}

export interface PatternGeneratorOptions {
  scale: number;
  rotation: number;
  color1: Color;
  color2: Color;
  complexity?: number;
  // Animation properties
  animationSpeed?: number;
  animationDirection?: 'forward' | 'reverse' | 'alternate';
  animationEnabled?: boolean;
  // Custom variation properties
  variations?: PatternVariation[];
  // Combination properties
  blendMode?: BlendMode;
  opacity?: number;
}

export interface PatternVariation {
  id: string;
  name: string;
  description: string;
  parameters: PatternParameterConfig[];
  basePattern: string;
  createdAt: Date;
  modifiedAt: Date;
  isCustom: boolean;
}

export interface PatternParameterConfig {
  name: string;
  type: 'range' | 'color' | 'select' | 'boolean' | 'text';
  min?: number;
  max?: number;
  step?: number;
  value: number | string | boolean;
  options?: string[];
  description?: string;
  group?: string;
}

export interface CustomPattern {
  id: string;
  name: string;
  description: string;
  basePattern: string;
  parameters: PatternParameterConfig[];
  animation?: AnimationConfig;
  combinations?: PatternCombination[];
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];
  isPublic: boolean;
  shareId?: string;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number; // in seconds
  direction: 'forward' | 'reverse' | 'alternate';
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  animatedParams: string[];
  keyframes: AnimationKeyframe[];
}

export interface AnimationKeyframe {
  time: number; // 0-1
  parameters: { [key: string]: any };
}

export interface PatternCombination {
  id: string;
  patterns: {
    patternId: string;
    blendMode: BlendMode;
    opacity: number;
    offset: Point;
    scale: number;
    rotation: number;
  }[];
  compositionMode: 'overlay' | 'multiply' | 'screen' | 'difference';
}