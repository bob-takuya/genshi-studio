/**
 * Genshi Studio Animation Engine
 * A fluid, organic animation system for parametric patterns
 */

// Perlin Noise Implementation
class PerlinNoise {
    constructor() {
        this.p = new Uint8Array(512);
        this.permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }
        // Shuffle permutation table
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        // Duplicate permutation table
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i & 255];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y = 0, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y;
        const AA = this.p[A] + Z;
        const AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y;
        const BA = this.p[B] + Z;
        const BB = this.p[B + 1] + Z;

        return this.lerp(w,
            this.lerp(v,
                this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
            ),
            this.lerp(v,
                this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
            )
        );
    }
}

// Main Animation Engine
class GenshiAnimationEngine {
    constructor(canvas, appState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
        this.appState = appState;
        
        // Core components
        this.animationCore = new AnimationCore();
        this.patternMorpher = new PatternMorpher(this);
        this.organicModulator = new OrganicModulator();
        this.gestureController = new FluidGestureController(canvas, this);
        this.gradientEngine = new DynamicGradientEngine();
        this.pulseSystem = new OrganicPulse();
        
        // Animation state
        this.isAnimating = false;
        this.animations = new Map();
        this.globalTime = 0;
        this.deltaTime = 0;
        this.lastFrameTime = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsUpdateInterval = 500; // ms
        this.lastFpsUpdate = 0;
        
        // Initialize components
        this.initializeModulations();
        this.initializeGestures();
    }
    
    initializeModulations() {
        // Add default modulations for organic movement
        this.organicModulator.addPerlinModulation('scale', {
            amplitude: 0.15,
            frequency: 0.0003,
            octaves: 2
        });
        
        this.organicModulator.addPerlinModulation('rotation', {
            amplitude: 15,
            frequency: 0.0002,
            octaves: 3
        });
        
        this.organicModulator.addPerlinModulation('complexity', {
            amplitude: 1,
            frequency: 0.0001,
            octaves: 1
        });
        
        // Add breathing animations
        this.pulseSystem.addBreathingCycle('density', {
            inhaleTime: 3.0,
            holdTime: 0.5,
            exhaleTime: 3.5,
            restTime: 0.5,
            amplitude: 0.1
        });
        
        // Add spring physics for interactive parameters
        this.organicModulator.springPhysics.addSpring('scale', this.appState.parameters.scale);
        this.organicModulator.springPhysics.addSpring('rotation', this.appState.parameters.rotation);
    }
    
    initializeGestures() {
        this.gestureController.enable();
    }
    
    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.lastFrameTime = performance.now();
            this.animate();
        }
    }
    
    stop() {
        this.isAnimating = false;
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // Cap at 100ms
        this.globalTime += this.deltaTime;
        this.lastFrameTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Update all animation systems
        this.updateAnimations();
        
        // Render the current frame
        this.render();
        
        // Continue animation loop
        requestAnimationFrame(() => this.animate());
    }
    
    updateAnimations() {
        // Update organic modulations
        const modulated = this.organicModulator.update(this.globalTime, this.deltaTime, this.appState.parameters);
        
        // Update breathing animations
        const breathingValues = this.pulseSystem.update(this.globalTime);
        
        // Apply modulations to app state
        Object.keys(modulated).forEach(param => {
            if (breathingValues[param] !== undefined) {
                this.appState.parameters[param] = modulated[param] + breathingValues[param];
            } else {
                this.appState.parameters[param] = modulated[param];
            }
        });
        
        // Update pattern morphing
        if (this.patternMorpher.isTransitioning) {
            this.patternMorpher.update(this.deltaTime);
        }
        
        // Update gradient evolution
        this.gradientEngine.update(this.globalTime);
    }
    
    render() {
        // This will be called by the main app's generatePattern function
        // We just need to ensure parameters are updated
        if (window.generatePattern) {
            window.generatePattern();
        }
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
            const fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            const fpsCounter = document.getElementById('fpsCounter');
            if (fpsCounter) {
                fpsCounter.textContent = `${fps} FPS`;
                fpsCounter.className = fps >= 50 ? 'fps-good' : fps >= 30 ? 'fps-medium' : 'fps-poor';
            }
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    morphTo(targetPattern, options = {}) {
        const duration = options.duration || 2.0;
        const easing = options.easing || 'easeInOutCubic';
        
        this.patternMorpher.startMorph(
            this.appState.currentPattern,
            targetPattern,
            duration,
            easing
        );
    }
    
    addModulation(parameter, config) {
        this.organicModulator.addPerlinModulation(parameter, config);
    }
    
    addBreathing(parameter, config) {
        this.pulseSystem.addBreathingCycle(parameter, config);
    }
}

