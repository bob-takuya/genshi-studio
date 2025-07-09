#version 300 es

precision highp float;

// Fragment shader for parametric pattern rendering
// Implements various mathematical patterns using GPU computation

in vec2 v_texCoord;
in vec2 v_position;
in vec2 v_screenPosition;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_primaryColor;
uniform vec4 u_secondaryColor;
uniform vec4 u_backgroundColor;
uniform float u_opacity;

// Pattern-specific parameters
uniform int u_patternType;
uniform float u_scale;
uniform float u_rotation;
uniform vec2 u_offset;
uniform float u_complexity;
uniform float u_symmetry;
uniform float u_strokeWidth;
uniform float u_smoothness;

// Animation parameters
uniform float u_animationSpeed;
uniform float u_animationAmplitude;
uniform bool u_animationEnabled;

// Fractal parameters
uniform vec2 u_fractalCenter;
uniform float u_fractalZoom;
uniform int u_fractalIterations;
uniform vec2 u_juliaConstant;

// Voronoi parameters
uniform float u_voronoiPointCount;
uniform float u_voronoiSeed;

out vec4 fragColor;

// Constants for pattern types
const int PATTERN_ISLAMIC_GEOMETRIC = 0;
const int PATTERN_PENROSE_TILING = 1;
const int PATTERN_TRUCHET_TILES = 2;
const int PATTERN_MANDELBROT = 3;
const int PATTERN_JULIA_SET = 4;
const int PATTERN_VORONOI = 5;
const int PATTERN_GIRIH_TILES = 6;
const int PATTERN_CELTIC_KNOT = 7;

// Utility functions
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random2(vec2 st) {
  st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float smoothstep_aa(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// Pattern generation functions

vec4 generateIslamicGeometric(vec2 pos) {
  vec2 center = vec2(0.0);
  float radius = length(pos - center);
  float angle = atan(pos.y - center.y, pos.x - center.x);
  
  // Apply animation
  float animTime = u_animationEnabled ? u_time * u_animationSpeed : 0.0;
  angle += animTime;
  
  // Create symmetric pattern
  float symAngle = mod(angle * u_symmetry, 2.0 * 3.14159);
  float star = abs(sin(symAngle * u_complexity));
  
  // Create radial pattern
  float radialPattern = sin(radius * u_scale + animTime) * 0.5 + 0.5;
  
  // Combine patterns
  float pattern = star * radialPattern;
  pattern = smoothstep_aa(0.3, 0.7, pattern);
  
  return mix(u_backgroundColor, u_primaryColor, pattern);
}

vec4 generatePenroseTiling(vec2 pos) {
  // Simplified Penrose tiling using golden ratio
  const float phi = 1.618033988749;
  
  vec2 scaledPos = pos * u_scale;
  
  // Create rhombus pattern
  float a = dot(scaledPos, vec2(1.0, 0.0));
  float b = dot(scaledPos, vec2(cos(2.0 * 3.14159 / 5.0), sin(2.0 * 3.14159 / 5.0)));
  float c = dot(scaledPos, vec2(cos(4.0 * 3.14159 / 5.0), sin(4.0 * 3.14159 / 5.0)));
  
  float pattern1 = sin(a * phi) * sin(b * phi);
  float pattern2 = sin(b * phi) * sin(c * phi);
  
  float combined = pattern1 + pattern2;
  combined = smoothstep_aa(-0.5, 0.5, combined);
  
  return mix(u_backgroundColor, u_primaryColor, combined);
}

vec4 generateTruchetTiles(vec2 pos) {
  vec2 scaledPos = pos * u_scale;
  vec2 grid = floor(scaledPos);
  vec2 local = fract(scaledPos) - 0.5;
  
  // Random tile orientation
  float tileRandom = random(grid + vec2(u_voronoiSeed));
  bool flipped = tileRandom > 0.5;
  
  if (flipped) {
    local.x = -local.x;
  }
  
  // Create quarter-circle arcs
  float dist1 = length(local + vec2(0.5, 0.5));
  float dist2 = length(local - vec2(0.5, 0.5));
  
  float arc1 = smoothstep_aa(0.4, 0.5, dist1) - smoothstep_aa(0.5, 0.6, dist1);
  float arc2 = smoothstep_aa(0.4, 0.5, dist2) - smoothstep_aa(0.5, 0.6, dist2);
  
  float pattern = max(arc1, arc2);
  
  return mix(u_backgroundColor, u_primaryColor, pattern);
}

vec4 generateMandelbrot(vec2 pos) {
  vec2 c = (pos - u_fractalCenter) / u_fractalZoom;
  vec2 z = vec2(0.0);
  
  int iterations = 0;
  for (int i = 0; i < 256; i++) {
    if (i >= u_fractalIterations) break;
    
    if (dot(z, z) > 4.0) break;
    
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    iterations++;
  }
  
  if (iterations == u_fractalIterations) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
  
  float t = float(iterations) / float(u_fractalIterations);
  
  // Rainbow coloring
  vec3 color = vec3(
    sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
    sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
    sin(t * 6.28318 + 4.188) * 0.5 + 0.5
  );
  
  return vec4(color, 1.0);
}

vec4 generateJuliaSet(vec2 pos) {
  vec2 z = pos / u_fractalZoom;
  vec2 c = u_juliaConstant;
  
  int iterations = 0;
  for (int i = 0; i < 256; i++) {
    if (i >= u_fractalIterations) break;
    
    if (dot(z, z) > 4.0) break;
    
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    iterations++;
  }
  
  if (iterations == u_fractalIterations) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
  
  float t = float(iterations) / float(u_fractalIterations);
  
  // Fire coloring
  vec3 color = vec3(
    min(1.0, t * 2.0),
    max(0.0, min(1.0, t * 2.0 - 0.5)),
    max(0.0, min(1.0, t * 2.0 - 1.0))
  );
  
  return vec4(color, 1.0);
}

vec4 generateVoronoi(vec2 pos) {
  vec2 scaledPos = pos * u_scale;
  vec2 grid = floor(scaledPos);
  vec2 local = fract(scaledPos);
  
  float minDistance = 1.0;
  vec2 closestPoint = vec2(0.0);
  
  // Check neighboring cells
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellGrid = grid + neighbor;
      vec2 cellPoint = random2(cellGrid + vec2(u_voronoiSeed)) * 0.8 + 0.1;
      
      vec2 pointPos = neighbor + cellPoint;
      float distance = length(pointPos - local);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = cellGrid;
      }
    }
  }
  
  // Color based on cell
  float cellColor = random(closestPoint + vec2(u_voronoiSeed));
  vec3 color = mix(u_backgroundColor.rgb, u_primaryColor.rgb, cellColor);
  
  // Add cell boundaries
  float edgeWidth = 0.02;
  float edge = smoothstep_aa(edgeWidth, edgeWidth * 2.0, minDistance);
  color = mix(u_secondaryColor.rgb, color, edge);
  
  return vec4(color, 1.0);
}

