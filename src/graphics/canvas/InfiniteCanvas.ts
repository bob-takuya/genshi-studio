/**
 * Infinite Canvas Implementation with Spatial Indexing
 * Provides viewport management and culling for large scenes
 */

import { Rectangle, Point, Transform } from '../../types/graphics';

interface CanvasObject {
  id: string;
  bounds: Rectangle;
  zIndex: number;
  visible: boolean;
  data: any;
}

interface SpatialCell {
  x: number;
  y: number;
  objects: Set<string>;
}

export class InfiniteCanvas {
  private viewport: Rectangle;
  private transform: Transform;
  private objects: Map<string, CanvasObject> = new Map();
  private spatialIndex: Map<string, SpatialCell> = new Map();
  private cellSize: number = 256; // Size of spatial index cells
  private visibleObjects: Set<string> = new Set();
  
  // Memory management
  private maxMemoryUsage: number = 512 * 1024 * 1024; // 512MB
  private currentMemoryUsage: number = 0;
  private memoryPressureCallback?: () => void;

  // Performance tracking
  private lastCullTime: number = 0;
  private cullCount: number = 0;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewport = {
      x: 0,
      y: 0,
      width: viewportWidth,
      height: viewportHeight
    };

    this.transform = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };
  }

  // Viewport management
  setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = { x, y, width, height };
    this.updateVisibleObjects();
  }

  pan(dx: number, dy: number): void {
    this.transform.translateX += dx;
    this.transform.translateY += dy;
    this.updateViewportPosition();
  }

  zoom(scale: number, centerX: number, centerY: number): void {
    // Zoom around a specific point
    const prevScale = this.transform.scaleX;
    const newScale = Math.max(0.1, Math.min(10, prevScale * scale));
    
    this.transform.scaleX = newScale;
    this.transform.scaleY = newScale;

    // Adjust translation to keep the zoom center fixed
    const scaleDiff = newScale / prevScale;
    this.transform.translateX = centerX - (centerX - this.transform.translateX) * scaleDiff;
    this.transform.translateY = centerY - (centerY - this.transform.translateY) * scaleDiff;

    this.updateViewportPosition();
  }

  getTransform(): Transform {
    return { ...this.transform };
  }

  screenToWorld(screenPoint: Point): Point {
    const worldX = (screenPoint.x - this.transform.translateX) / this.transform.scaleX;
    const worldY = (screenPoint.y - this.transform.translateY) / this.transform.scaleY;
    
    return { x: worldX, y: worldY };
  }

  worldToScreen(worldPoint: Point): Point {
    const screenX = worldPoint.x * this.transform.scaleX + this.transform.translateX;
    const screenY = worldPoint.y * this.transform.scaleY + this.transform.translateY;
    
    return { x: screenX, y: screenY };
  }

  // Object management
  addObject(id: string, bounds: Rectangle, data: any, zIndex: number = 0): void {
    const object: CanvasObject = {
      id,
      bounds,
      zIndex,
      visible: true,
      data
    };

    this.objects.set(id, object);
    this.addToSpatialIndex(object);
    this.updateMemoryUsage();
    
    // Check if object is visible
    if (this.isObjectInViewport(object)) {
      this.visibleObjects.add(id);
    }
  }

  removeObject(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    this.removeFromSpatialIndex(object);
    this.objects.delete(id);
    this.visibleObjects.delete(id);
    this.updateMemoryUsage();
  }

  updateObject(id: string, bounds: Rectangle): void {
    const object = this.objects.get(id);
    if (!object) return;

    // Remove from old spatial index cells
    this.removeFromSpatialIndex(object);
    
    // Update bounds
    object.bounds = bounds;
    
    // Add to new spatial index cells
    this.addToSpatialIndex(object);
    
    // Update visibility
    if (this.isObjectInViewport(object)) {
      this.visibleObjects.add(id);
    } else {
      this.visibleObjects.delete(id);
    }
  }

  // Spatial indexing
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCellsForBounds(bounds: Rectangle): string[] {
    const cells: string[] = [];
    const startX = Math.floor(bounds.x / this.cellSize);
    const startY = Math.floor(bounds.y / this.cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`);
      }
    }

    return cells;
  }

  private addToSpatialIndex(object: CanvasObject): void {
    const cells = this.getCellsForBounds(object.bounds);
    
    for (const cellKey of cells) {
      let cell = this.spatialIndex.get(cellKey);
      if (!cell) {
        const [x, y] = cellKey.split(',').map(Number);
        cell = { x, y, objects: new Set() };
        this.spatialIndex.set(cellKey, cell);
      }
      cell.objects.add(object.id);
    }
  }

  private removeFromSpatialIndex(object: CanvasObject): void {
    const cells = this.getCellsForBounds(object.bounds);
    
    for (const cellKey of cells) {
      const cell = this.spatialIndex.get(cellKey);
      if (cell) {
        cell.objects.delete(object.id);
        if (cell.objects.size === 0) {
          this.spatialIndex.delete(cellKey);
        }
      }
    }
  }

  // Viewport culling
  private updateViewportPosition(): void {
    // Transform viewport to world space for culling
    const worldViewport = this.getWorldViewport();
    this.viewport = worldViewport;
    this.updateVisibleObjects();
  }

  private getWorldViewport(): Rectangle {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ 
      x: this.viewport.width, 
      y: this.viewport.height 
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  private updateVisibleObjects(): void {
    const startTime = performance.now();
    this.visibleObjects.clear();
    
    // Get cells that intersect with viewport
    const worldViewport = this.getWorldViewport();
    const cells = this.getCellsForBounds(worldViewport);
    
    // Check objects in visible cells
    const checkedObjects = new Set<string>();
    
    for (const cellKey of cells) {
      const cell = this.spatialIndex.get(cellKey);
      if (!cell) continue;
      
      for (const objectId of cell.objects) {
        if (checkedObjects.has(objectId)) continue;
        checkedObjects.add(objectId);
        
        const object = this.objects.get(objectId);
        if (object && object.visible && this.isObjectInViewport(object)) {
          this.visibleObjects.add(objectId);
        }
      }
    }

    this.lastCullTime = performance.now() - startTime;
    this.cullCount++;
  }

  private isObjectInViewport(object: CanvasObject): boolean {
    const viewport = this.getWorldViewport();
    
    return !(
      object.bounds.x + object.bounds.width < viewport.x ||
      object.bounds.x > viewport.x + viewport.width ||
      object.bounds.y + object.bounds.height < viewport.y ||
      object.bounds.y > viewport.y + viewport.height
    );
  }

  getVisibleObjects(): CanvasObject[] {
    const objects: CanvasObject[] = [];
    
    for (const id of this.visibleObjects) {
      const object = this.objects.get(id);
      if (object) {
        objects.push(object);
      }
    }
    
    // Sort by z-index
    return objects.sort((a, b) => a.zIndex - b.zIndex);
  }

  // Memory management
  private updateMemoryUsage(): void {
    // Estimate memory usage (simplified)
    this.currentMemoryUsage = 0;
    
    // Object storage
    this.currentMemoryUsage += this.objects.size * 100; // Rough estimate per object
    
    // Spatial index
    this.currentMemoryUsage += this.spatialIndex.size * 50;
    
    // Check memory pressure
    if (this.currentMemoryUsage > this.maxMemoryUsage && this.memoryPressureCallback) {
      this.memoryPressureCallback();
    }
  }

  setMemoryPressureCallback(callback: () => void): void {
    this.memoryPressureCallback = callback;
  }

  // Performance metrics
  getMetrics(): {
    objectCount: number;
    visibleCount: number;
    cellCount: number;
    lastCullTime: number;
    memoryUsage: number;
    memoryLimit: number;
  } {
    return {
      objectCount: this.objects.size,
      visibleCount: this.visibleObjects.size,
      cellCount: this.spatialIndex.size,
      lastCullTime: this.lastCullTime,
      memoryUsage: this.currentMemoryUsage,
      memoryLimit: this.maxMemoryUsage
    };
  }

  // Utility methods
  clear(): void {
    this.objects.clear();
    this.spatialIndex.clear();
    this.visibleObjects.clear();
    this.currentMemoryUsage = 0;
  }

  getBounds(): Rectangle | null {
    if (this.objects.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const object of this.objects.values()) {
      minX = Math.min(minX, object.bounds.x);
      minY = Math.min(minY, object.bounds.y);
      maxX = Math.max(maxX, object.bounds.x + object.bounds.width);
      maxY = Math.max(maxY, object.bounds.y + object.bounds.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // Hit testing
  getObjectsAtPoint(worldPoint: Point): CanvasObject[] {
    const objects: CanvasObject[] = [];
    const cellKey = this.getCellKey(worldPoint.x, worldPoint.y);
    const cell = this.spatialIndex.get(cellKey);
    
    if (!cell) return objects;

    for (const objectId of cell.objects) {
      const object = this.objects.get(objectId);
      if (!object || !object.visible) continue;

      if (
        worldPoint.x >= object.bounds.x &&
        worldPoint.x <= object.bounds.x + object.bounds.width &&
        worldPoint.y >= object.bounds.y &&
        worldPoint.y <= object.bounds.y + object.bounds.height
      ) {
        objects.push(object);
      }
    }

    return objects.sort((a, b) => b.zIndex - a.zIndex);
  }
}