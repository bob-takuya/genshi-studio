/**
 * Input Device Manager for Pressure-Sensitive Devices
 * Supports Wacom, Apple Pencil, Surface Pen, and other professional input devices
 */

export interface PressureData {
  pressure: number;        // 0.0 to 1.0
  tangentialPressure?: number; // -1.0 to 1.0 (barrel pressure)
  tiltX?: number;         // -90 to 90 degrees
  tiltY?: number;         // -90 to 90 degrees
  twist?: number;         // 0 to 359 degrees
  width?: number;         // Contact width
  height?: number;        // Contact height
}

export interface InputDeviceInfo {
  type: 'pen' | 'touch' | 'mouse' | 'unknown';
  vendor?: string;
  model?: string;
  supportsPressure: boolean;
  supportsTilt: boolean;
  supportsRotation: boolean;
  supportsBarrelPressure: boolean;
  maxPressure: number;
  pressureResolution: number;
}

export interface PressureCurve {
  name: string;
  controlPoints: Array<{ x: number; y: number }>;
  interpolation: 'linear' | 'cubic' | 'exponential';
}

export class InputDeviceManager {
  private currentDevice: InputDeviceInfo | null = null;
  private pressureCurves: Map<string, PressureCurve> = new Map();
  private activeCurve: PressureCurve;
  private devicePresets: Map<string, any> = new Map();
  private pointerEventSupported: boolean;
  private lastRawPressure: number = 0;
  private calibrationData: Map<string, any> = new Map();

  constructor() {
    this.pointerEventSupported = 'PointerEvent' in window;
    this.initializeDefaultCurves();
    this.detectCurrentDevice();
    this.activeCurve = this.pressureCurves.get('default')!;
  }

  private initializeDefaultCurves(): void {
    // Default linear curve
    this.pressureCurves.set('default', {
      name: 'Default',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ],
      interpolation: 'linear'
    });

