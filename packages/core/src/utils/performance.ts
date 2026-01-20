/**
 * Non-intrusive performance monitoring system
 * Zero overhead in production, detailed insights in development
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryStart?: number;
  memoryEnd?: number;
  memoryDelta?: number;
}

interface FPSMetric {
  timestamp: number;
  fps: number;
  frameDuration: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private fpsHistory: FPSMetric[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private isProduction: boolean;
  private enabled: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.enabled = !this.isProduction && process.env.DISABLE_PERF_MONITOR !== 'true';
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance for a named operation
   */
  start(name: string): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
    };

    // Capture memory usage if available (Node.js)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      metric.memoryStart = process.memoryUsage().heapUsed;
    }

    this.metrics.set(name, metric);
  }

  /**
   * End measurement for a named operation
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceMonitor] No start time found for metric: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Capture final memory usage
    if (typeof process !== 'undefined' && process.memoryUsage && metric.memoryStart) {
      metric.memoryEnd = process.memoryUsage().heapUsed;
      metric.memoryDelta = metric.memoryEnd - metric.memoryStart;
    }

    this.log(metric);
    return metric.duration;
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Decorator for measuring method execution time
   */
  static measureMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const name = `${target.constructor.name}.${propertyKey}`;
      return monitor.measure(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  }

  /**
   * Track FPS for animations
   */
  trackFrame(): number {
    if (!this.enabled) return 60; // Return default FPS in production

    const currentTime = performance.now();
    
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return 60; // Default FPS for first frame
    }

    const frameDuration = currentTime - this.lastFrameTime;
    const fps = 1000 / frameDuration;

    this.fpsHistory.push({
      timestamp: currentTime,
      fps,
      frameDuration
    });

    // Keep only last 60 frames (1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    this.lastFrameTime = currentTime;
    this.frameCount++;

    return fps;
  }

  /**
   * Get average FPS over recent frames
   */
  getAverageFPS(): number {
    if (!this.enabled || this.fpsHistory.length === 0) return 60;

    const sum = this.fpsHistory.reduce((acc, metric) => acc + metric.fps, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.fpsHistory = [];
    this.frameCount = 0;
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    if (!this.enabled) return 'Performance monitoring disabled in production';

    const report: string[] = ['=== Performance Report ==='];
    
    // Add timing metrics
    const sortedMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    report.push('\nTiming Metrics:');
    sortedMetrics.forEach(metric => {
      const duration = metric.duration!.toFixed(2);
      const memory = metric.memoryDelta 
        ? ` (Memory: ${this.formatBytes(metric.memoryDelta)})`
        : '';
      report.push(`  ${metric.name}: ${duration}ms${memory}`);
    });

    // Add FPS metrics
    if (this.fpsHistory.length > 0) {
      const avgFPS = this.getAverageFPS();
      const minFPS = Math.min(...this.fpsHistory.map(m => m.fps));
      const maxFPS = Math.max(...this.fpsHistory.map(m => m.fps));
      
      report.push('\nFPS Metrics:');
      report.push(`  Average: ${avgFPS.toFixed(1)} fps`);
      report.push(`  Min: ${minFPS.toFixed(1)} fps`);
      report.push(`  Max: ${maxFPS.toFixed(1)} fps`);
      report.push(`  Total Frames: ${this.frameCount}`);
    }

    return report.join('\n');
  }

  /**
   * Log a metric to console in development
   */
  private log(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    const duration = metric.duration!.toFixed(2);
    const memory = metric.memoryDelta 
      ? ` | Memory: ${this.formatBytes(metric.memoryDelta)}`
      : '';
    
    console.log(`[Perf] ${metric.name}: ${duration}ms${memory}`);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = Math.abs(bytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const sign = bytes < 0 ? '-' : '+';
    return `${sign}${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Enable/disable monitoring at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled && !this.isProduction;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance for convenience
export const perfMonitor = PerformanceMonitor.getInstance();

// Export decorator
export const measureMethod = PerformanceMonitor.measureMethod;