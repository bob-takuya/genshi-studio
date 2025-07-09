/**
 * Test Data Fixtures for E2E Tests
 */

export const testPatterns = {
  geometric: [
    'mandala-basic',
    'mandala-complex',
    'hexagon-tile',
    'islamic-geometric',
    'kaleidoscope',
  ],
  floral: [
    'flower-motif',
    'vine-pattern',
    'lotus-design',
    'rose-window',
  ],
  traditional: [
    'celtic-knot',
    'arabesque',
    'japanese-wave',
    'aztec-pattern',
  ],
  modern: [
    'fractal-tree',
    'spiral-growth',
    'generative-art',
    'parametric-design',
  ],
  abstract: [
    'wave-pattern',
    'noise-texture',
    'gradient-mesh',
    'particle-system',
  ],
};

export const testColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  neutral: '#6B7280',
  black: '#000000',
  white: '#FFFFFF',
  culturalPalette: {
    japanese: ['#DC143C', '#FFD700', '#000000', '#FFFFFF'],
    islamic: ['#006994', '#FFD700', '#FFFFFF', '#2E7D32'],
    celtic: ['#004225', '#FFD700', '#8B4513', '#FFFFFF'],
    aztec: ['#B71C1C', '#FFD700', '#00695C', '#E65100'],
  },
};

export const testDrawings = {
  simpleLine: [
    [{ x: 100, y: 100 }, { x: 200, y: 200 }],
  ],
  square: [
    [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 },
      { x: 100, y: 100 },
    ],
  ],
  circle: Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2;
    return {
      x: 200 + Math.cos(angle) * 50,
      y: 200 + Math.sin(angle) * 50,
    };
  }),
  complexCurve: Array.from({ length: 100 }, (_, i) => ({
    x: 50 + i * 3,
    y: 200 + Math.sin(i * 0.1) * 50 * Math.cos(i * 0.05),
  })),
};

export const performanceThresholds = {
  fps: {
    target: 60,
    minimum: 55,
    critical: 30,
  },
  memory: {
    maxUsageMB: 512,
    maxGrowthMB: 256,
  },
  loadTime: {
    targetMs: 3000,
    ttfbMs: 500,
    domContentLoadedMs: 1500,
  },
  renderTime: {
    targetMs: 16.67, // 60fps
    maxMs: 33.33, // 30fps minimum
  },
};

export const accessibilityConfig = {
  wcagLevel: 'AA',
  contrastRatios: {
    normal: 4.5,
    large: 3,
  },
  focusIndicator: {
    minOutlineWidth: '2px',
    minContrastRatio: 3,
  },
  animations: {
    respectsReducedMotion: true,
    maxDuration: '0.3s',
  },
};

export const viewportSizes = {
  mobile: {
    small: { width: 320, height: 568 },
    medium: { width: 375, height: 667 },
    large: { width: 414, height: 896 },
  },
  tablet: {
    portrait: { width: 768, height: 1024 },
    landscape: { width: 1024, height: 768 },
  },
  desktop: {
    small: { width: 1280, height: 720 },
    medium: { width: 1920, height: 1080 },
    large: { width: 2560, height: 1440 },
  },
};

export const testArtworks = [
  {
    name: 'Mandala Meditation',
    pattern: 'mandala-complex',
    customization: { symmetry: 8, scale: 1.5 },
    overlayDrawings: testDrawings.circle,
  },
  {
    name: 'Celtic Harmony',
    pattern: 'celtic-knot',
    customization: { rotation: 45, scale: 1.2 },
    color: testColors.culturalPalette.celtic[0],
  },
  {
    name: 'Modern Fractal',
    pattern: 'fractal-tree',
    customization: { scale: 2, rotation: 0 },
    animations: true,
  },
];