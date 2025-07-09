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
}