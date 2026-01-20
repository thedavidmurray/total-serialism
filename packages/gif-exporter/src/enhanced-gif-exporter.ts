/**
 * Enhanced GIF Exporter with integrated performance monitoring
 * Provides detailed performance metrics during GIF generation
 */

import { GifExporter, GifExporterOptions, Frame } from './gif-exporter';
import { perfMonitor, measureMethod } from '../../core/src/utils/performance';
import { profiler, profileMethod } from '../../core/src/utils/profiler';

export interface EnhancedGifExporterOptions extends GifExporterOptions {
  enablePerfMonitoring?: boolean;
  enableProfiling?: boolean;
}

export interface PerformanceStats {
  totalTime: number;
  encodingTime: number;
  ioTime: number;
  frameStats: {
    count: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  };
  memoryUsage?: {
    start: number;
    end: number;
    delta: number;
  };
}

export class EnhancedGifExporter extends GifExporter {
  private perfEnabled: boolean;
  private profilingEnabled: boolean;
  private frameTimes: number[] = [];
  private startTime: number = 0;
  private encodingTime: number = 0;
  private ioTime: number = 0;

  constructor(options: EnhancedGifExporterOptions) {
    super(options);
    
    // Performance monitoring is enabled by default in development
    this.perfEnabled = options.enablePerfMonitoring !== false && process.env.NODE_ENV !== 'production';
    this.profilingEnabled = options.enableProfiling !== false && process.env.NODE_ENV !== 'production';
  }

  /**
   * Start the GIF encoding process with performance monitoring
   */
  @measureMethod
  @profileMethod
  async start(): Promise<void> {
    if (this.perfEnabled) {
      perfMonitor.start('gif-export-total');
      this.startTime = performance.now();
    }

    if (this.profilingEnabled) {
      profiler.start('GifExporter.start');
    }

    const ioStart = performance.now();
    await super.start();
    
    if (this.perfEnabled) {
      this.ioTime += performance.now() - ioStart;
    }

    if (this.profilingEnabled) {
      profiler.end('GifExporter.start');
    }
  }

  /**
   * Add a frame to the GIF with performance tracking
   */
  @measureMethod
  async addFrame(frame: Frame): Promise<void> {
    const frameStart = performance.now();

    if (this.profilingEnabled) {
      profiler.start(`GifExporter.addFrame[${this.frameCount}]`);
    }

    // Track memory usage for large frames
    let memoryBefore = 0;
    if (this.perfEnabled && frame.data.length > 1024 * 1024) { // > 1MB
      perfMonitor.start(`frame-${this.frameCount}-memory`);
      if (typeof process !== 'undefined' && process.memoryUsage) {
        memoryBefore = process.memoryUsage().heapUsed;
      }
    }

    // Profile encoding separately
    if (this.profilingEnabled) {
      await profiler.profile('frame-encoding', async () => {
        const encodingStart = performance.now();
        await super.addFrame(frame);
        this.encodingTime += performance.now() - encodingStart;
      });
    } else {
      const encodingStart = performance.now();
      await super.addFrame(frame);
      this.encodingTime += performance.now() - encodingStart;
    }

    // Track frame processing time
    if (this.perfEnabled) {
      const frameTime = performance.now() - frameStart;
      this.frameTimes.push(frameTime);

      // Log slow frames
      if (frameTime > 100) {
        console.warn(`[GifExporter] Slow frame ${this.frameCount}: ${frameTime.toFixed(2)}ms`);
      }

      // End memory tracking
      if (memoryBefore > 0) {
        perfMonitor.end(`frame-${this.frameCount}-memory`);
      }
    }

    if (this.profilingEnabled) {
      profiler.end(`GifExporter.addFrame[${this.frameCount - 1}]`);
    }

    // Track FPS if adding frames in real-time
    if (this.perfEnabled) {
      perfMonitor.trackFrame();
    }
  }

  /**
   * Finish the GIF encoding process and generate performance report
   */
  @measureMethod
  @profileMethod
  async finish(): Promise<void> {
    if (this.profilingEnabled) {
      profiler.start('GifExporter.finish');
    }

    const ioStart = performance.now();
    await super.finish();
    
    if (this.perfEnabled) {
      this.ioTime += performance.now() - ioStart;
      perfMonitor.end('gif-export-total');

      // Generate and log performance report
      const stats = this.getPerformanceStats();
      this.logPerformanceReport(stats);
    }

    if (this.profilingEnabled) {
      profiler.end('GifExporter.finish');
      
      // Log profiling report
      console.log('\n' + profiler.generateReport({
        sortBy: 'totalTime',
        minTime: 1
      }));
    }
  }