// Animation Core - Base animation loop manager
class AnimationCore {
    constructor() {
        this.animations = new Map();
        this.easingFunctions = {
            linear: t => t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeInElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeInOutElastic: t => {
                const c5 = (2 * Math.PI) / 4.5;
                return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
                    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
            }
        };
    }
    
    addAnimation(id, animation) {
        this.animations.set(id, animation);
    }
    
    removeAnimation(id) {
        this.animations.delete(id);
    }
    
    updateAnimations(deltaTime) {
        const completedAnimations = [];
        
        this.animations.forEach((animation, id) => {
            animation.progress += deltaTime / animation.duration;
            
            if (animation.progress >= 1) {
                animation.progress = 1;
                completedAnimations.push(id);
            }
            
            const easing = this.easingFunctions[animation.easing] || this.easingFunctions.linear;
            const easedProgress = easing(animation.progress);
            
            animation.onUpdate(easedProgress);
        });
        
        // Remove completed animations
        completedAnimations.forEach(id => {
            const animation = this.animations.get(id);
            if (animation.onComplete) {
                animation.onComplete();
            }
            this.animations.delete(id);
        });
    }
}

// Pattern Morphing System
class PatternMorpher {
    constructor(engine) {
        this.engine = engine;
        this.isTransitioning = false;
        this.sourcePattern = null;
        this.targetPattern = null;
        this.morphProgress = 0;
        this.morphDuration = 2.0;
        this.easing = 'easeInOutCubic';
        
        // Geometry extraction cache
        this.geometryCache = new Map();
    }
    
    startMorph(fromPattern, toPattern, duration, easing) {
        this.sourcePattern = fromPattern;
        this.targetPattern = toPattern;
        this.morphDuration = duration;
        this.easing = easing;
        this.morphProgress = 0;
        this.isTransitioning = true;
        
        // Create animation
        this.engine.animationCore.addAnimation('patternMorph', {
            duration: duration,
            progress: 0,
            easing: easing,
            onUpdate: (progress) => {
                this.morphProgress = progress;
                this.updateMorph(progress);
            },
            onComplete: () => {
                this.completeMorph();
            }
        });
    }
    
    updateMorph(progress) {
        // Interpolate parameters between patterns
        const sourceDefaults = patterns[this.sourcePattern].defaultParams;
        const targetDefaults = patterns[this.targetPattern].defaultParams;
        
        // Smooth parameter interpolation
        Object.keys(sourceDefaults).forEach(param => {
            if (targetDefaults[param] !== undefined) {
                const sourceValue = sourceDefaults[param];
                const targetValue = targetDefaults[param];
                this.engine.appState.parameters[param] = this.lerp(sourceValue, targetValue, progress);
            }
        });
        
        // Update pattern blend for rendering
        this.engine.appState.patternBlend = {
            source: this.sourcePattern,
            target: this.targetPattern,
            progress: progress
        };
    }
    
