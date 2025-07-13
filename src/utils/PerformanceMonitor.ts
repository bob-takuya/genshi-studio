/**
 * Performance Monitor for Genshi Studio Integration
 * DEVELOPER_INTEGRATION_001 Implementation
 * 
 * Comprehensive performance tracking, benchmarking, and optimization
 * for real-time multi-mode creative workflows
 */

import { EventEmitter } from 'events';
import { CreativeMode } from '../unified/UnifiedDataModel';

export interface PerformanceConfig {
  enableDetailedMetrics: boolean;
  enableMemoryTracking: boolean;
  enableNetworkTracking: boolean;
  sampleRate: number; // 0-1, percentage of events to sample
  bufferSize: number; // Number of measurements to keep
  alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
  maxFrameTime: number; // ms
  maxSyncLatency: number; // ms
  maxMemoryUsage: number; // MB
  minFPS: number;
  maxTranslationTime: number; // ms
}

export interface PerformanceMetrics {
  // Rendering performance
  fps: number;
  frameTime: number;
  renderTime: number;
  compositeTime: number;
  
  // Synchronization performance
  syncLatency: number;
  operationLatency: number;
  translationTime: number;
  conflictResolutionTime: number;
  
  // Resource usage
  memoryUsage: number;
  cpuUsage: number;
  webglMemory: number;
  cacheHitRatio: number;
  
  // Entity metrics
  entitiesActive: number;
  entitiesVisible: number;
  entitiesCulled: number;
  
  // Mode-specific metrics
  modeMetrics: Map<CreativeMode, ModePerformanceMetrics>;
  
  // Network metrics
  networkLatency: number;
  dataTransferred: number;
  websocketConnections: number;
  
  // Error tracking
  errorRate: number;
  criticalErrors: number;
  warnings: number;
}

export interface ModePerformanceMetrics {
  mode: CreativeMode;
  renderTime: number;
  translationTime: number;
  entityCount: number;
  memoryUsage: number;
  cacheHitRatio: number;
  errorCount: number;
}

export interface PerformanceBenchmark {
  name: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  environment: BenchmarkEnvironment;
  duration: number;
}

export interface BenchmarkEnvironment {
  userAgent: string;
  deviceMemory?: number;
  hardwareConcurrency: number;
  webglRenderer?: string;
  webglVersion?: string;
  canvasSize: { width: number; height: number };
  entityCount: number;
  activeModes: CreativeMode[];
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

export interface TimingEntry {
  name: string;
  startTime: number;
  duration: number;
  metadata?: any;
}

export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private isMonitoring: boolean = false;
  private startTime: number = 0;
  
  // Metric storage
  private frameMetrics: CircularBuffer<number>;
  private syncMetrics: CircularBuffer<number>;
  private translationMetrics: Map<string, CircularBuffer<number>>;
  private memoryMetrics: CircularBuffer<number>;
  private errorMetrics: CircularBuffer<{ timestamp: number; type: string }>;
  
  // Timing tracking
  private activeTimings: Map<string, number> = new Map();
  private completedTimings: CircularBuffer<TimingEntry>;
  
  // Benchmarking
  private baselines: Map<string, PerformanceBenchmark> = new Map();
  private currentBenchmark: PerformanceBenchmark | null = null;
  
  // Alerting
  private alerts: Map<string, PerformanceAlert> = new Map();
  private alertHistory: CircularBuffer<PerformanceAlert>;
  
  // Browser performance API integration
  private performanceObserver: PerformanceObserver | null = null;
  private memoryObserver: any = null; // For browsers that support memory API
  
  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
    
    // Initialize circular buffers
    this.frameMetrics = new CircularBuffer<number>(config.bufferSize);
    this.syncMetrics = new CircularBuffer<number>(config.bufferSize);
    this.translationMetrics = new Map();
    this.memoryMetrics = new CircularBuffer<number>(config.bufferSize);
    this.errorMetrics = new CircularBuffer<{ timestamp: number; type: string }>(config.bufferSize);
    this.completedTimings = new CircularBuffer<TimingEntry>(config.bufferSize);
    this.alertHistory = new CircularBuffer<PerformanceAlert>(1000);
    
