/**
 * Japanese Traditional Pattern Definitions
 * Collection of traditional Japanese patterns with cultural significance
 */

import { PatternDefinition, PatternCategory, CanvasBlendMode } from './types'
import { Color } from '../types/graphics'

export const JAPANESE_PATTERNS: PatternDefinition[] = [
  {
    id: 'asanoha',
    name: 'Asanoha',
    nameJa: '麻の葉',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Hemp leaf pattern symbolizing growth and protection',
    descriptionJa: '成長と保護を象徴する麻の葉模様',
    tags: ['traditional', 'geometric', 'hexagonal', 'nature'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'seigaiha',
    name: 'Seigaiha',
    nameJa: '青海波',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Wave pattern representing tranquility and good luck',
    descriptionJa: '平穏と幸運を表す波模様',
    tags: ['traditional', 'waves', 'water', 'nature'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'shippo',
    name: 'Shippo',
    nameJa: '七宝',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Seven treasures pattern symbolizing harmonious relationships',
    descriptionJa: '調和のとれた関係を象徴する七宝模様',
    tags: ['traditional', 'circles', 'geometric', 'harmony'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'kikkoumon',
    name: 'Kikkoumon',
    nameJa: '亀甲文',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Tortoise shell pattern representing longevity and fortune',
    descriptionJa: '長寿と幸運を表す亀甲模様',
    tags: ['traditional', 'hexagonal', 'geometric', 'longevity'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'ichimatsu',
    name: 'Ichimatsu',
    nameJa: '市松',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Checkerboard pattern symbolizing prosperity',
    descriptionJa: '繁栄を象徴する市松模様',
    tags: ['traditional', 'checkerboard', 'geometric', 'simple'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 45 },
      colors: {
        primary: true,
        secondary: true,
        background: false
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'kagome',
    name: 'Kagome',
    nameJa: '籠目',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Basket weave pattern for protection against evil',
    descriptionJa: '邪悪から守る籠目模様',
    tags: ['traditional', 'weave', 'geometric', 'protection'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'sayagata',
    name: 'Sayagata',
    nameJa: '紗綾形',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Key fret pattern representing continuous good fortune',
    descriptionJa: '継続的な幸運を表す紗綾形模様',
    tags: ['traditional', 'maze', 'geometric', 'fortune'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 90 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 }
    }
  },
  {
    id: 'tatewaku',
    name: 'Tatewaku',
    nameJa: '立涌',
    category: PatternCategory.TRADITIONAL_JAPANESE,
    description: 'Rising steam pattern symbolizing ascension',
    descriptionJa: '上昇を象徴する立涌模様',
    tags: ['traditional', 'waves', 'vertical', 'steam'],
    customizable: {
      scale: { min: 0.5, max: 3, default: 1, step: 0.1 },
      rotation: { enabled: true, step: 15 },
      colors: {
        primary: true,
        secondary: true,
        background: true
      },
      opacity: { min: 0.1, max: 1, default: 1, step: 0.05 },
      complexity: { min: 1, max: 10, default: 5, step: 1 }
    }
  }
]

// Default color schemes for Japanese patterns
export const JAPANESE_COLOR_SCHEMES = {
  traditional: {
    indigo: { primary: { r: 0.11, g: 0.16, b: 0.33, a: 1 }, secondary: { r: 1, g: 1, b: 1, a: 1 } },
    vermillion: { primary: { r: 0.89, g: 0.26, b: 0.20, a: 1 }, secondary: { r: 1, g: 1, b: 1, a: 1 } },
    blackInk: { primary: { r: 0.06, g: 0.06, b: 0.06, a: 1 }, secondary: { r: 1, g: 1, b: 1, a: 1 } },
    goldLeaf: { primary: { r: 0.83, g: 0.69, b: 0.22, a: 1 }, secondary: { r: 0.13, g: 0.13, b: 0.13, a: 1 } }
  },
  modern: {
    neon: { primary: { r: 0, g: 1, b: 0.5, a: 1 }, secondary: { r: 1, g: 0, b: 0.5, a: 1 } },
    pastel: { primary: { r: 0.68, g: 0.85, b: 0.90, a: 1 }, secondary: { r: 1, g: 0.75, b: 0.80, a: 1 } },
    monochrome: { primary: { r: 0.2, g: 0.2, b: 0.2, a: 1 }, secondary: { r: 0.8, g: 0.8, b: 0.8, a: 1 } }
  }
}

// Pattern blend mode recommendations
export const PATTERN_BLEND_MODES = {
  asanoha: [CanvasBlendMode.NORMAL, CanvasBlendMode.MULTIPLY],
  seigaiha: [CanvasBlendMode.NORMAL, CanvasBlendMode.OVERLAY],
  shippo: [CanvasBlendMode.NORMAL, CanvasBlendMode.SCREEN],
  kikkoumon: [CanvasBlendMode.NORMAL, CanvasBlendMode.MULTIPLY],
  ichimatsu: [CanvasBlendMode.NORMAL, CanvasBlendMode.DIFFERENCE],
  kagome: [CanvasBlendMode.NORMAL, CanvasBlendMode.OVERLAY],
  sayagata: [CanvasBlendMode.NORMAL, CanvasBlendMode.MULTIPLY],
  tatewaku: [CanvasBlendMode.NORMAL, CanvasBlendMode.SOFT_LIGHT]
}