    completeMorph() {
        this.isTransitioning = false;
        this.engine.appState.currentPattern = this.targetPattern;
        this.engine.appState.patternBlend = null;
        
        // Update UI
        if (window.selectPattern) {
            window.selectPattern(this.targetPattern);
        }
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

// Organic Modulator - Perlin noise and physics-based parameter modulation
class OrganicModulator {
    constructor() {
        this.perlinModulations = new Map();
        this.springPhysics = new SpringPhysics();
        this.autonomousDrift = new AutonomousDrift();
        
        // Initialize noise generators
        this.noiseGenerators = new Map();
    }
    
    addPerlinModulation(parameter, config) {
        if (!this.noiseGenerators.has(parameter)) {
            this.noiseGenerators.set(parameter, new PerlinNoise());
        }
        
        this.perlinModulations.set(parameter, {
            amplitude: config.amplitude || 0.1,
            frequency: config.frequency || 0.001,
            octaves: config.octaves || 1,
            baseValue: null
        });
    }
    
    update(globalTime, deltaTime, parameters) {
        const modulated = {};
        
        // Apply Perlin noise modulations
        this.perlinModulations.forEach((config, param) => {
            if (config.baseValue === null) {
                config.baseValue = parameters[param];
            }
            
            let noiseValue = 0;
            const noise = this.noiseGenerators.get(param);
            
            // Multi-octave noise for more organic movement
            for (let octave = 0; octave < config.octaves; octave++) {
                const frequency = config.frequency * Math.pow(2, octave);
                const amplitude = config.amplitude / Math.pow(2, octave);
                noiseValue += noise.noise(globalTime * frequency) * amplitude;
            }
            
            modulated[param] = config.baseValue + noiseValue;
        });
        
        // Update spring physics
        this.springPhysics.update(deltaTime);
        this.springPhysics.springs.forEach((spring, param) => {
            if (modulated[param] !== undefined) {
                spring.target = modulated[param];
                modulated[param] = spring.current;
            }
        });
        
        // Apply autonomous drift
        Object.keys(modulated).forEach(param => {
            const drift = this.autonomousDrift.calculateDrift(param, modulated[param]);
            modulated[param] += drift * deltaTime;
        });
        
        return modulated;
    }
}

// Spring Physics System
class SpringPhysics {
    constructor() {
        this.springs = new Map();
        this.damping = 0.88;
        this.stiffness = 0.08;
    }
    
    addSpring(parameter, initialValue) {
        this.springs.set(parameter, {
            current: initialValue,
            velocity: 0,
            target: initialValue
        });
    }
    
    update(deltaTime) {
        this.springs.forEach((spring, parameter) => {
            const force = (spring.target - spring.current) * this.stiffness;
            spring.velocity += force * deltaTime * 60; // Normalize to 60fps
            spring.velocity *= Math.pow(this.damping, deltaTime * 60);
            spring.current += spring.velocity * deltaTime;
        });
    }
    
    setTarget(parameter, target) {
        const spring = this.springs.get(parameter);
        if (spring) {
            spring.target = target;
        }
    }
    
    impulse(parameter, force) {
        const spring = this.springs.get(parameter);
        if (spring) {
            spring.velocity += force;
        }
    }
}

// Autonomous Drift System
class AutonomousDrift {
    constructor() {
        this.attractors = [];
        this.driftNoises = new Map();
        this.wanderStrength = 0.002;
    }
    
    addAttractor(parameter, value, strength) {
        this.attractors.push({ parameter, value, strength });
    }
    
    calculateDrift(parameter, currentValue) {
        let drift = 0;
        
        // Apply attractors
        this.attractors.forEach(attractor => {
            if (attractor.parameter === parameter) {
                const distance = attractor.value - currentValue;
                const attraction = Math.tanh(distance * 0.1) * attractor.strength;
                drift += attraction;
            }
        });
        
        // Add wandering behavior using Perlin noise
        if (!this.driftNoises.has(parameter)) {
            this.driftNoises.set(parameter, new PerlinNoise());
        }
        const noise = this.driftNoises.get(parameter);
        drift += noise.noise(Date.now() * 0.0001) * this.wanderStrength;
        
        return drift;
    }
}

// Fluid Gesture Controller
class FluidGestureController {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.touches = new Map();
        this.velocityBuffer = [];
        this.maxVelocityBufferSize = 5;
        
        // Gesture state
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.velocity = { x: 0, y: 0 };
        
        // Inertia settings
        this.inertiaEnabled = true;
        this.friction = 0.95;
        
        // Gesture recognition
        this.gestureStartTime = 0;
        this.gestureStartPos = { x: 0, y: 0 };
    }
    
    enable() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.gestureStartTime = Date.now();
        this.gestureStartPos = { x: e.clientX, y: e.clientY };
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.velocityBuffer = [];
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        
        // Update velocity buffer for inertia
        this.velocityBuffer.push({ x: deltaX, y: deltaY, time: Date.now() });
        if (this.velocityBuffer.length > this.maxVelocityBufferSize) {
            this.velocityBuffer.shift();
        }
        
        // Apply gesture to parameters
        this.applyGesture(deltaX, deltaY);
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        
        // Calculate final velocity for inertia
        if (this.velocityBuffer.length > 0 && this.inertiaEnabled) {
            const recentVelocities = this.velocityBuffer.slice(-3);
            this.velocity = {
                x: recentVelocities.reduce((sum, v) => sum + v.x, 0) / recentVelocities.length,
                y: recentVelocities.reduce((sum, v) => sum + v.y, 0) / recentVelocities.length
            };
            
            this.applyInertia();
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        // Use wheel for scale adjustment with spring physics
        const scaleDelta = -e.deltaY * 0.001;
        const spring = this.engine.organicModulator.springPhysics.springs.get('scale');
        if (spring) {
            spring.target = Math.max(0.1, Math.min(3.0, spring.target + scaleDelta));
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2) {
            // Pinch gesture for scale
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            if (this.lastPinchDistance) {
                const scaleDelta = (distance - this.lastPinchDistance) * 0.01;
                const spring = this.engine.organicModulator.springPhysics.springs.get('scale');
                if (spring) {
                    spring.target = Math.max(0.1, Math.min(3.0, spring.target + scaleDelta));
                }
            }
            
            this.lastPinchDistance = distance;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp({});
        this.lastPinchDistance = null;
    }
    
    applyGesture(deltaX, deltaY) {
        // Convert gesture to parameter changes
        const rotationDelta = deltaX * 0.5;
        const complexityDelta = -deltaY * 0.02;
        
        // Apply to spring physics for smooth response
        const rotationSpring = this.engine.organicModulator.springPhysics.springs.get('rotation');
        if (rotationSpring) {
            rotationSpring.target += rotationDelta;
        }
        
        // Direct parameter update for complexity
        this.engine.appState.parameters.complexity = Math.max(1, Math.min(20,
            this.engine.appState.parameters.complexity + complexityDelta));
    }
    
    applyInertia() {
        const inertiaAnimation = () => {
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
            
            if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
                this.applyGesture(this.velocity.x, this.velocity.y);
                requestAnimationFrame(inertiaAnimation);
            }
        };
        
        requestAnimationFrame(inertiaAnimation);
    }
}

// Dynamic Gradient Engine
class DynamicGradientEngine {
    constructor() {
        this.colorEvolution = new ColorEvolution();
        this.gradientCache = new Map();
        this.maxCacheSize = 100;
    }
    