    // Initialize translation metrics for each mode pair
    for (const sourceMode of Object.values(CreativeMode)) {
      for (const targetMode of Object.values(CreativeMode)) {
        if (sourceMode !== targetMode) {
          const key = `${sourceMode}->${targetMode}`;
          this.translationMetrics.set(key, new CircularBuffer<number>(config.bufferSize));
        }
      }
    }
  }

  /**
   * Start performance monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    // Set up browser performance observers
    await this.setupPerformanceObservers();
    
    // Start periodic metric collection
    this.startMetricCollection();
    
    // Load baseline benchmarks
    await this.loadBaselines();
    
    this.emit('monitoring:started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Cleanup observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.emit('monitoring:stopped');
  }

  /**
   * Record frame timing
   */
  recordFrame(frameTime: number): void {
    if (!this.shouldSample()) return;
    
    this.frameMetrics.push(frameTime);
    
    // Check for frame time alerts
    if (frameTime > this.config.alertThresholds.maxFrameTime) {
      this.triggerAlert('frame_time', 'warning', 
        `Frame time exceeded threshold: ${frameTime.toFixed(2)}ms`, 
        frameTime, this.config.alertThresholds.maxFrameTime);
    }
    
    this.emit('metrics:frame', { frameTime, fps: 1000 / frameTime });
  }

  /**
   * Record synchronization timing
   */
  recordSync(latency: number): void {
    if (!this.shouldSample()) return;
    
    this.syncMetrics.push(latency);
    
    // Check for sync latency alerts
    if (latency > this.config.alertThresholds.maxSyncLatency) {
      this.triggerAlert('sync_latency', 'warning',
        `Sync latency exceeded threshold: ${latency.toFixed(2)}ms`,
        latency, this.config.alertThresholds.maxSyncLatency);
    }
    
    this.emit('metrics:sync', { latency });
  }

  /**
   * Record translation timing
   */
  recordTranslation(sourceMode: CreativeMode, targetMode: CreativeMode, duration: number): void {
    if (!this.shouldSample()) return;
    
    const key = `${sourceMode}->${targetMode}`;
    const buffer = this.translationMetrics.get(key);
    if (buffer) {
      buffer.push(duration);
    }
    
    // Check for translation time alerts
    if (duration > this.config.alertThresholds.maxTranslationTime) {
      this.triggerAlert('translation_time', 'warning',
        `Translation time exceeded threshold: ${sourceMode}->${targetMode} ${duration.toFixed(2)}ms`,
        duration, this.config.alertThresholds.maxTranslationTime);
    }
    
    this.emit('metrics:translation', { sourceMode, targetMode, duration });
  }

  /**
   * Record memory usage
   */
  recordMemory(usage: number): void {
    if (!this.shouldSample()) return;
    
    this.memoryMetrics.push(usage);
    
    // Check for memory alerts
    if (usage > this.config.alertThresholds.maxMemoryUsage) {
      this.triggerAlert('memory_usage', 'critical',
        `Memory usage exceeded threshold: ${(usage / 1024 / 1024).toFixed(2)}MB`,
        usage, this.config.alertThresholds.maxMemoryUsage);
    }
    
    this.emit('metrics:memory', { usage });
  }

  /**
   * Record error occurrence
   */
  recordError(type: string, error?: Error): void {
    this.errorMetrics.push({ timestamp: Date.now(), type });
    
    this.triggerAlert('error', 'critical',
      `Error occurred: ${type}${error ? ` - ${error.message}` : ''}`,
      1, 0);
    
    this.emit('metrics:error', { type, error });
  }

  /**
   * Start timing measurement
   */
  startTiming(name: string, metadata?: any): void {
    this.activeTimings.set(name, performance.now());
    this.emit('timing:started', { name, metadata });
  }

  /**
   * End timing measurement
   */
  endTiming(name: string): number | null {
    const startTime = this.activeTimings.get(name);
    if (!startTime) return null;
    
    const duration = performance.now() - startTime;
    this.activeTimings.delete(name);
    
    const timing: TimingEntry = {
      name,
      startTime,
      duration
    };
    
    this.completedTimings.push(timing);
    this.emit('timing:completed', timing);
    
    return duration;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const frameData = this.frameMetrics.getAll();
    const syncData = this.syncMetrics.getAll();
    const memoryData = this.memoryMetrics.getAll();
    
    // Calculate averages and current values
    const avgFrameTime = this.calculateAverage(frameData);
    const avgSyncLatency = this.calculateAverage(syncData);
    const currentMemory = memoryData.length > 0 ? memoryData[memoryData.length - 1] : 0;
    
    // Calculate mode-specific metrics
    const modeMetrics = new Map<CreativeMode, ModePerformanceMetrics>();
    for (const mode of Object.values(CreativeMode)) {
      modeMetrics.set(mode, this.calculateModeMetrics(mode));
    }
    
    return {
      fps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      frameTime: avgFrameTime,
      renderTime: this.getAverageTimingDuration('render'),
      compositeTime: this.getAverageTimingDuration('composite'),
      
      syncLatency: avgSyncLatency,
      operationLatency: this.getAverageTimingDuration('operation'),
      translationTime: this.getAverageTranslationTime(),
      conflictResolutionTime: this.getAverageTimingDuration('conflict_resolution'),
      
      memoryUsage: currentMemory,
      cpuUsage: this.estimateCPUUsage(),
      webglMemory: this.estimateWebGLMemory(),
      cacheHitRatio: this.calculateCacheHitRatio(),
      
      entitiesActive: this.getMetricValue('entities_active'),
      entitiesVisible: this.getMetricValue('entities_visible'),
      entitiesCulled: this.getMetricValue('entities_culled'),
      
      modeMetrics,
      
      networkLatency: this.getMetricValue('network_latency'),
      dataTransferred: this.getMetricValue('data_transferred'),
      websocketConnections: this.getMetricValue('websocket_connections'),
      
      errorRate: this.calculateErrorRate(),
      criticalErrors: this.getCriticalErrorCount(),
      warnings: this.getWarningCount()
    };
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(name: string, duration: number = 10000): Promise<PerformanceBenchmark> {
    const environment = this.captureEnvironment();
    const startTime = performance.now();
    
    // Clear metrics for clean benchmark
    this.clearMetrics();
    
    // Set current benchmark
    this.currentBenchmark = {
      name,
      timestamp: Date.now(),
      metrics: this.getCurrentMetrics(),
      environment,
      duration: 0
    };
    
    this.emit('benchmark:started', { name, duration });
    
    // Wait for benchmark duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Capture final metrics
    const finalMetrics = this.getCurrentMetrics();
    const actualDuration = performance.now() - startTime;
    
    const benchmark: PerformanceBenchmark = {
      name,
      timestamp: Date.now(),
      metrics: finalMetrics,
      environment,
      duration: actualDuration
    };
    
    // Store as baseline if it's the first run
    if (!this.baselines.has(name)) {
      this.baselines.set(name, benchmark);
    }
    
    this.currentBenchmark = null;
    this.emit('benchmark:completed', benchmark);
    
    return benchmark;
  }

  /**
   * Compare current performance to baseline
   */
  compareToBaseline(baselineName: string): any {
    const baseline = this.baselines.get(baselineName);
    if (!baseline) {
      throw new Error(`Baseline '${baselineName}' not found`);
    }
    
    const current = this.getCurrentMetrics();
    
    return {
      baseline: baseline.metrics,
      current,
      comparison: {
        fps: this.calculatePercentageChange(baseline.metrics.fps, current.fps),
        frameTime: this.calculatePercentageChange(baseline.metrics.frameTime, current.frameTime),
        syncLatency: this.calculatePercentageChange(baseline.metrics.syncLatency, current.syncLatency),
        memoryUsage: this.calculatePercentageChange(baseline.metrics.memoryUsage, current.memoryUsage),
        translationTime: this.calculatePercentageChange(baseline.metrics.translationTime, current.translationTime)
      }
    };
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', alert);
    }
  }

  /**
   * Export performance data
   */
  exportData(): any {
    return {
      config: this.config,
      metrics: this.getCurrentMetrics(),
      baselines: Object.fromEntries(this.baselines),
      alerts: Array.from(this.alerts.values()),
      timings: this.completedTimings.getAll(),
      environment: this.captureEnvironment()
    };
  }

  // Private helper methods
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private async setupPerformanceObservers(): Promise<void> {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
    
    // Set up memory monitoring if available
    if ('memory' in (performance as any)) {
      this.memoryObserver = setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMemory(memory.usedJSHeapSize);
      }, 1000);
    }
  }

  private startMetricCollection(): void {
    // Collect metrics periodically
    setInterval(() => {
      if (this.isMonitoring) {
        this.collectMetrics();
      }
    }, 1000);
  }

  private collectMetrics(): void {
    // Collect various system metrics
    if (this.config.enableMemoryTracking && 'memory' in (performance as any)) {
      const memory = (performance as any).memory;
      this.recordMemory(memory.usedJSHeapSize);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'measure':
        this.completedTimings.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration
        });
        break;
      case 'navigation':
        // Handle navigation timing
        break;
      case 'resource':
        // Handle resource timing
        break;
    }
  }

  private triggerAlert(metric: string, type: 'warning' | 'critical' | 'info', message: string, value: number, threshold: number): void {
    const alertId = `${metric}_${Date.now()}`;
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);
    
    this.emit('alert:triggered', alert);
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateModeMetrics(mode: CreativeMode): ModePerformanceMetrics {
    return {
      mode,
      renderTime: this.getAverageTimingDuration(`render_${mode}`),
      translationTime: this.getAverageTranslationTimeForMode(mode),
      entityCount: this.getMetricValue(`entities_${mode}`),
      memoryUsage: this.getMetricValue(`memory_${mode}`),
      cacheHitRatio: this.getMetricValue(`cache_hit_ratio_${mode}`),
      errorCount: this.getErrorCountForMode(mode)
    };
  }

  private getAverageTimingDuration(name: string): number {
    const timings = this.completedTimings.getAll().filter(t => t.name === name);
    return this.calculateAverage(timings.map(t => t.duration));
  }

  private getAverageTranslationTime(): number {
    const allTranslationTimes: number[] = [];
    for (const buffer of this.translationMetrics.values()) {
      allTranslationTimes.push(...buffer.getAll());
    }
    return this.calculateAverage(allTranslationTimes);
  }

  private getAverageTranslationTimeForMode(mode: CreativeMode): number {
    const translationTimes: number[] = [];
    for (const [key, buffer] of this.translationMetrics) {
      if (key.startsWith(mode) || key.endsWith(mode)) {
        translationTimes.push(...buffer.getAll());
      }
    }
    return this.calculateAverage(translationTimes);
  }

  private estimateCPUUsage(): number {
    // Rough estimate based on frame timing
    const frameData = this.frameMetrics.getAll();
    const avgFrameTime = this.calculateAverage(frameData);
    return Math.min(100, (avgFrameTime / 16.67) * 100); // Normalize to 60fps = 100%
  }

  private estimateWebGLMemory(): number {
    // This would need WebGL context access for accurate measurement
    return 0;
  }

  private calculateCacheHitRatio(): number {
    // This would need cache statistics from other components
    return 0.95; // Mock value
  }

  private calculateErrorRate(): number {
    const errors = this.errorMetrics.getAll();
    const recentErrors = errors.filter(e => Date.now() - e.timestamp < 60000); // Last minute
    return recentErrors.length;
  }

  private getCriticalErrorCount(): number {
    return Array.from(this.alerts.values()).filter(a => a.type === 'critical').length;
  }

  private getWarningCount(): number {
    return Array.from(this.alerts.values()).filter(a => a.type === 'warning').length;
  }

  private getErrorCountForMode(mode: CreativeMode): number {
    const errors = this.errorMetrics.getAll();
    return errors.filter(e => e.type.includes(mode)).length;
  }

  private getMetricValue(name: string): number {
    // This would interface with other system components to get specific metric values
    return 0;
  }

  private captureEnvironment(): BenchmarkEnvironment {
    return {
      userAgent: navigator.userAgent,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      webglRenderer: this.getWebGLRenderer(),
      webglVersion: this.getWebGLVersion(),
      canvasSize: { width: 1920, height: 1080 }, // Would get from actual canvas
      entityCount: this.getMetricValue('entities_active'),
      activeModes: Object.values(CreativeMode) // Would get from actual state
    };
  }

  private getWebGLRenderer(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : undefined;
      }
    } catch (e) {
      // Ignore errors
    }
    return undefined;
  }

  private getWebGLVersion(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl ? gl.getParameter(gl.VERSION) : undefined;
    } catch (e) {
      // Ignore errors
    }
    return undefined;
  }

  private calculatePercentageChange(baseline: number, current: number): number {
    if (baseline === 0) return current === 0 ? 0 : 100;
    return ((current - baseline) / baseline) * 100;
  }

  private clearMetrics(): void {
    this.frameMetrics.clear();
    this.syncMetrics.clear();
    this.memoryMetrics.clear();
    this.errorMetrics.clear();
    this.completedTimings.clear();
    for (const buffer of this.translationMetrics.values()) {
      buffer.clear();
    }
  }

  private async loadBaselines(): Promise<void> {
    // In a real implementation, this would load baselines from storage
    // For now, we'll use default values
  }
}

// Utility class for circular buffer
class CircularBuffer<T> {
  private buffer: T[] = [];
  private index: number = 0;
  private size: number;
  private filled: boolean = false;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size);
  }

  push(item: T): void {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.size;
    if (this.index === 0) {
      this.filled = true;
    }
  }

  getAll(): T[] {
    if (!this.filled) {
      return this.buffer.slice(0, this.index);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  clear(): void {
    this.buffer = new Array(this.size);
    this.index = 0;
    this.filled = false;
  }

  get length(): number {
    return this.filled ? this.size : this.index;
  }
}

export default PerformanceMonitor;