    // Soft pressure curve for light touch
    this.pressureCurves.set('soft', {
      name: 'Soft',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0.3, y: 0.5 },
        { x: 0.6, y: 0.8 },
        { x: 1, y: 1 }
      ],
      interpolation: 'cubic'
    });

    // Hard pressure curve for firm strokes
    this.pressureCurves.set('hard', {
      name: 'Hard',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0.4, y: 0.2 },
        { x: 0.7, y: 0.5 },
        { x: 1, y: 1 }
      ],
      interpolation: 'cubic'
    });

    // Natural curve mimicking traditional media
    this.pressureCurves.set('natural', {
      name: 'Natural',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0.2, y: 0.15 },
        { x: 0.5, y: 0.5 },
        { x: 0.8, y: 0.85 },
        { x: 1, y: 1 }
      ],
      interpolation: 'cubic'
    });

    // Wacom optimized curve
    this.pressureCurves.set('wacom', {
      name: 'Wacom Optimized',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0.1, y: 0.05 },
        { x: 0.5, y: 0.45 },
        { x: 0.9, y: 0.95 },
        { x: 1, y: 1 }
      ],
      interpolation: 'cubic'
    });

    // Apple Pencil optimized curve
    this.pressureCurves.set('apple-pencil', {
      name: 'Apple Pencil',
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0.15, y: 0.1 },
        { x: 0.5, y: 0.48 },
        { x: 0.85, y: 0.9 },
        { x: 1, y: 1 }
      ],
      interpolation: 'cubic'
    });
  }

  detectCurrentDevice(): void {
    // Basic device detection based on user agent and available APIs
    const ua = navigator.userAgent.toLowerCase();
    
    if (ua.includes('ipad') && 'ontouchstart' in window) {
      this.currentDevice = {
        type: 'pen',
        vendor: 'Apple',
        model: 'Apple Pencil',
        supportsPressure: true,
        supportsTilt: true,
        supportsRotation: false,
        supportsBarrelPressure: false,
        maxPressure: 1.0,
        pressureResolution: 4096
      };
      this.activeCurve = this.pressureCurves.get('apple-pencil')!;
    } else if (ua.includes('surface')) {
      this.currentDevice = {
        type: 'pen',
        vendor: 'Microsoft',
        model: 'Surface Pen',
        supportsPressure: true,
        supportsTilt: true,
        supportsRotation: false,
        supportsBarrelPressure: true,
        maxPressure: 1.0,
        pressureResolution: 1024
      };
    } else if (this.pointerEventSupported) {
      // Generic pen device
      this.currentDevice = {
        type: 'pen',
        vendor: 'Unknown',
        supportsPressure: true,
        supportsTilt: true,
        supportsRotation: true,
        supportsBarrelPressure: true,
        maxPressure: 1.0,
        pressureResolution: 2048
      };
    } else {
      // Fallback to mouse/touch
      this.currentDevice = {
        type: 'mouse',
        supportsPressure: false,
        supportsTilt: false,
        supportsRotation: false,
        supportsBarrelPressure: false,
        maxPressure: 1.0,
        pressureResolution: 1
      };
    }
  }

  updateDeviceFromPointerEvent(event: PointerEvent): void {
    // Dynamically update device info based on actual pointer event data
    if (event.pointerType === 'pen') {
      const hasRealPressure = event.pressure > 0 && event.pressure < 1;
      const hasTilt = event.tiltX !== 0 || event.tiltY !== 0;
      
      this.currentDevice = {
        type: 'pen',
        vendor: this.detectVendorFromEvent(event),
        supportsPressure: hasRealPressure || event.pressure !== 0.5,
        supportsTilt: hasTilt,
        supportsRotation: 'twist' in event && (event as any).twist !== undefined,
        supportsBarrelPressure: 'tangentialPressure' in event,
        maxPressure: 1.0,
        pressureResolution: this.estimatePressureResolution(event)
      };

      // Auto-select appropriate curve based on detected device
      if (this.currentDevice.vendor === 'Wacom') {
        this.activeCurve = this.pressureCurves.get('wacom')!;
      }
    }
  }

  private detectVendorFromEvent(event: PointerEvent): string {
    // Attempt to detect vendor based on event characteristics
    // This is heuristic-based as there's no direct API
    
    if ('pointerId' in event && event.pointerId > 1) {
      // Wacom devices often have higher pointer IDs
      const pressurePattern = this.analyzePressurePattern(event.pressure);
      if (pressurePattern === 'wacom') return 'Wacom';
    }

    // Check for Apple Pencil characteristics
    if (navigator.userAgent.includes('iPad') && event.width && event.height) {
      return 'Apple';
    }

    return 'Unknown';
  }

  private analyzePressurePattern(pressure: number): string {
    // Wacom devices tend to have very precise pressure values
    const decimalPlaces = pressure.toString().split('.')[1]?.length || 0;
    return decimalPlaces > 6 ? 'wacom' : 'generic';
  }

  private estimatePressureResolution(event: PointerEvent): number {
    // Estimate pressure resolution based on smallest pressure change detected
    const diff = Math.abs(event.pressure - this.lastRawPressure);
    this.lastRawPressure = event.pressure;
    
    if (diff > 0 && diff < 0.001) return 4096;  // High resolution
    if (diff > 0 && diff < 0.01) return 2048;   // Medium resolution
    if (diff > 0 && diff < 0.1) return 1024;    // Standard resolution
    return 256; // Low resolution
  }

  extractPressureData(event: PointerEvent | Touch | MouseEvent): PressureData {
    const data: PressureData = {
      pressure: 0.5 // Default for non-pressure devices
    };

    if ('pressure' in event) {
      // PointerEvent with pressure
      data.pressure = this.applyPressureCurve(event.pressure);
      
      if ('tiltX' in event && event.tiltX !== undefined) {
        data.tiltX = event.tiltX;
      }
      if ('tiltY' in event && event.tiltY !== undefined) {
        data.tiltY = event.tiltY;
      }
      if ('twist' in event && (event as any).twist !== undefined) {
        data.twist = (event as any).twist;
      }
      if ('tangentialPressure' in event && (event as any).tangentialPressure !== undefined) {
        data.tangentialPressure = (event as any).tangentialPressure;
      }
      if ('width' in event && event.width !== undefined) {
        data.width = event.width;
      }
      if ('height' in event && event.height !== undefined) {
        data.height = event.height;
      }
    } else if ('force' in event) {
      // Touch event with force (3D Touch/Force Touch)
      const force = (event as any).force || 0;
      data.pressure = this.applyPressureCurve(force);
    } else if ('webkitForce' in event) {
      // Safari Force Touch
      const force = (event as any).webkitForce || 0;
      const maxForce = (event as any).WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN || 3;
      data.pressure = this.applyPressureCurve(force / maxForce);
    }

    // Apply device-specific calibration
    if (this.currentDevice?.vendor) {
      this.applyDeviceCalibration(data);
    }

    return data;
  }

  private applyPressureCurve(rawPressure: number): number {
    if (!this.activeCurve) return rawPressure;

    const points = this.activeCurve.controlPoints;
    
    if (this.activeCurve.interpolation === 'linear') {
      // Linear interpolation between control points
      for (let i = 0; i < points.length - 1; i++) {
        if (rawPressure >= points[i].x && rawPressure <= points[i + 1].x) {
          const t = (rawPressure - points[i].x) / (points[i + 1].x - points[i].x);
          return points[i].y + t * (points[i + 1].y - points[i].y);
        }
      }
    } else if (this.activeCurve.interpolation === 'cubic') {
      // Cubic spline interpolation for smoother curves
      return this.cubicSplineInterpolate(rawPressure, points);
    } else if (this.activeCurve.interpolation === 'exponential') {
      // Exponential curve
      const exp = points[1]?.x || 2;
      return Math.pow(rawPressure, exp);
    }

    return rawPressure;
  }

  private cubicSplineInterpolate(x: number, points: Array<{ x: number; y: number }>): number {
    // Simplified cubic spline interpolation
    // In production, use a proper spline library
    const n = points.length;
    if (n < 2) return x;

    // Find the interval
    let i = 0;
    for (let j = 1; j < n; j++) {
      if (x <= points[j].x) {
        i = j - 1;
        break;
      }
    }

    if (i === n - 1) i = n - 2;

    const x0 = points[i].x;
    const x1 = points[i + 1].x;
    const y0 = points[i].y;
    const y1 = points[i + 1].y;

    const t = (x - x0) / (x1 - x0);
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite interpolation
    const h1 = 2 * t3 - 3 * t2 + 1;
    const h2 = -2 * t3 + 3 * t2;
    
    return h1 * y0 + h2 * y1;
  }

  private applyDeviceCalibration(data: PressureData): void {
    const calibration = this.calibrationData.get(this.currentDevice!.vendor!);
    if (!calibration) return;

    // Apply vendor-specific calibration
    if (calibration.pressureOffset) {
      data.pressure = Math.max(0, Math.min(1, data.pressure + calibration.pressureOffset));
    }
    if (calibration.tiltScale && data.tiltX !== undefined) {
      data.tiltX *= calibration.tiltScale;
      data.tiltY! *= calibration.tiltScale;
    }
  }

  setPressureCurve(curveName: string): boolean {
    const curve = this.pressureCurves.get(curveName);
    if (curve) {
      this.activeCurve = curve;
      return true;
    }
    return false;
  }

  addCustomPressureCurve(curve: PressureCurve): void {
    this.pressureCurves.set(curve.name.toLowerCase(), curve);
  }

  getCurrentDevice(): InputDeviceInfo | null {
    return this.currentDevice;
  }

  getAvailableCurves(): string[] {
    return Array.from(this.pressureCurves.keys());
  }

  getActiveCurve(): PressureCurve {
    return this.activeCurve;
  }

  // Calibration methods for fine-tuning device response
  calibrateDevice(vendor: string, calibration: any): void {
    this.calibrationData.set(vendor, calibration);
  }

  // Check if palm rejection should be applied
  shouldRejectTouch(event: PointerEvent | Touch): boolean {
    if ('width' in event && 'height' in event) {
      // Large contact area likely indicates palm
      const area = (event.width || 0) * (event.height || 0);
      return area > 400; // Threshold for palm detection
    }
    return false;
  }

  // Get brush dynamics multipliers based on input
  getBrushDynamics(pressureData: PressureData, velocity: number): {
    sizeMultiplier: number;
    opacityMultiplier: number;
    textureMultiplier: number;
    scatterMultiplier: number;
  } {
    const pressure = pressureData.pressure || 0.5;
    const tiltMagnitude = pressureData.tiltX && pressureData.tiltY
      ? Math.sqrt(pressureData.tiltX * pressureData.tiltX + pressureData.tiltY * pressureData.tiltY) / 90
      : 0;
    
    // Velocity affects texture and scatter
    const normalizedVelocity = Math.min(velocity / 1000, 1); // Normalize to 0-1

    return {
      sizeMultiplier: 0.1 + 0.9 * pressure,
      opacityMultiplier: 0.3 + 0.7 * pressure,
      textureMultiplier: 1 - normalizedVelocity * 0.5,
      scatterMultiplier: normalizedVelocity * tiltMagnitude
    };
  }
}

// Singleton instance
export const inputDeviceManager = new InputDeviceManager();