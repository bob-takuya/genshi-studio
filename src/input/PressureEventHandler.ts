/**
 * Pressure Event Handler for Cross-Browser Compatibility
 * Handles PointerEvents, Touch Events, and Mouse Events with pressure support
 */

import { inputDeviceManager, PressureData } from './InputDeviceManager';

export interface PressureEventData {
  x: number;
  y: number;
  pressure: PressureData;
  velocity: number;
  pointerType: string;
  pointerId: number;
  timestamp: number;
  isPrimary: boolean;
}

export type PressureEventCallback = (event: PressureEventData) => void;

export class PressureEventHandler {
  private element: HTMLElement;
  private onStart: PressureEventCallback;
  private onMove: PressureEventCallback;
  private onEnd: PressureEventCallback;
  private lastPosition: Map<number, { x: number; y: number; time: number }> = new Map();
  private activePointers: Map<number, boolean> = new Map();
  private velocityBuffer: Map<number, number[]> = new Map();
  
  constructor(
    element: HTMLElement,
    callbacks: {
      onStart: PressureEventCallback;
      onMove: PressureEventCallback;
      onEnd: PressureEventCallback;
    }
  ) {
    this.element = element;
    this.onStart = callbacks.onStart;
    this.onMove = callbacks.onMove;
    this.onEnd = callbacks.onEnd;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Prevent default touch behaviors
    this.element.style.touchAction = 'none';
    this.element.style.userSelect = 'none';
    this.element.style.webkitUserSelect = 'none';

    if ('PointerEvent' in window) {
      // Use Pointer Events (preferred)
      this.element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
      this.element.addEventListener('pointermove', this.handlePointerMove.bind(this));
      this.element.addEventListener('pointerup', this.handlePointerUp.bind(this));
      this.element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
      
      // Handle pointer capture for better tracking
      this.element.addEventListener('gotpointercapture', this.handleGotPointerCapture.bind(this));
      this.element.addEventListener('lostpointercapture', this.handleLostPointerCapture.bind(this));
    } else {
      // Fallback to Touch + Mouse events
      this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
      this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
      
      this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();

    // Update device info based on actual event
    inputDeviceManager.updateDeviceFromPointerEvent(event);

    // Check for palm rejection
    if (inputDeviceManager.shouldRejectTouch(event)) {
      return;
    }

    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Capture pointer for consistent tracking
    try {
      this.element.setPointerCapture(event.pointerId);
    } catch (e) {
      console.warn('Failed to capture pointer:', e);
    }

    this.activePointers.set(event.pointerId, true);
    this.lastPosition.set(event.pointerId, { x, y, time: event.timeStamp });
    this.velocityBuffer.set(event.pointerId, []);

    const pressureData = inputDeviceManager.extractPressureData(event);
    
    this.onStart({
      x,
      y,
      pressure: pressureData,
      velocity: 0,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      isPrimary: event.isPrimary
    });
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    
    event.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const velocity = this.calculateVelocity(event.pointerId, x, y, event.timeStamp);
    const pressureData = inputDeviceManager.extractPressureData(event);

    this.onMove({
      x,
      y,
      pressure: pressureData,
      velocity,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      isPrimary: event.isPrimary
    });

    this.lastPosition.set(event.pointerId, { x, y, time: event.timeStamp });
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    
    event.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.onEnd({
      x,
      y,
      pressure: inputDeviceManager.extractPressureData(event),
      velocity: 0,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      isPrimary: event.isPrimary
    });

    this.cleanupPointer(event.pointerId);
    
    try {
      this.element.releasePointerCapture(event.pointerId);
    } catch (e) {
      // Pointer might not be captured
    }
  }

  private handlePointerCancel(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.onEnd({
      x,
      y,
      pressure: inputDeviceManager.extractPressureData(event),
      velocity: 0,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      isPrimary: event.isPrimary
    });

    this.cleanupPointer(event.pointerId);
  }

  private handleGotPointerCapture(event: PointerEvent): void {
    // Pointer capture acquired successfully
    console.debug(`Captured pointer ${event.pointerId}`);
  }

  private handleLostPointerCapture(event: PointerEvent): void {
    // Clean up if we unexpectedly lost pointer capture
    if (this.activePointers.has(event.pointerId)) {
      this.cleanupPointer(event.pointerId);
    }
  }

  // Touch event handlers (fallback)
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = this.element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.activePointers.set(touch.identifier, true);
      this.lastPosition.set(touch.identifier, { x, y, time: event.timeStamp });
      this.velocityBuffer.set(touch.identifier, []);

      const pressureData = inputDeviceManager.extractPressureData(touch);
      
      this.onStart({
        x,
        y,
        pressure: pressureData,
        velocity: 0,
        pointerType: 'touch',
        pointerId: touch.identifier,
        timestamp: event.timeStamp,
        isPrimary: i === 0
      });
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (!this.activePointers.has(touch.identifier)) continue;

      const rect = this.element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const velocity = this.calculateVelocity(touch.identifier, x, y, event.timeStamp);
      const pressureData = inputDeviceManager.extractPressureData(touch);

      this.onMove({
        x,
        y,
        pressure: pressureData,
        velocity,
        pointerType: 'touch',
        pointerId: touch.identifier,
        timestamp: event.timeStamp,
        isPrimary: i === 0
      });

      this.lastPosition.set(touch.identifier, { x, y, time: event.timeStamp });
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (!this.activePointers.has(touch.identifier)) continue;

      const rect = this.element.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.onEnd({
        x,
        y,
        pressure: inputDeviceManager.extractPressureData(touch),
        velocity: 0,
        pointerType: 'touch',
        pointerId: touch.identifier,
        timestamp: event.timeStamp,
        isPrimary: i === 0
      });

      this.cleanupPointer(touch.identifier);
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.cleanupPointer(touch.identifier);
    }
  }

  // Mouse event handlers (fallback)
  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only handle left button
    
    event.preventDefault();
    
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const pointerId = -1; // Use -1 for mouse
    this.activePointers.set(pointerId, true);
    this.lastPosition.set(pointerId, { x, y, time: event.timeStamp });
    this.velocityBuffer.set(pointerId, []);

    const pressureData = inputDeviceManager.extractPressureData(event);
    
    this.onStart({
      x,
      y,
      pressure: pressureData,
      velocity: 0,
      pointerType: 'mouse',
      pointerId,
      timestamp: event.timeStamp,
      isPrimary: true
    });

    // Add document-level listeners for mouse
    document.addEventListener('mousemove', this.handleMouseMoveDocument);
    document.addEventListener('mouseup', this.handleMouseUpDocument);
  }

  private handleMouseMove(event: MouseEvent): void {
    const pointerId = -1;
    if (!this.activePointers.has(pointerId)) return;
    
    event.preventDefault();
    
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const velocity = this.calculateVelocity(pointerId, x, y, event.timeStamp);
    const pressureData = inputDeviceManager.extractPressureData(event);

    this.onMove({
      x,
      y,
      pressure: pressureData,
      velocity,
      pointerType: 'mouse',
      pointerId,
      timestamp: event.timeStamp,
      isPrimary: true
    });

    this.lastPosition.set(pointerId, { x, y, time: event.timeStamp });
  }

  private handleMouseUp(event: MouseEvent): void {
    const pointerId = -1;
    if (!this.activePointers.has(pointerId)) return;
    
    event.preventDefault();
    
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.onEnd({
      x,
      y,
      pressure: inputDeviceManager.extractPressureData(event),
      velocity: 0,
      pointerType: 'mouse',
      pointerId,
      timestamp: event.timeStamp,
      isPrimary: true
    });

    this.cleanupPointer(pointerId);
    
    // Remove document-level listeners
    document.removeEventListener('mousemove', this.handleMouseMoveDocument);
    document.removeEventListener('mouseup', this.handleMouseUpDocument);
  }

  // Document-level mouse handlers (bound versions)
  private handleMouseMoveDocument = (event: MouseEvent) => this.handleMouseMove(event);
  private handleMouseUpDocument = (event: MouseEvent) => this.handleMouseUp(event);

  private calculateVelocity(pointerId: number, x: number, y: number, timestamp: number): number {
    const last = this.lastPosition.get(pointerId);
    if (!last) return 0;

    const dt = timestamp - last.time;
    if (dt === 0) return 0;

    const dx = x - last.x;
    const dy = y - last.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt * 1000; // pixels per second

    // Smooth velocity with moving average
    let buffer = this.velocityBuffer.get(pointerId) || [];
    buffer.push(velocity);
    if (buffer.length > 5) buffer.shift();
    this.velocityBuffer.set(pointerId, buffer);

    const avgVelocity = buffer.reduce((a, b) => a + b, 0) / buffer.length;
    return avgVelocity;
  }

  private cleanupPointer(pointerId: number): void {
    this.activePointers.delete(pointerId);
    this.lastPosition.delete(pointerId);
    this.velocityBuffer.delete(pointerId);
  }

  destroy(): void {
    // Remove all event listeners
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerCancel);
    
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    
    document.removeEventListener('mousemove', this.handleMouseMoveDocument);
    document.removeEventListener('mouseup', this.handleMouseUpDocument);

    this.activePointers.clear();
    this.lastPosition.clear();
    this.velocityBuffer.clear();
  }
}