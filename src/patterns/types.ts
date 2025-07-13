/**
 * Pattern System Type Definitions
 * Core types for the Genshi Studio Pattern Library
 */

import { Color } from '../types/graphics'

export interface PatternDefinition {
  id: string
  name: string
  nameJa: string // Japanese name
  category: PatternCategory
  description: string
  descriptionJa?: string
  thumbnail?: string
  tags: string[]
  customizable: PatternCustomization
}

export enum PatternCategory {
  TRADITIONAL_JAPANESE = 'traditional_japanese',
  GEOMETRIC = 'geometric',
  ORGANIC = 'organic',
  ABSTRACT = 'abstract',
  CUSTOM = 'custom'
}

export interface PatternCustomization {
  scale: {
    min: number
    max: number
    default: number
    step: number
  }
  rotation: {
    enabled: boolean
    step: number // degrees
  }
  colors: {
    primary: boolean
    secondary: boolean
    background: boolean
  }
  opacity: {
    min: number
    max: number
    default: number
    step: number
  }
  complexity?: {
    min: number
    max: number
    default: number
    step: number
  }
}

export interface PatternInstance {
  id: string
  patternId: string
  scale: number
  rotation: number
  opacity: number
  colors: {
    primary: Color
    secondary: Color
    background: Color
  }
  complexity?: number
  blendMode?: CanvasBlendMode
}

export enum CanvasBlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color-dodge',
  COLOR_BURN = 'color-burn',
  HARD_LIGHT = 'hard-light',
  SOFT_LIGHT = 'soft-light',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion'
}

export interface PatternRenderOptions {
  width: number
  height: number
  scale: number
  rotation: number
  opacity: number
  colors: {
    primary: Color
    secondary: Color
    background?: Color
  }
  complexity?: number
  quality?: 'low' | 'medium' | 'high'
  antialiasing?: boolean
}

export interface PatternApplication {
  targetType: 'fill' | 'stroke' | 'background' | 'mask'
  patternInstance: PatternInstance
  repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
  offset: { x: number; y: number }
}

export interface PatternLibraryState {
  selectedPattern: PatternDefinition | null
  activeInstance: PatternInstance | null
  customization: Partial<PatternInstance>
  previewMode: boolean
  favorites: string[] // pattern IDs
  recentPatterns: string[] // pattern IDs
}

export interface PatternPreset {
  id: string
  name: string
  patternId: string
  configuration: Partial<PatternInstance>
  thumbnail?: string
  tags: string[]
}