    update(globalTime) {
        this.colorEvolution.update(globalTime);
        
        // Clean cache periodically
        if (this.gradientCache.size > this.maxCacheSize) {
            const entriesToDelete = this.gradientCache.size - this.maxCacheSize / 2;
            const keys = Array.from(this.gradientCache.keys());
            for (let i = 0; i < entriesToDelete; i++) {
                this.gradientCache.delete(keys[i]);
            }
        }
    }
    
    createLineGradient(ctx, startPoint, endPoint, colors, time) {
        // Calculate line direction
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        
        // Create gradient perpendicular to line
        const gradientLength = 50;
        const perpAngle = angle + Math.PI / 2;
        
        const gradStartX = startPoint.x + Math.cos(perpAngle) * gradientLength;
        const gradStartY = startPoint.y + Math.sin(perpAngle) * gradientLength;
        const gradEndX = startPoint.x - Math.cos(perpAngle) * gradientLength;
        const gradEndY = startPoint.y - Math.sin(perpAngle) * gradientLength;
        
        const gradient = ctx.createLinearGradient(gradStartX, gradStartY, gradEndX, gradEndY);
        
        // Apply time-based color evolution
        const evolvedColors = colors.map(color => 
            this.colorEvolution.evolveColor(color, time)
        );
        
        // Add color stops
        evolvedColors.forEach((color, index) => {
            gradient.addColorStop(index / (evolvedColors.length - 1), color);
        });
        
        return gradient;
    }
    