  /**
   * Get detailed performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    const totalTime = performance.now() - this.startTime;
    
    const stats: PerformanceStats = {
      totalTime,
      encodingTime: this.encodingTime,
      ioTime: this.ioTime,
      frameStats: {
        count: this.frameCount,
        averageTime: 0,
        minTime: 0,
        maxTime: 0
      }
    };

    if (this.frameTimes.length > 0) {
      stats.frameStats.averageTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      stats.frameStats.minTime = Math.min(...this.frameTimes);
      stats.frameStats.maxTime = Math.max(...this.frameTimes);
    }

    // Add memory usage if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryMetrics = perfMonitor.getMetrics();
      const totalMemoryMetric = memoryMetrics.get('gif-export-total');
      
      if (totalMemoryMetric && totalMemoryMetric.memoryStart && totalMemoryMetric.memoryEnd) {
        stats.memoryUsage = {
          start: totalMemoryMetric.memoryStart,
          end: totalMemoryMetric.memoryEnd,
          delta: totalMemoryMetric.memoryEnd - totalMemoryMetric.memoryStart
        };
      }
    }

    return stats;
  }

  /**
   * Log a formatted performance report
   */
  private logPerformanceReport(stats: PerformanceStats): void {
    console.log('\n=== GIF Export Performance Report ===');
    console.log(`Total Time: ${stats.totalTime.toFixed(2)}ms`);
    console.log(`Encoding Time: ${stats.encodingTime.toFixed(2)}ms (${((stats.encodingTime / stats.totalTime) * 100).toFixed(1)}%)`);
    console.log(`I/O Time: ${stats.ioTime.toFixed(2)}ms (${((stats.ioTime / stats.totalTime) * 100).toFixed(1)}%)`);
    
    console.log('\nFrame Statistics:');
    console.log(`  Frames: ${stats.frameStats.count}`);
    console.log(`  Average: ${stats.frameStats.averageTime.toFixed(2)}ms/frame`);
    console.log(`  Min: ${stats.frameStats.minTime.toFixed(2)}ms`);
    console.log(`  Max: ${stats.frameStats.maxTime.toFixed(2)}ms`);
    
    if (stats.frameStats.count > 0) {
      const fps = 1000 / stats.frameStats.averageTime;
      console.log(`  Theoretical FPS: ${fps.toFixed(1)}`);
    }

    if (stats.memoryUsage) {
      const deltaSign = stats.memoryUsage.delta >= 0 ? '+' : '';
      const deltaMB = (stats.memoryUsage.delta / 1024 / 1024).toFixed(2);
      console.log(`\nMemory Usage: ${deltaSign}${deltaMB}MB`);
    }

    const avgFPS = perfMonitor.getAverageFPS();
    if (avgFPS < 60) {
      console.log(`\nReal-time FPS: ${avgFPS.toFixed(1)} (during encoding)`);
    }

    // Detect bottlenecks
    if (this.profilingEnabled) {
      const bottlenecks = profiler.detectBottlenecks(20); // 20% threshold
      if (bottlenecks.length > 0) {
        console.log('\nPerformance Bottlenecks:');
        bottlenecks.forEach(bottleneck => {
          console.log(`  ${bottleneck.name}: ${bottleneck.percentOfTotal.toFixed(1)}% of total time`);
        });
      }
    }
  }

  /**
   * Reset performance counters
   */
  resetPerformanceCounters(): void {
    this.frameTimes = [];
    this.encodingTime = 0;
    this.ioTime = 0;
    perfMonitor.clear();
    profiler.clear();
  }

  /**
   * Export performance data for external analysis
   */
  exportPerformanceData(): {
    stats: PerformanceStats;
    frameTimes: number[];
    perfMetrics: any;
    flameGraph?: any;
  } {
    return {
      stats: this.getPerformanceStats(),
      frameTimes: [...this.frameTimes],
      perfMetrics: Object.fromEntries(perfMonitor.getMetrics()),
      flameGraph: this.profilingEnabled ? profiler.generateFlameGraphData() : undefined
    };
  }
}

/**
 * Factory function with automatic performance monitoring in development
 */
export function createEnhancedGifExporter(options: EnhancedGifExporterOptions): EnhancedGifExporter {
  return new EnhancedGifExporter({
    ...options,
    enablePerfMonitoring: options.enablePerfMonitoring ?? process.env.NODE_ENV !== 'production',
    enableProfiling: options.enableProfiling ?? process.env.NODE_ENV !== 'production'
  });
}