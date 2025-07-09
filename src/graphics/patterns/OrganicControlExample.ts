/**
 * Organic Control System Example for Line Art Patterns
 * Demonstrates non-linear, artistic parameter controls
 */

export class OrganicControlExample {
  private time: number = 0;
  private noiseOffsets: Map<string, number> = new Map();
  private springStates: Map<string, { value: number; velocity: number }> = new Map();
  private breathingPhase: number = 0;
  
  /**
   * Transform a linear slider value (0-1) into an organic parameter
   * Uses multiple techniques to create unpredictable but beautiful responses
   */
  transformParameter(
    paramName: string,
    linearValue: number,
    options: {
      // How much Perlin noise affects the value (0-1)
      noiseInfluence?: number;
      // Spring dynamics for smooth transitions
      springStiffness?: number;
      springDamping?: number;
      // Breathing effect for living feel
      breathingAmount?: number;
      breathingSpeed?: number;
      // Non-linear response curve
      curve?: 'exponential' | 'logarithmic' | 'sine' | 'custom';
      customCurve?: (x: number) => number;
    } = {}
  ): number {
    const {
      noiseInfluence = 0.1,
      springStiffness = 0.15,
      springDamping = 0.85,
      breathingAmount = 0.05,
      breathingSpeed = 0.5,
      curve = 'sine'
    } = options;
    
    // Initialize states if needed
    if (!this.noiseOffsets.has(paramName)) {
      this.noiseOffsets.set(paramName, Math.random() * 1000);
    }
    if (!this.springStates.has(paramName)) {
      this.springStates.set(paramName, { value: linearValue, velocity: 0 });
    }
    
    // 1. Apply non-linear curve
    let value = this.applyCurve(linearValue, curve, options.customCurve);
    
    // 2. Add Perlin noise for organic variation
    const noiseOffset = this.noiseOffsets.get(paramName)!;
    const noise = this.perlinNoise(this.time * 0.001 + noiseOffset) * noiseInfluence;
    value = value + noise;
    
    // 3. Apply spring dynamics for smooth, elastic response
    const spring = this.springStates.get(paramName)!;
    const springForce = (value - spring.value) * springStiffness;
    spring.velocity = spring.velocity * springDamping + springForce;
    spring.value += spring.velocity;
    value = spring.value;
    
    // 4. Add breathing effect for living feel
    const breathing = Math.sin(this.breathingPhase * breathingSpeed) * breathingAmount;
    value = value * (1 + breathing);
    
    // Clamp to valid range
    return Math.max(0, Math.min(1, value));
  }
  
  /**
   * Create interconnected parameters that influence each other
   * Creates emergent behaviors from simple controls
   */
  createInterconnectedParameters(params: {
    speed: number;
    density: number;
    complexity: number;
  }): {
    flowSpeed: number;
    lineCount: number;
    turbulence: number;
    colorShift: number;
    patternScale: number;
  } {
    // Speed influences multiple aspects
    const flowSpeed = this.transformParameter('flowSpeed', params.speed, {
      noiseInfluence: 0.15,
      curve: 'exponential'
    });
    
    // Density affects line count but also influences other parameters
    const lineCount = Math.floor(
      this.transformParameter('lineCount', params.density, {
        noiseInfluence: 0.05,
        curve: 'logarithmic'
      }) * 200 + 50
    );
    
    // Complexity creates turbulence and affects speed
    const turbulence = this.transformParameter('turbulence', 
      params.complexity * (1 + params.speed * 0.3), {
      noiseInfluence: 0.2,
      breathingAmount: 0.1
    });
    
    // Emergent parameters from combinations
    const colorShift = this.transformParameter('colorShift',
      (params.speed * 0.5 + params.complexity * 0.5), {
      noiseInfluence: 0.1,
      breathingAmount: 0.15,
      breathingSpeed: 0.3
    });
    
    const patternScale = this.transformParameter('patternScale',
      1 - (params.density * 0.3 + params.complexity * 0.2), {
      springStiffness: 0.1,
      springDamping: 0.9
    });
    
    return {
      flowSpeed,
      lineCount,
      turbulence,
      colorShift,
      patternScale
    };
  }
  
  /**
   * Update time for animation
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.breathingPhase += deltaTime * 0.001;
  }
  
  /**
   * Apply non-linear curves to create organic responses
   */
  private applyCurve(
    value: number, 
    curve: string, 
    customCurve?: (x: number) => number
  ): number {
    switch (curve) {
      case 'exponential':
        // Slow start, fast end
        return Math.pow(value, 2);
        
      case 'logarithmic':
        // Fast start, slow end
        return Math.sqrt(value);
        
      case 'sine':
        // S-curve for smooth acceleration/deceleration
        return (Math.sin((value - 0.5) * Math.PI) + 1) / 2;
        
      case 'custom':
        return customCurve ? customCurve(value) : value;
        
      default:
        return value;
    }
  }
  
  /**
   * Simple Perlin noise implementation
   */
  private perlinNoise(x: number): number {
    // Simplified for example - real implementation would use proper Perlin
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const dx = x - x0;
    
    const a = this.pseudoRandom(x0);
    const b = this.pseudoRandom(x1);
    
    // Smooth interpolation
    const sx = dx * dx * (3 - 2 * dx);
    return a + sx * (b - a);
  }
  
  private pseudoRandom(x: number): number {
    const prime1 = 73856093;
    const prime2 = 19349663;
    let hash = x * prime1;
    hash = ((hash >> 16) ^ hash) * prime2;
    hash = ((hash >> 16) ^ hash);
    return (hash & 0x7fffffff) / 0x7fffffff - 0.5;
  }
}

/**
 * Example usage showing how organic controls create beautiful behaviors
 */
export class OrganicPatternExample {
  private controls = new OrganicControlExample();
  
  renderFrame(userInputs: { speed: number; density: number; complexity: number }) {
    // Update time
    this.controls.update(16); // 60fps
    
    // Transform user inputs into organic parameters
    const params = this.controls.createInterconnectedParameters(userInputs);
    
    // Use parameters to create beautiful patterns
    this.drawFlowField({
      speed: params.flowSpeed * 5,
      lineCount: params.lineCount,
      turbulence: params.turbulence * 0.5,
      colorPosition: params.colorShift,
      scale: params.patternScale * 2 + 0.5
    });
  }
  
  private drawFlowField(params: any) {
    // Pattern generation would happen here
    console.log('Drawing with organic parameters:', params);
  }
}

/**
 * Custom curve examples for different feels
 */
export const OrganicCurves = {
  // Gentle wave - good for color transitions
  gentleWave: (x: number) => {
    return x + Math.sin(x * Math.PI * 2) * 0.1;
  },
  
  // Elastic bounce - good for playful controls
  elasticBounce: (x: number) => {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 :
      Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },
  
  // Plateau curve - creates interesting pause points
  plateau: (x: number) => {
    if (x < 0.2) return x * 2.5;
    if (x < 0.8) return 0.5;
    return (x - 0.8) * 2.5 + 0.5;
  },
  
  // Breathing curve - for living, organic feel
  breathing: (x: number) => {
    return x + Math.sin(x * Math.PI * 4) * 0.05 * (1 - x);
  }
};