    createRadialGradient(ctx, center, radius, colors, time) {
        const gradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
        );
        
        // Apply time-based color evolution
        const evolvedColors = colors.map(color => 
            this.colorEvolution.evolveColor(color, time)
        );
        
        // Add color stops with breathing effect
        evolvedColors.forEach((color, index) => {
            const position = index / (evolvedColors.length - 1);
            const breathingOffset = Math.sin(time * 0.001 + position * Math.PI) * 0.05;
            gradient.addColorStop(
                Math.max(0, Math.min(1, position + breathingOffset)),
                color
            );
        });
        
        return gradient;
    }
}

// Color Evolution System
class ColorEvolution {
    constructor() {
        this.hueShiftSpeed = 0.01;
        this.saturationWaveSpeed = 0.002;
        this.brightnessNoiseScale = 0.001;
        this.colorPhase = 0;
        
        this.brightnessNoise = new PerlinNoise();
    }
    
    update(globalTime) {
        this.colorPhase = globalTime * 0.001;
    }
    
    evolveColor(hexColor, time) {
        const rgb = this.hexToRgb(hexColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Evolve hue with cyclic motion
        hsl.h = (hsl.h + this.hueShiftSpeed * time) % 360;
        
        // Modulate saturation with sine wave
        const saturationModulation = Math.sin(time * this.saturationWaveSpeed) * 0.2 + 1;
        hsl.s = Math.max(0, Math.min(100, hsl.s * saturationModulation));
        
        // Add brightness variation with Perlin noise
        const brightnessModulation = this.brightnessNoise.noise(time * this.brightnessNoiseScale) * 0.1 + 1;
        hsl.l = Math.max(0, Math.min(100, hsl.l * brightnessModulation));
        
        const evolved = this.hslToRgb(hsl.h, hsl.s, hsl.l);
        return `rgb(${evolved.r}, ${evolved.g}, ${evolved.b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }
    
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
}

// Organic Pulse System - Breathing and heartbeat animations
class OrganicPulse {
    constructor() {
        this.breathingCycles = [];
        this.pulseValues = new Map();
    }
    
    addBreathingCycle(parameter, config) {
        this.breathingCycles.push({
            parameter,
            inhaleTime: config.inhaleTime || 2.0,
            holdTime: config.holdTime || 0.5,
            exhaleTime: config.exhaleTime || 2.5,
            restTime: config.restTime || 0.3,
            amplitude: config.amplitude || 0.1,
            phase: Math.random() * Math.PI * 2 // Random phase for natural variation
        });
    }
    
    update(globalTime) {
        const values = {};
        
        this.breathingCycles.forEach(cycle => {
            const value = this.calculateBreathing(cycle, globalTime + cycle.phase);
            values[cycle.parameter] = value;
        });
        
        return values;
    }
    
    calculateBreathing(cycle, time) {
        const totalTime = cycle.inhaleTime + cycle.holdTime + cycle.exhaleTime + cycle.restTime;
        const phase = (time % totalTime) / totalTime;
        
        let value = 0;
        const inhaleEnd = cycle.inhaleTime / totalTime;
        const holdEnd = (cycle.inhaleTime + cycle.holdTime) / totalTime;
        const exhaleEnd = (cycle.inhaleTime + cycle.holdTime + cycle.exhaleTime) / totalTime;
        
        if (phase < inhaleEnd) {
            // Inhale - smooth ease in
            const t = phase / inhaleEnd;
            value = cycle.amplitude * this.smoothstep(0, 1, t);
        } else if (phase < holdEnd) {
            // Hold
            value = cycle.amplitude;
        } else if (phase < exhaleEnd) {
            // Exhale - smooth ease out
            const t = (phase - holdEnd) / (exhaleEnd - holdEnd);
            value = cycle.amplitude * (1 - this.smoothstep(0, 1, t));
        } else {
            // Rest
            value = 0;
        }
        
        // Add subtle variation
        value *= (0.9 + 0.1 * Math.sin(time * 0.0003));
        
        return value;
    }
    
    smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
}

// Export for use in main application
window.GenshiAnimationEngine = GenshiAnimationEngine;