vec4 generateGirihTiles(vec2 pos) {
  vec2 scaledPos = pos * u_scale;
  
  // Create decagonal symmetry
  float radius = length(scaledPos);
  float angle = atan(scaledPos.y, scaledPos.x);
  
  // 10-fold symmetry
  float decagonalAngle = mod(angle * 5.0, 3.14159);
  float decagonalPattern = cos(decagonalAngle) * 0.5 + 0.5;
  
  // Radial pattern
  float radialPattern = sin(radius * u_complexity) * 0.5 + 0.5;
  
  // Combine patterns
  float pattern = decagonalPattern * radialPattern;
  pattern = smoothstep_aa(0.3, 0.7, pattern);
  
  return mix(u_backgroundColor, u_primaryColor, pattern);
}

vec4 generateCelticKnot(vec2 pos) {
  vec2 scaledPos = pos * u_scale;
  
  // Create interlacing pattern
  float pattern1 = sin(scaledPos.x * 3.14159 + u_time * u_animationSpeed) * 0.5 + 0.5;
  float pattern2 = sin(scaledPos.y * 3.14159 + u_time * u_animationSpeed) * 0.5 + 0.5;
  
  // Create knot effect
  float knot = pattern1 * pattern2;
  knot = smoothstep_aa(0.3, 0.7, knot);
  
  // Add stroke effect
  float strokeMask = smoothstep_aa(u_strokeWidth, u_strokeWidth + 0.02, abs(knot - 0.5));
  
  vec4 color = mix(u_primaryColor, u_secondaryColor, knot);
  color = mix(u_backgroundColor, color, strokeMask);
  
  return color;
}

void main() {
  vec2 pos = v_position;
  vec4 color = u_backgroundColor;
  
  // Apply time-based animation offset
  if (u_animationEnabled) {
    pos += vec2(cos(u_time * u_animationSpeed), sin(u_time * u_animationSpeed)) * u_animationAmplitude;
  }
  
  // Generate pattern based on type
  if (u_patternType == PATTERN_ISLAMIC_GEOMETRIC) {
    color = generateIslamicGeometric(pos);
  } else if (u_patternType == PATTERN_PENROSE_TILING) {
    color = generatePenroseTiling(pos);
  } else if (u_patternType == PATTERN_TRUCHET_TILES) {
    color = generateTruchetTiles(pos);
  } else if (u_patternType == PATTERN_MANDELBROT) {
    color = generateMandelbrot(pos);
  } else if (u_patternType == PATTERN_JULIA_SET) {
    color = generateJuliaSet(pos);
  } else if (u_patternType == PATTERN_VORONOI) {
    color = generateVoronoi(pos);
  } else if (u_patternType == PATTERN_GIRIH_TILES) {
    color = generateGirihTiles(pos);
  } else if (u_patternType == PATTERN_CELTIC_KNOT) {
    color = generateCelticKnot(pos);
  }
  
  // Apply global opacity
  color.a *= u_opacity;
  
  fragColor = color;
}